import React, { useState } from "react";
import { Search, Eye, Calendar, MousePointerClick, RefreshCw, Trash2, ArrowUpDown, ChevronLeft, ChevronRight, Copy, Check, ExternalLink } from "lucide-react";
import { ShortLink } from "../types";
import { formatRelativeTime, truncateUrl } from "../utils";
import { motion } from "motion/react";

interface AnalyticsTableProps {
  links: ShortLink[];
  loading: boolean;
  onRefresh: () => Promise<void>;
  onDeleteLink: (id: string) => Promise<void>;
}

export default function AnalyticsTable({ links, loading, onRefresh, onDeleteLink }: AnalyticsTableProps) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortBy, setSortBy] = useState<"createdAt" | "clicks">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const itemsPerPage = 10;

  // Handle individual short link copy inside table
  const handleCopyLink = (code: string) => {
    const url = `https://videy.nfy.fyi/${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  // Toggle sorting logic
  const handleSort = (field: "createdAt" | "clicks") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  // Safe delete handler
  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus tautan pendek ini dari database?")) {
      setDeletingId(id);
      try {
        await onDeleteLink(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  // Filter links based on search
  const filteredLinks = links.filter((link) => {
    const term = searchTerm.toLowerCase();
    return (
      link.shortCode.toLowerCase().includes(term) ||
      link.originalUrl.toLowerCase().includes(term)
    );
  });

  // Sort filtered links
  const sortedLinks = [...filteredLinks].sort((a, b) => {
    if (sortBy === "clicks") {
      return sortOrder === "asc" ? a.clicks - b.clicks : b.clicks - a.clicks;
    } else {
      // Handle timestamp sorting safely
      const dateA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
      const dateB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    }
  });

  // Paginate items
  const totalPages = Math.ceil(sortedLinks.length / itemsPerPage) || 1;
  const paginatedLinks = sortedLinks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="rounded-2xl bg-[#0f0f12]/80 border border-white/10 backdrop-blur-md p-6 glow-border relative overflow-hidden">
      {/* Table header / actions toolbar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xs font-mono uppercase tracking-widest text-white">Analitik Pengunjung</h2>
          <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase tracking-wider">
            Rincian seluruh data tautan pendek yang tersimpan pada klaster database Firestore.
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2">
          {/* Refresh Database */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all disabled:opacity-50 cursor-pointer"
            title="Muat ulang dataset"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`} />
          </button>

          {/* Search box */}
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="CARI KODE / URL..."
              className="bg-black/40 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-[10px] uppercase font-mono tracking-wider text-slate-100 placeholder:opacity-20 focus:outline-none focus:border-cyan-500/50 w-full transition-all"
            />
          </div>
        </div>
      </div>

      {/* Table responsive viewport */}
      <div className="overflow-x-auto border border-white/5 rounded-xl bg-black/10">
        <table className="w-full text-left border-collapse text-[11px] font-mono">
          <thead>
            <tr className="border-b border-white/5 bg-black/40 text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4 font-normal">Short Code</th>
              <th className="py-3.5 px-4 font-normal">Tujuan Tautan Asli</th>
              <th className="py-3.5 px-4 font-normal cursor-pointer select-none hover:text-white" onClick={() => handleSort("clicks")}>
                <div className="flex items-center gap-1">
                  <span>Klik</span>
                  <ArrowUpDown className={`h-3 w-3 ${sortBy === "clicks" ? "text-cyan-400" : "text-slate-700"}`} />
                </div>
              </th>
              <th className="py-3.5 px-4 font-normal cursor-pointer select-none hover:text-white" onClick={() => handleSort("createdAt")}>
                <div className="flex items-center gap-1">
                  <span>Tanggal Dibuat</span>
                  <ArrowUpDown className={`h-3 w-3 ${sortBy === "createdAt" ? "text-cyan-400" : "text-slate-700"}`} />
                </div>
              </th>
              <th className="py-3.5 px-4 font-normal text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              // Loading Skeleton State
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-4 px-4"><div className="h-3 w-12 bg-white/5 rounded" /></td>
                  <td className="py-4 px-4"><div className="h-3 w-48 bg-white/5 rounded" /></td>
                  <td className="py-4 px-4"><div className="h-3 w-8 bg-white/5 rounded" /></td>
                  <td className="py-4 px-4"><div className="h-3 w-16 bg-white/5 rounded" /></td>
                  <td className="py-4 px-4 text-right"><div className="h-3 w-10 bg-white/5 rounded ml-auto" /></td>
                </tr>
              ))
            ) : paginatedLinks.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={5} className="py-10 px-4 text-center text-slate-600 font-mono tracking-widest uppercase">
                  Data metadata tautan tidak ditemukan.
                </td>
              </tr>
            ) : (
              // Real Data rows
              paginatedLinks.map((link) => {
                const isCopied = copiedCode === link.shortCode;
                const isDeleting = deletingId === link.id;
                const targetShortUrl = `http://videy.nfy.fyi/${link.shortCode}`;
                const localShortUrl = `${window.location.origin}/${link.shortCode}`;

                return (
                  <tr key={link.id} className="hover:bg-white/5 transition-colors group">
                    {/* Short link copy & quick open cell */}
                    <td className="py-3.5 px-4 font-mono font-bold">
                      <div className="flex items-center gap-1.5">
                        <span className="text-cyan-400">/{link.shortCode}</span>
                        
                        {/* Copy code button */}
                        <button
                          type="button"
                          onClick={() => handleCopyLink(link.shortCode)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/5 text-slate-500 hover:text-cyan-400 transition-all cursor-pointer"
                          title="Salin short url"
                        >
                          {isCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        </button>

                        {/* Test click redirection link */}
                        <a
                          href={localShortUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/5 text-slate-500 hover:text-purple-400 transition-all"
                          title="Uji Pengalihan"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </td>

                    {/* Original target URL cell */}
                    <td className="py-3.5 px-4 max-w-xs truncate font-mono text-slate-400">
                      <a
                        href={link.originalUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="hover:text-cyan-400 transition-all block truncate"
                        title={link.originalUrl}
                      >
                        {truncateUrl(link.originalUrl, 50)}
                      </a>
                    </td>

                    {/* Clicks counter cell */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="flex items-center gap-1.5">
                        <MousePointerClick className="h-3.5 w-3.5 text-slate-700 shrink-0" />
                        <span className={`font-semibold px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${
                          link.clicks > 0
                            ? "bg-purple-500/10 text-purple-300 border border-purple-500/20"
                            : "bg-white/5 text-slate-600 border border-white/5"
                        }`}>
                          {link.clicks.toLocaleString("id-ID")} KLIK
                        </span>
                      </div>
                    </td>

                    {/* Created date cell */}
                    <td className="py-3.5 px-4 text-slate-500 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-700 shrink-0" />
                        <span className="uppercase tracking-wider">{formatRelativeTime(link.createdAt)}</span>
                      </div>
                    </td>

                    {/* Delete entry control cell */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(link.id)}
                        disabled={isDeleting}
                        className="p-1.5 rounded-lg bg-transparent hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-slate-500 hover:text-red-400 transition-all disabled:opacity-50 cursor-pointer"
                        title="Hapus catatan"
                      >
                        <Trash2 className={`h-3.5 w-3.5 ${isDeleting ? "animate-pulse" : ""}`} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/5 text-[10px]">
          <span className="font-mono text-slate-500 uppercase tracking-wider">
            Menampilkan Halaman <span className="text-slate-300">{currentPage}</span> dari <span className="text-slate-300">{totalPages}</span> ({filteredLinks.length} item)
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-cyan-400 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-cyan-400 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
