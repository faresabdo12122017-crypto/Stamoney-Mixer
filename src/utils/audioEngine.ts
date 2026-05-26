import { MixerSettings } from "../types";

export class SitamoniAudioEngine {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isRunning = false;
  private bpm = 125;
  private mixer: MixerSettings;

  // Sequencer Variables
  private schedulerInterval: number | null = null;
  private nextNoteTime = 0.0;
  private current16thNote = 0;
  private lookahead = 25.0; // ms
  private scheduleAheadTime = 0.1; // sec

  // Synth oscillators currently playing (to prevent overlapping notes)
  private activeSynthNodes: { osc1: OscillatorNode; osc2: OscillatorNode; gain: GainNode }[] = [];

  // Callbacks
  private onBeatCallback: ((step: number) => void) | null = null;

  constructor(initialMixer: MixerSettings) {
    this.mixer = initialMixer;
  }

  // Lazy initialize AudioContext on User Gesture
  public init() {
    if (this.audioCtx) return;
    
    // Support cross-browser AudioContext
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.audioCtx = new AudioContextClass();
    
    // Master Gain
    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.setValueAtTime(this.mixer.masterVol, this.audioCtx.currentTime);

    // Analyser Node for glorious glowing canvas frequency visualisations
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 256;

    // Connect them
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination);
    
