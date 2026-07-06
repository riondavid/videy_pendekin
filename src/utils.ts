/**
 * Utility functions for Pendekin URL Shortener
 */

/**
 * Validates whether a string is a properly formatted URL.
 */
export function isValidUrl(urlString: string): boolean {
  try {
    // Basic validation check
    if (!urlString || urlString.trim() === "") return false;
    
    // Add protocol if missing to test validity
    let testUrl = urlString.trim();
    if (!/^https?:\/\//i.test(testUrl)) {
      testUrl = "http://" + testUrl;
    }
    
    const url = new URL(testUrl);
    // Ensure hostname is valid and has at least a TLD (contains a dot)
    return url.hostname.includes(".") && url.hostname.length > 3;
  } catch {
    return false;
  }
}

/**
 * Normalizes a URL by ensuring it starts with http:// or https://.
 */
export function normalizeUrl(url: string): string {
  let trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return "https://" + trimmed;
  }
  return trimmed;
}

/**
 * Generates a random alphanumeric short code of a specific length.
 * Excludes confusing characters like l, 1, o, 0, I for user friendliness.
 */
export function generateShortCode(length: number = 6): string {
  const chars = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Formats a Firestore timestamp or JS Date into a readable relative string.
 */
export function formatRelativeTime(dateInput: any): string {
  if (!dateInput) return "Unknown";
  
  let date: Date;
  if (dateInput instanceof Date) {
    date = dateInput;
  } else if (dateInput && typeof dateInput.toDate === "function") {
    date = dateInput.toDate();
  } else if (dateInput && dateInput.seconds) {
    date = new Date(dateInput.seconds * 1000);
  } else {
    date = new Date(dateInput);
  }

  if (isNaN(date.getTime())) return "Unknown";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 10) return "Just now";
  if (diffSecs < 60) return `${diffSecs}s ago`;
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

/**
 * Truncates a URL so it fits beautifully in UI cards or tables.
 */
export function truncateUrl(url: string, maxLength: number = 45): string {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength) + "...";
}
