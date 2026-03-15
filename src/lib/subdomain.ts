const ROOT_DOMAIN = "orthfx.org";

export function getSubdomain(hostname: string): string | null {
  // Dev: stmichael.localhost -> "stmichael"
  if (hostname.endsWith(".localhost")) {
    const sub = hostname.replace(".localhost", "");
    if (sub && sub !== "www") return sub;
    return null;
  }

  // Prod: stmichael.orthfx.org -> "stmichael"
  if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    const sub = hostname.replace(`.${ROOT_DOMAIN}`, "");
    if (sub && sub !== "www" && sub !== "app") return sub;
    return null;
  }

  return null;
}
