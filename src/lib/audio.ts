/**
 * Motor de áudio da Arca de Noé.
 *
 * O jogo usa duas camadas:
 * 1) gravações reais quando disponíveis (Wikimedia Commons / arquivos locais);
 * 2) síntese procedural como fallback, para o jogo nunca ficar silencioso.
 *
 * A arquitetura foi feita para permitir trocar as URLs por arquivos locais em
 * /src/assets/audio sem alterar nenhuma tela do jogo.
 */

export type Ambience = "campo" | "construcao" | "animais" | "chuva" | "arca" | "final";
export type SfxName =
  | "tap" | "pop" | "star" | "success" | "again" | "hammer" | "wood" | "medal" | "rainbow"
  | "elefante" | "leao" | "girafa" | "macaco" | "passaro" | "ovelha" | "vaca" | "zebra" | "panda";

type Voice = { stop: () => void };
type RealSound = { url: string; volume: number; maxDuration?: number };

const STORAGE_KEY = "arca:audio-on";
const REAL_SOUNDS: Partial<Record<SfxName, RealSound[]>> = {
  // CC0 / domínio público. As URLs apontam para arquivos publicados no Wikimedia Commons.
  elefante: [{ url: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Elephant_voice_-_trumpeting.ogg", volume: 0.9 }],
  leao: [{ url: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Lion_raring-sound1TamilNadu178.ogg", volume: 0.9 }],
  ovelha: [{ url: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Sheep_bleat.ogg", volume: 0.85 }],
  // O arquivo é uma gravação real; o fallback continua disponível caso a rede esteja offline.
  macaco: [{ url: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Sound-of-stump-tailed-macaque-%28macaca-arctoides%29.ogg", volume: 0.55, maxDuration: 2.8 }],
  zebra: [{ url: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Gr%C3%A9vys_zebra_%28Sound_Effects%29.ogg", volume: 0.6, maxDuration: 3.2 }],
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private ambienceGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private voices: Voice[] = [];
  private timers = new Set<ReturnType<typeof setTimeout>>();
  private current: Ambience | null = null;
  private narration: HTMLAudioElement | null = null;
  private realAudio = new Map<SfxName, HTMLAudioElement>();
  private loading = new Set<SfxName>();
  private ambienceGeneration = 0;
  enabled = true;
  unlocked = false;

  constructor() {
    if (typeof window !== "undefined") this.enabled = window.localStorage.getItem(STORAGE_KEY) !== "off";
  }

  unlock() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as any).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.enabled ? 0.9 : 0;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.gain(0.1);
      this.ambienceGain = this.gain(0.22);
      this.sfxGain = this.gain(0.52);
    }
    void this.ctx.resume();
    this.unlocked = true;
  }

  private gain(value: number) {
    const g = this.ctx!.createGain();
    g.gain.value = value;
    g.connect(this.master!);
    return g;
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(on ? 0.9 : 0, this.ctx.currentTime, 0.08);
    if (!on) this.stopNarration();
  }

  private schedule(fn: () => void, ms: number) {
    const id = window.setTimeout(() => {
      this.timers.delete(id);
      fn();
    }, ms);
    this.timers.add(id);
    return id;
  }

  private clearTimers() {
    this.timers.forEach((id) => clearTimeout(id));
    this.timers.clear();
  }

  private tone(freq: number, duration: number, type: OscillatorType = "sine", volume = 0.5, delay = 0, slideTo?: number) {
    if (!this.ctx || !this.sfxGain || !this.enabled) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(freq, 20), t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(slideTo, 20), t0 + duration);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(volume, 0.0001), t0 + Math.min(0.025, duration / 4));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(g).connect(this.sfxGain);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  }

  private noiseBurst(duration: number, freq: number, volume = 0.4, delay = 0) {
    if (!this.ctx || !this.sfxGain || !this.enabled) return;
    const t0 = this.ctx.currentTime + delay;
    const frames = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
    const buffer = this.ctx.createBuffer(1, frames, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = freq;
    filter.Q.value = 0.7;
    const g = this.ctx.createGain();
    g.gain.value = volume;
    src.connect(filter).connect(g).connect(this.sfxGain);
    src.start(t0);
  }

  private async loadReal(name: SfxName): Promise<HTMLAudioElement | null> {
    const source = REAL_SOUNDS[name]?.[0];
    if (!source || typeof window === "undefined") return null;
    const cached = this.realAudio.get(name);
    if (cached) return cached;
    if (this.loading.has(name)) return null;
    this.loading.add(name);
    try {
      const audio = new Audio();
      audio.preload = "auto";
      audio.src = source.url;
      audio.volume = source.volume;
      audio.setAttribute("playsinline", "true");
      audio.load();
      this.realAudio.set(name, audio);
      return audio;
    } catch {
      return null;
    } finally {
      this.loading.delete(name);
    }
  }

  private playReal(name: SfxName): boolean {
    const source = REAL_SOUNDS[name]?.[0];
    if (!source || typeof window === "undefined" || !this.enabled) return false;
    const existing = this.realAudio.get(name);
    if (!existing) {
      void this.loadReal(name).then((audio) => {
        if (!audio || !this.unlocked || !this.enabled) return;
        audio.currentTime = 0;
        audio.playbackRate = 0.94 + Math.random() * 0.12;
        audio.volume = clamp(source.volume * (0.92 + Math.random() * 0.16), 0, 1);
        void audio.play().catch(() => undefined);
      });
      // The request is already in flight; do not synthesize a second animal over it.
      return true;
    }
    existing.currentTime = Math.random() * Math.min(0.08, Math.max(existing.duration || 0, 0));
    existing.playbackRate = 0.94 + Math.random() * 0.12;
    existing.volume = clamp(source.volume * (0.92 + Math.random() * 0.16), 0, 1);
    void existing.play().catch(() => undefined);
    if (source.maxDuration) {
      this.schedule(() => { if (!existing.paused) existing.pause(); }, source.maxDuration * 1000);
    }
    return true;
  }

  sfx(name: SfxName) {
    if (!this.unlocked || !this.enabled) return;
    // Sons reais têm prioridade; a síntese entra somente como fallback/efeito complementar.
    if (REAL_SOUNDS[name] && this.playReal(name)) return;
    switch (name) {
      case "tap": this.tone(620, 0.08, "triangle", 0.25); break;
      case "pop": this.tone(480, 0.12, "sine", 0.35, 0, 920); break;
      case "star": [784, 988, 1319].forEach((f, i) => this.tone(f, 0.24, "triangle", 0.3, i * 0.065)); break;
      case "success": [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.36, "sine", 0.28, i * 0.09)); break;
      case "again": this.tone(440, 0.15, "sine", 0.26); this.tone(392, 0.22, "sine", 0.24, 0.13); break;
      case "hammer": this.noiseBurst(0.11, 1100, 0.42); this.tone(145, 0.1, "square", 0.22); break;
      case "wood": this.noiseBurst(0.18, 360, 0.32); break;
      case "medal": [659, 880, 1047, 1319].forEach((f, i) => this.tone(f, 0.42, "triangle", 0.28, i * 0.1)); break;
      case "rainbow": [523, 587, 659, 784, 880, 1047].forEach((f, i) => this.tone(f, 0.45, "sine", 0.28, i * 0.09)); break;
      // Fallbacks: são intencionalmente curtos e mais orgânicos do que os sons antigos.
      case "elefante": this.tone(150, 0.8, "sawtooth", 0.25, 0, 430); this.noiseBurst(0.55, 900, 0.12); break;
      case "leao": this.tone(105, 1.0, "sawtooth", 0.28, 0, 72); this.noiseBurst(0.8, 220, 0.22); break;
      case "girafa": this.tone(260, 0.36, "triangle", 0.2, 0, 410); this.tone(390, 0.2, "sine", 0.11, 0.18, 280); break;
      case "macaco": [740, 1050, 820, 1200].forEach((f, i) => this.tone(f, 0.11, "triangle", 0.18, i * 0.075)); break;
      case "passaro": [1700, 2300, 1950, 2700].forEach((f, i) => this.tone(f, 0.12, "sine", 0.15, i * 0.07)); break;
      case "ovelha": this.tone(470, 0.55, "triangle", 0.2, 0, 350); break;
      case "vaca": this.tone(160, 0.75, "triangle", 0.25, 0, 120); break;
      case "zebra": this.tone(360, 0.35, "triangle", 0.18, 0, 230); this.noiseBurst(0.2, 650, 0.08); break;
      case "panda": this.tone(240, 0.35, "triangle", 0.2, 0, 180); break;
    }
  }

  private loopNoise(freq: number, q: number, volume: number): Voice {
    const ctx = this.ctx!;
    const frames = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = freq;
    filter.Q.value = q;
    const g = ctx.createGain();
    g.gain.value = 0;
    g.gain.setTargetAtTime(volume, ctx.currentTime, 1.0);
    src.connect(filter).connect(g).connect(this.ambienceGain!);
    src.start();
    return { stop: () => { g.gain.setTargetAtTime(0, ctx.currentTime, 0.35); window.setTimeout(() => src.stop(), 700); } };
  }

  private randomBirds(generation: number): Voice {
    let alive = true;
    const tick = () => {
      if (!alive || generation !== this.ambienceGeneration || !this.enabled) return;
      this.sfx("passaro");
      this.schedule(tick, 3000 + Math.random() * 6000);
    };
    this.schedule(tick, 1300 + Math.random() * 2500);
    return { stop: () => { alive = false; } };
  }

  private randomAnimals(generation: number): Voice {
    let alive = true;
    const tick = () => {
      if (!alive || generation !== this.ambienceGeneration || !this.enabled) return;
      const pool: SfxName[] = ["elefante", "macaco", "passaro", "ovelha"];
      this.sfx(pool[Math.floor(Math.random() * pool.length)]!);
      this.schedule(tick, 4500 + Math.random() * 8500);
    };
    this.schedule(tick, 2600 + Math.random() * 3500);
    return { stop: () => { alive = false; } };
  }

  private wind(generation: number): Voice {
    let alive = true;
    const tick = () => {
      if (!alive || generation !== this.ambienceGeneration || !this.enabled) return;
      this.noiseBurst(0.9, 180 + Math.random() * 100, 0.055);
      this.schedule(tick, 3500 + Math.random() * 4500);
    };
    this.schedule(tick, 1800);
    return { stop: () => { alive = false; } };
  }

  private rain(generation: number): Voice {
    let alive = true;
    const tick = () => {
      if (!alive || generation !== this.ambienceGeneration || !this.enabled) return;
      this.noiseBurst(0.35 + Math.random() * 0.25, 1800 + Math.random() * 1800, 0.07);
      this.schedule(tick, 280 + Math.random() * 420);
    };
    this.schedule(tick, 200);
    return { stop: () => { alive = false; } };
  }

  private pad(freqs: number[], volume: number): Voice {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    g.gain.value = 0;
    g.gain.setTargetAtTime(volume, ctx.currentTime, 1.4);
    g.connect(this.musicGain!);
    const oscs = freqs.map((f, i) => {
      const o = ctx.createOscillator();
      o.type = i % 2 ? "triangle" : "sine";
      o.frequency.value = f;
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.06 + i * 0.025;
      lfoGain.gain.value = 1.2;
      lfo.connect(lfoGain).connect(o.frequency);
      lfo.start(); o.connect(g); o.start();
      return { o, lfo };
    });
    return { stop: () => { g.gain.setTargetAtTime(0, ctx.currentTime, 0.45); window.setTimeout(() => oscs.forEach(({ o, lfo }) => { o.stop(); lfo.stop(); }), 900); } };
  }

  private melody(notes: number[], bpm: number, volume: number): Voice {
    const ctx = this.ctx!;
    let alive = true;
    const beat = 60 / bpm;
    const playPhrase = () => {
      if (!alive || !this.musicGain || !this.enabled) return;
      notes.forEach((frequency, index) => {
        const startsAt = ctx.currentTime + index * beat;
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = index % 3 === 0 ? "triangle" : "sine";
        o.frequency.value = frequency;
        g.gain.setValueAtTime(0.0001, startsAt);
        g.gain.exponentialRampToValueAtTime(volume, startsAt + 0.035);
        g.gain.exponentialRampToValueAtTime(0.0001, startsAt + beat * 0.75);
        o.connect(g).connect(this.musicGain); o.start(startsAt); o.stop(startsAt + beat * 0.8);
      });
      this.schedule(playPhrase, notes.length * beat * 1000);
    };
    playPhrase();
    return { stop: () => { alive = false; } };
  }

  startWelcomeMusic() { this.unlock(); this.setAmbience("campo"); }

  setAmbience(scene: Ambience) {
    if (!this.unlocked || !this.ctx) return;
    if (this.current === scene) return;
    this.current = scene;
    this.ambienceGeneration += 1;
    const generation = this.ambienceGeneration;
    this.clearTimers();
    this.voices.forEach((v) => v.stop());
    this.voices = [];
    const add = (v: Voice) => this.voices.push(v);

    switch (scene) {
      case "campo":
        add(this.loopNoise(420, 0.5, 0.035));
        add(this.wind(generation));
        add(this.randomBirds(generation));
        add(this.pad([261.6, 329.6, 392], 0.07));
        add(this.melody([523.3, 659.3, 784, 659.3, 698.5, 880, 784, 659.3], 132, 0.13));
        break;
      case "construcao":
        add(this.loopNoise(350, 0.55, 0.025));
        add(this.wind(generation));
        add(this.pad([293.7, 349.2, 440], 0.055));
        break;
      case "animais":
        add(this.loopNoise(500, 0.45, 0.025));
        add(this.wind(generation));
        add(this.randomBirds(generation));
        add(this.randomAnimals(generation));
        add(this.pad([329.6, 392, 493.9], 0.055));
        break;
      case "chuva":
        add(this.rain(generation));
        add(this.loopNoise(180, 0.7, 0.035));
        add(this.pad([220, 261.6, 329.6], 0.04));
        this.schedule(() => { if (generation === this.ambienceGeneration) this.noiseBurst(1.0, 90, 0.13); }, 5000 + Math.random() * 7000);
        break;
      case "arca":
        add(this.loopNoise(230, 0.65, 0.045));
        add(this.randomAnimals(generation));
        add(this.pad([246.9, 311.1, 370], 0.055));
        break;
      case "final":
        add(this.loopNoise(480, 0.5, 0.025));
        add(this.randomBirds(generation));
        add(this.wind(generation));
        add(this.pad([392, 493.9, 587.3], 0.075));
        break;
    }
  }

  stopAmbience() {
    this.ambienceGeneration += 1;
    this.clearTimers();
    this.voices.forEach((v) => v.stop());
    this.voices = [];
    this.current = null;
  }

  playNarration(base64: string, mime: string, onEnd?: () => void) {
    this.stopNarration();
    if (!this.enabled) { onEnd?.(); return; }
    const audio = new Audio(`data:${mime};base64,${base64}`);
    audio.volume = 1;
    audio.onplay = () => {
      if (this.ambienceGain && this.ctx) this.ambienceGain.gain.setTargetAtTime(0.07, this.ctx.currentTime, 0.12);
      if (this.musicGain && this.ctx) this.musicGain.gain.setTargetAtTime(0.025, this.ctx.currentTime, 0.12);
    };
    audio.onended = () => { this.restoreNarrationMix(); onEnd?.(); };
    audio.onerror = () => { this.restoreNarrationMix(); onEnd?.(); };
    this.narration = audio;
    void audio.play().catch(() => { this.restoreNarrationMix(); onEnd?.(); });
  }

  private restoreNarrationMix() {
    if (!this.ctx) return;
    this.ambienceGain?.gain.setTargetAtTime(0.22, this.ctx.currentTime, 0.3);
    this.musicGain?.gain.setTargetAtTime(0.1, this.ctx.currentTime, 0.3);
  }

  stopNarration() {
    if (this.narration) {
      this.narration.pause();
      this.narration.onended = null;
      this.narration.onerror = null;
      this.narration = null;
      this.restoreNarrationMix();
    }
  }
}

export const audio = new AudioEngine();
