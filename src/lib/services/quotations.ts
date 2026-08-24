import { 
  QuotationRecord, 
  QuotationStatus, 
  CommercialDocument, 
  CommercialDocType,
  RfqRecord 
} from "@/types/b2b";
import { updateRfqStatus } from "./rfq";

const QUOTE_STORAGE_KEY = "ayaan_b2b_quotations_db";

const INITIAL_DEMO_QUOTES: QuotationRecord[] = [
  {
    id: "qt_demo_102",
    quotationNumber: "QT-2026-000102",
    revisionNumber: 1,
    rfqId: "rfq_demo_102",
    rfqNumber: "RFQ-2026-000102",
    buyerName: "Marcus Vance",
    buyerEmail: "m.vance@vancestyle.co.uk",
    buyerPhone: "+44 20 7946 0912",
    companyName: "Vance & Co Retail Ltd",
    destinationCountry: "United Kingdom",
    destinationCity: "London",
    currency: "USD",
    currencySymbol: "$",
    items: [
      {
        id: "qi_1",
        productId: "prod_2",
        productName: "Heritage Crewneck Sweatshirt",
        sku: "ADI-HD-002",
        variantTitle: "Heather Grey / L",
        quantity: 300,
        unitPrice: 19.50, // Negotiated B2B unit price (public was $22)
        lineTotal: 5850.00,
      },
    ],
    subtotal: 5850.00,
    discountTotal: 0,
    shippingFee: 450.00,
    taxAmount: 0,
    grandTotal: 6300.00,
    paymentTerms: "30% Advance T/T, 70% against Bill of Lading (B/L) copy",
    shippingTerms: "FOB Chittagong Port (Air/Sea Freight arranged upon request)",
    incoterm: "FOB",
    deliveryEstimate: "18-22 working days from production approval",
    validUntil: "2026-09-30",
    adminNotes: "Special promotional discount applied for 300+ units volume.",
    status: "READY",
    createdAt: "2026-08-24T12:00:00Z",
    updatedAt: "2026-08-24T12:00:00Z",
  },
];

export function getStoredQuotations(): QuotationRecord[] {
  if (typeof window === "undefined") {
    return INITIAL_DEMO_QUOTES;
  }
  try {
    const saved = localStorage.getItem(QUOTE_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore
  }
  return INITIAL_DEMO_QUOTES;
}

function persistQuotations(quotes: QuotationRecord[]) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(QUOTE_STORAGE_KEY, JSON.stringify(quotes));
    } catch {
      // Ignore
    }
  }
}

export function generateQuotationNumber(): string {
  const rand = Math.floor(100000 + Math.random() * 900000);
  const year = new Date().getFullYear();
  return `QT-${year}-${rand}`;
}

export function generatePiNumber(): string {
  const rand = Math.floor(100000 + Math.random() * 900000);
  const year = new Date().getFullYear();
  return `PI-${year}-${rand}`;
}

