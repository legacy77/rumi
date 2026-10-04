const mem: any[] = [];
export function queueWrite(op: any) { mem.push({ ...op, at: Date.now() }); return mem; }
export function antreanTerkirim() { return mem; }
