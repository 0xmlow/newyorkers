/* The census data as the museum sees it: window.NY_DATA from assets/data.js. */
import * as T from 'three';
import { mulberry } from './textures';

export type Piece = {
  id: string;
  n: number;
  t: string;
  f: string;
  b: string;
  e: number;
  cat?: string;
  story?: string;
  set?: string;
  st: string[];
  ar: number;
  loc?: string;
  nb?: string;
  prec?: string;
  inf?: number;
  gl?: { mp4: string; st: string };
};
type Era = { i: number; roman: string; title: string; sub: string; desc: string; range: [number, number] };
type NYData = {
  counts: Record<string, number> & { atlases: number; atlasGrid: number; atlasPrefix: string; pieces: number };
  pieces: Piece[];
  story: { eras: Era[]; sets: { key: string; name: string; range: [number, number]; hook: string }[]; eraHeroes: Record<string, number[]>; oneLine?: string; oneBreath?: string };
};

declare global {
  interface Window {
    NY_DATA: NYData;
    NY_CONFIG?: Record<string, unknown>;
  }
}

export const D = window.NY_DATA;
export const P = D.pieces;
export const C = D.counts;
export const ERAS = D.story.eras;
export const indexOf = new Map<string, number>();
P.forEach((p, i) => indexOf.set(p.id, i));
export const byNum = new Map<number, Piece>();
P.forEach((p) => byNum.set(p.n, p));
export const thumb = (p: Piece) => `assets/t/${p.st[0]}.jpg`;
export const fmt = (p: Piece) => (p.n != null ? 'NO. ' + String(p.n).padStart(4, '0') : 'UNCOUNTED');
export const era = (p: Piece) => ERAS[p.e - 1];
export const FAMILIES = Array.from(new Set(P.map((p) => p.f))).sort();
export const SETS = Array.from(new Set(P.map((p) => p.set).filter(Boolean) as string[])).sort();
export const HEROES = new Set(Object.values(D.story.eraHeroes).flat());

/* Each room hangs the New Yorkers who belong to it first: pieces whose recorded
   neighbourhood, title or story places them there, then the rest of the census. */
