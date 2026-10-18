// Stable IDs and byte-identical art files. Curate by subject, then fill deterministically.
export function curate(cast, rooms) {
    const source = [...new Map(Object.values(cast).flat().map(p => [p.n, p])).values()];
    const themes = ['work|office|clerk|bureau|janitor', 'pigeon|bird|justice|law|guard', 'home|rent|landlord|apartment|tenant', 'bodega|deli|cat|coffee|food', 'wash|laundry|clean|water', 'lost|home|travel|memory', 'wait|office|clerk|work', 'sky|roof|bird|fly|tower', 'water|harbor|ferry|beach|river', 'park|tree|bench|garden', 'music|busker|song|dance|radio', 'art|artist|museum|paint', 'landlord|rent|home|money', 'art|critic|gallery|museum', 'garden|roof|flower|community', 'New York|home|city'];
    const used = new Set();
    return Object.fromEntries(rooms.map((r, i) => { const re = new RegExp(themes[i], 'i'); const eligible = source.filter(p => !used.has(p.n)); const ranked = [...eligible.filter(p => re.test(p.t + ' ' + p.s)), ...eligible.filter(p => !re.test(p.t + ' ' + p.s))].slice(0, 10); ranked.forEach(p => used.add(p.n)); return [r.id, ranked]; }));
}
