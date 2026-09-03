// Site configuration. Safe to edit by hand; the data build never touches this file.
window.NY_CONFIG = {
  // Allowlist / census registration backend. Create a free form at https://formspree.io
  // (New Form, name it "NEW YORKERS Census"), copy the form ID from its endpoint URL
  // (https://formspree.io/f/XXXXXXXX) and paste the XXXXXXXX part here.
  // Until this is set, registrations fall back to a prefilled email draft.
  formspree: "",
  // Where the email fallback goes:
  contactEmail: "",

  // THE COUNT: the Census Office at NFT.NYC.
  countLabel: "SEPT 1 TO 3, 2026 · NFT.NYC · THE CENSUS OFFICE",
  // THE CLAIM: the mint. Recommended Thursday Oct 8 2026, 11:11 AM ET (decision N01).
  // Flip claimSigned to true once the date is signed; until then every surface says so.
  claimDate: "2026-10-08T11:11:00-04:00",
  claimLabel: "THURSDAY OCT 8, 2026 · 11:11 AM ET",
  claimSigned: false,

  // The public count of people counted. Never estimated, never inflated: leave null
  // until there is a real posted number, and the site shows the painted census instead.
  peopleCounted: null,

  // Public domain used in share cards and copy.
  domain: "NEWYORKERS.MLOW.XYZ"
};
