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

const SOUNDS = {
  // tic : la mine du crayon qui touche la feuille (sélection, règle de page)
  crayon: (c, d) => { rub(c, d, { f: 4200, q: 2.5, attack: 0.001, decay: 0.022, peak: 0.55, type: "bandpass" }); strike(c, d, { f: 1400, decay: 0.03, peak: 0.12, modes: WOOD }); },
  // appui : un doigt sur une couverture en carton
  carton: (c, d) => { strike(c, d, { f: 330, decay: 0.06, peak: 0.45, modes: WOOD, drop: 1.5 }); rub(c, d, { f: 1800, q: 0.8, attack: 0.001, decay: 0.03, peak: 0.12 }); },
  // pose : une feuille qu'on pose sur la table (note postée)
  feuille: (c, d) => { rub(c, d, { type: "lowpass", f: 2600, f2: 900, q: 0.5, attack: 0.03, decay: 0.16, peak: 0.45, wobble: 38 }); strike(c, d, { at: 0.035, f: 160, decay: 0.08, peak: 0.25, modes: WOOD, drop: 1.4 }); },
  // page : une page qui tourne (navigation, carnet qui défile)
  page: (c, d) => { rub(c, d, { f: 900, f2: 3600, q: 0.9, attack: 0.09, decay: 0.16, peak: 0.42, wobble: 55 }); rub(c, d, { at: 0.17, type: "highpass", f: 3000, q: 0.7, attack: 0.004, decay: 0.05, peak: 0.18 }); },
  // marque-page : le ruban qui tombe entre deux pages (série)
  "marque-page": (c, d) => { rub(c, d, { f: 1500, f2: 700, q: 1.2, attack: 0.015, decay: 0.06, peak: 0.2 }); strike(c, d, { at: 0.05, f: 120, decay: 0.12, peak: 0.55, modes: WOOD, drop: 1.6 }); },
  // tampon : le coup sourd d'un tampon encreur (valider sa page)
  tampon: (c, d) => { strike(c, d, { f: 95, decay: 0.14, peak: 0.7, modes: WOOD, drop: 1.8 }); rub(c, d, { type: "lowpass", f: 1200, q: 0.6, attack: 0.002, decay: 0.07, peak: 0.25, color: "brown" }); },
  // fermer : un livre qu'on referme doucement (sheet qui se ferme)
  fermer: (c, d) => { rub(c, d, { type: "lowpass", f: 600, f2: 2400, q: 0.6, attack: 0.08, decay: 0.03, peak: 0.25, color: "brown" }); strike(c, d, { at: 0.1, f: 85, decay: 0.16, peak: 0.6, modes: WOOD, drop: 1.5 }); },
  // réussite : deux notes de marimba qui montent (page validée, objectif)
  reussite: (c, d) => { strike(c, d, { f: 523.25, decay: 0.5, peak: 0.35, modes: MARIMBA }); strike(c, d, { at: 0.09, f: 783.99, decay: 0.7, peak: 0.35, modes: MARIMBA }); },
  // fête : arpège de marimba + feuilles qui volent (livre fini, série sauvée)
  fete: (c, d) => {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => strike(c, d, { at: i * 0.075, f, decay: 0.8, peak: 0.3, modes: MARIMBA }));
    rub(c, d, { at: 0.2, f: 1200, f2: 4200, q: 0.8, attack: 0.12, decay: 0.3, peak: 0.16, wobble: 60 });
  },
  // erreur : deux petits coups de bois qui descendent, sans alarme
  erreur: (c, d) => { strike(c, d, { f: 240, decay: 0.08, peak: 0.45, modes: WOOD, drop: 1.3 }); strike(c, d, { at: 0.11, f: 180, decay: 0.1, peak: 0.45, modes: WOOD, drop: 1.3 }); },
  // réaction : une petite bulle de bois, plus aiguë et ronde
  reaction: (c, d) => { strike(c, d, { f: 880, decay: 0.12, peak: 0.35, modes: MARIMBA, drop: 0.8 }); },
  // dépasser : trois notes de marimba qui grimpent vite (classement)
  depasser: (c, d) => { [587.33, 739.99, 880].forEach((f, i) => strike(c, d, { at: i * 0.055, f, decay: 0.35, peak: 0.28, modes: MARIMBA })); },
};

const only = process.argv[3];
for (const [name, fn] of Object.entries(SOUNDS)) {
  if (only && name !== only) continue;
  const ctx = new OfflineAudioContext({ numberOfChannels: 2, length: RATE * 2, sampleRate: RATE });
  const out = ctx.createGain(); out.connect(ctx.destination);
  const dry = ctx.createGain(); dry.connect(out); dry.connect(room(ctx, out));
  fn(ctx, dry);
  const buf = await ctx.startRendering();
  const r = writeWav(`${outDir}/${name}.wav`, buf);
  console.log(name, r.seconds.toFixed(2) + "s", "peak", r.peak.toFixed(2));
}
