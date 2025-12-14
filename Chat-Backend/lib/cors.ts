// CORS headers helper
const allowedOrigins = [
  "https://choricana.vercel.app"
];

// Function to get CORS headers based on request origin
export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin");
  
  // Normalize origin (remove trailing slash for comparison)
  const normalizedOrigin = origin ? origin.replace(/\/$/, '') : null;
  
  // Check if normalized origin matches any allowed origin (with or without trailing slash)
  const allowedOrigin = normalizedOrigin && allowedOrigins.some(allowed => {
    const normalizedAllowed = allowed.replace(/\/$/, '');
    return normalizedOrigin === normalizedAllowed;
  })
    ? origin! // Use original origin (browser sends it as-is)
    : allowedOrigins[0]; // Default to first origin if not in allowed list

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

// Backward compatibility: static headers (defaults to first origin)
export const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigins[0],
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};