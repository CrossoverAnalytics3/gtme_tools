// Per-tool persistence in localStorage. Every read and write is guarded:
// private windows and blocked storage just mean the tool forgets on reload.

const PREFIX = 'gtm-toolkit:';

export function clone(x) {
  return JSON.parse(JSON.stringify(x));
}

export function createStore(key, defaults) {
  const k = PREFIX + key;
  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(k);
      if (raw) return { ...clone(defaults), ...JSON.parse(raw) };
    } catch {
      /* fall through to defaults */
    }
    return clone(defaults);
  }

  return {
    get state() {
      return state;
    },
    save() {
      try {
        localStorage.setItem(k, JSON.stringify(state));
      } catch {
        /* storage full or blocked */
      }
    },
    replace(next) {
      state = { ...clone(defaults), ...clone(next) };
      this.save();
    },
    reset() {
      state = clone(defaults);
      try {
        localStorage.removeItem(k);
      } catch {
        /* ignore */
      }
    },
  };
}
