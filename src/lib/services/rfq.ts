import { RfqRecord, RfqStatus, RfqMessage, RfqItem } from "@/types/b2b";

const RFQ_STORAGE_KEY = "ayaan_b2b_rfqs_db";

const INITIAL_DEMO_RFQS: RfqRecord[] = [
  {
    id: "rfq_demo_101",
    rfqNumber: "RFQ-2026-000101",
    buyerName: "Tariq Al-Mansoor",
    buyerEmail: "tariq@gulfapparel.ae",
    buyerPhone: "+971 50 123 4567",
    companyName: "Gulf Apparel Trading LLC",
    businessType: "Wholesale Distributor",
    destinationCountry: "United Arab Emirates",
    destinationCity: "Dubai",
    shippingPort: "Jebel Ali Port",
    targetDeliveryDate: "2026-10-15",
    requestTitle: "500 Nike T-Shirts for UAE Retail Network",
    generalNotes: "Need assorted sizes (M: 200, L: 200, XL: 100). Please quote FOB Chittagong.",
    status: "UNDER_REVIEW",
    items: [
      {
        id: "rfq_item_1",
        productId: "prod_1",
        productName: "Essential Cotton T-Shirt",
        productSlug: "essential-cotton-t-shirt",
        brand: "Nike",
        sku: "NIK-TSH-001",
        image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
        selectedColor: "Black",
        selectedSize: "Assorted (M, L, XL)",
        quantity: 500,
        moq: 50,
        unitPrice: 12.00,
        targetPrice: 10.50,
        buyerNotes: "High density print packaging required.",
      },
    ],
    messages: [
      {
        id: "msg_1",
        rfqId: "rfq_demo_101",
        senderRole: "buyer",
        senderName: "Tariq Al-Mansoor",
        message: "Hello, we are looking for a reliable shipment of 500 pcs to Dubai. Please confirm lead time.",
        createdAt: "2026-08-24T14:30:00Z",
      },
      {
        id: "msg_2",
        rfqId: "rfq_demo_101",
        senderRole: "sales",
        senderName: "Ayaan Export Team",
        message: "Thank you for the inquiry. Production lead time is 14 days. We are preparing your official quotation now.",
        createdAt: "2026-08-24T15:10:00Z",
      },
    ],
    history: [
      {
        id: "hist_1",
        rfqId: "rfq_demo_101",
        status: "SUBMITTED",
        actorName: "Tariq Al-Mansoor",
        createdAt: "2026-08-24T14:30:00Z",
      },
      {
        id: "hist_2",
        rfqId: "rfq_demo_101",
        status: "UNDER_REVIEW",
        actorName: "Sales Admin",
        note: "Assigned to export desk.",
        createdAt: "2026-08-24T15:00:00Z",
      },
    ],
    createdAt: "2026-08-24T14:30:00Z",
    updatedAt: "2026-08-24T15:10:00Z",
  },
  {
    id: "rfq_demo_102",
    rfqNumber: "RFQ-2026-000102",
    buyerName: "Marcus Vance",
    buyerEmail: "m.vance@vancestyle.co.uk",
    buyerPhone: "+44 20 7946 0912",
    companyName: "Vance & Co Retail Ltd",
    businessType: "Fashion Retailer",
    destinationCountry: "United Kingdom",
    destinationCity: "London",
    targetDeliveryDate: "2026-11-01",
    requestTitle: "Hoodies & Sweaters Fall Collection",
    generalNotes: "Mixed order of heavyweight hoodies and premium knits.",
    status: "QUOTATION_PREPARED",
    items: [
      {
        id: "rfq_item_2",
        productId: "prod_2",
        productName: "Heritage Crewneck Sweatshirt",
        productSlug: "heritage-crewneck-sweatshirt",
        brand: "Adidas",
        sku: "ADI-HD-002",
        image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80",
        selectedColor: "Heather Grey",
        selectedSize: "L",
        quantity: 300,
        moq: 50,
        unitPrice: 22.00,
        targetPrice: 20.00,
      },
    ],
    history: [
      {
        id: "hist_3",
        rfqId: "rfq_demo_102",
        status: "SUBMITTED",
        actorName: "Marcus Vance",
        createdAt: "2026-08-24T10:00:00Z",
      },
      {
        id: "hist_4",
        rfqId: "rfq_demo_102",
        status: "QUOTATION_PREPARED",
        actorName: "Sales Admin",
        note: "Quotation QT-2026-000102 sent to buyer.",
        createdAt: "2026-08-24T12:00:00Z",
      },
    ],
    quotationId: "qt_demo_102",
    createdAt: "2026-08-24T10:00:00Z",
    updatedAt: "2026-08-24T12:00:00Z",
  },
];

