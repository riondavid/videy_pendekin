import React from "react";
import { Link, MousePointerClick, Zap, Flame } from "lucide-react";
import { ShortLink, AnalyticsSummary } from "../types";
import { motion } from "motion/react";

interface AnalyticsCardsProps {
  summary: AnalyticsSummary;
  loading: boolean;
}

export default function AnalyticsCards({ summary, loading }: AnalyticsCardsProps) {
  const cards = [
    {
      title: "Tautan Pendek Aktif",
      value: loading ? "..." : summary.totalLinks.toLocaleString("id-ID"),
      icon: Link,
      description: "Tersimpan di database",
      color: "border-white/5",
      textColor: "text-cyan-400",
      glow: "shadow-cyan-500/5",
    },
    {
      title: "Analitik Total Klik",
      value: loading ? "..." : summary.totalClicks.toLocaleString("id-ID"),
      icon: MousePointerClick,
      description: "Akumulasi pengalihan rute",
      color: "border-white/5",
      textColor: "text-purple-400",
      glow: "shadow-purple-500/5",
    },
    {
      title: "Performa Terbaik",
      value: loading
        ? "..."
        : summary.mostClicked
        ? `/${summary.mostClicked.shortCode}`
        : "N/A",
      subtext: summary.mostClicked
        ? `${summary.mostClicked.clicks.toLocaleString("id-ID")} klik`
        : "Belum ada klik",
      icon: Flame,
      description: summary.mostClicked
        ? summary.mostClicked.originalUrl
        : "Tidak ada data lalu lintas",
      color: "border-cyan-500/20",
      textColor: "text-cyan-400",
      glow: "shadow-cyan-500/5",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            className={`relative rounded-2xl bg-[#0f0f12]/80 border p-6 glow-border ${card.color} overflow-hidden`}
          >
            {/* Subtle card grid effect */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff02_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

            <div className="flex justify-between items-start mb-4 relative z-10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                {card.title}
              </span>
              <div className={`p-2 rounded-xl bg-white/5 border border-white/5 ${card.textColor}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>

            <div className="space-y-1 relative z-10">
              {loading ? (
                <div className="h-9 w-24 bg-white/5 animate-pulse rounded-md" />
              ) : (
                <div className="text-2xl font-black tracking-tight font-mono text-white">
                  {card.value}
                </div>
              )}
              
              {card.subtext && !loading && (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 uppercase tracking-wider">
                  <Zap className="h-2.5 w-2.5 fill-cyan-400 text-cyan-400" />
                  {card.subtext}
                </div>
              )}

              <p className="text-[10px] font-mono text-slate-600 truncate max-w-full pt-1 uppercase tracking-wider">
                {card.description}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
