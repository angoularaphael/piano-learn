// Piano numerique branche en USB ou en Bluetooth : chaque note est reconnue a coup sur (Web MIDI).
// Chrome, Edge et Android le gerent ; Safari ne le gere pas encore.
let access = null;
const handlers = new Set();
const changeListeners = new Set();

export function midiSupported() {
  return typeof navigator !== 'undefined' && !!navigator.requestMIDIAccess;
}

function onMessage(e) {
  const [status, d1, d2] = e.data;
  const cmd = status & 0xf0;
  if (cmd === 0x90 && d2 > 0) handlers.forEach((h) => h.noteOn?.(d1, d2 / 127));
  else if (cmd === 0x80 || (cmd === 0x90 && d2 === 0)) handlers.forEach((h) => h.noteOff?.(d1));
  else if (cmd === 0xb0 && d1 === 64) handlers.forEach((h) => h.pedal?.(d2 >= 64));
}

function bind() {
  if (!access) return;
  for (const input of access.inputs.values()) input.onmidimessage = onMessage;
  changeListeners.forEach((fn) => fn(midiInputs()));
}

export async function connectMidi() {
  if (!midiSupported()) throw new Error('midi-indisponible');
  if (!access) {
    access = await navigator.requestMIDIAccess({ sysex: false });
    access.onstatechange = bind;
  }
  bind();
  return midiInputs();
}

export function midiInputs() {
  if (!access) return [];
  return [...access.inputs.values()].filter((i) => i.state === 'connected').map((i) => i.name || 'Piano numérique');
}

export function onMidi(h) {
  handlers.add(h);
  return () => handlers.delete(h);
}

export function onMidiDevices(fn) {
  changeListeners.add(fn);
  return () => changeListeners.delete(fn);
}

// Si l'autorisation a deja ete donnee, on se reconnecte sans rien demander
export async function autoConnectMidi() {
  if (!midiSupported() || !navigator.permissions?.query) return;
  try {
    const st = await navigator.permissions.query({ name: 'midi' });
    if (st.state === 'granted') await connectMidi();
  } catch (e) { /* permission inconnue de ce navigateur */ }
}
