import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { describe, it, expect } from 'vitest';

function fixture() {
  const stores = new Map<string, Map<string, Response>>();
  const handlers: Record<string, Function> = {};
  const requests: string[] = []; let fail = false;
  const caches = {
    keys: async () => [...stores.keys()], delete: async (n: string) => stores.delete(n),
    open: async (n: string) => {
      if (!stores.has(n)) stores.set(n, new Map());
      const store = stores.get(n)!;
      return { match: async (u: string) => store.get(u)?.clone(), put: async (u: string, r: Response) => { store.set(u, r.clone()); } };
    },
  };
  const manifest = { version: 'new', totalBytes: 2, assets: [{ url: '/a', bytes: 1 }, { url: '/b', bytes: 1 }] };
  const source = readFileSync('scripts/offline-worker.js', 'utf8').replace('/* MANIFEST */ null', JSON.stringify(manifest));
  vm.runInNewContext(source, { Response, URL, caches, fetch: async (url: string) => { requests.push(url); if (fail && url === '/b') throw new Error('interrupted'); return new Response(url); }, self: { location: { origin: 'https://course.test' }, skipWaiting: async () => {}, clients: { claim: async () => {} }, addEventListener: (name: string, fn: Function) => { handlers[name] = fn; } } });
  const message = async (type: string) => {
    const events: any[] = []; let work: Promise<void> = Promise.resolve();
    handlers.message({ data: { type }, ports: [{ postMessage: (d: any) => events.push(d) }], waitUntil: (p: Promise<void>) => { work = p; } });
    await work; return events;
  };
  return { stores, requests, caches, handlers, message, interrupt: (value: boolean) => { fail = value; } };
}
describe('explicit offline preparation', () => {
  it('installs without requesting course assets', async () => {
    const f = fixture(); let work: Promise<void> = Promise.resolve();
    f.handlers.install({ waitUntil: (p: Promise<void>) => { work = p; } }); await work;
    expect(f.requests).toEqual([]); expect((await f.message('STATUS')).at(-1).ready).toBe(false);
  });
  it('keeps the prior complete version when a download fails and resumes missing assets', async () => {
    const f = fixture(); const old = await f.caches.open('fintech-offline-old'); await old.put('/__offline_complete__', new Response('old'));
    f.interrupt(true); expect((await f.message('PREPARE')).at(-1).type).toBe('error');
    expect(f.stores.has('fintech-offline-old')).toBe(true);
    expect((await f.message('STATUS')).at(-1)).toMatchObject({ ready: true, current: false });
    f.interrupt(false); expect((await f.message('PREPARE')).at(-1)).toMatchObject({ type: 'complete', current: true });
    expect(f.requests.filter(u => u === '/a')).toHaveLength(1);
    expect(f.stores.has('fintech-offline-old')).toBe(false);
  });
  it('removes only course caches', async () => {
    const f = fixture(); await f.message('PREPARE'); await f.caches.open('unrelated-app');
    expect((await f.message('REMOVE')).at(-1).ready).toBe(false);
    expect([...f.stores.keys()]).toEqual(['unrelated-app']);
  });
});
