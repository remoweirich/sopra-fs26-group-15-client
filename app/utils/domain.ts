export function getApiDomain(): string {
  if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
    return process.env.NEXT_PUBLIC_PROD_API_URL || "https://sopra-fs26-group-15-server.oa.r.appspot.com";
  }
  return "http://localhost:8080";
}