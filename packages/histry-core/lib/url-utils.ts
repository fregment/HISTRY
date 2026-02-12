/**
 * Normalize a URL for consistent comparison:
 * - Remove fragment (#...)
 * - Remove trailing slashes
 * - Remove www. prefix
 * - Lowercase the hostname
 */
export const normalizeUrl = (rawUrl: string): string => {
  try {
    const url = new URL(rawUrl);
    // Remove fragment
    url.hash = '';
    // Lowercase hostname
    url.hostname = url.hostname.toLowerCase();
    // Remove www. prefix
    if (url.hostname.startsWith('www.')) {
      url.hostname = url.hostname.slice(4);
    }
    // Build normalized string, remove trailing slash for non-root paths
    let normalized = url.toString();
    if (normalized.endsWith('/') && url.pathname !== '/') {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  } catch {
    return rawUrl;
  }
};

/**
 * Extract the domain from a URL
 */
export const getDomain = (rawUrl: string): string => {
  try {
    const url = new URL(rawUrl);
    let hostname = url.hostname.toLowerCase();
    if (hostname.startsWith('www.')) {
      hostname = hostname.slice(4);
    }
    return hostname;
  } catch {
    return rawUrl;
  }
};

/**
 * Get a favicon URL for a given page URL.
 * Uses Google's public favicon service as a reliable cross-context source.
 */
export const getFaviconUrl = (pageUrl: string, size: number = 32): string => {
  const domain = getDomain(pageUrl);
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`;
};

/**
 * Check if a URL should be excluded from indexing
 * (internal browser pages, extension pages, etc.)
 */
export const shouldExcludeUrl = (url: string): boolean => {
  const excludedPrefixes = [
    'chrome://',
    'chrome-extension://',
    'about:',
    'edge://',
    'brave://',
    'moz-extension://',
    'file://',
    'data:',
    'blob:',
    'javascript:',
  ];
  const lowered = url.toLowerCase();
  return excludedPrefixes.some(prefix => lowered.startsWith(prefix));
};
