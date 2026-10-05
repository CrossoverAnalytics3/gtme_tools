// Per-tool persistence.
// - Always: localStorage, so the page works offline and in the repo.
// - Hosted on claude.ai: also the viewer's private `db` subtree
//   (data/users/<id>/<tool>), so work follows the person across devices.
// Every read and write is guarded; a failure just means "this browser only".

import { capability } from './runtime.js';

const PREFIX = 'gtm-toolkit:';

export function clone(x) {
  return JSON.parse(JSON.stringify(x));
}

function readLocal(k) {
  try {
    const raw = localStorage.getItem(k);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeLocal(k, v) {
  try {
    if (v == null) localStorage.removeItem(k);
    else localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* storage full or blocked */
  }
}

/**
 * opts.example   state to start from on a first visit (marked as example)
 * opts.exampleId which example that is, so the banner can name it
 * opts.onRemote  called with nothing when the account copy replaced state
 * opts.onStatus  called with 'local' | 'syncing' | 'synced' | 'error'
 */
export function createStore(key, defaults, { example = null, exampleId = 'brief', onRemote, onStatus } = {}) {
  const k = PREFIX + key;
  const metaKey = `${k}:meta`;
  const stored = readLocal(k);
  let state;
  let meta = readLocal(metaKey) || { fromExample: false, updatedAt: 0 };
  if (stored) state = { ...clone(defaults), ...stored };
  else if (example) {
    state = { ...clone(defaults), ...clone(example) };
    meta = { fromExample: exampleId, updatedAt: 0 };
  } else state = clone(defaults);

  let ref = null;
  let pending = null;
  let writing = Promise.resolve();
  const status = (s) => onStatus && onStatus(s);
  status('local');

  async function pushRemote() {
    if (!ref) return;
    const body = { json: JSON.stringify(state), fromExample: meta.fromExample || false, updatedAt: meta.updatedAt };
    status('syncing');
    writing = writing
      .then(() => ref.set(body))
      .then(() => status('synced'))
      .catch(() => status('error'));
    return writing;
  }

  function scheduleRemote() {
    if (!ref) return;
    clearTimeout(pending);
    pending = setTimeout(pushRemote, 900);
  }

  // Connect to the account copy when hosted. Never blocks first paint.
  (async () => {
    const [db, user] = await Promise.all([capability('db'), capability('user')]);
    if (!db || !user) return;
    let id = null;
    try {
      id = await user.id();
    } catch {
      id = null;
    }
    if (!id) return;
    try {
      ref = db.doc(`data/users/${id}/${key}`);
      const snap = await ref.get();
      const remote = snap.exists ? snap.data() : null;
      if (remote && remote.json && (remote.updatedAt || 0) >= (meta.updatedAt || 0)) {
        state = { ...clone(defaults), ...JSON.parse(remote.json) };
        meta = { fromExample: remote.fromExample || false, updatedAt: remote.updatedAt || 0 };
        writeLocal(k, state);
        writeLocal(metaKey, meta);
        status('synced');
        onRemote && onRemote();
      } else if (meta.updatedAt) {
        await pushRemote();
      } else {
        status('synced');
      }
    } catch {
      ref = null;
      status('error');
    }
  })();

  return {
    get state() {
      return state;
    },
    /** Id of the example the page is showing ('brief', 'sports'...), or false. */
    get fromExample() {
      return meta.fromExample === true ? 'brief' : meta.fromExample || false;
    },
    get connected() {
      return !!ref;
    },
    save() {
      meta.updatedAt = Date.now();
      writeLocal(k, state);
      writeLocal(metaKey, meta);
      scheduleRemote();
    },
    replace(next, { fromExample = false } = {}) {
      state = { ...clone(defaults), ...clone(next) };
      meta.fromExample = fromExample;
      this.save();
    },
    reset() {
      state = clone(defaults);
      meta.fromExample = false;
      this.save();
    },
    dismissExample() {
      meta.fromExample = false;
      writeLocal(metaKey, meta);
      scheduleRemote();
    },
  };
}
