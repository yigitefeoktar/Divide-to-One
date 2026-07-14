let audioCtx: AudioContext | null = null;
let isMutedState = localStorage.getItem('gameMuted') === 'true';
let volumeState = Number(localStorage.getItem('gameVolume') ?? '0.5');

export const isMuted = () => isMutedState;

export const setMuted = (muted: boolean) => {
  isMutedState = muted;
  localStorage.setItem('gameMuted', String(muted));
};

export const getVolume = () => volumeState;

export const setVolume = (vol: number) => {
  volumeState = vol;
  localStorage.setItem('gameVolume', String(vol));
};

const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

export const playCorrectMove = () => {
  if (isMutedState || volumeState <= 0.01) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
    
    const maxGain = 0.1 * volumeState;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(maxGain, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {
    console.error(e);
  }
};

export const playWrongMove = () => {
  if (isMutedState || volumeState <= 0.01) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.15);
    
    const maxGain = 0.1 * volumeState;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(maxGain, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {
    console.error(e);
  }
};

export const playWinLevel = () => {
  if (isMutedState || volumeState <= 0.01) return;
  try {
    const ctx = getAudioContext();
    
    const playNote = (freq: number, delay: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const maxGain = 0.1 * volumeState;
      const startTime = ctx.currentTime + delay;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(maxGain, startTime + duration * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    playNote(440, 0, 0.2); // A4
    playNote(554.37, 0.1, 0.2); // C#5
    playNote(659.25, 0.2, 0.4); // E5
    playNote(880, 0.3, 0.6); // A5
  } catch (e) {
    console.error(e);
  }
};

export const playLoseGame = () => {
  if (isMutedState || volumeState <= 0.01) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(250, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.5);
    
    const maxGain = 0.1 * volumeState;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(maxGain, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    console.error(e);
  }
};

export const playClick = () => {
  if (isMutedState || volumeState <= 0.01) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.05);
    
    const maxGain = 0.1 * volumeState;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(maxGain, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (e) {
    console.error(e);
  }
};
