// Site configuration. Safe to edit by hand; the data build never touches this file.
window.NY_CONFIG = {
  // Allowlist / census registration backend. Create a free form at https://formspree.io
  // (New Form, name it "NEW YORKERS Census"), copy the form ID from its endpoint URL
  // (https://formspree.io/f/XXXXXXXX) and paste the XXXXXXXX part here.
  // Until this is set, registrations fall back to a prefilled email draft.
  formspree: "",
  // Nominate a New Yorker (counted.html#nominate). A second Formspree form so nominations
  // land in their own queue. Leave empty to reuse the census form id above.
  formspreeNominate: "",
  // Where the email fallback goes:
  // Contact is @degens on X. MLow asked for his personal address off every public surface, and
  // preflight now fails the build if it reappears. Left empty on purpose: nothing renders it.
  contactEmail: "",

  // THE COUNT: the Census Office at NFT.NYC.
  countLabel: "SEPT 1 TO 3, 2026 · NFT.NYC · THE CENSUS OFFICE",
  // THE CLAIM: the mint. Recommended Thursday Oct 8 2026, 11:11 AM ET (decision N01).
  // Flip claimSigned to true once the date is signed; until then every surface says so.
  claimDate: "2026-09-23T11:11:00-04:00",
  claimLabel: "WEDNESDAY SEPT 23, 2026 · 11:11 AM ET · MINTING ON OPENSEA",
  claimSigned: true,

  // The public count of people counted. Never estimated, never inflated: leave null
  // until there is a real posted number, and the site shows the painted census instead.
  peopleCounted: null,

  // Public domain used in share cards and copy, and the canonical URL the SEO build writes into every page,
  // the sitemap and llms.txt. Change siteUrl and rerun _build/build_all.sh if the site moves; the SEO build
  // normalises every earlier host it knows about (see OLD_HOSTS in _build/build_seo.py).
  domain: "N3WYORKERS.COM",
  siteUrl: "https://n3wyorkers.com",

  // The print shop stays exactly where it is, at mlow.nyc, with its 3D gallery. The census took its own
  // domain instead, so nothing about the shop had to move. printsHost is also where build_shop.py
  // reads the catalogue for the product feeds.
  printsUrl: "https://mlow.nyc",
  printsHost: "https://mlow.nyc",
  // The artist site.
  artistUrl: "https://mlow.xyz",

  // ALLOWLIST INTAKE. Where whitelist.html posts. Two supported shapes, pick one:
  //  1. A Google Apps Script web app that appends straight to a Google Sheet. Free, no third party,
  //     you own the data. Setup is in _build/WHITELIST_SETUP.md, takes about five minutes.
  //     Paste the /exec URL here.
  //  2. A Formspree form id, same as the census form. Set whitelistEndpoint to "" and it falls back
  //     to `formspree` below.
  // Until one of these is set the form refuses to submit and says so, rather than pretending to work.
  whitelistEndpoint: "",

  // COLLECTOR PROFILES. Sign in with Privy: wallet, email or social, in one modal.
  // Get an App ID at dashboard.privy.io, paste it here, and set the matching secrets on the
  // Cloudflare Pages project so the server can verify a login:
  //     cd "GO LIVE PACKAGE"
  //     npx wrangler pages secret put PRIVY_APP_ID    --project-name new-yorkers
  //     npx wrangler pages secret put PRIVY_APP_SECRET --project-name new-yorkers
  // Until all three are set, the profile page says sign in is not open yet rather than half working.
  // Collector sign in. false hides the whole thing: the footer link, the page controls
  // and the Privy load. The API and the D1 tables stay in place, so flipping this back
  // to true is the only step needed once wallet sign in is sorted.
  loginEnabled: false,

  privyAppId: "cmtrwiuxw00za0claolirlkjs",

  // The referral share of a mint, as a decimal. Shown on the share card and in the terms.
  // Nothing pays out automatically; this is a stated rate, not a smart contract.
  referralRate: 0.05
};
