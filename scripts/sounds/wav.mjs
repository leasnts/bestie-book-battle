import { writeFileSync } from "node:fs";
// Écrit un AudioBuffer en WAV 16 bits, avec fondu de fin et coupe du silence final.
export function writeWav(path, buffer, { trimDb = -60, gain = 1 } = {}) {
  const ch = buffer.numberOfChannels, rate = buffer.sampleRate;
  const data = Array.from({ length: ch }, (_, c) => buffer.getChannelData(c));
  const thr = Math.pow(10, trimDb / 20);
  let end = data[0].length;
  while (end > 1 && data.every((d) => Math.abs(d[end - 1]) < thr)) end--;
  end = Math.min(data[0].length, end + Math.floor(rate * 0.01));
  const fade = Math.floor(rate * 0.01);
  const out = Buffer.alloc(44 + end * ch * 2);
  out.write("RIFF", 0); out.writeUInt32LE(36 + end * ch * 2, 4); out.write("WAVE", 8);
  out.write("fmt ", 12); out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(ch, 22);
  out.writeUInt32LE(rate, 24); out.writeUInt32LE(rate * ch * 2, 28); out.writeUInt16LE(ch * 2, 32); out.writeUInt16LE(16, 34);
  out.write("data", 36); out.writeUInt32LE(end * ch * 2, 40);
  let peak = 0;
  for (let i = 0; i < end; i++) for (let c = 0; c < ch; c++) peak = Math.max(peak, Math.abs(data[c][i]));
  for (let i = 0; i < end; i++) {
    const f = i > end - fade ? (end - i) / fade : 1;
    for (let c = 0; c < ch; c++) {
      const v = Math.max(-1, Math.min(1, data[c][i] * f * gain));
      out.writeInt16LE(Math.round(v * 32767), 44 + (i * ch + c) * 2);
    }
  }
  writeFileSync(path, out);
  return { seconds: end / rate, peak };
}
