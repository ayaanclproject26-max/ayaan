"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getRfqById, addRfqMessage, updateRfqStatus } from "@/lib/services/rfq";
import { createQuotation, getQuotationByRfqId } from "@/lib/services/quotations";
import { RfqRecord, QuotationRecord, QuotationItem } from "@/types/b2b";
import { 
  FileText, 
  ArrowLeft, 
  Building2, 
  Globe2, 
  Clock, 
  CheckCircle2, 
  Send, 
  DollarSign, 
  Package, 
  AlertTriangle,
  FileCheck,
  Printer
} from "lucide-react";

export default function AdminRfqDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [rfq, setRfq] = useState<RfqRecord | null>(null);
  const [quotation, setQuotation] = useState<QuotationRecord | null>(null);
  const [loading, setLoading] = useState(true);

  // Messaging
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Quotation Builder State
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [currency, setCurrency] = useState<"USD" | "EUR" | "GBP" | "BDT">("USD");
  const [quotedPrices, setQuotedPrices] = useState<{ [key: string]: number }>({});
  const [shippingFee, setShippingFee] = useState<number>(350);
  const [discountTotal, setDiscountTotal] = useState<number>(0);
  const [paymentTerms, setPaymentTerms] = useState("30% Advance T/T, 70% against B/L copy");
  const [shippingTerms, setShippingTerms] = useState("FOB Chittagong Port");
  const [incoterm, setIncoterm] = useState<"FOB" | "CIF" | "EXW" | "DDP" | "CFR">("FOB");
  const [deliveryEstimate, setDeliveryEstimate] = useState("14-18 working days");
  const [validUntil, setValidUntil] = useState("2026-09-30");
  const [adminNotes, setAdminNotes] = useState("");

  const refresh = async () => {
    const rfqData = await getRfqById(id);
    setRfq(rfqData);
    if (rfqData) {
      const q = await getQuotationByRfqId(rfqData.id);
      setQuotation(q);

      // Initialize default quoted prices from RFQ items
      const initialPrices: { [key: string]: number } = {};
      rfqData.items.forEach((item) => {
        initialPrices[item.id] = item.unitPrice || 15;
      });
      setQuotedPrices(initialPrices);
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !rfq) return;

    setIsSending(true);
    await addRfqMessage(rfq.id, "sales", "Ayaan Export Sales", newMessage.trim());
    setNewMessage("");
    setIsSending(false);
    refresh();
  };

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfq) return;

    const quoteItems: QuotationItem[] = rfq.items.map((item) => {
      const unitPrice = quotedPrices[item.id] || item.unitPrice || 15;
      return {
        id: `qi_${Date.now()}_${item.id}`,
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        variantTitle: `${item.selectedColor || "Standard"} / ${item.selectedSize || "Assorted"}`,
        quantity: item.quantity,
        unitPrice,
        lineTotal: item.quantity * unitPrice,
      };
    });

    const subtotal = quoteItems.reduce((acc, i) => acc + i.lineTotal, 0);
    const grandTotal = subtotal - discountTotal + shippingFee;

    const newQuote = await createQuotation({
      rfqId: rfq.id,
      rfqNumber: rfq.rfqNumber,
      userId: rfq.userId,
      buyerName: rfq.buyerName,
      buyerEmail: rfq.buyerEmail,
      buyerPhone: rfq.buyerPhone,
      companyName: rfq.companyName,
      destinationCountry: rfq.destinationCountry,
      destinationCity: rfq.destinationCity,
      currency,
      currencySymbol: currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "৳",
      items: quoteItems,
      subtotal,
      discountTotal,
      shippingFee,
      taxAmount: 0,
      grandTotal,
      paymentTerms,
      shippingTerms,
      incoterm,
      deliveryEstimate,
      validUntil,
      adminNotes,
    });

    setIsQuoteModalOpen(false);
    refresh();
  };

  if (loading) {
    return (
      <div className="w-full py-20 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="w-full py-20 text-center">
        <h2 className="text-xl font-bold uppercase">RFQ Not Found</h2>
        <Link href="/admin/rfq" className="text-primary hover:underline mt-2 inline-block text-xs font-bold uppercase">
          ← Back to RFQ List
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Top Navigation & Status */}
      <div>
        <Link
          href="/admin/rfq"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground uppercase tracking-wider mb-3"
        >
          <ArrowLeft size={13} />
          <span>Back to All Inquiries</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-2xl font-bold text-foreground">
                {rfq.rfqNumber}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                {rfq.status.replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Buyer: <strong>{rfq.buyerName}</strong> ({rfq.companyName}) • Received on {new Date(rfq.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {quotation ? (
              <Link
                href={`/admin/documents/QUOTATION/${quotation.id}`}
                target="_blank"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-secondary hover:bg-card border border-border text-foreground font-bold text-xs uppercase tracking-wider transition-colors shadow-xs"
              >
                <Printer size={14} />
                <span>Print Quotation ({quotation.quotationNumber})</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setIsQuoteModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-foreground text-background font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity shadow-md cursor-pointer"
              >
                <DollarSign size={15} />
                <span>Prepare Quotation</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Details + Items vs Messaging */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: BUYER & LINE ITEMS (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Buyer & Destination Profile */}
          <div className="p-6 bg-card border border-border/70 rounded-2xl shadow-xs space-y-4 text-xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground pb-2 border-b border-border/60">
              Buyer & Destination Information
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <span className="font-bold text-muted-foreground uppercase text-[10px] block">Company</span>
                <span className="font-bold text-foreground">{rfq.companyName}</span>
              </div>
              <div>
                <span className="font-bold text-muted-foreground uppercase text-[10px] block">Business Type</span>
                <span className="text-foreground">{rfq.businessType || "Wholesale"}</span>
              </div>
              <div>
                <span className="font-bold text-muted-foreground uppercase text-[10px] block">Contact</span>
                <span className="text-foreground">{rfq.buyerEmail}</span>
              </div>
              <div>
                <span className="font-bold text-muted-foreground uppercase text-[10px] block">Destination</span>
                <span className="font-bold text-foreground">{rfq.destinationCity}, {rfq.destinationCountry}</span>
              </div>
              <div>
                <span className="font-bold text-muted-foreground uppercase text-[10px] block">Target Delivery</span>
                <span className="text-foreground">{rfq.targetDeliveryDate || "Flexible"}</span>
              </div>
              <div>
                <span className="font-bold text-muted-foreground uppercase text-[10px] block">Discharge Port</span>
                <span className="text-foreground">{rfq.shippingPort || "Not Specified"}</span>
              </div>
            </div>
            {rfq.generalNotes && (
              <div className="pt-3 border-t border-border/40">
                <span className="font-bold text-muted-foreground uppercase text-[10px] block">Buyer Instructions</span>
                <p className="text-foreground mt-0.5 leading-relaxed">{rfq.generalNotes}</p>
              </div>
            )}
          </div>

          {/* Line Items Table */}
          <div className="p-6 bg-card border border-border/70 rounded-2xl shadow-xs space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground pb-2 border-b border-border/60">
              Requested Products ({rfq.items.length})
            </h2>

            <div className="space-y-3">
              {rfq.items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-border/70 bg-secondary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image}
                      alt={item.productName}
                      className="w-14 h-16 object-cover rounded-lg bg-secondary shrink-0 border border-border/50"
                    />
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
                        {item.brand} • SKU: {item.sku}
                      </span>
                      <h3 className="text-xs font-bold text-foreground truncate max-w-xs">
                        {item.productName}
                      </h3>
                      <span className="text-[11px] text-muted-foreground block mt-0.5">
                        Color: {item.selectedColor} • Size: {item.selectedSize}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-foreground block">
                      {item.quantity.toLocaleString()} pcs
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      MOQ: {item.moq} pcs
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: MESSAGING & QUOTATION (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Threaded Messaging */}
          <div className="p-6 bg-card border border-border/70 rounded-2xl shadow-xs flex flex-col h-[520px]">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground pb-3 border-b border-border/60 mb-4">
              Buyer Clarifications Thread
            </h2>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4">
              {rfq.messages && rfq.messages.length > 0 ? (
                rfq.messages.map((msg) => {
                  const isSales = msg.senderRole === "sales" || msg.senderRole === "admin";

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isSales ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
                        <span className="font-bold text-foreground">{msg.senderName}</span>
                        <span>•</span>
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <div
                        className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                          isSales
                            ? "bg-foreground text-background rounded-br-none"
                            : "bg-secondary text-foreground rounded-bl-none border border-border/60"
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-muted-foreground text-center py-12">
                  No messages yet. Send a note to the buyer to clarify size breakdown, colors, or export requirements.
                </p>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="pt-3 border-t border-border flex items-center gap-2">
              <input
                type="text"
                placeholder="Reply to buyer..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs rounded-full border border-border bg-secondary/30 text-foreground focus:ring-1 focus:ring-primary outline-none"
              />
              <button
                type="submit"
                disabled={isSending || !newMessage.trim()}
                className="p-2 rounded-full bg-foreground text-background disabled:opacity-40 transition-opacity cursor-pointer hover:opacity-90 shrink-0"
              >
                <Send size={14} />
              </button>
            </form>
          </div>

        </div>

      </div>

      {/* PREPARE QUOTATION MODAL */}
      {isQuoteModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="font-bold text-base uppercase text-foreground">
                  Create Commercial Quotation for {rfq.rfqNumber}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Set negotiated unit prices and export payment/shipping terms.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsQuoteModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateQuotation} className="space-y-4 text-xs">
              
              {/* Currency & Price Terms */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-muted-foreground">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-secondary/30 text-foreground font-bold"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="BDT">BDT (৳)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-muted-foreground">
                    Incoterm
                  </label>
                  <select
                    value={incoterm}
                    onChange={(e) => setIncoterm(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-secondary/30 text-foreground font-bold"
                  >
                    <option value="FOB">FOB (Free on Board)</option>
                    <option value="CIF">CIF (Cost, Insurance & Freight)</option>
                    <option value="EXW">EXW (Ex Works)</option>
                    <option value="DDP">DDP (Delivered Duty Paid)</option>
                    <option value="CFR">CFR (Cost and Freight)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-muted-foreground">
                    Valid Until
                  </label>
                  <input
                    type="date"
                    required
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-secondary/30 text-foreground"
                  />
                </div>
              </div>

              {/* Line Items Pricing */}
              <div className="space-y-2 pt-2 border-t border-border/60">
                <label className="font-bold uppercase tracking-wider text-muted-foreground block">
                  Quoted B2B Unit Prices
                </label>
                <div className="space-y-2">
                  {rfq.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl border border-border bg-secondary/20 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-foreground block truncate max-w-xs">
                          {item.productName}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {item.quantity.toLocaleString()} pcs • SKU: {item.sku}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-muted-foreground font-bold">$</span>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={quotedPrices[item.id] || ""}
                          onChange={(e) =>
                            setQuotedPrices((prev) => ({
                              ...prev,
                              [item.id]: parseFloat(e.target.value) || 0,
                            }))
                          }
                          className="w-24 px-2 py-1 rounded-lg border border-border bg-card font-bold text-right"
                        />
                        <span className="text-[10px] text-muted-foreground">/ pc</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-muted-foreground">
                    Payment Terms
                  </label>
                  <input
                    type="text"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-secondary/30"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-muted-foreground">
                    Delivery Lead Time
                  </label>
                  <input
                    type="text"
                    value={deliveryEstimate}
                    onChange={(e) => setDeliveryEstimate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-secondary/30"
                  />
                </div>
              </div>

              {/* Submit Modal */}
              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsQuoteModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-border font-bold uppercase text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-foreground text-background font-bold uppercase text-xs hover:opacity-90 transition-opacity"
                >
                  Issue Commercial Quotation
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
