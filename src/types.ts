export interface ShortLink {
  id: string; // The shortCode (e.g., "z9K2p")
  shortCode: string;
  originalUrl: string;
  clicks: number;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  } | any;
}

export interface AnalyticsSummary {
  totalLinks: number;
  totalClicks: number;
  mostClicked: ShortLink | null;
}
