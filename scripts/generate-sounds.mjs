/**
 * Procedural WAV sound generator for World Discovery
 * Generates ambient loops + UI one-shots using pure PCM synthesis.
 * Run: node scripts/generate-sounds.mjs
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SR = 44100; // sample rate

// ---------- WAV writer ----------

function writeWav(samples) {
  const dataBytes = samples.length * 2;
  const buf = Buffer.alloc(44 + dataBytes);
  let o = 0;

  buf.write('RIFF', o); o += 4;
  buf.writeUInt32LE(36 + dataBytes, o); o += 4;
  buf.write('WAVE', o); o += 4;

  buf.write('fmt ', o); o += 4;
  buf.writeUInt32LE(16, o); o += 4;
  buf.writeUInt16LE(1, o); o += 2;  // PCM
  buf.writeUInt16LE(1, o); o += 2;  // mono
  buf.writeUInt32LE(SR, o); o += 4;
  buf.writeUInt32LE(SR * 2, o); o += 4;
  buf.writeUInt16LE(2, o); o += 2;
  buf.writeUInt16LE(16, o); o += 2;

  buf.write('data', o); o += 4;
  buf.writeUInt32LE(dataBytes, o); o += 4;

  for (let i = 0; i < samples.length; i++) {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), o);
    o += 2;
  }
  return buf;
}

// ---------- DSP helpers ----------

// Paul Kellet pink noise
function makePinkNoise(n) {
  const out = new Float32Array(n);
  let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
  for (let i=0; i<n; i++) {
    const w = Math.random()*2-1;
    b0 = 0.99886*b0 + w*0.0555179;
    b1 = 0.99332*b1 + w*0.0750759;
    b2 = 0.96900*b2 + w*0.1538520;
    b3 = 0.86650*b3 + w*0.3104856;
    b4 = 0.55000*b4 + w*0.5329522;
    b5 = -0.7616*b5 - w*0.0168980;
    out[i] = (b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.11;
    b6 = w*0.115926;
  }
  return out;
}

// Crossfade loop endpoints so looping sounds seamless
function loopFade(samples, fadeFrames=Math.floor(SR*0.08)) {
  const n = samples.length;
  for (let i=0; i<fadeFrames; i++) {
    const t = i/fadeFrames;
    samples[i] *= t;
    samples[n-1-i] *= t;
  }
  return samples;
}

function normalize(samples, peak=0.85) {
  let max=0;
  for (let i=0; i<samples.length; i++) max = Math.max(max, Math.abs(samples[i]));
  if (max>0) { const s=peak/max; for (let i=0; i<samples.length; i++) samples[i]*=s; }
  return samples;
}

// ---------- Ambient generators ----------

// nature: pink-noise wind + slow gusts + faint high shimmer
function genNature(sec=8) {
  const n = Math.floor(SR*sec);
  const pink = makePinkNoise(n);
  const out = new Float32Array(n);
  for (let i=0; i<n; i++) {
    const t = i/SR;
    // gusting wind envelope
    const gust = 0.55 + 0.25*Math.sin(2*Math.PI*0.13*t) + 0.15*Math.sin(2*Math.PI*0.07*t) + 0.05*Math.sin(2*Math.PI*0.31*t);
    const wind = pink[i] * gust * 0.55;
    // very faint air shimmer
    const shimmer = Math.sin(2*Math.PI*3200*t) * 0.008 * (0.5+0.5*Math.sin(2*Math.PI*0.19*t));
    out[i] = wind + shimmer;
  }
  return loopFade(normalize(out, 0.75));
}

// city: 60 Hz power-hum + traffic rumble (low-passed brown noise) + sparse mid texture
function genCity(sec=8) {
  const n = Math.floor(SR*sec);
  const pink = makePinkNoise(n);
  const out = new Float32Array(n);
  // simple one-pole LP for rumble
  let prev=0;
  const lpPink = new Float32Array(n);
  for (let i=0; i<n; i++) { prev = 0.97*prev + 0.03*pink[i]; lpPink[i] = prev; }

  for (let i=0; i<n; i++) {
    const t = i/SR;
    const hum = Math.sin(2*Math.PI*60*t)*0.07 + Math.sin(2*Math.PI*120*t)*0.025 + Math.sin(2*Math.PI*180*t)*0.008;
    const rumble = lpPink[i]*0.35*(0.7+0.3*Math.sin(2*Math.PI*0.04*t));
    const chatter = pink[i]*0.08*(0.5+0.5*Math.sin(2*Math.PI*0.11*t));
    out[i] = hum + rumble + chatter;
  }
  return loopFade(normalize(out, 0.72));
}

// ancient: deep A2 drone (110Hz) + detuned harmonics + slow beat = mysterious reverence
function genAncient(sec=10) {
  const n = Math.floor(SR*sec);
  const out = new Float32Array(n);
  for (let i=0; i<n; i++) {
    const t = i/SR;
    // fundamental + harmonics
    const d  = Math.sin(2*Math.PI*110*t);
    const h2 = Math.sin(2*Math.PI*220*t)*0.45;
    const h3 = Math.sin(2*Math.PI*330*t)*0.22;
    const h4 = Math.sin(2*Math.PI*440*t)*0.10;
    const h5 = Math.sin(2*Math.PI*550*t)*0.05;
    // detuned counterparts create slow beating
    const b1 = Math.sin(2*Math.PI*109.7*t)*0.28;
    const b2 = Math.sin(2*Math.PI*220.4*t)*0.14;
    // slow breath envelope
    const breath = 0.55 + 0.35*Math.sin(2*Math.PI*0.06*t) + 0.10*Math.sin(2*Math.PI*0.023*t);
    // subtle noise floor
    const noise = (Math.random()*2-1)*0.018;
    out[i] = (d+h2+h3+h4+h5+b1+b2)*breath*0.14 + noise;
  }
  return loopFade(normalize(out, 0.70));
}

// default: ethereal space — soft sub-drone + slowly modulating high tones + sparse pink
function genDefault(sec=8) {
  const n = Math.floor(SR*sec);
  const pink = makePinkNoise(n);
  const out = new Float32Array(n);
  for (let i=0; i<n; i++) {
    const t = i/SR;
    const sub = Math.sin(2*Math.PI*55*t)*0.06*(0.6+0.4*Math.sin(2*Math.PI*0.05*t));
    const tone1 = Math.sin(2*Math.PI*880*t)*0.022*(0.5+0.5*Math.sin(2*Math.PI*0.11*t));
    const tone2 = Math.sin(2*Math.PI*1108*t)*0.015*(0.5+0.5*Math.sin(2*Math.PI*0.08*t));
    const tone3 = Math.sin(2*Math.PI*1320*t)*0.010*(0.5+0.5*Math.sin(2*Math.PI*0.06*t));
    const air   = pink[i]*0.10;
    out[i] = sub + tone1 + tone2 + tone3 + air;
  }
  return loopFade(normalize(out, 0.65));
}

// ---------- UI sound generators ----------

// hover: soft crystalline tick — 1400 Hz + octave, fast decay
function genHover() {
  const n = Math.floor(SR*0.06);
  const out = new Float32Array(n);
  for (let i=0; i<n; i++) {
    const t = i/SR;
    const env = Math.exp(-70*t);
    out[i] = (Math.sin(2*Math.PI*1400*t)*0.65 + Math.sin(2*Math.PI*2800*t)*0.25)*env;
  }
  return normalize(out, 0.40);
}

// click: low body (200 Hz) + white-noise transient attack
function genClick() {
  const n = Math.floor(SR*0.09);
  const out = new Float32Array(n);
  for (let i=0; i<n; i++) {
    const t = i/SR;
    const body = Math.sin(2*Math.PI*200*t)*Math.exp(-35*t);
    const transient = (Math.random()*2-1)*Math.exp(-280*t)*0.55;
    out[i] = body*0.55 + transient;
  }
  return normalize(out, 0.55);
}

// success: warm C major arpeggio C5 → E5 → G5, then held chord
function genSuccess() {
  const dur = 0.75;
  const n = Math.floor(SR*dur);
  const out = new Float32Array(n);
  // note freqs (C5, E5, G5) + attack offsets
  const notes = [[523.25,0],[659.25,0.15],[783.99,0.30]];

  for (const [freq, startSec] of notes) {
    for (let i=0; i<n; i++) {
      const t = i/SR - startSec;
      if (t<0) continue;
      // ADSR-ish: quick attack, long release
      const env = (1-Math.exp(-30*t)) * Math.exp(-5*t);
      out[i] += (Math.sin(2*Math.PI*freq*t)*0.60
               + Math.sin(2*Math.PI*freq*2*t)*0.22
               + Math.sin(2*Math.PI*freq*3*t)*0.10
               + Math.sin(2*Math.PI*freq*4*t)*0.05) * env * 0.18;
    }
  }
  return normalize(out, 0.70);
}

// ---------- Main ----------

const base = join(__dirname, '..', 'public', 'sounds');
mkdirSync(join(base,'ambient'), { recursive:true });
mkdirSync(join(base,'ui'),      { recursive:true });

const files = [
  ['ambient/nature.wav',  genNature()],
  ['ambient/city.wav',    genCity()],
  ['ambient/ancient.wav', genAncient()],
  ['ambient/default.wav', genDefault()],
  ['ui/hover.wav',        genHover()],
  ['ui/click.wav',        genClick()],
  ['ui/success.wav',      genSuccess()],
];

for (const [name, samples] of files) {
  const buf = writeWav(samples);
  writeFileSync(join(base, name), buf);
  console.log(`✓  ${name.padEnd(26)} ${(buf.length/1024).toFixed(0).padStart(5)} KB`);
}

console.log('\nAll sounds generated.');
