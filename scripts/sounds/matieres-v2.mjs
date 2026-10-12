import { createRequire } from "node:module";
import { writeWav } from "./wav.mjs";
const { OfflineAudioContext } = createRequire(import.meta.url)("node-web-audio-api");
const [, , outDir] = process.argv;
const RATE = 44100;

// Petite pièce : quelques réflexions courtes, comme une table en bois dans une chambre.
function room(ctx, out, send = 0.12) {
  const len = Math.floor(0.22 * RATE), ir = ctx.createBuffer(2, len, RATE);
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c); let e = 0;
    for (let i = 0; i < len; i++) { const t = i / RATE; d[i] = t < 0.007 ? 0 : (Math.random() * 2 - 1) * Math.exp(-6.9 * t / 0.22); e += d[i] * d[i]; }
    for (let i = 0; i < len; i++) d[i] /= Math.sqrt(e);
  }
  const conv = ctx.createConvolver(); conv.normalize = false; conv.buffer = ir;
  const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 3200;
  const g = ctx.createGain(); g.gain.value = send;
  g.connect(lp).connect(conv).connect(out);
  return g;
}
function noiseBuf(ctx, sec, color = "white") {
  const b = ctx.createBuffer(1, Math.floor(sec * RATE), RATE), d = b.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; d[i] = color === "brown" ? (last = (last + 0.02 * w) / 1.02) * 3.5 : w; }
  return b;
}
// Bruit filtré avec enveloppe : frottement, papier, mine de crayon.
function rub(ctx, dest, { at = 0, attack = 0.005, decay = 0.08, peak = 0.5, type = "bandpass", f = 2000, f2, q = 1, color = "white", wobble = 0 }) {
  const src = ctx.createBufferSource(); src.buffer = noiseBuf(ctx, attack + decay + 0.1, color);
  const fl = ctx.createBiquadFilter(); fl.type = type; fl.Q.value = q;
  fl.frequency.setValueAtTime(f, at); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, at + attack + decay);
  const g = ctx.createGain(); g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(peak, at + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
  if (wobble) { // grain du papier : l'amplitude tremble
    const lfo = ctx.createOscillator(); lfo.frequency.value = wobble; const lg = ctx.createGain(); lg.gain.value = peak * 0.6;
    lfo.connect(lg).connect(g.gain); lfo.start(at); lfo.stop(at + attack + decay + 0.05);
  }
  src.connect(fl).connect(g).connect(dest); src.start(at); src.stop(at + attack + decay + 0.1);
}
// Note frappée : un mode par sinus, les aigus meurent d'abord (bois, marimba).
function strike(ctx, dest, { at = 0, f, decay = 0.25, peak = 0.4, modes = [[1, 1], [3.99, 0.18]], drop = 1 }) {
  for (const [ratio, amp] of modes) {
    if (f * ratio > 6000) continue;
    const o = ctx.createOscillator(); o.type = "sine";
    o.frequency.setValueAtTime(f * ratio * drop, at); if (drop !== 1) o.frequency.exponentialRampToValueAtTime(f * ratio, at + 0.02);
    const g = ctx.createGain(); const d = Math.max(0.02, decay / ratio);
    g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(peak * amp, at + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.003 + d);
    o.connect(g).connect(dest); o.start(at); o.stop(at + d + 0.05);
  }
}
const WOOD = [[1, 1], [2.57, 0.25], [4.8, 0.08]];
const MARIMBA = [[1, 1], [3.99, 0.2], [10, 0.03]];

