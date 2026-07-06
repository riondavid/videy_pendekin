import React, { useState, useEffect } from "react";
import { collection, getDocs, setDoc, deleteDoc, doc, serverTimestamp, query, orderBy, limit } from "firebase/firestore";
import { db } from "./firebase";
import { ShortLink, AnalyticsSummary } from "./types";
import { generateShortCode, normalizeUrl } from "./utils";
import { ShieldCheck, Compass, Link2, Share2, AlertTriangle, Zap, Lock, MessageCircle } from "lucide-react";
import { motion } from "motion/react";

// Components
import RedirectHandler from "./components/RedirectHandler";
import BulkInputForm from "./components/BulkInputForm";
import ResultsList from "./components/ResultsList";
import AnalyticsCards from "./components/AnalyticsCards";
import AnalyticsTable from "./components/AnalyticsTable";

export default function App() {
  // Check if current URL path is a potential short link redirect
  const pathname = window.location.pathname.substring(1);
  const isRedirect = pathname && /^[a-zA-Z0-9_-]{3,15}$/.test(pathname);

  // App States
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [generatedLinks, setGeneratedLinks] = useState<ShortLink[]>([]);
  const [allLinks, setAllLinks] = useState<ShortLink[]>([]);
  const [generating, setGenerating] = useState<boolean>(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState<boolean>(true);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const [summary, setSummary] = useState<AnalyticsSummary>({
    totalLinks: 0,
    totalClicks: 0,
    mostClicked: null,
  });

  // Check secret key gate on mount
  useEffect(() => {
    if (isRedirect) return;

    const queryParams = new URLSearchParams(window.location.search);
    const hasKeyParam = queryParams.has("admin") || queryParams.get("key") === "pendekin-secure";
    const hasStoredAccess = localStorage.getItem("pendekin_admin") === "authorized";

    if (hasKeyParam || hasStoredAccess) {
      localStorage.setItem("pendekin_admin", "authorized");
      setHasAccess(true);
      
      // Clean query parameters from address bar to hide the secret access key
      if (hasKeyParam) {
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    } else {
      setHasAccess(false);
    }
  }, [isRedirect]);

  // Fetch all link analytics from Firestore
  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    setErrorBanner(null);
    try {
      const linksQuery = query(collection(db, "links"), orderBy("createdAt", "desc"), limit(300));
      const querySnapshot = await getDocs(linksQuery);
      
      const loadedLinks: ShortLink[] = [];
      let totalClicksCount = 0;
      let highestClicksLink: ShortLink | null = null;

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const shortLink: ShortLink = {
          id: docSnap.id,
          shortCode: data.shortCode || docSnap.id,
          originalUrl: data.originalUrl,
          clicks: data.clicks || 0,
          createdAt: data.createdAt,
        };
        loadedLinks.push(shortLink);
        
        totalClicksCount += shortLink.clicks;
        if (!highestClicksLink || shortLink.clicks > highestClicksLink.clicks) {
          highestClicksLink = shortLink;
        }
      });

      setAllLinks(loadedLinks);
      setSummary({
        totalLinks: loadedLinks.length,
        totalClicks: totalClicksCount,
        mostClicked: highestClicksLink,
      });
    } catch (err: any) {
      console.error("Gagal memuat analitik:", err);
      setErrorBanner("Gagal sinkronisasi data dengan Firebase. Pastikan koneksi internet Anda stabil atau aturan keamanan Firestore sudah dikonfigurasi.");
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // Run on dashboard mount
  useEffect(() => {
    if (!isRedirect && hasAccess) {
      fetchAnalytics();
    }
  }, [isRedirect, hasAccess]);

  // Bulk Generator handler
  const handleGenerateLinks = async (urls: string[]) => {
    setGenerating(true);
    setErrorBanner(null);
    
    // Clear previous session results immediately upon a second generate trigger
    setGeneratedLinks([]);

    const newlyCreated: ShortLink[] = [];

    try {
      // Loop through each URL (max 20)
      for (const rawUrl of urls) {
        const shortCode = generateShortCode(5);
        const docId = shortCode;
        const normalized = normalizeUrl(rawUrl);

        // Firestore document reference
        const docRef = doc(db, "links", docId);
        
        // Document payload
        const payload = {
          shortCode,
          originalUrl: normalized,
          clicks: 0,
          createdAt: serverTimestamp(),
        };

        // Write directly to Firestore using shortCode as Document ID
        await setDoc(docRef, payload);

        newlyCreated.push({
          id: docId,
          shortCode,
          originalUrl: normalized,
          clicks: 0,
          createdAt: new Date(), // Local fallback timestamp for instant UI render
        });
      }

      // Store in session memory (clears on refresh or subsequent generation)
      setGeneratedLinks(newlyCreated);
      
      // Refresh analytics tracking database
      await fetchAnalytics();
    } catch (err: any) {
      console.error("Gagal membuat tautan:", err);
      setErrorBanner(err?.message || "Kesalahan otentikasi database. Pastikan Firestore rules Anda mengizinkan akses tulis.");
      throw err;
    } finally {
      setGenerating(false);
    }
  };

  // Delete short link handler
  const handleDeleteLink = async (id: string) => {
    try {
      await deleteDoc(doc(db, "links", id));
      // Refresh current table state
      await fetchAnalytics();
      
      // Also update generated links if deleted link was from the current session
      setGeneratedLinks(prev => prev.filter(l => l.id !== id));
    } catch (err: any) {
      console.error("Gagal menghapus tautan:", err);
      setErrorBanner("Gagal menghapus tautan. Periksa hak akses database Anda.");
    }
  };

  // If visiting a shortened URL, render the redirection handler directly
  if (isRedirect) {
    return <RedirectHandler shortCode={pathname} />;
  }

  // If visitor has no access (ordinary user visiting the root domain with no key)
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-[#050505] text-slate-100 font-sans flex flex-col justify-center p-6 relative overflow-hidden">
        {/* Background elegant grid & micro subtle accent blur */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />
        <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex-grow flex flex-col items-center justify-center max-w-md mx-auto text-center relative z-10 space-y-8">
          <div className="space-y-3">
            <span className="text-4xl font-black tracking-tighter uppercase text-cyan-400 glow-text italic select-none animate-pulse">
              pendekin
            </span>
            <p className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">
              Sistem Pengalihan Tautan Aktif
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-[#0f0f12]/90 border border-white/10 backdrop-blur-md glow-border space-y-6 w-full">
            <div className="h-14 w-14 rounded-full bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400 mx-auto animate-bounce">
              <Lock className="h-6 w-6" />
            </div>
            
            <div className="space-y-3">
              <h2 className="text-lg font-black font-mono uppercase tracking-tight text-white">Hi! Sehat Terus Ya!</h2>
            </div>

            <div className="pt-2">
              <a
                href="https://t.me/+UQvbKIWvCDU4YzNl"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 px-6 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-black uppercase tracking-wider text-xs transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg shadow-cyan-400/20 hover:shadow-cyan-300/40 cursor-pointer text-center"
              >
                <MessageCircle className="h-4 w-4" />
                Gabung Obrolan Disini
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 font-sans pb-16 relative overflow-hidden">
      {/* Background elegant grid & micro subtle accent blur */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />
      <div className="absolute top-[-10%] right-[10%] w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-10%] w-[400px] h-[400px] bg-purple-500/3 rounded-full blur-[120px] pointer-events-none" />

      {/* Main navigation header - Clean Minimalist style from template */}
      <header className="border-b border-white/10 bg-[#050505]/80 backdrop-blur-md sticky top-0 z-50 transition-all">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black tracking-tighter uppercase text-cyan-400 glow-text italic select-none">
              pendekin
            </span>
            <div className="h-4 w-px bg-white/20 mx-2 hidden sm:block"></div>
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono opacity-60">
              <span className="status-dot"></span>
              <span>SERVER AKTIF : videy.nfy.fyi</span>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs font-mono">
            <div className="text-right">
              <div className="opacity-40">TOTAL TAUTAN</div>
              <div className="font-bold text-slate-200">
                {loadingAnalytics ? "..." : summary.totalLinks.toLocaleString("id-ID")}
              </div>
            </div>
            <div className="text-right">
              <div className="opacity-40">TOTAL KLIK</div>
              <div className="font-bold text-cyan-400">
                {loadingAnalytics ? "..." : summary.totalClicks.toLocaleString("id-ID")}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard viewport container */}
      <main className="max-w-6xl mx-auto px-6 mt-10 space-y-8 relative z-10">
        
        {/* Futuristic Welcome Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-2">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-cyan-400 text-[10px] font-mono tracking-wider uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>Versi 2.1.0 • Minimalis Bersih</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight font-display text-white uppercase mt-2">
              Panel Pembuat Short Link Massal
            </h1>
            <p className="text-slate-400 max-w-xl text-xs font-mono">
              Sistem generator tautan massal (hingga 20 link sekali input), fitur salin cepat, penyimpanan hasil sesi sementara, dan dasbor analitik real-time.
            </p>
          </div>
          
          <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-mono opacity-60 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span>PEMBARUAN LANGSUNG AKTIF</span>
          </div>
        </div>

        {/* Global Error Banner */}
        {errorBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-start gap-3.5 text-amber-400 text-xs shadow-lg"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-semibold font-display uppercase tracking-wider">Pemberitahuan Pengecualian Sistem</h4>
              <p className="text-slate-300 leading-relaxed font-mono text-[11px]">{errorBanner}</p>
            </div>
          </motion.div>
        )}

        {/* Grid: Generator Controls + Live Results */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left panel: URL inputs */}
          <div className="lg:col-span-7 space-y-6">
            <BulkInputForm onGenerate={handleGenerateLinks} generating={generating} />
          </div>

          {/* Right panel: Active generation outputs */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
            {generatedLinks.length > 0 ? (
              <ResultsList links={generatedLinks} onClear={() => setGeneratedLinks([])} />
            ) : (
              <div className="rounded-2xl border border-white/5 bg-[#0f0f12]/40 backdrop-blur-md p-8 text-center flex flex-col items-center justify-center min-h-[280px]">
                <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 mb-4">
                  <Link2 className="h-4 w-4" />
                </div>
                <h3 className="text-xs uppercase tracking-widest font-mono text-slate-400">Belum Ada Hasil Baru</h3>
                <p className="text-[11px] text-slate-600 max-w-xs mt-2 leading-relaxed font-mono">
                  Masukkan tautan panjang di panel kiri dan klik "BUAT SHORT LINK" untuk merender hasil di sini.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Section: Analytics Dashboard */}
        <div className="space-y-6 pt-6 border-t border-white/5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase tracking-widest opacity-60">
              Dasbor Analitik Real-Time
            </h2>
            <div className="h-[1px] flex-grow bg-white/10 ml-4 max-w-xs" />
          </div>

          {/* Core high-tech analytics counters */}
          <AnalyticsCards summary={summary} loading={loadingAnalytics} />

          {/* Data listing of shortenings with clicks tracking */}
          <AnalyticsTable
            links={allLinks}
            loading={loadingAnalytics}
            onRefresh={fetchAnalytics}
            onDeleteLink={handleDeleteLink}
          />
        </div>
      </main>

      {/* Futuristic subtle footer */}
      <footer className="mt-20 border-t border-white/5 pt-8 max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-mono opacity-30">
        <div>© 2026 PENDEKIN INTERFACE V.2.1.0</div>
        <div>DIKEMBANGKAN UNTUK CLUSTER DOMAIN NFY.FYI</div>
      </footer>
    </div>
  );
}
