/* www to apex. Pages _redirects rules cannot match on host, so the only place to fold www.n3wyorkers.com
 * into n3wyorkers.com is a Function that sees the whole request. One 301 to the same path and query on
 * the apex, and everything else passes straight through to the static site and the other functions.
 * Lives at functions/_middleware.js so it runs for every path, not just /api.
 */
export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.hostname.startsWith("www.")) {
    url.hostname = url.hostname.slice(4);
    return Response.redirect(url.toString(), 301);
  }
  return context.next();
}