import { readFileSync } from "node:fs";
const SAMPLES = process.argv[4];
// Un enregistrement CC0 (Kenney), joué tel quel dans la même pièce
async function sample(ctx, dest, name, { at = 0, gain = 1, rate = 1 } = {}) {
  const raw = readFileSync(`${SAMPLES}/${name}.wav`);
  const buf = await ctx.decodeAudioData(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength));
  const src = ctx.createBufferSource(); src.buffer = buf; src.playbackRate.value = rate;
  const g = ctx.createGain(); g.gain.value = gain; src.connect(g).connect(dest); src.start(at);
}
// Une bulle : un sinus qui monte vite et s'éteint, rond comme une goutte
function bubble(ctx, dest, { at = 0, f = 420, to = 760, peak = 0.5, decay = 0.09 }) {
  const o = ctx.createOscillator(); o.type = "sine";
  o.frequency.setValueAtTime(f, at); o.frequency.exponentialRampToValueAtTime(to, at + 0.045);
  const g = ctx.createGain(); g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(peak, at + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, at + decay);
  o.connect(g).connect(dest); o.start(at); o.stop(at + decay + 0.05);
}
// Nappe douce : un accord qui fleurit lentement puis s'efface
function bloom(ctx, dest, { at = 0, notes, peak = 0.08, attack = 0.12, decay = 1.1 }) {
  for (const f of notes) {
    const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = f;
    const g = ctx.createGain(); g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(peak, at + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
    o.connect(g).connect(dest); o.start(at); o.stop(at + attack + decay + 0.05);
  }
}
const KALIMBA = [[1, 1], [5.9, 0.12]];
const BELL = [[1, 1], [2.76, 0.25], [5.4, 0.06]];
const N = { C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880, B5: 987.77, C6: 1046.5, D6: 1174.66, E6: 1318.51, G6: 1567.98, C7: 2093 };

const SOUNDS = {
  // Poster une note
  "note-bulle": async (c, d) => { bubble(c, d, { peak: 0.55 }); strike(c, d, { at: 0.05, f: N.C6, decay: 0.35, peak: 0.22, modes: MARIMBA }); },
  "note-postit": async (c, d) => { await sample(c, d, "bookPlace3", { gain: 0.8 }); strike(c, d, { at: 0.06, f: N.E5, decay: 0.3, peak: 0.22, modes: MARIMBA }); strike(c, d, { at: 0.13, f: N.B5, decay: 0.45, peak: 0.22, modes: MARIMBA }); },
  "note-kalimba": async (c, d) => { strike(c, d, { f: N.G5, decay: 0.5, peak: 0.32, modes: KALIMBA }); strike(c, d, { at: 0.08, f: N.D6, decay: 0.7, peak: 0.3, modes: KALIMBA }); },
  // Tourner une page : de vraies pages
  "page-courte": async (c, d) => { await sample(c, d, "bookFlip3"); },
  "page-moyenne": async (c, d) => { await sample(c, d, "bookFlip2"); },
  "page-longue": async (c, d) => { await sample(c, d, "bookFlip1"); },
  // Note lue : la carte qu'on glisse s'envole comme un autocollant
  "lue-envol": async (c, d) => { await sample(c, d, "cloth4", { rate: 1.3 }); },
  "lue-pichenette": async (c, d) => { strike(c, d, { f: 1800, decay: 0.025, peak: 0.25, modes: WOOD }); bubble(c, d, { at: 0.02, f: 600, to: 1100, peak: 0.4, decay: 0.08 }); },
  "lue-kalimba": async (c, d) => { strike(c, d, { f: N.E6, decay: 0.25, peak: 0.28, modes: KALIMBA }); strike(c, d, { at: 0.06, f: N.A5 * 2, decay: 0.4, peak: 0.24, modes: KALIMBA }); },
  // Valider sa page (v3) : progresser, sans souffle
  "valider-coche": async (c, d) => { strike(c, d, { f: N.G5, decay: 0.3, peak: 0.3, modes: KALIMBA }); strike(c, d, { at: 0.07, f: N.D6, decay: 0.5, peak: 0.3, modes: KALIMBA }); },
  "valider-carillon": async (c, d) => { strike(c, d, { f: N.C5, decay: 0.4, peak: 0.25, modes: MARIMBA }); strike(c, d, { at: 0.01, f: N.E6, decay: 0.9, peak: 0.22, modes: BELL }); },
  "valider-marches": async (c, d) => { [N.C6, N.E6, N.G6].forEach((f, i) => strike(c, d, { at: i * 0.05, f, decay: 0.3, peak: 0.25, modes: MARIMBA })); },
  // Réagir (v3) : plus aigu
  "reagir-bulle": async (c, d) => { bubble(c, d, { f: 900, to: 1700, peak: 0.45, decay: 0.07 }); },
  "reagir-kalimba": async (c, d) => { strike(c, d, { f: 1760, decay: 0.25, peak: 0.3, modes: KALIMBA }); },
  "reagir-tinte": async (c, d) => { strike(c, d, { f: N.C7, decay: 0.35, peak: 0.25, modes: BELL }); },
  // Note lue (v3) : plus aigu
  "lue-pichenette-aigue": async (c, d) => { strike(c, d, { f: 2600, decay: 0.02, peak: 0.22, modes: WOOD }); bubble(c, d, { at: 0.015, f: 1000, to: 1900, peak: 0.4, decay: 0.07 }); },
  "lue-kalimba-aigu": async (c, d) => { strike(c, d, { f: N.G6, decay: 0.18, peak: 0.28, modes: KALIMBA }); strike(c, d, { at: 0.045, f: N.C7, decay: 0.3, peak: 0.24, modes: KALIMBA }); },
  "lue-sifflet": async (c, d) => { bubble(c, d, { f: 1200, to: 2600, peak: 0.3, decay: 0.12 }); },
  // Livre fini
  "fin-accord": async (c, d) => {
    [N.C5, N.E5, N.G5, N.C6].forEach((f, i) => strike(c, d, { at: i * 0.085, f, decay: 0.9, peak: 0.28, modes: MARIMBA }));
    bloom(c, d, { at: 0.3, notes: [N.C5, N.E5, N.G5, N.C6] });
  },
  "fin-referme": async (c, d) => {
    await sample(c, d, "bookClose", { gain: 0.9 });
    [N.G5, N.C6, N.E6, N.G6].forEach((f, i) => strike(c, d, { at: 0.22 + i * 0.07, f, decay: 0.9, peak: 0.22, modes: KALIMBA }));
  },
  "fin-boite-a-musique": async (c, d) => {
    [N.G5, N.C6, N.E6, N.D6, N.G6, N.C7].forEach((f, i) => strike(c, d, { at: i * 0.11, f, decay: i === 5 ? 1.4 : 0.8, peak: 0.2, modes: BELL }));
  },
};

const only = process.argv[5];
for (const [name, fn] of Object.entries(SOUNDS)) {
  if (only && name !== only) continue;
  const ctx = new OfflineAudioContext({ numberOfChannels: 2, length: RATE * 2.5, sampleRate: RATE });
  const out = ctx.createGain(); out.connect(ctx.destination);
  const dry = ctx.createGain(); dry.connect(out); dry.connect(room(ctx, out));
  await fn(ctx, dry);
  const buf = await ctx.startRendering();
  let peak = 0; for (let ch = 0; ch < 2; ch++) for (const v of buf.getChannelData(ch)) peak = Math.max(peak, Math.abs(v));
  const r = writeWav(`${outDir}/${name}.wav`, buf, { gain: 0.6 / peak });
  console.log(name, r.seconds.toFixed(2) + "s");
}
