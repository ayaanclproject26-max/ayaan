import { Product } from "@/types";

export type ProductStatus = "draft" | "active" | "archived" | "published" | "unpublished";

export interface B2BProductVariant {
  id?: string;
  sku: string;
  title: string;
  optionSummary?: string;
  color?: string;
  size?: string;
  priceCents?: number;
  wholesalePrice?: number;
  stock: number;
  moq?: number;
  isActive?: boolean;
}

export interface B2BProductInput {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brand: string;
  categoryId?: string;
  categoryName?: string;
  audience: "MEN" | "WOMEN" | "BOYS" | "GIRLS" | "UNISEX";
  productType?: string;
  collectionSeason?: string;
  shortDescription?: string;
  description?: string;
  material?: string;
  colorName?: string;
  colorHex?: string;
  weightGrams?: number;
  videoUrl?: string;
  images: string[];
  costPrice?: number;
  wholesalePrice: number;
  msrpPrice?: number;
  moq: number;
  stock: number;
  status: "published" | "draft" | "unpublished";
  isFeatured?: boolean;
  isNew?: boolean;
  isHot?: boolean;
  isLimitedDeal?: boolean;
  isBestDeal?: boolean;
  sizes?: string[];
  colors?: string[];
  variants?: B2BProductVariant[];
}

export type RfqStatus = 
  | "SUBMITTED" 
  | "UNDER_REVIEW" 
  | "NEED_INFORMATION" 
  | "QUOTATION_PREPARED" 
  | "SENT_TO_BUYER" 
  | "NEGOTIATION" 
  | "ACCEPTED" 
  | "REJECTED" 
  | "EXPIRED" 
  | "CONVERTED_TO_ORDER" 
  | "CANCELLED";

export interface RfqItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  brand: string;
  sku: string;
  image: string;
  category?: string;
  audience?: string;
  selectedColor?: string;
  selectedSize?: string;
  assortedSizesNotes?: string;
  assortedColorsNotes?: string;
  quantity: number;
  moq: number;
  unitPrice?: number;
  targetPrice?: number;
  buyerNotes?: string;
}

export interface RfqMessage {
  id: string;
  rfqId: string;
  senderRole: "buyer" | "admin" | "sales";
  senderName: string;
  message: string;
  createdAt: string;
}

export interface RfqHistoryEvent {
  id: string;
  rfqId: string;
  status: RfqStatus;
  actorName: string;
  note?: string;
  createdAt: string;
}

export interface RfqRecord {
  id: string;
  rfqNumber: string;
  userId?: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  companyName: string;
  businessType?: string;
  website?: string;
  taxNumber?: string;
  destinationCountry: string;
  destinationCity: string;
  shippingPort?: string;
  targetDeliveryDate?: string;
  requestTitle?: string;
  generalNotes?: string;
  status: RfqStatus;
  items: RfqItem[];
  messages?: RfqMessage[];
  history?: RfqHistoryEvent[];
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  quotationId?: string;
}

export type QuotationStatus = 
  | "DRAFT" 
  | "READY" 
  | "SENT" 
  | "VIEWED" 
  | "NEGOTIATION" 
  | "ACCEPTED" 
  | "REJECTED" 
  | "EXPIRED" 
  | "CONVERTED_TO_ORDER" 
  | "CANCELLED";

export interface QuotationItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  variantTitle?: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  lineTotal: number;
}

export interface QuotationRecord {
  id: string;
  quotationNumber: string; // e.g. QT-2026-000101
  revisionNumber: number; // 1, 2, ...
  rfqId: string;
  rfqNumber: string;
  userId?: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  companyName: string;
  destinationCountry: string;
  destinationCity: string;
  currency: "USD" | "EUR" | "GBP" | "BDT";
  currencySymbol: string;
  items: QuotationItem[];
  subtotal: number;
  discountTotal: number;
  shippingFee: number;
  taxAmount: number;
  grandTotal: number;
  paymentTerms: string; // e.g. "30% T/T Advance, 70% against B/L"
  shippingTerms: string; // e.g. "FOB Chittagong"
  incoterm?: "FOB" | "CIF" | "EXW" | "DDP" | "CFR";
  deliveryEstimate?: string;
  validUntil: string;
  adminNotes?: string;
  status: QuotationStatus;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  proformaInvoiceId?: string;
}

export type CommercialDocType = "QUOTATION" | "PROFORMA_INVOICE" | "COMMERCIAL_INVOICE" | "PACKING_LIST" | "CHALAN";

export interface CommercialDocument {
  id: string;
  docNumber: string;
  docType: CommercialDocType;
  title: string;
  date: string;
  quotationNumber?: string;
  rfqNumber?: string;
  orderNumber?: string;
  companyName: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  buyerAddress?: string;
  buyerCountry: string;
  items: Array<{
    description: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    total: number;
    details?: string;
  }>;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  grandTotal: number;
  currency: string;
  paymentTerms?: string;
  shippingTerms?: string;
  incoterm?: string;
  validUntil?: string;
  notes?: string;
  bankDetails?: {
    beneficiaryName: string;
    bankName: string;
    accountNumber: string;
    swiftCode: string;
    branch: string;
  };
}
