// Detect if running on mobile device
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// List of CORS proxies in order of preference
const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://proxy.cors.sh/${url}`,
];

export async function fetchWithCorsProxy(url: string, options: RequestInit = {}) {
  // Try direct request first on mobile devices
  if (isMobileDevice()) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'User-Agent': 'Mozilla/5.0 (compatible; ArxivDigest/1.0;)',
        },
      });

      if (response.ok) {
        return response;
      }
    } catch (error) {
      console.warn('Direct request failed, falling back to CORS proxies:', error);
    }
  }

  // Fall back to CORS proxies if direct request fails or if on desktop
  let lastError: Error | null = null;

  for (const proxyFn of CORS_PROXIES) {
    try {
      const proxyUrl = proxyFn(url);
      const response = await fetch(proxyUrl, {
        ...options,
        headers: {
          ...options.headers,
          'User-Agent': 'Mozilla/5.0 (compatible; ArxivDigest/1.0;)',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Failed to fetch');
      continue;
    }
  }

  throw lastError || new Error('All requests failed');
}