import React, { useState } from "react";
import { Plus, Trash2, ListPlus, LayoutList, Wand2, RefreshCw, AlertCircle } from "lucide-react";
import { isValidUrl } from "../utils";
import { motion, AnimatePresence } from "motion/react";

interface BulkInputFormProps {
  onGenerate: (urls: string[]) => Promise<void>;
  generating: boolean;
}

export default function BulkInputForm({ onGenerate, generating }: BulkInputFormProps) {
  const [activeTab, setActiveTab] = useState<"form" | "bulk">("form");
  
  // Form Mode State (individual rows with 10 default rows)
  const [formUrls, setFormUrls] = useState<string[]>(Array(10).fill(""));
  
  // Bulk Mode State (textarea)
  const [bulkText, setBulkText] = useState<string>("");
  
  const [error, setError] = useState<string | null>(null);

  // Form Mode: Add a new input row (max 20)
  const handleAddRow = () => {
    if (formUrls.length >= 20) {
      setError("Maksimal 20 link dapat digenerate sekaligus.");
      return;
    }
    setFormUrls([...formUrls, ""]);
    setError(null);
  };

  // Form Mode: Remove a specific row
  const handleRemoveRow = (index: number) => {
    if (formUrls.length === 1) {
      setFormUrls([""]);
      return;
    }
    const updated = formUrls.filter((_, idx) => idx !== index);
    setFormUrls(updated);
    setError(null);
  };

  // Form Mode: Update input row value
  const handleRowChange = (index: number, val: string) => {
    const updated = [...formUrls];
    updated[index] = val;
    setFormUrls(updated);
    setError(null);
  };

  // Clear Form state
  const handleReset = () => {
    setFormUrls(Array(10).fill(""));
    setBulkText("");
    setError(null);
  };

  // Handle auto-splitting when multiple links are pasted into a row
  const handlePaste = (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData("text");
    
    // Split by newlines, commas, or tabs
    let items = pastedText
      .split(/[\r\n\t,]+/)
      .map(item => item.trim())
      .filter(item => item !== "");

    // If it's a single line but contains spaces, check if they are multiple URLs separated by space
    if (items.length === 1 && pastedText.includes(" ")) {
      items = pastedText
        .split(/\s+/)
        .map(item => item.trim())
        .filter(item => item !== "");
    }

    if (items.length > 1) {
      e.preventDefault();
      
      const updated = [...formUrls];
      // Replace the pasted input row with the first item, and insert subsequent items
      updated.splice(index, 1, ...items);
      
      if (updated.length > 20) {
        setError("Maksimal 20 link dapat digenerate sekaligus. Link selebihnya dipotong.");
        setFormUrls(updated.slice(0, 20));
      } else {
        setFormUrls(updated);
        setError(null);
      }
    }
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let urlsToProcess: string[] = [];

    if (activeTab === "form") {
      // Filter out empty rows
      urlsToProcess = formUrls.map(u => u.trim()).filter(u => u !== "");
    } else {
      // Split bulk text by newlines and filter empty lines
      urlsToProcess = bulkText
        .split("\n")
        .map(u => u.trim())
        .filter(u => u !== "");
    }

    if (urlsToProcess.length === 0) {
      setError("Masukkan setidaknya satu tautan URL.");
      return;
    }

    if (urlsToProcess.length > 20) {
      setError(`Terlalu banyak link! Anda memasukkan ${urlsToProcess.length} link. Maksimal 20 link sekaligus.`);
      return;
    }

    // Validate URLs
    const invalidUrls = urlsToProcess.filter(u => !isValidUrl(u));
    if (invalidUrls.length > 0) {
      setError(
        `Ditemukan ${invalidUrls.length} format link tidak valid (contoh format valid: google.com atau https://google.com).`
      );
      return;
    }

    // Run callback
    try {
      await onGenerate(urlsToProcess);
    } catch (err: any) {
      setError(err?.message || "Gagal menggenerate tautan pendek.");
    }
  };

  // Count active lines in bulk mode
  const bulkLinesCount = bulkText
    .split("\n")
    .map(u => u.trim())
    .filter(u => u !== "").length;

  return (
    <div className="rounded-2xl bg-[#0f0f12]/80 border border-white/10 backdrop-blur-md p-6 glow-border relative overflow-hidden">
      {/* Visual cybernetic accent bar */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

      {/* Mode Selector Tabs */}
      <div className="flex border-b border-white/5 mb-6">
        <button
          type="button"
          onClick={() => { setActiveTab("form"); setError(null); }}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-mono tracking-wider uppercase transition-colors relative ${
            activeTab === "form" ? "text-cyan-400 font-bold" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <LayoutList className="h-3.5 w-3.5" />
          <span>Baris Input</span>
          {activeTab === "form" && (
            <motion.div
              layoutId="activeTabUnderline"
              className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-cyan-400"
            />
          )}
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab("bulk"); setError(null); }}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-mono tracking-wider uppercase transition-colors relative ${
            activeTab === "bulk" ? "text-cyan-400 font-bold" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <ListPlus className="h-3.5 w-3.5" />
          <span>Tempel Massal</span>
          {activeTab === "bulk" && (
            <motion.div
              layoutId="activeTabUnderline"
              className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-cyan-400"
            />
          )}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <AnimatePresence mode="wait">
          {activeTab === "form" ? (
            <motion.div
              key="form-mode"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-3 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar scroll-hide"
            >
              <div className="flex justify-between items-center text-[10px] text-slate-400 px-1 pb-1 font-mono uppercase tracking-wider">
                <span>DAFTAR URL ({formUrls.length}/20)</span>
                <span className="text-cyan-400">TAMBAH BARIS (+)</span>
              </div>
              
              {formUrls.map((url, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2"
                >
                  <div className="flex-none text-[10px] font-mono text-slate-600 w-5 text-center">
                    {(index + 1).toString().padStart(2, "0")}
                  </div>
                  
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => handleRowChange(index, e.target.value)}
                    onPaste={(e) => handlePaste(index, e)}
                    placeholder="Masukkan tautan panjang..."
                    className="flex-grow bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:opacity-20 focus:outline-none focus:border-cyan-500/50 font-mono transition-all"
                  />
                  
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(index)}
                    tabIndex={-1}
                    className="flex-none p-3 rounded-xl bg-white/5 hover:bg-red-950/40 border border-white/5 hover:border-red-500/30 text-slate-400 hover:text-red-400 transition-colors"
                    title="Hapus tautan"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              ))}

              <button
                type="button"
                onClick={handleAddRow}
                className="w-full py-3 rounded-xl border border-dashed border-white/10 hover:border-cyan-500/40 bg-white/5 hover:bg-cyan-500/5 text-[10px] uppercase font-mono text-slate-400 hover:text-cyan-400 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah Baris Baru ({formUrls.length}/20)
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="bulk-mode"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              <div className="flex justify-between items-center text-[10px] text-slate-400 px-1 pb-1 font-mono uppercase tracking-wider">
                <span>TEMPEL DAFTAR ({bulkLinesCount}/20)</span>
                <span className="text-cyan-400">SATU URL PER BARIS</span>
              </div>
              
              <textarea
                value={bulkText}
                onChange={(e) => {
                  setBulkText(e.target.value);
                  setError(null);
                }}
                rows={8}
                placeholder="https://contoh-link-panjang-1.com&#10;https://contoh-link-panjang-2.com..."
                className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-sm text-slate-100 placeholder:opacity-20 focus:outline-none focus:border-cyan-500/50 font-mono transition-all resize-none leading-relaxed"
              />
              <p className="text-[10px] font-mono text-slate-500 leading-relaxed uppercase tracking-wider">
                * Maksimal 20 URL dipisahkan dengan baris baru.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error notification banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 bg-red-500/5 border border-red-500/20 rounded-xl text-red-400 text-xs font-mono flex items-start gap-2.5"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </motion.div>
        )}

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={generating}
            className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition-all text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            <RefreshCw className="h-3 w-3" />
            Atur Ulang Form
          </button>

          <button
            type="submit"
            disabled={generating}
            className="w-full sm:flex-1 py-4 bg-white text-black font-black uppercase tracking-tighter text-sm hover:bg-cyan-400 hover:text-black transition-colors rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {generating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-black" />
                MEMPROSES...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                BUAT SHORT LINK
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
