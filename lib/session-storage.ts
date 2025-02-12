export function setSessionItem(key: string, value: string, ttl: number = 3600 * 1000) {
    const now = Date.now();
    const item = {
      value,
      expiry: now + ttl, // Store expiry time (current time + 1 hour)
    };
    sessionStorage.setItem(key, JSON.stringify(item));
  }
  
  export function getSessionItem(key: string) {
    if (typeof window === "undefined") return null;
    const itemStr = sessionStorage.getItem(key);
    if (!itemStr) return null;
  
    const item = JSON.parse(itemStr);
    if (Date.now() > item.expiry) {
      sessionStorage.removeItem(key);
      return null; // Return null if expired
    }
    return item.value;
  }
  