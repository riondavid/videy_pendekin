import React, { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebase";
import { withTimeout } from "../utils";
import { ShieldAlert, Compass, Globe, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

interface RedirectHandlerProps {
  shortCode: string;
}

export default function RedirectHandler({ shortCode }: RedirectHandlerProps) {
  const [status, setStatus] = useState<"loading" | "redirecting" | "not_found" | "error">("loading");
  const [originalUrl, setOriginalUrl] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    async function performRedirect() {
      try {
        const docRef = doc(db, "links", shortCode);
        const docSnap = await withTimeout(
          getDoc(docRef),
          7000,
          "Koneksi ke Firebase Firestore timeout. Pastikan Firestore Database diaktifkan di Firebase Console."
        );

        if (docSnap.exists()) {
          const data = docSnap.data();
          const targetUrl = data.originalUrl;
          setOriginalUrl(targetUrl);
          setStatus("redirecting");

          // Increment click counter asynchronously in Firestore
          try {
            await updateDoc(docRef, {
              clicks: increment(1),
            });
          } catch (err) {
            console.warn("Failed to increment click count, proceeding with redirect...", err);
          }

          // Delay slightly for a cool sci-fi visual transition before redirecting
          setTimeout(() => {
            window.location.replace(targetUrl);
          }, 1500);
        } else {
          setStatus("not_found");
        }
      } catch (error) {
        console.error("Redirection error:", error);
        setStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "Sistem gagal mengakses database.");
      }
    }

    if (shortCode) {
      performRedirect();
    }
  }, [shortCode]);

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background futuristic glow grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b10_1px,transparent_1px),linear-gradient(to_bottom,#1e293b10_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full text-center relative z-10 px-6 py-12 rounded-2xl bg-[#0e1424]/80 border border-slate-800 backdrop-blur-xl glow-border">
        {/* Logo */}
        <div className="mb-8 flex justify-center items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-500 flex items-center justify-center text-[#070a13] font-bold text-xl shadow-lg shadow-cyan-500/20">
            p
          </div>
          <span className="text-2xl font-bold tracking-tight font-display bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            pendekin
          </span>
        </div>

        {status === "loading" && (
          <div className="space-y-6">
            <div className="relative h-20 w-20 mx-auto">
              {/* Outer scanning loader */}
              <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-t-cyan-400 border-r-transparent border-b-transparent border-l-transparent"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              />
              <div className="absolute inset-4 rounded-full bg-[#070a13] flex items-center justify-center">
                <Compass className="h-6 w-6 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold font-display tracking-wide text-cyan-400">
                MENCARI TAUTAN
              </h2>
              <p className="text-sm text-slate-400 font-mono">
                Mendekodekan short code: <span className="text-cyan-300">/{shortCode}</span>
              </p>
            </div>
          </div>
        )}

        {status === "redirecting" && (
          <div className="space-y-6">
            <div className="relative h-20 w-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20" />
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-t-emerald-400 border-b-emerald-400 border-r-transparent border-l-transparent"
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              />
              <div className="absolute inset-4 rounded-full bg-[#070a13] flex items-center justify-center">
                <Globe className="h-6 w-6 text-emerald-400 animate-bounce" />
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-xl font-semibold font-display tracking-wide text-emerald-400">
                PENGALIHAN AKTIF
              </h2>
              <div className="bg-[#070a13] p-3 rounded-lg border border-slate-800 max-w-xs mx-auto truncate text-xs font-mono text-slate-300 flex items-center justify-center gap-2">
                <span>/{shortCode}</span>
                <ArrowRight className="h-3 w-3 text-emerald-400 shrink-0" />
                <span className="truncate">{originalUrl}</span>
              </div>
              <p className="text-xs text-slate-400 animate-pulse">
                Menghubungkan ke server tujuan...
              </p>
            </div>
          </div>
        )}

        {status === "not_found" && (
          <div className="space-y-6">
            <div className="h-16 w-16 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-red-500/5">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold font-display text-red-400">
                Tautan Tidak Ditemukan
              </h2>
              <p className="text-sm text-slate-400">
                Short code <code className="text-red-300 bg-red-950/40 px-1.5 py-0.5 rounded font-mono">/{shortCode}</code> tidak terdaftar di database kami atau telah kadaluarsa.
              </p>
            </div>
            <div className="pt-4">
              <a
                href="/"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors font-medium text-sm font-display border border-slate-700"
              >
                Kembali ke Beranda
              </a>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-6">
            <div className="h-16 w-16 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold font-display text-amber-400">
                Kesalahan Koneksi
              </h2>
              <p className="text-xs text-slate-400 font-mono bg-slate-950/60 p-3 rounded border border-slate-800 text-left max-h-24 overflow-y-auto">
                {errorMessage}
              </p>
            </div>
            <div className="pt-4">
              <a
                href="/"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors font-medium text-sm font-display border border-slate-700"
              >
                Coba Lagi
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