export function getStoredRfqs(): RfqRecord[] {
  if (typeof window === "undefined") {
    return INITIAL_DEMO_RFQS;
  }
  try {
    const saved = localStorage.getItem(RFQ_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore
  }
  return INITIAL_DEMO_RFQS;
}

function persistRfqs(rfqs: RfqRecord[]) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(RFQ_STORAGE_KEY, JSON.stringify(rfqs));
    } catch {
      // Ignore
    }
  }
}

export function generateRfqNumber(): string {
  const rand = Math.floor(100000 + Math.random() * 900000);
  const year = new Date().getFullYear();
  return `RFQ-${year}-${rand}`;
}

export async function createRfq(
  data: Omit<RfqRecord, "id" | "rfqNumber" | "status" | "createdAt" | "updatedAt">
): Promise<RfqRecord> {
  const all = getStoredRfqs();
  const id = `rfq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const rfqNumber = generateRfqNumber();
  const now = new Date().toISOString();

  const newRfq: RfqRecord = {
    ...data,
    id,
    rfqNumber,
    status: "SUBMITTED",
    messages: data.generalNotes
      ? [
          {
            id: `msg_${Date.now()}`,
            rfqId: id,
            senderRole: "buyer",
            senderName: data.buyerName,
            message: data.generalNotes,
            createdAt: now,
          },
        ]
      : [],
    history: [
      {
        id: `hist_${Date.now()}`,
        rfqId: id,
        status: "SUBMITTED",
        actorName: data.buyerName,
        note: "Request for Quote submitted by buyer.",
        createdAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  const updated = [newRfq, ...all];
  persistRfqs(updated);
  return newRfq;
}

export async function getAllRfqs(filters?: {
  status?: string;
  country?: string;
  search?: string;
}): Promise<RfqRecord[]> {
  const all = getStoredRfqs();

  return all.filter((rfq) => {
    if (filters?.status && filters.status !== "all" && rfq.status !== filters.status) {
      return false;
    }
    if (filters?.country && filters.country !== "all" && rfq.destinationCountry.toLowerCase() !== filters.country.toLowerCase()) {
      return false;
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      const match =
        rfq.rfqNumber.toLowerCase().includes(q) ||
        rfq.buyerName.toLowerCase().includes(q) ||
        rfq.companyName.toLowerCase().includes(q) ||
        rfq.destinationCountry.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });
}

export async function getRfqById(id: string): Promise<RfqRecord | null> {
  const all = getStoredRfqs();
  const found = all.find((r) => r.id === id || r.rfqNumber === id);
  return found || null;
}

export async function updateRfqStatus(
  id: string,
  status: RfqStatus,
  actorName: string,
  note?: string
): Promise<RfqRecord | null> {
  const all = getStoredRfqs();
  const index = all.findIndex((r) => r.id === id || r.rfqNumber === id);
  if (index === -1) return null;

  const now = new Date().toISOString();
  const existing = all[index];
  const history = existing.history || [];

  history.push({
    id: `hist_${Date.now()}`,
    rfqId: existing.id,
    status,
    actorName,
    note,
    createdAt: now,
  });

  const updated: RfqRecord = {
    ...existing,
    status,
    history,
    updatedAt: now,
  };

  all[index] = updated;
  persistRfqs(all);
  return updated;
}

export async function addRfqMessage(
  rfqId: string,
  senderRole: "buyer" | "admin" | "sales",
  senderName: string,
  message: string
): Promise<RfqMessage | null> {
  const all = getStoredRfqs();
  const index = all.findIndex((r) => r.id === rfqId || r.rfqNumber === rfqId);
  if (index === -1) return null;

  const now = new Date().toISOString();
  const msgObj: RfqMessage = {
    id: `msg_${Date.now()}`,
    rfqId,
    senderRole,
    senderName,
    message,
    createdAt: now,
  };

  const messages = all[index].messages || [];
  messages.push(msgObj);
  all[index].messages = messages;
  all[index].updatedAt = now;

  persistRfqs(all);
  return msgObj;
}
