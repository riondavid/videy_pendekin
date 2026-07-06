import React, { useState } from "react";
import { Copy, Check, Share2, ArrowRight, ExternalLink, RefreshCw, Layers } from "lucide-react";
import { ShortLink } from "../types";
import { motion } from "motion/react";

interface ResultsListProps {
  links: ShortLink[];
  onClear: () => void;
}

export default function ResultsList({ links, onClear }: ResultsListProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [bulkCopied, setBulkCopied] = useState<boolean>(false);
  const [useProductionDomain, setUseProductionDomain] = useState<boolean>(true);

  if (links.length === 0) return null;

  // Domain configurations
  const prodBase = "http://videy.nfy.fyi";
  const devBase = window.location.origin;

  const getShortUrl = (code: string) => {
    const base = useProductionDomain ? prodBase : devBase;
    return `${base}/${code}`;
  };

  // Copy individual short link
  const handleCopyOne = (code: string, index: number) => {
    const url = getShortUrl(code);
    navigator.clipboard.writeText(url);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Copy all links in bulk
  const handleCopyAll = () => {
    const allUrls = links.map(l => getShortUrl(l.shortCode)).join("\n");
    navigator.clipboard.writeText(allUrls);
    setBulkCopied(true);
    setTimeout(() => setBulkCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="rounded-2xl bg-[#0f0f12]/80 border border-white/10 p-6 glow-border relative overflow-hidden"
    >
      {/* Laser horizontal scanning effect */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />

      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-white/5 pb-4 mb-6">
        <div>
          <h2 className="text-xs font-mono uppercase tracking-widest text-white flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
            Tautan Hasil Generate ({links.length})
          </h2>
          <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase tracking-wider">
            Salin tautan di bawah ini. Hasil bersifat sementara dan akan terhapus jika direfresh.
          </p>
        </div>

        {/* Domain selection toggler */}
        <div className="flex items-center bg-black/40 border border-white/5 p-1 rounded-xl shrink-0 text-[10px] font-mono">
          <button
            type="button"
            onClick={() => setUseProductionDomain(true)}
            className={`px-3 py-1.5 rounded-lg transition-all uppercase tracking-wider ${
              useProductionDomain
                ? "bg-white/10 border border-white/10 text-cyan-400 font-bold"
                : "text-slate-500 hover:text-slate-300 border border-transparent"
            }`}
          >
            PROD
          </button>
          <button
            type="button"
            onClick={() => setUseProductionDomain(false)}
            className={`px-3 py-1.5 rounded-lg transition-all uppercase tracking-wider ${
              !useProductionDomain
                ? "bg-white/10 border border-white/10 text-purple-400 font-bold"
                : "text-slate-500 hover:text-slate-300 border border-transparent"
            }`}
          >
            SANDBOX
          </button>
        </div>
      </div>

      {/* Grid List of Links */}
      <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 scroll-hide">
        {links.map((link, index) => {
          const shortUrl = getShortUrl(link.shortCode);
          return (
            <motion.div
              key={link.id || index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-black/20 border border-white/5 hover:border-white/10 transition-colors"
            >
              {/* Left Details */}
              <div className="min-w-0 flex-1 space-y-1">
                {/* Original url source */}
                <span className="text-[10px] font-mono text-slate-600 truncate block max-w-sm">
                  ASLI: {link.originalUrl}
                </span>
                
                {/* Generated shortened url */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold font-mono text-cyan-400 tracking-wide select-all">
                    {shortUrl}
                  </span>
                  
                  {/* Test link anchor */}
                  <a
                    href={shortUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="p-1 rounded text-slate-500 hover:text-cyan-400 transition-colors"
                    title="Buka tautan"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {/* Copy control button */}
              <button
                type="button"
                onClick={() => handleCopyOne(link.shortCode, index)}
                className={`sm:self-center shrink-0 py-2 px-3.5 rounded-lg text-[10px] font-mono uppercase tracking-wider border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  copiedIndex === index
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-white/5 border-white/5 hover:border-cyan-500/30 hover:text-cyan-400 text-slate-400"
                }`}
              >
                {copiedIndex === index ? (
                  <>
                    <Check className="h-3 w-3" />
                    TERSALIN!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    SALIN
                  </>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Bulk Action Controls */}
      <div className="mt-6 pt-5 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Helper info on selected domain */}
        <span className="text-[10px] font-mono text-slate-600 leading-relaxed uppercase tracking-wider truncate">
          * Target: {useProductionDomain ? "http://videy.nfy.fyi" : "Sandbox lokal"}.
        </span>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onClear}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-red-950/20 hover:border-red-500/20 text-[10px] font-mono uppercase tracking-wider text-slate-400 hover:text-red-400 transition-all cursor-pointer"
          >
            Bersihkan Hasil
          </button>

          <button
            type="button"
            onClick={handleCopyAll}
            className="flex-2 sm:flex-initial px-5 py-2.5 rounded-xl bg-white text-black hover:bg-cyan-400 font-bold text-[10px] font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {bulkCopied ? (
              <>
                <Check className="h-3.5 w-3.5 text-black" />
                SEMUA TERSALIN!
              </>
            ) : (
              <>
                <Layers className="h-3.5 w-3.5 text-black" />
                SALIN SEMUA LINK
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