type Cur = { nb: string[]; loc?: RegExp; words: RegExp; fam?: string[]; boro?: string[]; cat?: string[] };
const CURATION: Record<string, Cur> = {
  bowery: { nb: ['Lower East Side', 'East Village', 'Chinatown', 'NoHo', 'SoHo', 'Little Italy', 'Two Bridges'], words: /bowery|bodega|fire escape|stoop|tenement|houston|delancey|deli/i, fam: ['Stoop', 'Hustlers'] },
  subway: { nb: ['The Subway'], words: /subway|platform|the train|\bmta\b|turnstile|conductor|straphanger|\bstation\b|tunnel|\bA train|\bL train|\bF train|\b[1-7] train/i, fam: ['Underground'] },
  met: { nb: ['Upper East Side', 'Central Park', 'Museum Mile', 'Carnegie Hill'], words: /museum|the met\b|gallery|sculpt|curator|rooftop|roof garden|fifth avenue/i, fam: ['Design', 'Builders'] },
  brooklyn: { nb: ['The Brooklyn Bridge', 'DUMBO', 'Brooklyn Heights', 'Downtown Brooklyn', 'Vinegar Hill', 'Brooklyn Bridge Park'], words: /brooklyn bridge|east river|promenade|dumbo|waterfront|bridge/i, boro: ['Brooklyn'] },
  times: { nb: ['Midtown', 'Times Square', 'Theater District', "Hell's Kitchen", 'Garment District'], words: /times square|broadway|billboard|neon|marquee|theater|theatre|midnight|ball drop|tourist/i, fam: ['Heroes', 'Degens'] },
  ferry: { nb: ['The Staten Island Ferry', 'New York Harbor', 'Staten Island', 'St. George', 'The Battery', 'Battery Park'], words: /ferry|harbor|harbour|liberty|deckhand|whitehall|staten|the bay\b|boat/i, boro: ['Staten Island'] },
  botanical: { nb: ['Belmont', 'Fordham', 'Bronx Park', 'The Bronx', 'Norwood', 'Bedford Park'], words: /botanical|garden|greenhouse|conservatory|orchid|bloom|flower|plant|gardener|bronx/i, boro: ['The Bronx', 'Bronx'] },
  penn: { nb: ['Penn Station', 'Moynihan Train Hall', 'Chelsea', 'Midtown', 'Herald Square', 'Koreatown'], words: /penn station|moynihan|amtrak|\blirr\b|commuter|departure|arrival|train hall|luggage|suitcase|transplant|newcomer/i, fam: ['Transplants'] },
  grand: { nb: ['Grand Central Terminal', 'Murray Hill', 'Turtle Bay', 'Midtown East'], words: /grand central|terminal|the clock|constellation|oyster bar|metro-north|commut|whispering/i },
  highline: { nb: ['Chelsea', 'Meatpacking District', 'West Village', 'Hudson Yards', 'West Chelsea'], words: /high line|highline|hudson|rail yard|elevated|planting|gallery district|chelsea/i, fam: ['Design'] },
  coney: { nb: ['Coney Island', 'Brighton Beach', 'Sheepshead Bay', 'Sea Gate'], words: /coney|boardwalk|cyclone|wonder wheel|nathan|mermaid|beach|atlantic|seaside|surf/i },
  bethesda: { nb: ['Central Park'], words: /bethesda|fountain|angel|terrace|the mall|the ramble|central park|rowboat|carousel|sheep meadow/i, fam: ['Places'] },
  oculus: { nb: ['Financial District', 'Tribeca', 'Battery Park City', 'World Trade Center', 'Wall Street'], words: /oculus|world trade|path train|wall street|downtown|financial|stock|trader|broker|tower/i, fam: ['Builders', 'Degens'] },
  guggenheim: { nb: ['Upper East Side', 'Carnegie Hill', 'Museum Mile'], words: /guggenheim|spiral|museum|abstract|artist|painter|architect|design/i, fam: ['Design', 'Process'] },
  library: { nb: ['Bryant Park', 'Midtown', 'Murray Hill'], words: /library|book|reading|writer|poet|novel|librarian|manuscript|study|scholar|typewriter|newspaper/i, fam: ['Process', 'Citizens'] },
  apollo: { nb: ['Harlem', 'East Harlem', 'Sugar Hill', 'Hamilton Heights', 'Strivers Row'], words: /apollo|harlem|stage|jazz|singer|music|rapper|\bmc\b|\bdj\b|band|drum|trumpet|sax|choir|gospel|show/i, cat: ['Musician', 'Rapper'] },
  unisphere: { nb: ['Corona', 'Flushing', 'Flushing Meadows', 'Jackson Heights', 'Elmhurst', 'Queens', 'Forest Hills', 'Willets Point'], words: /unisphere|world'?s fair|flushing|corona|queens|mets|citi field|us open|globe|orbit|seven train|7 train/i, boro: ['Queens'] },
  tram: { nb: ['Roosevelt Island', 'Long Island City', 'Upper East Side', 'Queensboro', 'Sutton Place'], words: /tram|roosevelt island|queensboro|59th|cable|gondola|east river|suspended|above the city|skyline|window/i, fam: ['Transplants', 'Citizens'] },
  cloisters: { nb: ['Inwood', 'Washington Heights', 'Fort Tryon Park', 'Hudson Heights'], words: /cloisters|monastery|medieval|inwood|washington heights|garden|quiet|prayer|herb|tapestry|unicorn|stone/i, fam: ['Places', 'Citizens'] },
  navyyard: { nb: ['Brooklyn Navy Yard', 'Fort Greene', 'Wallabout', 'Vinegar Hill', 'Williamsburg', 'Clinton Hill'], words: /navy yard|shipyard|dock|crane|welder|steel|forge|ironwork|machinist|builder|hard hat|construction|scaffold/i, fam: ['Builders'] },
  governors: { nb: ['Governors Island', 'New York Harbor', 'Red Hook', 'The Battery', 'Battery Park', 'Brooklyn Heights'], words: /governors island|harbor|harbour|island|hill|overlook|horizon|ferry|lighthouse|gull|wind/i, fam: ['Places', 'Strays'] },
  // the second twenty
  chrysler: { nb: ['Midtown East', 'Murray Hill', 'Turtle Bay', 'Midtown'], words: /chrysler|art deco|\bdeco\b|lexington|skyscraper|spire|eagle|elevator|lobby|gargoyle/i, fam: ['Builders', 'Design'] },
  flatiron: { nb: ['Flatiron', 'Gramercy', 'NoMad', 'Madison Square'], words: /flatiron|fifth avenue|madison square|wedge|triangle|plaza|broadway/i, fam: ['Design', 'Builders'] },
  bleachers: { nb: ['Concourse', 'Highbridge', 'Mott Haven', 'The Bronx', 'Fordham', 'Belmont'], words: /yankee|stadium|ballpark|bleacher|baseball|home run|pitcher|shortstop|\bbat\b|the bronx|bronx|mets|ballgame/i, boro: ['Bronx', 'The Bronx'], fam: ['Heroes'] },
  deli: { nb: ['Lower East Side', 'Two Bridges', 'East Village', 'Orchard Street'], words: /\bdeli\b|appetizing|bagel|\blox\b|sturgeon|counter|pastrami|pickle|smoked|herring|knish|take a number|whitefish|bialy/i, fam: ['Hustlers', 'Stoop'] },
  washington: { nb: ['Greenwich Village', 'West Village', 'NoHo', 'Washington Square'], words: /washington square|the arch|chess|fountain|\bnyu\b|the village|busker|guitar|skateboard|pigeon|folk/i, fam: ['Citizens', 'Degens'] },
  boathouse: { nb: ['Prospect Park', 'Park Slope', 'Prospect Heights', 'Windsor Terrace', 'Flatbush', 'Prospect Lefferts Gardens'], words: /prospect park|boathouse|the lake|rowboat|swan|lullwater|long meadow|picnic|brooklyn/i, fam: ['Places', 'Citizens'] },
  halloffame: { nb: ['University Heights', 'Morris Heights', 'Fordham', 'The Bronx', 'Kingsbridge'], words: /hall of fame|\bbust\b|bronze|colonnade|great american|inventor|poet|scientist|statue|monument|legend/i, fam: ['Heroes', 'Builders'] },
  twa: { nb: ['Jamaica', 'JFK', 'Ozone Park', 'Howard Beach', 'Queens', 'South Ozone Park'], words: /\bjfk\b|\btwa\b|airport|flight|terminal|departure|arrival|\bjet\b|pilot|stewardess|luggage|runway|customs|passport|layover/i, fam: ['Transplants'] },
  snug: { nb: ['Randall Manor', 'St. George', 'New Brighton', 'Livingston', 'Staten Island', 'West Brighton'], words: /snug harbor|staten island|sailor|temple|greek|scholar|garden|lawn|retired|old salt/i, boro: ['Staten Island'] },
  wollman: { nb: ['Central Park', 'Midtown', 'Midtown South'], words: /wollman|skat|\bice\b|rink|winter|snow|december|holiday|zamboni|mittens|frozen|cocoa/i, fam: ['Citizens'] },
  doyers: { nb: ['Chinatown', 'Two Bridges', 'Little Italy'], words: /doyers|chinatown|dim sum|noodle|dumpling|lantern|mott street|canal street|\btea\b|mahjong|lunar|wonton|bakery|dragon/i, fam: ['Hustlers', 'Stoop'] },
  strivers: { nb: ['Harlem', 'Hamilton Heights', 'Sugar Hill', 'Strivers Row', 'Central Harlem'], words: /brownstone|stoop|parlor|parlour|harlem|renaissance|strivers|piano|sunday best|church hat|block party|lenox/i, fam: ['Stoop', 'Citizens'] },
  rock: { nb: ['Midtown', 'Rockefeller Center', 'Midtown West'], words: /rockefeller|top of the rock|observation|skyline|30 rock|the view|tourist|helicopter|horizon|deck|binocular/i, fam: ['Transplants', 'Places'] },
  frick: { nb: ['Upper East Side', 'Lenox Hill', 'Museum Mile'], words: /frick|mansion|garden court|gilded|fifth avenue|collector|old master|fountain|marble|vermeer|magnolia/i, fam: ['Design', 'Hustlers'] },
  seaport: { nb: ['Financial District', 'South Street Seaport', 'Two Bridges', 'The Seaport'], words: /seaport|fulton|fish market|tall ship|schooner|pier|cobblestone|harbor|sailor|oyster|rigging|wavertree/i, fam: ['Hustlers', 'Builders'] },
  vessel: { nb: ['Hudson Yards', 'Chelsea', "Hell's Kitchen", 'West Chelsea'], words: /vessel|hudson yards|honeycomb|stairs|staircase|climb|copper|selfie|development|glass tower|the yards/i, fam: ['Degens', 'Design'] },
  littleisland: { nb: ['Chelsea', 'Meatpacking District', 'West Village', 'Hudson River Park'], words: /little island|pier 55|hudson river|tulip|amphitheat|park|the river|sunset|pier|hudson/i, fam: ['Places', 'Citizens'] },
  cathedral: { nb: ['Morningside Heights', 'Harlem', 'Manhattanville', 'Upper West Side'], words: /cathedral|st\.? john|divine|nave|rose window|gothic|choir|organ|peacock|blessing|amsterdam avenue|columbia|candle|hymn/i, fam: ['Heroes', 'Citizens'] },
  queensboro: { nb: ['Long Island City', 'Sunnyside', 'Astoria', 'Queens Plaza', 'Woodside', 'Court Square'], words: /7 train|seven train|queensboro|elevated|\bel\b train|platform|long island city|sunnyside|queens|court square|the n\b|the w\b/i, fam: ['Underground', 'Transplants'] },
  bushwick: { nb: ['Bushwick', 'Ridgewood', 'East Williamsburg', 'Williamsburg'], words: /bushwick|mural|graffiti|rooftop|water tower|spray|street art|warehouse|loft|party|\bl train|jefferson|morgan avenue|dj\b/i, fam: ['Design', 'Degens'] },
};

/* The museum keeps New York time. The hang of the day and the light of the hour
   both come from it, so the same room reads differently every visit. */
const params = new URLSearchParams(location.search);
function nycParts() {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  const o: Record<string, string> = {};
  for (const p of f.formatToParts(new Date())) o[p.type] = p.value;
  return { y: o.year, m: o.month, d: o.day, h: Number(o.hour) % 24, min: Number(o.minute) };
}
const NOW = nycParts();
/* A minted copy pins its room and its hang day; the light still follows the clock. */
export const MINT: { room?: string; day?: string; token?: number } = (window as unknown as { NY_MINT?: { room?: string; day?: string; token?: number } }).NY_MINT || {};
export const DAY = params.get('day') || MINT.day || `${NOW.y}-${NOW.m}-${NOW.d}`;
export const DAY_SEED = Number(DAY.replace(/-/g, '')) || 20260906;
export const HOUR = params.has('hour') ? Number(params.get('hour')) : NOW.h + NOW.min / 60;
export const CLOCK = `${String(Math.floor(HOUR)).padStart(2, '0')}:${String(Math.round((HOUR % 1) * 60)).padStart(2, '0')}`;

const orderCache = new Map<string, Piece[]>();
export function placeHang(roomId: string): Piece[] {
  const hit = orderCache.get(roomId);
  if (hit) return hit;
  const c = CURATION[roomId];
  const rnd = mulberry(roomId.length * 977 + roomId.charCodeAt(0));
  const daily = mulberry(DAY_SEED * 31 + roomId.length * 977 + roomId.charCodeAt(1));
  const scored = P.map((p, i) => {
    let s = 0;
    if (c) {
      if (p.nb && c.nb.includes(p.nb)) s += p.nb === c.nb[0] ? 9 : 6;
      else if (p.loc && c.nb.includes(p.loc)) s += 5;
      if (c.words.test(p.t)) s += 5;
      if (p.story && c.words.test(p.story)) s += 3;
      if (p.nb && c.words.test(p.nb)) s += 2;
      if (c.fam && c.fam.includes(p.f)) s += 2;
      if (c.boro && c.boro.includes(p.b)) s += 1.5;
      if (c.cat && p.cat && c.cat.includes(p.cat)) s += 6;
      if (HEROES.has(p.n)) s += 0.75;
    }
    return { p, s, r: rnd(), d: daily(), i };
  });
  // the recorded New Yorkers of this place lead, reshuffled every New York day; the rest keep a fixed order
  scored.sort((a, b) => (b.s > 0 ? 1 : 0) - (a.s > 0 ? 1 : 0) || (a.s > 0 && b.s > 0 ? (a.d - b.d) : (b.s - a.s) || (a.r - b.r)));
  const out = scored.map((x) => x.p);
  orderCache.set(roomId, out);
  return out;
}
export function placeCount(roomId: string) {
  const c = CURATION[roomId];
  if (!c) return 0;
  return P.filter((p) => (p.nb && c.nb.includes(p.nb)) || c.words.test(p.t) || (p.cat && c.cat?.includes(p.cat))).length;
}

export type Hang = { mode: 'place' | 'era' | 'family' | 'set' | 'all' | 'heroes' | 'search'; key?: string };
export function hangList(h: Hang, roomId: string): Piece[] {
  switch (h.mode) {
    case 'place': return placeHang(roomId);
    case 'era': return P.filter((p) => p.e === Number(h.key));
    case 'family': return P.filter((p) => p.f === h.key);
    case 'set': return P.filter((p) => p.set === h.key);
    case 'heroes': return P.filter((p) => HEROES.has(p.n));
    case 'search': {
      const q = (h.key || '').trim().toLowerCase();
      if (!q) return P;
      const n = Number(q);
      if (Number.isFinite(n) && /^\d+$/.test(q)) {
        const exact = byNum.get(n);
        const near = P.filter((p) => Math.abs(p.n - n) <= 40).sort((a, b) => Math.abs(a.n - n) - Math.abs(b.n - n));
        return exact ? [exact, ...near.filter((p) => p !== exact)] : near;
      }
      return P.filter((p) => p.t.toLowerCase().includes(q) || (p.nb || '').toLowerCase().includes(q) || (p.story || '').toLowerCase().includes(q));
    }
    default: return P;
  }
}
export function hangLabel(h: Hang, roomName: string) {
  switch (h.mode) {
    case 'place': return 'THIS PLACE / ' + roomName;
    case 'era': { const e = ERAS[Number(h.key) - 1]; return `ERA ${e.roman} / ${e.title}`; }
    case 'family': return 'FAMILY / ' + h.key;
    case 'set': return 'SET / ' + h.key;
    case 'heroes': return 'THE HEROES';
    case 'search': return 'SEARCH / ' + (h.key || 'everything');
    default: return 'THE WHOLE CENSUS';
  }
}

/* Atlas sheets, downscaled on low-quality devices. */
const atlasCache = new Map<number, Promise<T.Texture>>();
export function atlasLoader(quality: 'high' | 'low') {
  return (a: number) => {
    let p = atlasCache.get(a);
    if (!p) {
      p = new Promise((res, rej) => {
        const img = new Image();
        img.onload = () => {
          let src: HTMLImageElement | HTMLCanvasElement = img;
          if (quality === 'low') {
            const c = document.createElement('canvas');
            c.width = c.height = 2048;
            c.getContext('2d')!.drawImage(img, 0, 0, 2048, 2048);
            src = c;
          }
          const t = new T.Texture(src);
          t.colorSpace = T.SRGBColorSpace;
          t.anisotropy = 8;
          t.generateMipmaps = true;
          t.minFilter = T.LinearMipmapLinearFilter;
          t.needsUpdate = true;
          res(t);
        };
        img.onerror = rej;
        img.src = `assets/atlas/${C.atlasPrefix || 'd'}${a}.jpg`;
      });
      atlasCache.set(a, p);
    }
    return p;
  };
}
export const perAtlas = C.atlasGrid * C.atlasGrid;
export const atlasOf = (globalIndex: number) => Math.floor(globalIndex / perAtlas);
/* First index at or after `from` such that `count` tiles stay inside one atlas. */
export function wallStart(from: number, count: number) {
  from = from % Math.max(1, P.length);
  if (from + count > P.length) from = Math.max(0, P.length - count);
  const a = atlasOf(from);
  if (atlasOf(from + count - 1) === a) return from;
  return (a + 1) * perAtlas;
}
