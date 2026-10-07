/* audio.js — WebAudio 纯合成音效与背景音乐，无任何外部音频素材 */
(function () {
  'use strict';
  const PVZ = (window.PVZ = window.PVZ || {});

  class AudioEngine {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.musicGain = null;
      this.sfxGain = null;
      this.noiseBuf = null;
      this.muted = false;
      this.musicOn = true;
      this.timer = null;
      this.step = 0;
      this.nextNoteTime = 0;
      this.musicType = 'day';
      this.mowerNodes = null;
    }

    ensure() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.9;
      this.master.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.22;
      this.musicGain.connect(this.master);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.85;
      this.sfxGain.connect(this.master);

      const len = this.ctx.sampleRate * 1.2;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }

    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.02);
    }

    /* ---- primitive helpers ---- */
    tone(o) {
      if (!this.ctx) return;
      const t0 = this.ctx.currentTime + (o.delay || 0);
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = o.type || 'square';
      osc.frequency.setValueAtTime(o.f0, t0);
      if (o.f1 != null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.f1), t0 + o.dur);
      const vol = o.vol == null ? 0.3 : o.vol;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + (o.attack || 0.008));
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
      osc.connect(g).connect(o.bus || this.sfxGain);
      osc.start(t0);
      osc.stop(t0 + o.dur + 0.05);
    }

    noise(o) {
      if (!this.ctx) return;
      const t0 = this.ctx.currentTime + (o.delay || 0);
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      src.loop = !!o.loop;
      const g = this.ctx.createGain();
      const vol = o.vol == null ? 0.3 : o.vol;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + (o.attack || 0.005));
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
      let node = src;
      if (o.filter) {
        const f = this.ctx.createBiquadFilter();
        f.type = o.filterType || 'lowpass';
        f.frequency.setValueAtTime(o.f0 || 1200, t0);
        if (o.f1 != null) f.frequency.exponentialRampToValueAtTime(Math.max(20, o.f1), t0 + o.dur);
        if (o.q) f.Q.value = o.q;
        src.connect(f);
        node = f;
      }
      node.connect(g).connect(o.bus || this.sfxGain);
      src.start(t0);
      src.stop(t0 + o.dur + 0.05);
      return { src, g, t0 };
    }

    /* ---- game sfx ---- */
    shoot() { this.tone({ type: 'square', f0: 720, f1: 260, dur: 0.09, vol: 0.16 }); }
    snowShoot() { this.tone({ type: 'triangle', f0: 980, f1: 520, dur: 0.12, vol: 0.2 }); }
    spore() { this.noise({ dur: 0.08, vol: 0.1, filter: true, filterType: 'bandpass', f0: 2600, q: 2 }); }
    plant() {
      this.tone({ type: 'sine', f0: 180, f1: 90, dur: 0.16, vol: 0.32 });
      this.noise({ dur: 0.12, vol: 0.12, filter: true, f0: 500, f1: 150 });
    }
    shovel() { this.noise({ dur: 0.18, vol: 0.18, filter: true, filterType: 'bandpass', f0: 1400, f1: 600 }); }
    sunSpawn() { this.tone({ type: 'sine', f0: 520, f1: 660, dur: 0.12, vol: 0.14 }); }
    sunCollect() {
      this.tone({ type: 'sine', f0: 1318, dur: 0.1, vol: 0.22 });
      this.tone({ type: 'sine', f0: 1760, dur: 0.16, vol: 0.22, delay: 0.07 });
    }
    chomp() {
      this.noise({ dur: 0.14, vol: 0.2, filter: true, filterType: 'bandpass', f0: 300, f1: 120, q: 2 });
      this.tone({ type: 'sine', f0: 140, f1: 70, dur: 0.12, vol: 0.2 });
    }
    swallow() { this.tone({ type: 'sawtooth', f0: 300, f1: 90, dur: 0.35, vol: 0.2 }); }
    freezeHit() { this.tone({ type: 'triangle', f0: 1600, f1: 1000, dur: 0.1, vol: 0.14 }); }
    explode() {
      this.noise({ dur: 0.55, vol: 0.5, filter: true, f0: 2400, f1: 90 });
      this.tone({ type: 'sine', f0: 120, f1: 38, dur: 0.5, vol: 0.5 });
    }
    squish() {
      this.tone({ type: 'sawtooth', f0: 220, f1: 55, dur: 0.3, vol: 0.3 });
      this.noise({ dur: 0.25, vol: 0.18, filter: true, f0: 800, f1: 120 });
    }
    flame() { this.noise({ dur: 0.9, vol: 0.36, filter: true, filterType: 'bandpass', f0: 900, f1: 300, q: 1.2 }); }
    arm() { this.tone({ type: 'square', f0: 880, f1: 1320, dur: 0.1, vol: 0.12 }); }
    groan() { this.tone({ type: 'sawtooth', f0: 130, f1: 80, dur: 0.55, vol: 0.12 }); }
    vault() { this.tone({ type: 'triangle', f0: 300, f1: 700, dur: 0.2, vol: 0.18 }); }
    paper() { this.noise({ dur: 0.18, vol: 0.2, filter: true, filterType: 'highpass', f0: 1500 }); }
    ui() { this.tone({ type: 'square', f0: 660, f1: 660, dur: 0.05, vol: 0.1 }); }
    alarm() {
      this.tone({ type: 'sawtooth', f0: 392, dur: 0.25, vol: 0.2 });
      this.tone({ type: 'sawtooth', f0: 330, dur: 0.3, vol: 0.2, delay: 0.3 });
    }
    flagHorn() {
      this.tone({ type: 'square', f0: 220, dur: 0.22, vol: 0.2 });
      this.tone({ type: 'square', f0: 262, dur: 0.3, vol: 0.2, delay: 0.2 });
    }
    win() {
      const n = [523, 659, 784, 1047];
      n.forEach((f, i) => this.tone({ type: 'triangle', f0: f, dur: 0.22, vol: 0.25, delay: i * 0.13 }));
    }
    lose() {
      const n = [392, 370, 330, 262];
      n.forEach((f, i) => this.tone({ type: 'sawtooth', f0: f, dur: 0.3, vol: 0.2, delay: i * 0.18 }));
    }
    mowerStart() {
      if (!this.ctx || this.mowerNodes) return;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      src.loop = true;
      const f = this.ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = 700;
      f.Q.value = 0.8;
      const g = this.ctx.createGain();
      g.gain.value = 0.16;
      src.connect(f).connect(g).connect(this.sfxGain);
      src.start();
      this.mowerNodes = { src, g };
    }
    mowerStop() {
      if (!this.mowerNodes) return;
      try {
        this.mowerNodes.g.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.05);
        this.mowerNodes.src.stop(this.ctx.currentTime + 0.3);
      } catch (e) { /* ignore */ }
      this.mowerNodes = null;
    }

    /* ---- music ---- */
    startMusic(type) {
      this.ensure();
      if (!this.ctx) return;
      this.musicType = type || 'day';
      if (this.timer) return;
      this.step = 0;
      this.nextNoteTime = this.ctx.currentTime + 0.1;
      this.timer = setInterval(() => this._schedule(), 30);
    }
    stopMusic() {
      if (this.timer) { clearInterval(this.timer); this.timer = null; }
    }

    _schedule() {
      if (!this.ctx) return;
      const spb = 60 / (this.musicType === 'day' ? 132 : 88) / 2; // 16分音符时长
      while (this.nextNoteTime < this.ctx.currentTime + 0.15) {
        this._playStep(this.step, this.nextNoteTime);
        this.nextNoteTime += spb;
        this.step = (this.step + 1) % 64;
      }
    }

    _playStep(step, t) {
      const pat = MUSIC[this.musicType];
      // melody
      const m = pat.melody[step];
      if (m) this._musicNote(m, t, pat.melodyLen || 0.24, 'square', 0.5);
      // bass on even steps
      if (step % 4 === 0) {
        const b = pat.bass[(step / 4) % pat.bass.length];
        this._musicNote(b, t, 0.5, 'triangle', 0.8);
      }
      // soft hat on offbeat
      if (step % 2 === 1 && this.musicType === 'day') this._hat(t);
    }

    _musicNote(freq, t, dur, type, vol) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.18 * vol, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g).connect(this.musicGain);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    }
    _hat(t) {
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const f = this.ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = 6000;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.05, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      src.connect(f).connect(g).connect(this.musicGain);
      src.start(t);
      src.stop(t + 0.08);
    }
  }

  // 64 step loops. day: cheerful C major; night: calm a minor
  const N = 0;
  const MUSIC = {
    day: {
      bass: [131, 131, 196, 175],
      melody: [
        523, N, 659, N, 784, N, 659, N,
        587, N, 698, N, 880, 784, 698, N,
        523, N, 659, N, 784, 880, 988, N,
        880, N, 784, 659, 587, N, 0, N,
        523, N, 659, N, 784, N, 659, N,
        587, N, 698, N, 880, 784, 698, N,
        659, 784, 880, N, 784, 659, 587, N,
        523, N, 0, N, 0, N, 0, N
      ]
    },
    night: {
      bass: [110, 110, 165, 147],
      melody: [
        440, N, N, 523, N, N, 659, N,
        587, N, 523, N, 440, N, N, N,
        392, N, N, 523, N, 587, N, 659,
        N, N, 587, N, 523, N, N, N,
        440, N, N, 523, N, N, 698, N,
        659, N, 587, N, 523, N, N, N,
        392, N, 440, N, 523, N, 587, N,
        523, N, 440, N, 0, N, 0, N
      ]
    }
  };

  PVZ.audio = new AudioEngine();
})();