    console.log("🔊 Sitamoni Web Audio Synth initialized successfully.");
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public updateMixer(newMixer: MixerSettings) {
    this.mixer = newMixer;
    if (this.audioCtx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.mixer.masterVol, this.audioCtx.currentTime, 0.05);
    }
  }

  public setCallback(cb: (step: number) => void) {
    this.onBeatCallback = cb;
  }

  public start(trackBpm: number) {
    this.init();
    if (this.isRunning) return;
    
    this.bpm = trackBpm;
    if (this.audioCtx?.state === "suspended") {
      this.audioCtx.resume();
    }

    this.isRunning = true;
    this.current16thNote = 0;
    this.nextNoteTime = this.audioCtx!.currentTime;

    // Start scheduler loop
    this.schedulerInterval = window.setInterval(() => {
      this.scheduler();
    }, this.lookahead);

    console.log(`🎶 Sitamoni Beat Loop started at BPM: ${this.bpm}`);
  }

  public stop() {
    this.isRunning = false;
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
    // Stop any active synth notes
    this.activeSynthNodes.forEach(node => {
      try {
        node.osc1.stop();
        node.osc2.stop();
      } catch (e) {}
    });
    this.activeSynthNodes = [];
    console.log("🛑 Sitamoni Beat Loop paused.");
  }

  public setBpm(newBpm: number) {
    this.bpm = newBpm;
  }

  // ----------------------------------------------------
  // SEQUENCER SCHEDULER
  // ----------------------------------------------------
  private scheduler() {
    if (!this.audioCtx || !this.isRunning) return;

    while (this.nextNoteTime < this.audioCtx.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.current16thNote, this.nextNoteTime);
      this.advanceNote();
    }
  }

  private advanceNote() {
    if (!this.audioCtx) return;
    // Seconds per step (16th note)
    const secondsPerBeat = 60.0 / this.bpm;
    const secondsPerStep = secondsPerBeat / 4.0; 
    
    this.nextNoteTime += secondsPerStep;

    // Advance 16th note, wrap at 16 (4/4 time bar)
    this.current16thNote = (this.current16thNote + 1) % 16;
  }

  private scheduleNote(step: number, time: number) {
    if (!this.audioCtx) return;

    // Trigger visual/ui update callback on beat/offbeats
    if (this.onBeatCallback) {
      // Direct callback logic via window postMessage/timeout to keep audio safe
      this.onBeatCallback(step);
    }

    // 1st Layer: Mahragan Boom Bass Kick (بوم وباص) Drums
    // Standard Mahragan beat signature: Heavy Kick on steps: 0, 4, 8, 11, 13
    const isKickStep = [0, 6, 8, 12].includes(step);
    if (isKickStep && this.mixer.beatVol > 0) {
      this.playKickSample(time);
    }

    // 2nd Layer: Egyptian Maksoum Tabla (دم تك) Darabukka
    // Authentic hits ("تك" and "صاجات") on steps: 2, 4, 10, 14
    const isTablaStep = [2, 4, 10, 14].includes(step);
    if (isTablaStep && this.mixer.tablaVol > 0) {
      this.playTablaHit(time, step === 4 ? "دم" : "تك");
    }

    // 3rd Layer: Autonomous Micro-Mezmar (المزمار الذكي) Melodic Sequence
    // Plays random scales dynamically matching the bpm and vibes on certain steps
    const isMelodyStep = [0, 2, 4, 6, 8, 10, 12, 14].includes(step);
    if (isMelodyStep && this.mixer.synthVol > 0 && Math.random() < 0.85) {
      this.playSequencedsynthNote(step, time);
    }
  }

  // ----------------------------------------------------
  // DRUM GENERATORS (PURE SYNTHESIS)
  // ----------------------------------------------------
  private playKickSample(time: number) {
    if (!this.audioCtx || !this.masterGain) return;

    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(this.masterGain);

    // Deep sub-bass sweep
    osc.frequency.setValueAtTime(120, time);
    osc.frequency.exponentialRampToValueAtTime(35, time + 0.25);

    // Punchy volume envelope
    gainNode.gain.setValueAtTime(this.mixer.beatVol * 0.45, time);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

    osc.start(time);
    osc.stop(time + 0.35);
  }

  private playTablaHit(time: number, toneType: "دم" | "تك") {
    if (!this.audioCtx || !this.masterGain) return;

    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    if (toneType === "دم") {
      // Resonant, hollow mid-bass hit
      osc.type = "sine";
      osc.frequency.setValueAtTime(180, time);
      osc.frequency.exponentialRampToValueAtTime(80, time + 0.15);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(300, time);

      gainNode.gain.setValueAtTime(this.mixer.tablaVol * 0.35, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
    } else {
      // Snappy, metallic high-end edge ("تك")
      osc.type = "triangle";
      osc.frequency.setValueAtTime(800, time);
      osc.frequency.linearRampToValueAtTime(1100, time + 0.08);

      filter.type = "highpass";
      filter.frequency.setValueAtTime(1200, time);

      gainNode.gain.setValueAtTime(this.mixer.tablaVol * 0.22, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    }

    osc.start(time);
    osc.stop(time + 0.2);
  }

  // ----------------------------------------------------
  // MEZMAR MICRO-MELODY SCALE SELECTOR (EGYPTIAN SCALE)
  // Double Harmonic Major (حجاز كار) / Phrygian scale
  // ----------------------------------------------------
  private playSequencedsynthNote(step: number, time: number) {
    // Shaabi Mezmar Riffs: A3, Bb3, C#4, D4, E4, F4, G#4, A4
    const shaabiScale = [220.00, 233.08, 277.18, 293.66, 329.63, 349.23, 415.30, 440.00];
    
    // Choose index deterministically based on step with adding slight random variation
    const baseIndex = (step * 3) % shaabiScale.length;
    let finalIndex = baseIndex;
    if (Math.random() < 0.2) {
      finalIndex = (baseIndex + 1) % shaabiScale.length;
    } else if (Math.random() < 0.2) {
      finalIndex = (baseIndex - 1 + shaabiScale.length) % shaabiScale.length;
    }

    const freq = shaabiScale[finalIndex];
    this.playMezmarVoice(freq, time, 0.15);
  }

  // Synthesize an authentic sharp buzzy Electronic Shaabi Mezmar
  private playMezmarVoice(freq: number, time: number, duration: number) {
    if (!this.audioCtx || !this.masterGain) return;

    // Create 2 sawtooths slightly detuned for high-density buzzy chorus
    const osc1 = this.audioCtx.createOscillator();
    const osc2 = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();
    const bandpass = this.audioCtx.createBiquadFilter();

    osc1.type = "sawtooth";
    osc2.type = "sawtooth";

    osc1.frequency.setValueAtTime(freq, time);
    osc2.frequency.setValueAtTime(freq + (this.mixer.mufflerActive ? 1.5 : 3.5), time);

    // Rhythmic pitch slide (vibrato/sweep) to sound exactly like a real Arabic folk organ pitch bendwheel
    osc1.frequency.linearRampToValueAtTime(freq * 1.02, time + duration * 0.4);
    osc1.frequency.linearRampToValueAtTime(freq * 0.98, time + duration * 0.8);
    osc2.frequency.linearRampToValueAtTime((freq + 3) * 1.02, time + duration * 0.4);
    osc2.frequency.linearRampToValueAtTime((freq + 3) * 0.98, time + duration * 0.8);

    // Mixer control & bandpass shaping to sound vintage metallic
    bandpass.type = "bandpass";
    bandpass.frequency.setValueAtTime(this.mixer.mufflerActive ? 600 : 1600, time);
    bandpass.Q.setValueAtTime(1.5, time);

    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(this.mixer.synthVol * 0.15, time + 0.01); // Quick attack
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration); // decay

    osc1.connect(bandpass);
    osc2.connect(bandpass);
    bandpass.connect(gainNode);
    gainNode.connect(this.masterGain);

    osc1.start(time);
    osc1.stop(time + duration + 0.05);
    osc2.start(time);
    osc2.stop(time + duration + 0.05);

    // Keep track of active nodes
    const nodeRef = { osc1, osc2, gain: gainNode };
    this.activeSynthNodes.push(nodeRef);
    setTimeout(() => {
      this.activeSynthNodes = this.activeSynthNodes.filter(n => n !== nodeRef);
    }, (duration + 0.2) * 1000);
  }

  // TRIGGER KEYBOARD NOTE (Live Melodic Keyboard Playground!)
  public triggerKeyboardNote(freq: number) {
    this.init();
    if (this.audioCtx?.state === "suspended") {
      this.audioCtx.resume();
    }
    const time = this.audioCtx!.currentTime;
    this.playMezmarVoice(freq, time, 0.4);
  }

  // ----------------------------------------------------
  // SOUND BOARD STREET PARTY EFFECTS
  // ----------------------------------------------------
  
  // Siren Effect (سرينة الحفلات الشعبية)
  public triggerSirenEffect() {
    this.init();
    if (!this.audioCtx || !this.masterGain) return;

    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(300, this.audioCtx.currentTime);

    // Rapid alarm pitch scan (up-down sequence)
    const t = this.audioCtx.currentTime;
    osc.frequency.linearRampToValueAtTime(1400, t + 0.3);
    osc.frequency.linearRampToValueAtTime(500, t + 0.6);
    osc.frequency.linearRampToValueAtTime(1400, t + 0.9);
    osc.frequency.linearRampToValueAtTime(500, t + 1.2);
    osc.frequency.exponentialRampToValueAtTime(50, t + 1.6);

    gainNode.gain.setValueAtTime(0.12, t);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + 1.65);

    osc.connect(gainNode);
    gainNode.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 1.7);
    console.log("🚨 Synthetic Shaabi Party Siren Triggered!");
  }

  // Firework Gunshot (ضرب نار العيد والمهرجانات)
  public triggerGunshotEffect() {
    this.init();
    if (!this.audioCtx || !this.masterGain) return;

    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(500, this.audioCtx.currentTime);
    osc.frequency.setValueAtTime(200, this.audioCtx.currentTime + 0.05);

    // Exploding noise simulation
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(400, this.audioCtx.currentTime);

    const t = this.audioCtx.currentTime;
    gainNode.gain.setValueAtTime(0.35, t); // Heavy blast volume
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.45);
    console.log("💥 Gunshot Firework blast synthesized!");
  }

  // High pitch Laser Sweep (سويرب الليزر الجديد)
  public triggerLaserSweep() {
    this.init();
    if (!this.audioCtx || !this.masterGain) return;

    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    osc.type = "sine";
    const t = this.audioCtx.currentTime;
    osc.frequency.setValueAtTime(1800, t);
    osc.frequency.exponentialRampToValueAtTime(250, t + 0.45);

    gainNode.gain.setValueAtTime(0.18, t);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.connect(gainNode);
    gainNode.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.5);
    console.log("⚡ Laser sweep synthesized!");
  }

  // ----------------------------------------------------
  // STREET VOCAL SINGER SIGHTS (SPEECH SYNTHESIS)
  // ----------------------------------------------------
  public singLine(text: string) {
    if (!this.mixer.vocalVol || this.mixer.vocalVol === 0) return;

    try {
      // Cancel previous utterances immediately to prevent speech pile-ups
      window.speechSynthesis.cancel();
      
      const cleanMessage = text
        .replace(/[a-zA-Z]/g, '') // remove English paths/IDs
        .substring(0, 180); // Capped for stability

      const utterance = new SpeechSynthesisUtterance(cleanMessage);
      utterance.lang = "ar-EG"; // Native Egyptian Arabic
      
      const speedValue = 0.85 + (this.mixer.vocalSpeechRate * 0.3); // Map slider to friendly TTS speed
      utterance.rate = speedValue; 
      utterance.pitch = this.mixer.vocalPitch; // Map pitch slider (0.6 - 1.6)

      // Apply electronic volume
      utterance.volume = this.mixer.vocalVol;

      window.speechSynthesis.speak(utterance);
      console.log(`🎤 Singer TTS Chanting: "${cleanMessage}" (Rate: ${speedValue.toFixed(2)}, Pitch: ${this.mixer.vocalPitch})`);
    } catch (e) {
      console.error("Vocal Synthesis Playback issue:", e);
    }
  }
}
