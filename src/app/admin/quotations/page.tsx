"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAllQuotations } from "@/lib/services/quotations";
import { QuotationRecord } from "@/types/b2b";
import { 
  FileCheck, 
  Search, 
  Printer, 
  Building2, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  RotateCw 
} from "lucide-react";

export default function AdminQuotationsPage() {
  const [quotations, setQuotations] = useState<QuotationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const refresh = async () => {
    setLoading(true);
    const data = await getAllQuotations({ search, status: statusFilter });
    setQuotations(data);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [search, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "READY":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400">ISSUED</span>;
      case "ACCEPTED":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">ACCEPTED</span>;
      case "NEGOTIATION":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">REVISING</span>;
      case "REJECTED":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-destructive/15 text-destructive">REJECTED</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-secondary text-foreground">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-foreground">
          Commercial Quotations & Invoices
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Manage issued B2B export quotations, revisions, and accepted Proforma Invoices (PI).
        </p>
      </div>

      {/* Filter & Search */}
      <div className="bg-card border border-border/70 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by Quotation Number, RFQ Ref, Buyer, Company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-border bg-secondary/30 text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground focus:ring-1 focus:ring-primary outline-none w-full sm:w-auto"
        >
          <option value="all">All Statuses</option>
          <option value="READY">Issued</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="NEGOTIATION">In Negotiation</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Quotations Data Table */}
      <div className="bg-card border border-border/70 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4">Quote Ref</th>
                <th className="py-3 px-3">Buyer & Company</th>
                <th className="py-3 px-3">Destination</th>
                <th className="py-3 px-3 text-right">Grand Total</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3">Valid Until</th>
                <th className="py-3 px-4 text-right">Print Documents</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-muted-foreground">
                    <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading quotations...</span>
                  </td>
                </tr>
              ) : quotations.length > 0 ? (
                quotations.map((q) => (
                  <tr key={q.id} className="hover:bg-secondary/30 transition-colors font-medium">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-foreground">
                          {q.quotationNumber}
                        </span>
                        {q.revisionNumber > 1 && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-secondary border border-border">
                            Rev.{q.revisionNumber}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono block mt-0.5">
                        Ref: {q.rfqNumber}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="font-bold text-foreground block">
                        {q.buyerName}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Building2 size={11} />
                        {q.companyName}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="font-bold text-foreground block">
                        {q.destinationCity}, {q.destinationCountry}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {q.incoterm || "FOB"} Terms
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <span className="font-bold text-foreground text-sm block">
                        ${q.grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {q.currency}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      {getStatusBadge(q.status)}
                    </td>

                    <td className="py-3.5 px-3 text-muted-foreground">
                      {q.validUntil}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/documents/QUOTATION/${q.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border hover:bg-secondary text-foreground text-xs font-bold transition-colors"
                          title="Print Quotation Document"
                        >
                          <Printer size={12} />
                          <span>Quote</span>
                        </Link>

                        {q.proformaInvoiceId && (
                          <Link
                            href={`/admin/documents/PROFORMA_INVOICE/${q.id}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold transition-colors shadow-xs"
                            title="Print Proforma Invoice"
                          >
                            <Printer size={12} />
                            <span>PI</span>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-muted-foreground">
                    No commercial quotations generated yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
