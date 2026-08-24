"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAllRfqs } from "@/lib/services/rfq";
import { RfqRecord } from "@/types/b2b";
import { 
  FileText, 
  Search, 
  Filter, 
  ArrowRight, 
  Globe2, 
  Package, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Building2
} from "lucide-react";

export default function AdminRfqPage() {
  const [rfqs, setRfqs] = useState<RfqRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");

  const refresh = async () => {
    setLoading(true);
    const data = await getAllRfqs({
      search,
      status: statusFilter,
      country: countryFilter,
    });
    setRfqs(data);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [search, statusFilter, countryFilter]);

  const totalCount = rfqs.length;
  const underReviewCount = rfqs.filter((r) => r.status === "UNDER_REVIEW" || r.status === "SUBMITTED").length;
  const quotePreparedCount = rfqs.filter((r) => r.status === "QUOTATION_PREPARED").length;
  const acceptedCount = rfqs.filter((r) => r.status === "ACCEPTED").length;
  const totalUnits = rfqs.reduce((acc, r) => acc + r.items.reduce((sum, i) => sum + i.quantity, 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400">NEW INQUIRY</span>;
      case "UNDER_REVIEW":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">UNDER REVIEW</span>;
      case "QUOTATION_PREPARED":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400">QUOTE SENT</span>;
      case "ACCEPTED":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">ACCEPTED</span>;
      case "NEGOTIATION":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">NEGOTIATING</span>;
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
          B2B Wholesale Inquiries (RFQs)
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Review buyer quotation requests, verify MOQ compliance, and generate official commercial quotations.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Total Inquiries
          </span>
          <span className="text-2xl font-display font-bold text-foreground mt-1 block">
            {totalCount}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
            Needs Review
          </span>
          <span className="text-2xl font-display font-bold text-amber-600 dark:text-amber-400 mt-1 block">
            {underReviewCount}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
            Quotes Prepared
          </span>
          <span className="text-2xl font-display font-bold text-purple-600 dark:text-purple-400 mt-1 block">
            {quotePreparedCount}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
            Accepted Orders
          </span>
          <span className="text-2xl font-display font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
            {acceptedCount}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
            Total Inquired Units
          </span>
          <span className="text-2xl font-display font-bold text-primary mt-1 block">
            {totalUnits.toLocaleString()} pcs
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-card border border-border/70 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by RFQ Number, Buyer Name, Company, Country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-border bg-secondary/30 text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="QUOTATION_PREPARED">Quote Prepared</option>
            <option value="NEGOTIATION">Negotiating</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* RFQ Data Table */}
      <div className="bg-card border border-border/70 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4">RFQ Ref</th>
                <th className="py-3 px-3">Buyer & Company</th>
                <th className="py-3 px-3">Destination</th>
                <th className="py-3 px-3 text-right">Volume</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-muted-foreground">
                    <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading inquiries...</span>
                  </td>
                </tr>
              ) : rfqs.length > 0 ? (
                rfqs.map((r) => {
                  const totalQty = r.items.reduce((acc, i) => acc + i.quantity, 0);

                  return (
                    <tr key={r.id} className="hover:bg-secondary/30 transition-colors font-medium">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-foreground block">
                          {r.rfqNumber}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate max-w-[160px] block">
                          {r.requestTitle || "General Inquiry"}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-bold text-foreground block">
                          {r.buyerName}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Building2 size={11} />
                          {r.companyName}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-bold text-foreground block">
                          {r.destinationCity}, {r.destinationCountry}
                        </span>
                        {r.shippingPort && (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            Port: {r.shippingPort}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <span className="font-bold text-foreground block">
                          {totalQty.toLocaleString()} pcs
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {r.items.length} line item(s)
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        {getStatusBadge(r.status)}
                      </td>

                      <td className="py-3.5 px-3 text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/admin/rfq/${r.id}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-secondary hover:bg-foreground hover:text-background text-foreground font-bold text-xs transition-colors cursor-pointer"
                        >
                          <span>Review & Quote</span>
                          <ArrowRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-muted-foreground">
                    No RFQ requests found matching your filter criteria.
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
