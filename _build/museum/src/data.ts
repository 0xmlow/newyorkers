/* The census data as the museum sees it: window.NY_DATA from assets/data.js. */
import * as T from 'three';
import { USED } from './used';
import { OWNED, LEADS } from './hang_owned';
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
  /** Canal Street knockoff: the replaced original (k) under a misspelled name, plus bootleg meme takes (x). */
  cs?: { k: string; name: string; x?: string[] };
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
const FAM_NAMES: Record<string, { name: string; blurb: string }> = (D.story as unknown as { familyNames?: Record<string, { name: string; blurb: string }> }).familyNames || {};
/* The stored family value is the stable key; this is the two word name shown to people. */
export const famName = (f: string) => (FAM_NAMES[f] && FAM_NAMES[f].name) || f || '';
export const FAMILIES = Array.from(new Set(P.map((p) => p.f))).sort();
export const SETS = Array.from(new Set(P.map((p) => p.set).filter(Boolean) as string[])).sort();
export const HEROES = new Set(Object.values(D.story.eraHeroes).flat());

/* Each room hangs the New Yorkers who belong to it first: pieces whose recorded
   neighbourhood, title or story places them there, then the rest of the census. */
type Cur = { nb: string[]; loc?: RegExp; words: RegExp; fam?: string[]; boro?: string[]; cat?: string[]; fresh?: boolean };
const CURATION: Record<string, Cur> = {
  katz: { nb: ['Lower East Side'], words: /deli|pastrami|cook|counter|pickle|waiter/i },
  barney: { nb: ['Upper West Side'], words: /deli|bagel|regular|breakfast|appetizing/i },
  astorhall: { nb: ['Midtown'], words: /library|book|writer|poet|reader/i },
  jefferson: { nb: ['Greenwich Village'], words: /book|writer|poet|village/i },
  eldridge: { nb: ['Lower East Side'], words: /immigrant|synagogue|heritage|family/i },
  cityhallrotunda: { nb: ['Civic Center'], words: /civic|mayor|citizen|protest|public/i },
  castleclinton: { nb: ['Battery Park'], words: /harbor|arrival|immigrant|boat/i },
  greenacre: { nb: ['Midtown'], words: /garden|flower|lunch|quiet/i },
  paley: { nb: ['Midtown'], words: /garden|tree|coffee|regular/i },
  stmarksyard: { nb: ['East Village'], words: /poetry|poet|punk|writer/i },
  kingsfoyer: { nb: ['Flatbush'], words: /theater|cinema|performer|usher/i },
  valencia: { nb: ['Jamaica'], words: /queens|theater|cinema|dream/i },
  essexmarket: { nb: ['Lower East Side'], words: /market|vendor|cook|grocer/i },
  armstronggarden: { nb: ['Corona'], words: /jazz|trumpet|musician|queens/i },
  hamiltongrange: { nb: ['Hamilton Heights'], words: /harlem|history|neighbor|park/i },

  fultonfish: { nb: ['Hunts Point', 'The Bronx'], words: /fish|market|dock|porter|night shift|worker|ice|forklift/i },
  lunarnewyear: { nb: ['Chinatown'], words: /chinatown|lunar|new year|lion|dragon|parade|firecracker|mott/i },
  enginecompany: { nb: ['Little Italy', 'Nolita', 'SoHo'], words: /fire|firefighter|engine|ladder|rescue|broome/i },
  eastriverfourth: { nb: ['Brooklyn Heights', 'DUMBO', 'Brooklyn Bridge Park'], words: /fireworks|fourth of july|promenade|east river|crowd|summer/i },
  paradisegarage: { nb: ['SoHo', 'Hudson Square', 'West Village'], words: /\bdj\b|dance|club|disco|garage|night|record|party/i },
  arthurashe: { nb: ['Flushing', 'Flushing Meadows', 'Corona'], words: /tennis|us open|racket|athlete|umpire|stadium|match|serve/i },
  carousel: { nb: ['Central Park'], words: /carousel|horse|child|kid|ride|park|organ|waltz/i },
  sharks: { nb: ['Coney Island'], words: /aquarium|shark|fish|ocean|diver|\bsea\b|tank|boardwalk/i },
  astoriapool: { nb: ['Astoria'], words: /pool|swim|lifeguard|summer|astoria|dive|heat/i },
  rockcenter: { nb: ['Midtown', 'Rockefeller Center'], words: /skat|christmas|holiday|tree|rockefeller|tourist|\bice\b|december/i },
  empirestate: { nb: ['Midtown', 'Koreatown', 'Murray Hill'], words: /skyscraper|empire|observation|view|skyline|tourist|king kong|wind|height/i },
  stpatricks: { nb: ['Midtown'], words: /church|cathedral|priest|nun|saint|catholic|prayer|mass|irish|choir|parade/i },
  dumbo: { nb: ['DUMBO', 'Brooklyn Heights', 'Vinegar Hill'], words: /bridge|cobble|photograph|warehouse|carousel|brooklyn|waterfront|wedding/i },
  bowbridge: { nb: ['Central Park', 'Upper West Side'], words: /bridge|rowboat|lake|park|swan|duck|romance|proposal|autumn|stroll/i },
  unassembly: { nb: ['Turtle Bay', 'Midtown East'], words: /diplomat|interpreter|flag|nation|translator|peace|delegate|world|immigrant/i },
  palmcourt: { nb: ['Midtown', 'Central Park South'], words: /tea|hotel|plaza|palm|waiter|pianist|eloise|lunch|elegan/i },
  chelseamarket: { nb: ['Chelsea', 'Meatpacking District'], words: /market|food|baker|cookie|oreo|factory|shop|vendor|lobster/i },
  brooklyncentral: { nb: ['Prospect Heights', 'Park Slope', 'Grand Army Plaza'], words: /library|book|read|librarian|student|writer|poet|brooklyn/i },
  templeemanuel: { nb: ['Upper East Side', 'Lenox Hill'], words: /synagogue|temple|jewish|rabbi|cantor|organ|bar mitzvah|wedding|fifth avenue/i },
  kehilathjeshurun: { nb: ['Upper East Side', 'Yorkville'], words: /synagogue|jewish|rabbi|school|student|shabbat|family|prayer/i },
  jewishcenter: { nb: ['Upper West Side'], words: /synagogue|jewish|rabbi|pool|gym|community|shabbat|scholar/i },
  chabad770: { nb: ['Crown Heights'], words: /chabad|hasid|rebbe|jewish|yeshiva|student|crown heights|prayer|brooklyn|beard/i },
  ohel: { nb: ['Cambria Heights', 'Queens'], words: /prayer|candle|letter|pilgrim|chabad|jewish|memorial|visitor/i },
  safra: { nb: ['Upper East Side', 'Lenox Hill'], words: /synagogue|sephardic|jewish|prayer|family|stone|holiday/i },
  shearith: { nb: ['Upper West Side', 'Lincoln Square'], words: /synagogue|sephardic|portuguese|jewish|colonial|history|heritage|prayer/i },
  parkeast: { nb: ['Upper East Side', 'Lenox Hill'], words: /synagogue|jewish|rabbi|cantor|choir|survivor|holocaust|prayer/i },
  gramercy: { nb: ['Gramercy', 'Gramercy Park', 'Flatiron'], words: /park|key|gate|garden|actor|writer|club|nanny|doorman|resident|private/i },
  weitsmanyard: { nb: [], words: /scrap|metal|steel|crane|truck|driver|welder|recycl|junk|iron|machin|worker|forge/i },
  cityhallloop: { nb: ['Civic Center', 'Lower Manhattan'], words: /subway|train|conductor|commut|token|transit|tile|station|underground|motorman/i },
  goldvault: { nb: ['Financial District'], words: /gold|bank|vault|guard|money|finance|treasur|security|federal|clerk/i },
  unionsquare: { nb: ['Union Square', 'Gramercy', 'Flatiron', 'East Village'], words: /market|farmer|vendor|produce|protest|skate|chess|flower|clock|square|apple|honey/i },
  bryantpark: { nb: ['Midtown'], words: /park|lunch|chess|carousel|reader|office|lawn|ping pong|skate|film|librar/i },
  lighthouse: { nb: ['Washington Heights', 'Fort Washington', 'Hudson Heights'], words: /lighthouse|bridge|river|hudson|keeper|boat|kayak|jogger|cyclist|fisher/i },
  fourfreedoms: { nb: ['Roosevelt Island'], words: /island|river|granite|tram|nurse|hospital|freedom|memorial|architect|ruin/i },
  sealions: { nb: ['Central Park', 'Upper East Side'], words: /zoo|sea lion|penguin|keeper|child|animal|clock|feed|snow leopard|bear/i },
  delacorte: { nb: ['Central Park', 'Upper West Side'], words: /theater|theatre|actor|shakespeare|stage|audience|summer|play|performer|usher/i },
  cherryesplanade: { nb: ['Prospect Heights', 'Crown Heights', 'Park Slope', 'Flatbush'], words: /garden|cherry|blossom|flower|gardener|japanese|koi|picnic|spring|bonsai/i },
  promenade: { nb: ['Brooklyn Heights'], words: /promenade|skyline|view|brownstone|dog|jogger|sunset|harbor|bench|stroller/i },
  astorplace: { nb: ['East Village', 'NoHo', 'Cooper Square'], words: /cube|student|cooper|skate|hair|barber|punk|village|subway|engineer|architect/i },
  nightmarket: { nb: ['Flushing', 'Corona', 'Queens', 'Flushing Meadows'], words: /market|food|vendor|cook|night|lantern|stall|grill|dumpling|immigrant|queens|arepa|momo/i },
  dykerheights: { nb: ['Dyker Heights', 'Bensonhurst', 'Bay Ridge'], words: /christmas|lights|holiday|santa|family|italian|decorat|winter|brooklyn|nonna|electrician/i },
  huntspoint: { nb: ['Hunts Point', 'The Bronx', 'Bronx'], words: /market|produce|truck|forklift|warehouse|night shift|worker|driver|fruit|vegetable|bronx|wholesale|loader/i },
  columbuspark: { nb: ['Chinatown', 'Civic Center', 'Two Bridges'], words: /chinatown|chess|xiangqi|mahjong|tai chi|erhu|elder|grandmother|grandfather|park|bench|cantonese/i },
  pennstation: { nb: ['Penn Station', 'Garment District', 'Midtown South', 'Hudson Yards'], words: /penn station|demoli|wrecking|landmark|lost|vanish|ghost|travertine|waiting room|column|ledger|census|counted|roll call|preserv|1963|1910|eagle|clock/i },
  crystalpalace: { nb: ['Bryant Park', 'Midtown', 'Murray Hill', 'Garment District'], words: /glass|crystal|fair|exhibit|world's fair|inventor|invent|engine|machine|steam|elevator|otis|fountain|palace|1853|1858|fire|burn|ember|gaslight|lantern|showman|barnum|stained|dome|light/i },

  pneumatic: { nb: ['Civic Center'], words: /letter|mail|postal|messenger|courier|message/i },
  garment: { nb: ['Garment District'], words: /tailor|seamstress|garment|fashion|fabric|designer/i },
  diamondexchange: { nb: ['Midtown'], words: /diamond|jewel|gem|dealer|gold|appraiser/i },
  steamworks: { nb: ['Manhattan'], words: /steam|plumber|pipe|engineer|worker|maintenance/i },
  newsprint: { nb: ['Civic Center'], words: /newspaper|reporter|journalist|print|editor|newsstand/i },
  laundry: { nb: ['Queens'], words: /laundry|laundromat|night shift|neighbor|washing/i },
  taxidispatch: { nb: ['Long Island City'], words: /taxi|cab|driver|dispatch|chauffeur/i },
  flowercold: { nb: ['Chelsea'], words: /flower|florist|blossom|botanical|petal|garden/i },
  handball: { nb: ['Lower East Side'], words: /handball|court|player|stoop|neighborhood/i },
  saltvault: { nb: ['Manhattan'], words: /snow|sanitation|winter|salt|sweeper/i },

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
  cyclone: { nb: ['Coney Island', 'Brighton Beach', 'Sea Gate', 'Gravesend'], words: /cyclone|coaster|coney|boardwalk|wonder wheel|luna park|nathan|mermaid|parachute|ride\b|screaming|amusement/i, fam: ['Heroes', 'Citizens'] },
  brooklynbridge: { nb: ['The Brooklyn Bridge', 'DUMBO', 'Brooklyn Heights', 'Two Bridges', 'Civic Center', 'City Hall'], words: /brooklyn bridge|cable|the bridge\b|walkway|promenade|gothic tower|east river|crossing|roebling/i, fam: ['Transplants', 'Citizens'] },
  panorama: { nb: ['Flushing Meadows', 'Corona', 'Flushing', 'Queens Museum', 'Willets Point'], words: /panorama|queens museum|model|miniature|world's fair|1964|flushing|corona|all five boroughs|every borough|the whole city|tiny/i, fam: ['Builders', 'Design'] },
  liberty: { nb: ['Liberty Island', 'New York Harbor', 'Ellis Island', 'The Battery', 'Battery Park'], words: /liberty|statue|torch|crown|harbor|harbour|immigrant|ellis|arrival|the lady|copper|pedestal|ferry/i, fam: ['Transplants', 'Heroes'] },
  oysterbar: { nb: ['Grand Central Terminal', 'Murray Hill', 'Midtown East', 'Turtle Bay'], words: /oyster|grand central|chowder|counter|lunch|whispering|vault|tile|guastavino|clam|shuck|pan roast/i, fam: ['Stoop', 'Citizens'] },
  morgan: { nb: ['Murray Hill', 'Madison Avenue', 'Midtown', 'NoMad', 'Kips Bay'], words: /library|book|manuscript|reading|librarian|shelf|shelves|study|folio|ink|the morgan|scholar|archive/i, fam: ['Process', 'Design'] },
  radiocity: { nb: ['Rockefeller Center', 'Midtown', 'Sixth Avenue', 'Theater District'], words: /radio city|rockette|marquee|stage|show|theater|theatre|spotlight|curtain|christmas spectacular|deco|usher|matinee/i, fam: ['Heroes', 'Design'] },
  woolworth: { nb: ['Tribeca', 'City Hall', 'Civic Center', 'Financial District', 'Park Row'], words: /woolworth|gothic|terracotta|lobby|skyscraper|cathedral of commerce|broadway|city hall|mosaic|tower/i, fam: ['Builders', 'Hustlers'] },
  wallstreet: { nb: ['Financial District', 'Wall Street', 'Battery Park', 'Bowling Green', 'Broad Street'], words: /wall street|stock|exchange|trader|broker|bell\b|bull\b|federal hall|finance|market|ticker|bank|charging bull|fearless/i, fam: ['Hustlers', 'Villains', 'StonkBrokers'] },
  lincolncenter: { nb: ['Lincoln Square', 'Upper West Side', 'Lincoln Center', 'Columbus Circle'], words: /lincoln center|opera|ballet|philharmonic|orchestra|soprano|conductor|juilliard|fountain|plaza|gala|evening gown|tuxedo|intermission/i, fam: ['Design', 'Heroes'] },
  belvedere: { nb: ['Central Park', 'Upper West Side', 'Upper East Side', 'The Ramble', 'Great Lawn'], words: /belvedere|castle|turtle pond|great lawn|ramble|delacorte|shakespeare|weather|birdwatch|binocular|central park/i, fam: ['Citizens', 'Places'] },
  highbridge: { nb: ['Washington Heights', 'Highbridge', 'Morris Heights', 'The Bronx', 'Harlem River'], words: /high bridge|highbridge|aqueduct|harlem river|croton|water tower|washington heights|bronx|arch/i, fam: ['Builders', 'Citizens'] },
  arthuravenue: { nb: ['Belmont', 'Arthur Avenue', 'Fordham', 'Little Italy', 'The Bronx', 'Tremont'], words: /arthur avenue|belmont|italian|market|butcher|baker|bakery|cannoli|salami|provolone|mozzarella|espresso|pastry|deli|cigar|nonna/i, fam: ['Stoop', 'Citizens'] },
  wavehill: { nb: ['Riverdale', 'Wave Hill', 'The Bronx', 'Spuyten Duyvil', 'Fieldston'], words: /wave hill|riverdale|garden|pergola|palisades|hudson|greenhouse|conservatory|estate|gardener|bloom|flower|lawn/i, fam: ['Places', 'Process'] },
  gantry: { nb: ['Long Island City', 'Hunters Point', 'Gantry Plaza', 'Queens West', 'Court Square'], words: /gantry|long island city|hunters point|pier|east river|neon|skyline|waterfront|ferry|sunset|pepsi/i, fam: ['Transplants', 'Design'] },
  rockaway: { nb: ['Rockaway Beach', 'Far Rockaway', 'Rockaway Park', 'Arverne', 'Breezy Point', 'The Rockaways'], words: /rockaway|surf|surfer|wave\b|beach|boardwalk|lifeguard|\bA train|sand|swell|jetty|bungalow|ocean/i, fam: ['Heroes', 'Citizens'] },
  greenwood: { nb: ['Green-Wood Cemetery', 'Greenwood Heights', 'Sunset Park', 'Windsor Terrace', 'South Slope', 'Park Slope'], words: /green-wood|greenwood|cemetery|grave|tomb|mausoleum|angel|parakeet|parrot|battle hill|monument|obelisk|mourning|ghost/i, fam: ['Villains', 'Places'] },
  domino: { nb: ['Williamsburg', 'South Williamsburg', 'Domino Park', 'East River'], words: /domino|sugar|refinery|williamsburg|waterfront|factory|warehouse|brick|smokestack|crane|syrup|the bridge\b/i, fam: ['Builders', 'Degens'] },
  boatgraveyard: { nb: ['Rossville', 'Arthur Kill', 'Staten Island', 'Tottenville', 'Charleston', 'Fresh Kills'], words: /graveyard|wreck|rust|tugboat|tug\b|hull|marsh|arthur kill|staten|abandoned|ruin|ghost ship|kayak|heron|fog/i, fam: ['Villains', 'Underground'] },
  intrepid: { nb: ["Hell's Kitchen", 'Pier 86', 'Hudson River', 'Midtown West', 'Clinton'], words: /intrepid|carrier|aircraft|jet\b|pilot|shuttle|enterprise|navy|hudson|pier 86|flight deck|concorde|submarine|veteran/i, fam: ['Heroes', 'Builders'] },
  studio8h: { nb: ['Rockefeller Center', 'Midtown', 'Sixth Avenue'], words: /live from new york|saturday night|studio|sketch|comedian|comedy|television|tv\b|broadcast|late night|monologue|audience|cue card|rockefeller/i, fam: ['Heroes', 'Design'], fresh: true },
  carnegie: { nb: ['Midtown', '57th Street', 'Midtown West', 'Columbus Circle'], words: /carnegie|concert|symphony|piano|violin|cello|recital|orchestra|conductor|practice|rehearsal|encore|maestro|music hall/i, fam: ['Heroes', 'Process'], fresh: true },
  vanguard: { nb: ['West Village', 'Greenwich Village', 'Seventh Avenue South', 'Sheridan Square'], words: /vanguard|jazz|saxophone|trumpet|bass|drummer|second set|club|basement|village|coltrane|bebop|trio|quartet|late set/i, fam: ['Underground', 'Heroes'], fresh: true },
  rucker: { nb: ['Harlem', 'Sugar Hill', 'Washington Heights', 'Polo Grounds', 'Hamilton Heights'], words: /rucker|basketball|hoop|court\b|streetball|crossover|dunk|ball\b|game\b|sneaker|playground|155th|harlem/i, fam: ['Heroes', 'Citizens'], fresh: true },
  sedgwick: { nb: ['Morris Heights', 'Highbridge', 'The Bronx', 'University Heights', 'Sedgwick'], words: /hip hop|hip-hop|dj\b|turntable|breakbeat|break dance|b-boy|b-girl|rec room|block party|mc\b|rapper|rap\b|boombox|sedgwick|bronx|1973/i, fam: ['Underground', 'Heroes', 'Degens'], fresh: true },
  balloons: { nb: ['Upper West Side', 'Central Park West', 'Museum of Natural History', 'Lincoln Square'], words: /balloon|thanksgiving|parade|inflat|helium|the night before|natural history|museum|november|float\b|marching band/i, fam: ['Citizens', 'Places'], fresh: true },
  stonewall: { nb: ['West Village', 'Greenwich Village', 'Sheridan Square', 'Christopher Street'], words: /stonewall|pride|christopher|rainbow|queer|gay|lesbian|trans\b|drag\b|parade|march\b|liberation|village/i, fam: ['Heroes', 'Citizens'], fresh: true },
  sangennaro: { nb: ['Little Italy', 'Nolita', 'Mulberry Street', 'Chinatown', 'SoHo'], words: /gennaro|feast|festa|mulberry|little italy|zeppole|cannoli|sausage|procession|saint|italian|nonna|festival|carnival lights/i, fam: ['Stoop', 'Citizens'], fresh: true },
  chelseahotel: { nb: ['Chelsea', 'West 23rd Street', 'Flatiron', 'Midtown South'], words: /chelsea|hotel|room \d+|lobby|poet|painter|songwriter|bohemian|residency|rent|balcony|the chelsea/i, fam: ['Process', 'Design', 'Underground'], fresh: true },
  strand: { nb: ['Union Square', 'East Village', 'Greenwich Village', 'NoHo', 'Broadway'], words: /strand|book|bookstore|bookshop|paperback|novel|reading|reader|tote|miles of books|library|first edition|shelf|browse/i, fam: ['Process', 'Citizens'], fresh: true },
  dakota: { nb: ['Upper West Side', 'Central Park West', 'Strawberry Fields', 'Lincoln Square'], words: /dakota|imagine|strawberry fields|72nd|courtyard|doorman|apartment house|mosaic|beatle|lennon|gable|central park west/i, fam: ['Heroes', 'Places'], fresh: true },
  garden: { nb: ['Midtown', 'Penn Station', 'Chelsea', 'Herald Square', 'Garment District'], words: /garden|knicks|rangers|arena|madison square|courtside|playoff|buzzer|jumbotron|crowd|concert|fight night|hockey|rangers|seventh avenue/i, fam: ['Heroes', 'Citizens'], fresh: true },
  dendur: { nb: ['Upper East Side', 'Museum Mile', 'Central Park', 'Fifth Avenue'], words: /dendur|temple|egypt|the met\b|museum|sackler|pharaoh|hieroglyph|nile|antiquit|gala|met gala|sandstone/i, fam: ['Design', 'Places'], fresh: true },
  moma: { nb: ['Midtown', '53rd Street', 'Rockefeller Center', 'Midtown West'], words: /moma|modern|sculpture garden|museum|abstract|canvas|painter|gallery|curator|installation|picasso|warhol|white cube/i, fam: ['Design', 'Process'], fresh: true },
  whitney: { nb: ['Meatpacking District', 'West Village', 'Chelsea', 'Gansevoort', 'High Line'], words: /whitney|biennial|gansevoort|meatpacking|terrace|american art|museum|gallery|high line|hudson|renzo|sawtooth/i, fam: ['Design', 'Process'], fresh: true },
  ellis: { nb: ['Ellis Island', 'New York Harbor', 'Liberty Island', 'The Battery', 'Lower Manhattan'], words: /ellis|immigra|arrival|registry|steerage|passage|manifest|old country|the boat|customs|new name|great hall|harbor|harbour/i, fam: ['Transplants', 'Citizens'], fresh: true },
  marathon: { nb: ['Bay Ridge', 'Fort Wadsworth', 'Staten Island', 'The Verrazzano', 'Sunset Park'], words: /marathon|runner|running|26\.2|verrazzano|verrazano|mile\b|race\b|finish line|start line|first sunday|bib\b|sneaker|jog/i, fam: ['Heroes', 'Citizens'], fresh: true },
  halloween: { nb: ['Greenwich Village', 'West Village', 'Chelsea', 'Sixth Avenue', 'Flatiron'], words: /halloween|costume|parade|puppet|skeleton|ghost|witch|mask\b|october|pumpkin|monster|vampire|zombie|sixth avenue/i, fam: ['Villains', 'Degens', 'Underground'], fresh: true },
  easternparkway: { nb: ['Crown Heights', 'Prospect Heights', 'Grand Army Plaza', 'Flatbush', 'Eastern Parkway', 'Park Slope'], words: /carnival|labor day|west indian|caribbean|eastern parkway|grand army|feather|soca|jouvert|j'ouvert|steel pan|flag\b|masquerad|brooklyn museum|library|arch\b/i, fam: ['Citizens', 'Heroes'], fresh: true },
  manhattanhenge: { nb: ['Midtown East', 'Tudor City', 'Murray Hill', 'Turtle Bay', '42nd Street'], words: /manhattanhenge|sunset|the sun\b|golden hour|42nd|crosstown|grid\b|tudor city|overpass|phone up|solstice|the light\b|dusk|last light/i, fam: ['Design', 'Citizens'], fresh: true },
  metgreathall: { nb: ['Upper East Side', 'Museum Mile', 'Central Park', 'Fifth Avenue'], words: /the met\b|great hall|museum|gallery|curator|masterpiece|fifth avenue|steps\b|docent|old master|gala/i, fam: ['Design', 'Heroes'], fresh: true },
  metamerican: { nb: ['Upper East Side', 'Museum Mile', 'Central Park'], words: /american wing|tiffany|court|loggia|bronze|sculpture|museum|glass|colonial|federal|early american/i, fam: ['Design', 'Builders'], fresh: true },
  meteuropean: { nb: ['Upper East Side', 'Museum Mile'], words: /painting|painter|portrait|canvas|old master|rembrandt|vermeer|skylight|gallery|frame|oil\b|brush/i, fam: ['Process', 'Design'], fresh: true },
  oceanlife: { nb: ['Upper West Side', 'Central Park West', 'Museum of Natural History', 'Lincoln Square'], words: /whale|ocean|natural history|diorama|deep sea|aquarium|fish\b|squid|blue whale|museum|dinosaur|fossil/i, fam: ['Citizens', 'Places'], fresh: true },
  rosecenter: { nb: ['Upper West Side', 'Central Park West', 'Museum of Natural History'], words: /planetarium|space|cosmos|star\b|stars\b|galaxy|planet|orbit|astronaut|rose center|sphere|universe|night sky|telescope/i, fam: ['Builders', 'Process'], fresh: true },
  momaatrium: { nb: ['Midtown', '53rd Street', 'Rockefeller Center', 'Midtown West'], words: /moma|modern|atrium|escalator|mobile|calder|museum|abstract|installation|white wall|contemporary|free friday/i, fam: ['Design', 'Process'], fresh: true },
  newmuseum: { nb: ['Lower East Side', 'Bowery', 'NoHo', 'East Village'], words: /new museum|bowery|contemporary|emerging|installation|mesh|stacked|sky room|artist run|biennial|downtown art/i, fam: ['Degens', 'Design'], fresh: true },
  neuegalerie: { nb: ['Upper East Side', 'Museum Mile', 'Carnegie Hill'], words: /neue|vienna|klimt|gold\b|golden|cafe|café|sacher|strudel|austrian|german|expressionist|mansion|1900/i, fam: ['Design', 'Transplants'], fresh: true },
  cooperhewitt: { nb: ['Upper East Side', 'Carnegie Hill', 'Museum Mile'], words: /cooper hewitt|design museum|carnegie|mansion|garden party|conservatory|typeface|furniture|prototype|designer|industrial design|pergola/i, fam: ['Design', 'Builders'], fresh: true },
  breuer: { nb: ['Upper East Side', 'Madison Avenue', 'Lenox Hill'], words: /breuer|brutalist|concrete|granite|whitney|frick madison|madison avenue|sunken|moat|bluestone|modernist/i, fam: ['Design', 'Builders'], fresh: true },
  jewishmuseum: { nb: ['Upper East Side', 'Museum Mile', 'Carnegie Hill'], words: /jewish|synagogue|menorah|torah|shabbat|kosher|yiddish|hebrew|hanukkah|passover|warburg|mansion|heritage/i, fam: ['Transplants', 'Citizens'], fresh: true },
  rubin: { nb: ['Chelsea', 'Flatiron', 'Seventh Avenue', 'Midtown South'], words: /rubin|himalaya|tibet|buddha|buddhist|mandala|shrine|monk|incense|nepal|meditation|spiral|prayer/i, fam: ['Process', 'Places'], fresh: true },
  theshed: { nb: ['Hudson Yards', 'Chelsea', 'West Chelsea', 'High Line'], words: /the shed|hudson yards|shell|rolling|performance|commission|premiere|rail yard|opening night|mccourt|kinetic/i, fam: ['Design', 'Heroes'], fresh: true },
  armory: { nb: ['Upper East Side', 'Lenox Hill', 'Park Avenue'], words: /armory|drill hall|regiment|installation|immersive|tiffany|veteran|park avenue|performance art|cavernous|soldier/i, fam: ['Heroes', 'Builders'], fresh: true },
  customhouse: { nb: ['Financial District', 'Bowling Green', 'Battery Park', 'The Battery'], words: /custom house|bowling green|rotunda|native|indigenous|lenape|american indian|mural|harbor|tariff|collector|beaux arts|continents/i, fam: ['Citizens', 'Places'], fresh: true },
  mad: { nb: ['Columbus Circle', 'Midtown West', 'Upper West Side', 'Lincoln Square'], words: /arts and design|columbus circle|craft|jewelry|ceramic|glassblow|maker|design|lollipop|the circle\b|studio/i, fam: ['Design', 'Process'], fresh: true },
  hispanicsociety: { nb: ['Washington Heights', 'Audubon Terrace', 'Hamilton Heights', 'Sugar Hill'], words: /hispanic|spanish|spain|goya|sorolla|terracotta|audubon terrace|latin|iberian|el greco|castilian|library/i, fam: ['Transplants', 'Design'], fresh: true },
  studiomuseum: { nb: ['Harlem', 'Central Harlem', '125th Street', 'Sugar Hill'], words: /studio museum|harlem|black art|artist in residence|125th|renaissance|collage|quilt|portrait|diaspora|apollo/i, fam: ['Heroes', 'Process'], fresh: true },
  elmuseo: { nb: ['East Harlem', 'El Barrio', 'Spanish Harlem', 'Museum Mile', 'Upper East Side'], words: /el museo|el barrio|puerto ric|boricua|three kings|dia de reyes|latino|latina|latinx|caribbean|salsa|nuyorican|bomba|plena/i, fam: ['Citizens', 'Heroes'], fresh: true },
  mcny: { nb: ['East Harlem', 'Museum Mile', 'Upper East Side', 'El Barrio'], words: /city of new york|history of the city|timeline|archive|five boroughs|the city itself|new york at its core|museum|founding|old new york|gotham/i, fam: ['Citizens', 'Places'], fresh: true },
  nyhistorical: { nb: ['Upper West Side', 'Central Park West', 'Lincoln Square'], words: /historical society|history|tiffany lamp|archive|library|reading room|founding|1804|relic|audubon|revolution|old new york/i, fam: ['Places', 'Citizens'], fresh: true },
  diachelsea: { nb: ['Chelsea', 'West Chelsea', 'Meatpacking District', 'High Line'], words: /dia\b|chelsea|minimal|installation|land art|warehouse|garage|earth room|light and space|conceptual|long term/i, fam: ['Process', 'Design'], fresh: true },
  chelseablock: { nb: ['Chelsea', 'West Chelsea', 'West 24th Street', 'High Line'], words: /gallery|opening|dealer|collector|white cube|chelsea|art world|press release|price list|vernissage|plastic cup|thursday night/i, fam: ['Hustlers', 'Design'], fresh: true },
  fotografiska: { nb: ['Flatiron', 'Gramercy', 'Park Avenue South', 'Midtown South', 'NoMad'], words: /photograph|photographer|camera|lens|darkroom|print\b|portrait|film\b|exposure|fotografiska|flash|shutter/i, fam: ['Process', 'Design'], fresh: true },
  ps1: { nb: ['Long Island City', 'Court Square', 'Hunters Point', 'Astoria'], words: /ps1|p\.s\. 1|public school|warm up|courtyard|classroom|long island city|dj\b|summer|installation|boiler room|greater new york/i, fam: ['Degens', 'Design'], fresh: true },
  noguchi: { nb: ['Long Island City', 'Astoria', 'Vernon Boulevard', 'Ravenswood'], words: /noguchi|stone|basalt|granite|sculpt|garden|zen|lantern|akari|paper lamp|carved|quiet|vernon/i, fam: ['Process', 'Design'], fresh: true },
  socrates: { nb: ['Long Island City', 'Astoria', 'Ravenswood', 'Hallets Point'], words: /socrates|sculpture park|outdoor|waterfront|hallets|kayak|monumental|steel|installation|east river|astoria/i, fam: ['Builders', 'Citizens'], fresh: true },
  brooklynmuseum: { nb: ['Prospect Heights', 'Crown Heights', 'Eastern Parkway', 'Grand Army Plaza', 'Park Slope'], words: /brooklyn museum|first saturday|beaux|court|egyptian|mummy|rodin|feminist|dinner party|eastern parkway|museum/i, fam: ['Citizens', 'Design'], fresh: true },
  pioneerworks: { nb: ['Red Hook', 'Columbia Street', 'Carroll Gardens', 'Gowanus'], words: /pioneer works|red hook|ironworks|residency|garden|second sunday|science|sound|warehouse|van brunt|pier/i, fam: ['Process', 'Builders'], fresh: true },
  bronxmuseum: { nb: ['Concourse', 'Grand Concourse', 'The Bronx', 'Highbridge', 'Melrose', 'Morrisania'], words: /bronx museum|grand concourse|the bronx|deco|borough|emerging|community|free admission|concourse|165th|yankee/i, fam: ['Citizens', 'Heroes'], fresh: true },
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

/* THE TWELVE: the pieces frozen for the launch fortnight, Sept 8 to 21, 2026 (STORYTELLING PLAN 2026-09-06/03_THE_TWELVE.md).
   The launch hang leads with them in this order and is the default hang while the New York date is inside the window. */
export const LAUNCH_TWELVE = [548, 891, 942, 767, 1485, 1467, 1151, 2300, 1866, 3000, 3466, 3200];
export const LAUNCH_WINDOW: [string, string] = ['2026-09-08', '2026-09-21'];
export const IN_LAUNCH = DAY >= LAUNCH_WINDOW[0] && DAY <= LAUNCH_WINDOW[1];
export const DEFAULT_HANG: Hang = { mode: IN_LAUNCH ? 'launch' : 'place' };

const orderCache = new Map<string, Piece[]>();
export function placeHang(roomId: string): Piece[] {
  const hit = orderCache.get(roomId);
  if (hit) return hit;
  /* Every piece belongs to exactly one room, decided once by assign_hang.mjs and
     written into hang_owned.ts. A room hangs out of its own list and nothing
     else, which is what stops the same New Yorker turning up on six walls: the
     old code scored the whole census per room and let neighbouring rooms take
     the same top slice. The leading segment is the part the curation actually
     matched, and it reshuffles every New York day; the tail keeps a fixed
     order so paging is stable. */
  const mine = OWNED[roomId];
  if (mine && mine.length) {
    const daily = mulberry(DAY_SEED * 31 + roomId.length * 977 + roomId.charCodeAt(1));
    const lead = mine.slice(0, LEADS[roomId] || 0)
      .map((n) => ({ n, d: daily() }))
      .sort((a, b) => a.d - b.d)
      .map((x) => x.n);
    const out = lead.concat(mine.slice(LEADS[roomId] || 0))
      .map((n) => byNum.get(n))
      .filter((p): p is Piece => !!p);
    orderCache.set(roomId, out);
    return out;
  }
  /* A room with no entry in the table falls back to the whole census, in a
     fixed order, so a new room still hangs something while it is being written. */
  const rnd = mulberry(roomId.length * 977 + roomId.charCodeAt(0));
  const out = P.map((p, i) => ({ p, r: rnd(), i }))
    .sort((a, b) => a.r - b.r)
    .map((x) => x.p);
  orderCache.set(roomId, out);
  return out;
}
export function placeCount(roomId: string) {
  const c = CURATION[roomId];
  if (!c) return 0;
  return P.filter((p) => (p.nb && c.nb.includes(p.nb)) || c.words.test(p.t) || (p.cat && c.cat?.includes(p.cat))).length;
}

export type Hang = { mode: 'place' | 'launch' | 'era' | 'family' | 'set' | 'all' | 'heroes' | 'search' | 'collector'; key?: string };
/* A collector's own New Yorkers, loaded by main.ts from api/c/<wallet>.json before the room is built
   (hang=collector:<wallet or ENS>). Any room can hang them, so every room is a variation of their gallery. */
export const COLLECTOR: { key: string; a: string; name: string; tag: string; nums: number[]; home: string } = { key: '', a: '', name: '', tag: '', nums: [], home: '' };
export function hangList(h: Hang, roomId: string): Piece[] {
  switch (h.mode) {
    case 'place': return placeHang(roomId);
    case 'launch': {
      /* The twelve lead the launch fortnight, but only in the room each one
         belongs to. Putting all twelve at the front of all 111 rooms was the
         single most visible repeat in the building: the first twelve works a
         visitor met were the same twelve wherever they went. */
      const here = placeHang(roomId);
      const mine = new Set(OWNED[roomId] || []);
      const twelve = LAUNCH_TWELVE.filter((n) => mine.has(n))
        .map((n) => byNum.get(n))
        .filter((p): p is Piece => !!p);
      const lead = new Set(twelve);
      return twelve.concat(here.filter((p) => !lead.has(p)));
    }
    case 'era': return P.filter((p) => p.e === Number(h.key));
    case 'family': return P.filter((p) => p.f === h.key);
    case 'set': return P.filter((p) => p.set === h.key);
    case 'heroes': return P.filter((p) => HEROES.has(p.n));
    case 'collector': return COLLECTOR.nums.map((n) => byNum.get(n)).filter((p): p is Piece => !!p);
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
    case 'launch': return 'THE TWELVE / ' + roomName;
    case 'era': { const e = ERAS[Number(h.key) - 1]; return `ERA ${e.roman} / ${e.title}`; }
    case 'family': return 'FAMILY / ' + h.key;
    case 'set': return 'SET / ' + h.key;
    case 'heroes': return 'THE HEROES';
    case 'collector': return 'THE COLLECTION OF ' + (COLLECTOR.name || 'A COLLECTOR').toUpperCase();
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
/* Phones: a downscaled atlas is a 2048 canvas, 16 MB each, and the cache kept every one the visitor
   ever walked past. After a room is built, drop the sheets it does not use. */
export function trimAtlases(keep: Set<number>) {
  for (const [a, p] of atlasCache) {
    if (keep.has(a)) continue;
    atlasCache.delete(a);
    p.then((t) => {
      t.dispose();
      const c = t.image as HTMLCanvasElement | undefined;
      if (c && 'getContext' in c) c.width = c.height = 0;
    }).catch(() => {});
  }
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
