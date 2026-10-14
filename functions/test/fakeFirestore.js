/**
 * Firestore en mémoire, juste assez complet pour tester les services
 * (doc get/set/update, requêtes simples, transactions avec annulation).
 */
const SERVER_TS = Symbol('serverTimestamp');

function resolve(value) {
  if (value === SERVER_TS) return new Date();
  if (Array.isArray(value)) return value.map(resolve);
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolve(v)]));
  }
  return value;
}

export function createFakeFirestore() {
  const store = new Map();
  let autoId = 0;

  const snap = (ref) => {
    const data = store.get(ref.path);
    return { id: ref.id, ref, exists: data !== undefined, data: () => (data ? structuredClone(data) : undefined) };
  };

  const write = (path, data, { merge = false } = {}) => {
    const prev = store.get(path);
    store.set(path, merge && prev ? { ...prev, ...resolve(data) } : resolve(data));
  };
  const update = (path, data) => {
    const prev = store.get(path);
    if (!prev) throw new Error(`NOT_FOUND ${path}`);
    store.set(path, { ...prev, ...resolve(data) });
  };

  const docRef = (col, id) => {
    const ref = {
      id, path: `${col}/${id}`,
      get: async () => snap(ref),
      set: async (d, o) => write(ref.path, d, o),
      update: async (d) => update(ref.path, d),
    };
    return ref;
  };

  const db = {
    collection(col) {
      return {
        doc: (id) => docRef(col, id ?? `auto${++autoId}`),
        where(field, op, value) {
          const filters = [[field, value]];
          const q = {
            where(f, o, v) { filters.push([f, v]); return q; },
            limit() { return q; },
            async get() {
              const docs = [...store.keys()].filter((p) => p.startsWith(`${col}/`))
                .map((p) => snap(docRef(col, p.slice(col.length + 1))))
                .filter((s) => filters.every(([f, v]) => s.data()[f] === v));
              return { empty: docs.length === 0, docs, size: docs.length };
            },
          };
          return q;
        },
      };
    },
    async runTransaction(fn) {
      const ops = [];
      const t = {
        get: async (ref) => snap(ref),
        set: (ref, d, o) => { ops.push(() => write(ref.path, d, o)); return t; },
        update: (ref, d) => { ops.push(() => update(ref.path, d)); return t; },
      };
      const result = await fn(t);
      ops.forEach((op) => op());
      return result;
    },
    _dump: () => Object.fromEntries(store),
    _get: (path) => store.get(path),
    _set: (path, data) => store.set(path, data),
  };

  const FieldValue = { serverTimestamp: () => SERVER_TS };
  return { db, FieldValue };
}