export async function createQuotation(
  data: Omit<QuotationRecord, "id" | "quotationNumber" | "revisionNumber" | "status" | "createdAt" | "updatedAt">
): Promise<QuotationRecord> {
  const all = getStoredQuotations();
  const id = `qt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const quotationNumber = generateQuotationNumber();
  const now = new Date().toISOString();

  const newQuote: QuotationRecord = {
    ...data,
    id,
    quotationNumber,
    revisionNumber: 1,
    status: "READY",
    createdAt: now,
    updatedAt: now,
  };

  const updated = [newQuote, ...all];
  persistQuotations(updated);

  // Update associated RFQ status to QUOTATION_PREPARED
  await updateRfqStatus(data.rfqId, "QUOTATION_PREPARED", "Sales Admin", `Quotation ${quotationNumber} prepared.`);

  return newQuote;
}

export async function createQuotationRevision(
  quotationId: string,
  revisedData: Partial<QuotationRecord>
): Promise<QuotationRecord | null> {
  const all = getStoredQuotations();
  const index = all.findIndex((q) => q.id === quotationId || q.quotationNumber === quotationId);
  if (index === -1) return null;

  const current = all[index];
  const now = new Date().toISOString();
  const nextRev = (current.revisionNumber || 1) + 1;

  const revisedQuote: QuotationRecord = {
    ...current,
    ...revisedData,
    id: `qt_${Date.now()}_rev${nextRev}`,
    revisionNumber: nextRev,
    status: "READY",
    updatedAt: now,
  };

  const updated = [revisedQuote, ...all];
  persistQuotations(updated);

  await updateRfqStatus(current.rfqId, "NEGOTIATION", "Sales Admin", `Quotation ${current.quotationNumber} revised to Rev.${nextRev}.`);
  return revisedQuote;
}

export async function getQuotationById(id: string): Promise<QuotationRecord | null> {
  const all = getStoredQuotations();
  const found = all.find((q) => q.id === id || q.quotationNumber === id);
  return found || null;
}

export async function getQuotationByRfqId(rfqId: string): Promise<QuotationRecord | null> {
  const all = getStoredQuotations();
  const found = all.find((q) => q.rfqId === rfqId);
  return found || null;
}

export async function getAllQuotations(filters?: {
  status?: string;
  search?: string;
}): Promise<QuotationRecord[]> {
  const all = getStoredQuotations();

  return all.filter((quote) => {
    if (filters?.status && filters.status !== "all" && quote.status !== filters.status) {
      return false;
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      const match =
        quote.quotationNumber.toLowerCase().includes(q) ||
        quote.rfqNumber.toLowerCase().includes(q) ||
        quote.buyerName.toLowerCase().includes(q) ||
        quote.companyName.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });
}

/**
 * Handle Buyer's response to an official quotation (Accept, Reject, Request Changes)
 */
export async function buyerRespondToQuotation(
  quotationId: string,
  response: "accept" | "reject" | "request_changes",
  notes?: string
): Promise<QuotationRecord | null> {
  const all = getStoredQuotations();
  const index = all.findIndex((q) => q.id === quotationId || q.quotationNumber === quotationId);
  if (index === -1) return null;

  const now = new Date().toISOString();
  const current = all[index];

  let newStatus: QuotationStatus = "VIEWED";
  if (response === "accept") {
    newStatus = "ACCEPTED";
    const piNum = generatePiNumber();
    current.proformaInvoiceId = piNum;
    await updateRfqStatus(current.rfqId, "ACCEPTED", current.buyerName, `Buyer accepted quotation ${current.quotationNumber}. Generated ${piNum}.`);
  } else if (response === "reject") {
    newStatus = "REJECTED";
    current.rejectionReason = notes || "No specific reason provided.";
    await updateRfqStatus(current.rfqId, "REJECTED", current.buyerName, `Buyer rejected quotation: ${notes}`);
  } else if (response === "request_changes") {
    newStatus = "NEGOTIATION";
    await updateRfqStatus(current.rfqId, "NEGOTIATION", current.buyerName, `Buyer requested changes: ${notes}`);
  }

  current.status = newStatus;
  current.updatedAt = now;
  all[index] = current;

  persistQuotations(all);
  return current;
}

/**
 * Generate standardized Commercial Document layout (Quotation, PI, Invoice, Packing List, Chalan)
 */
export async function getCommercialDocument(
  docType: CommercialDocType,
  id: string
): Promise<CommercialDocument | null> {
  const quote = await getQuotationById(id);
  if (!quote) return null;

  let title = "COMMERCIAL QUOTATION";
  let docNumber = quote.quotationNumber;

  if (docType === "PROFORMA_INVOICE") {
    title = "PROFORMA INVOICE";
    docNumber = quote.proformaInvoiceId || `PI-2026-${quote.quotationNumber.split("-")[2] || "0001"}`;
  } else if (docType === "COMMERCIAL_INVOICE") {
    title = "COMMERCIAL INVOICE";
    docNumber = `INV-2026-${quote.quotationNumber.split("-")[2] || "0001"}`;
  } else if (docType === "PACKING_LIST") {
    title = "PACKING LIST";
    docNumber = `PL-2026-${quote.quotationNumber.split("-")[2] || "0001"}`;
  } else if (docType === "CHALAN") {
    title = "DELIVERY CHALAN / GATE PASS";
    docNumber = `CH-2026-${quote.quotationNumber.split("-")[2] || "0001"}`;
  }

  return {
    id: `doc_${docType}_${quote.id}`,
    docNumber,
    docType,
    title,
    date: quote.createdAt.split("T")[0],
    quotationNumber: quote.quotationNumber,
    rfqNumber: quote.rfqNumber,
    companyName: quote.companyName,
    buyerName: quote.buyerName,
    buyerEmail: quote.buyerEmail,
    buyerPhone: quote.buyerPhone,
    buyerAddress: `${quote.destinationCity}, ${quote.destinationCountry}`,
    buyerCountry: quote.destinationCountry,
    items: quote.items.map((item) => ({
      description: `${item.productName} (${item.variantTitle || "Standard"})`,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.lineTotal,
      details: item.variantTitle,
    })),
    subtotal: quote.subtotal,
    discount: quote.discountTotal,
    shipping: quote.shippingFee,
    tax: quote.taxAmount,
    grandTotal: quote.grandTotal,
    currency: quote.currency,
    paymentTerms: quote.paymentTerms,
    shippingTerms: quote.shippingTerms,
    incoterm: quote.incoterm,
    validUntil: quote.validUntil,
    notes: quote.adminNotes,
    bankDetails: {
      beneficiaryName: "Ayaan Clothing Manufacturing & Export Ltd.",
      bankName: "Standard Chartered Bank",
      accountNumber: "01-8273918-01",
      swiftCode: "SCBLBDDX",
      branch: "Gulshan Corporate Branch, Dhaka, Bangladesh",
    },
  };
}
