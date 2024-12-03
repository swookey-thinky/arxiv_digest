// Detect browser type
function getBrowser() {
  const ua = navigator.userAgent;
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'safari';
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return 'mobile';
  return 'other';
}

// List of CORS proxies in order of preference
const CORS_PROXIES = [
  // allOrigins works well with Safari
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  // Fallback proxies
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

export async function fetchWithCorsProxy(url: string, options: RequestInit = {}) {
  const browserType = getBrowser();
  const headers = {
    ...options.headers,
  };

  // Try direct request first on mobile devices
  if (browserType === 'mobile') {
    try {
      const response = await fetch(url, { ...options, headers });
      if (response.ok) return response;
    } catch (error) {
      console.warn('Direct request failed, falling back to CORS proxies:', error);
    }
  }

  // For Safari, start with allOrigins proxy
  const proxyList = browserType === 'safari' 
    ? [CORS_PROXIES[0]] 
    : CORS_PROXIES;

  // Try each proxy in sequence
  let lastError: Error | null = null;
  for (const proxyFn of proxyList) {
    try {
      const proxyUrl = proxyFn(url);
      const response = await fetch(proxyUrl, { ...options, headers });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Validate response is XML for ArXiv requests
      const contentType = response.headers.get('content-type');
      if (url.includes('arxiv.org') && contentType && !contentType.includes('xml')) {
        throw new Error('Invalid response format');
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Failed to fetch');
      continue;
    }
  }

  // If all proxies fail, throw the last error
  throw lastError || new Error('All requests failed');
}
