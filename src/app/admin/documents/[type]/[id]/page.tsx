"use client";

import { use, useState, useEffect } from "react";
import { getCommercialDocument } from "@/lib/services/quotations";
import { CommercialDocument, CommercialDocType } from "@/types/b2b";
import { Printer, ArrowLeft, Building2, ShieldCheck, Download } from "lucide-react";
import Link from "next/link";

export default function CommercialDocumentPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = use(params);
  const [doc, setDoc] = useState<CommercialDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getCommercialDocument(type as CommercialDocType, id);
      setDoc(data);
      setLoading(false);
    }
    load();
  }, [type, id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="w-full py-20 text-center">
        <h2 className="text-xl font-bold uppercase">Commercial Document Not Found</h2>
        <Link href="/admin/quotations" className="text-primary hover:underline mt-2 inline-block text-xs font-bold uppercase">
          ← Back to Quotations
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 py-8 px-4 sm:px-6">
      
      {/* Top Floating Print Controls (Hidden on Print) */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <Link
          href="/admin/quotations"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground uppercase tracking-wider"
        >
          <ArrowLeft size={13} />
          <span>Back to Quotations</span>
        </Link>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-foreground text-background font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity shadow-md cursor-pointer"
        >
          <Printer size={15} />
          <span>Print / Save PDF</span>
        </button>
      </div>

      {/* DOCUMENT SHEET */}
      <div className="max-w-4xl mx-auto bg-card text-foreground border border-border/80 rounded-3xl p-8 sm:p-12 shadow-xl print:shadow-none print:border-0 print:p-0 space-y-8 font-sans">
        
        {/* Company Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b-2 border-foreground/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-foreground">
                AYAAN CLOTHING
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest bg-primary text-primary-foreground px-2 py-0.5 rounded">
                Export Dept.
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm leading-relaxed">
              Ayaan Clothing Manufacturing & Export Ltd.<br />
              Plot 42, Export Processing Zone (EPZ), Sector 7<br />
              Dhaka 1230, Bangladesh • Reg: C-192837/2020<br />
              Tel: +880 2 8839201 • Email: export@ayaanclothing.com
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xl sm:text-2xl font-display font-bold uppercase tracking-wide text-primary block">
              {doc.title}
            </span>
            <span className="font-mono text-base font-bold text-foreground block mt-1">
              {doc.docNumber}
            </span>
            <span className="text-xs text-muted-foreground block mt-1">
              Date: {doc.date}
            </span>
            {doc.validUntil && (
              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 block mt-0.5">
                Valid Until: {doc.validUntil}
              </span>
            )}
          </div>
        </div>

        {/* Bill To & Export Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs">
          <div className="p-4 rounded-2xl bg-secondary/30 border border-border/60 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Commercial Buyer / Consignee
            </span>
            <span className="font-bold text-sm text-foreground block">
              {doc.companyName}
            </span>
            <p className="text-muted-foreground leading-relaxed">
              Attn: {doc.buyerName}<br />
              Address: {doc.buyerAddress}<br />
              Country: {doc.buyerCountry}<br />
              Email: {doc.buyerEmail} • Phone: {doc.buyerPhone || "N/A"}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-secondary/30 border border-border/60 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Commercial Terms
            </span>
            <div className="space-y-1 text-muted-foreground">
              <div><strong className="text-foreground">Incoterm:</strong> {doc.incoterm || "FOB Chittagong"}</div>
              <div><strong className="text-foreground">Payment Terms:</strong> {doc.paymentTerms || "30% Advance, 70% B/L"}</div>
              <div><strong className="text-foreground">Shipping Terms:</strong> {doc.shippingTerms || "Sea / Air Freight"}</div>
              <div><strong className="text-foreground">RFQ Reference:</strong> {doc.rfqNumber || "N/A"}</div>
            </div>
          </div>
        </div>

        {/* Itemized Commercial Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b-2 border-foreground bg-secondary/50 uppercase text-[10px] font-bold tracking-wider text-foreground">
                <th className="py-3 px-3">Item & Description</th>
                <th className="py-3 px-3">SKU</th>
                <th className="py-3 px-3 text-right">Quantity</th>
                <th className="py-3 px-3 text-right">Unit Price ({doc.currency})</th>
                <th className="py-3 px-3 text-right">Total ({doc.currency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {doc.items.map((item, idx) => (
                <tr key={idx} className="font-medium text-foreground">
                  <td className="py-3.5 px-3">
                    <span className="font-bold block">{item.description}</span>
                    {item.details && (
                      <span className="text-[11px] text-muted-foreground">{item.details}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 font-mono text-muted-foreground">{item.sku}</td>
                  <td className="py-3.5 px-3 text-right font-bold">{item.quantity.toLocaleString()} pcs</td>
                  <td className="py-3.5 px-3 text-right font-bold">${item.unitPrice.toFixed(2)}</td>
                  <td className="py-3.5 px-3 text-right font-bold">${item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals & Notes */}
        <div className="flex flex-col sm:flex-row justify-between gap-8 pt-4 border-t border-border text-xs">
          <div className="flex-1 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Terms & Special Instructions
            </span>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              1. Goods manufactured in compliance with ISO 9001 and OEKO-TEX Standard 100.<br />
              2. Export documentation includes Commercial Invoice, Packing List, Certificate of Origin (GSP/EUR.1), and Bill of Lading.<br />
              3. Port of Loading: Chittagong Sea Port / Hazrat Shahjalal International Airport (DAC).
            </p>
          </div>

          <div className="w-full sm:w-72 space-y-2 shrink-0">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal:</span>
              <span className="font-bold text-foreground">${doc.subtotal.toFixed(2)}</span>
            </div>
            {doc.shipping > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping / Freight:</span>
                <span className="font-bold text-foreground">${doc.shipping.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-foreground pt-2 border-t-2 border-foreground">
              <span>Grand Total:</span>
              <span>${doc.grandTotal.toFixed(2)} {doc.currency}</span>
            </div>
          </div>
        </div>

        {/* Bank & Authorized Signature */}
        <div className="pt-8 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs">
          {doc.bankDetails && (
            <div className="p-4 rounded-xl bg-secondary/30 border border-border/60 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Official Export Bank Wire Information
              </span>
              <p className="text-muted-foreground text-[11px]">
                Beneficiary: <strong className="text-foreground">{doc.bankDetails.beneficiaryName}</strong><br />
                Bank: {doc.bankDetails.bankName}<br />
                Account No: <strong className="font-mono text-foreground">{doc.bankDetails.accountNumber}</strong><br />
                SWIFT Code: <strong className="font-mono text-foreground">{doc.bankDetails.swiftCode}</strong><br />
                Branch: {doc.bankDetails.branch}
              </p>
            </div>
          )}

          <div className="flex flex-col justify-end items-start sm:items-end text-right">
            <div className="w-48 border-b border-foreground mb-2" />
            <span className="font-bold text-xs uppercase text-foreground">
              Authorized Signatory
            </span>
            <span className="text-[11px] text-muted-foreground">
              Ayaan Clothing Export Division
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
