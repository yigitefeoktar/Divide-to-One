import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { ByteBrew } from 'bytebrew-web-sdk';
import { generateTarget, getBestMove, getMinimumMoves } from './utils';
import { cn } from './lib/utils';
import { RotateCcw, Volume2, VolumeX, Settings, X, HelpCircle } from 'lucide-react';
import { playCorrectMove, playWrongMove, playWinLevel, playLoseGame, playClick, isMuted, setMuted, getVolume, setVolume } from './audio';

function useAppScale() {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      // Use actual window dimensions
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      
      // Target container size
      const TARGET_WIDTH = 400;
      const TARGET_HEIGHT = 850;
      
      // Add safe margin to ensure it never touches the absolute edges
      // This prevents cut-offs on some browsers
      const SAFE_MARGIN_Y = 40; 
      
      const scaleX = vw / TARGET_WIDTH;
      const scaleY = vh / (TARGET_HEIGHT + SAFE_MARGIN_Y);
      
      setScale(Math.min(scaleX, scaleY));
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  return { scale };
}

function ActionButton({ 
  number, 
  onClick, 
  disabled,
  isHinted,
  theme
}: { 
  key?: any;
  number: number; 
  onClick: (n: number) => void;
  disabled: boolean;
  isHinted?: boolean;
  theme: any;
}) {
  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.92 } : {}}
      onClick={() => onClick(number)}
      disabled={disabled}
      className={cn(
        "relative w-full aspect-square rounded-2xl flex items-center justify-center text-5xl font-black",
        theme.keyBg, "border", theme.keyBorder,
        theme.text,
        !disabled ? theme.keyShadow : theme.keyDisabledShadow,
        "active:shadow-none active:translate-y-2",
        "transition-colors duration-1000",
        !disabled && `${theme.keyHover} ${theme.textHover} ${theme.borderHover}`,
        disabled && "opacity-50 cursor-not-allowed translate-y-1"
      )}
    >
      {isHinted && !disabled && (
        <motion.div
          className={cn("absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-4 pointer-events-none", theme.border)}
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.2, 1] }}
          transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <span className="relative z-10">{number}</span>
    </motion.button>
  );
}

const getDynamicTextSize = (num: number) => {
  const digits = Math.abs(num).toString().length;
  
  // Phase 1: 1 Line (1-13 digits)
  // Our container is exactly 400px wide. We scale the font sizes to fit nicely.
  if (digits <= 7) return "text-7xl"; 
  if (digits <= 10) return "text-6xl";
  if (digits <= 13) return "text-5xl"; 
  
  // Phase 2: 2 Lines (14-26 digits)
  if (digits <= 20) return "text-6xl"; 
  if (digits <= 26) return "text-5xl";
  
  // Phase 3: 3 Lines (27+ digits)
  if (digits <= 32) return "text-5xl";
  if (digits <= 40) return "text-4xl";
  if (digits <= 55) return "text-3xl";
  if (digits <= 80) return "text-2xl";
  
  return "text-xl";
};

const formatNumberLines = (num: number): string[] => {
  const fullStr = num.toString();
  const digits = Math.abs(num).toString().length;
  
  if (digits <= 13) {
    return [fullStr];
  }
  
  if (digits <= 26) {
    const half = Math.ceil(fullStr.length / 2);
    return [fullStr.slice(0, half), fullStr.slice(half)];
  }
  
  const third = Math.ceil(fullStr.length / 3);
  return [fullStr.slice(0, third), fullStr.slice(third, third * 2), fullStr.slice(third * 2)];
};

const USE_DYNAMIC_THEME = true;
const DEBUG_LEVEL_JUMP = false;
const DEBUG_AUTO_PLAY = false;
const DEBUG_SETTINGS_TAB = false;

const getLevelColors = (level: number, isTutorial: boolean) => {
  const base = { 
    label: "text-slate-500", 
    value: "text-indigo-400",
    text: "text-indigo-400",
    textHover: "hover:text-indigo-300",
    borderHover: "hover:border-indigo-500/30",
    border: "border-indigo-400",
    ring: "ring-indigo-400",
    textHalf: "text-indigo-400/50",
    dropShadow: "drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]",
    hex: "#818cf8",
    appBg: "bg-[#020617]",
    keypadBg: "bg-[#0f172a]/50",
    keypadBorder: "border-[#1e293b]",
    keyBg: "bg-[#1e293b]",
    keyBorder: "border-[#334155]/50",
    keyHover: "hover:bg-[#334155]",
    keyShadow: "shadow-[0_8px_0_0_#0f172a]",
    keyDisabledShadow: "shadow-[0_4px_0_0_#0f172a]"
  };

  if (!USE_DYNAMIC_THEME || isTutorial) return base;
  
  if (level >= 50) return { 
    ...base,
    label: "text-amber-500/80", 
    value: "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]",
    text: "text-amber-400",
    textHover: "hover:text-amber-300",
    borderHover: "hover:border-amber-500/30",
    border: "border-amber-400",
    ring: "ring-amber-400",
    textHalf: "text-amber-400/50",
    dropShadow: "drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]",
    hex: "#fbbf24",
    appBg: "bg-[#120c04]",
    keypadBg: "bg-[#1f1406]/80",
    keypadBorder: "border-[#2e1e0a]",
    keyBg: "bg-[#2e1e0a]",
    keyBorder: "border-[#40290d]/50",
    keyHover: "hover:bg-[#40290d]",
    keyShadow: "shadow-[0_8px_0_0_#1f1406]",
    keyDisabledShadow: "shadow-[0_4px_0_0_#1f1406]"
  };
  if (level >= 40) return { 
    ...base,
    label: "text-orange-500/80", 
    value: "text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]",
    text: "text-orange-500",
    textHover: "hover:text-orange-400",
    borderHover: "hover:border-orange-500/30",
    border: "border-orange-500",
    ring: "ring-orange-500",
    textHalf: "text-orange-500/50",
    dropShadow: "drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]",
    hex: "#f97316",
    appBg: "bg-[#120704]",
    keypadBg: "bg-[#1f0d06]/80",
    keypadBorder: "border-[#2e140a]",
    keyBg: "bg-[#2e140a]",
    keyBorder: "border-[#401c0d]/50",
    keyHover: "hover:bg-[#401c0d]",
    keyShadow: "shadow-[0_8px_0_0_#1f0d06]",
    keyDisabledShadow: "shadow-[0_4px_0_0_#1f0d06]"
  };
  if (level >= 30) return { 
    ...base,
    label: "text-purple-500/80", 
    value: "text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.5)]",
    text: "text-purple-400",
    textHover: "hover:text-purple-300",
    borderHover: "hover:border-purple-500/30",
    border: "border-purple-400",
    ring: "ring-purple-400",
    textHalf: "text-purple-400/50",
    dropShadow: "drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]",
    hex: "#c084fc",
    appBg: "bg-[#0e0412]",
    keypadBg: "bg-[#18061f]/80",
    keypadBorder: "border-[#230a2e]",
    keyBg: "bg-[#230a2e]",
    keyBorder: "border-[#310d40]/50",
    keyHover: "hover:bg-[#310d40]",
    keyShadow: "shadow-[0_8px_0_0_#18061f]",
    keyDisabledShadow: "shadow-[0_4px_0_0_#18061f]"
  };
  if (level >= 20) return { 
    ...base,
    label: "text-sky-500/80", 
    value: "text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]",
    text: "text-sky-400",
    textHover: "hover:text-sky-300",
    borderHover: "hover:border-sky-500/30",
    border: "border-sky-400",
    ring: "ring-sky-400",
    textHalf: "text-sky-400/50",
    dropShadow: "drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]",
    hex: "#38bdf8",
    appBg: "bg-[#040d12]",
    keypadBg: "bg-[#06161f]/80",
    keypadBorder: "border-[#0a222e]",
    keyBg: "bg-[#0a222e]",
    keyBorder: "border-[#0d2f40]/50",
    keyHover: "hover:bg-[#0d2f40]",
    keyShadow: "shadow-[0_8px_0_0_#06161f]",
    keyDisabledShadow: "shadow-[0_4px_0_0_#06161f]"
  };
  if (level >= 10) return { 
    ...base,
    label: "text-emerald-500/80", 
    value: "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]",
    text: "text-emerald-400",
    textHover: "hover:text-emerald-300",
    borderHover: "hover:border-emerald-500/30",
    border: "border-emerald-400",
    ring: "ring-emerald-400",
    textHalf: "text-emerald-400/50",
    dropShadow: "drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]",
    hex: "#34d399",
    appBg: "bg-[#04120a]",
    keypadBg: "bg-[#061f12]/80",
    keypadBorder: "border-[#0a2e1c]",
    keyBg: "bg-[#0a2e1c]",
    keyBorder: "border-[#0d4026]/50",
    keyHover: "hover:bg-[#0d4026]",
    keyShadow: "shadow-[0_8px_0_0_#061f12]",
    keyDisabledShadow: "shadow-[0_4px_0_0_#061f12]"
  };
  
  return base;
};

const getGameOverMessage = (level: number) => {
  if (level < 10) return { word: "Keep Trying", note: "Keep playing. It trains your math intelligence." };
  if (level < 20) return { word: "Good Effort", note: "Every game builds your mental math." };
  if (level < 30) return { word: "Smart Thinking", note: "A strong display of mathematical logic." };
  if (level < 40) return { word: "Great Work", note: "Great logic. Playing regularly sharpens your math sense." };
  if (level < 50) return { word: "Outstanding", note: "Exceptional logic and mathematical intuition." };
  if (level < 75) return { word: "Brilliant", note: "Brilliant! Your number logic is getting really strong." };
  if (level < 100) return { word: "Genius Level", note: "Genius! Your brain is wired for math." };
  return { word: "Mathematical Prodigy", note: "Prodigy! Your math intelligence is off the charts." };
};

export default function App() {
  const { scale } = useAppScale();
  const [level, setLevel] = useState(1);
  const [current, setCurrent] = useState(0);
  const [minMoves, setMinMoves] = useState(0);
  const [maxMistakes, setMaxMistakes] = useState(0);
  const [moves, setMoves] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  
  const [isWon, setIsWon] = useState(false);
  const [isLost, setIsLost] = useState(false);
  const [lossReason, setLossReason] = useState<'moves' | 'impossible' | 'mistakes' | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [scaleKey, setScaleKey] = useState(0);
  const [floatingText, setFloatingText] = useState<{ text: string; isPerfect?: boolean; id: number } | null>(null);
  
  const historyRef = useRef<number[]>([]);
  const tutorialRef = useRef(true);
  const tutorialProgressRef = useRef(0);
  const [bestMove, setBestMove] = useState<number>(-1);
  const [failedDivisors, setFailedDivisors] = useState<number[]>([]);
  const [muted, setMutedState] = useState(() => isMuted());
  const [volume, setVolumeState] = useState(() => getVolume());

  const toggleMute = () => {
    const newState = !muted;
    setMutedState(newState);
    setMuted(newState);
    if (!newState) {
      setTimeout(() => {
        playClick();
      }, 50);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolumeState(newVol);
    setVolume(newVol);
  };

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [vibrateEnabled, setVibrateEnabled] = useState(() => {
    return localStorage.getItem('gameVibrate') !== 'false';
  });

  const toggleVibrate = () => {
    const newState = !vibrateEnabled;
    setVibrateEnabled(newState);
    localStorage.setItem('gameVibrate', String(newState));
    if (newState && navigator.vibrate) {
      try {
        navigator.vibrate(40);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const triggerVibrate = useCallback((pattern: number | number[]) => {
    if (vibrateEnabled && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        console.error(e);
      }
    }
  }, [vibrateEnabled]);
  
  const playSessionIdRef = useRef(Math.random().toString(36).substring(2, 10));
  const gameIdRef = useRef('');
  const gameStartTimeRef = useRef(Date.now());
  
  const initGame = useCallback((diff: number, resetHistory = false) => {
    if (resetHistory) {
      if (historyRef.current.length > 0) {
        localStorage.setItem('lastGameHistory', JSON.stringify(historyRef.current));
      }
      historyRef.current = [];
    }
    const isTut = tutorialRef.current;
    const lastGameHistory: number[] = JSON.parse(localStorage.getItem('lastGameHistory') || '[]');
    const combinedHistory = [...lastGameHistory, ...historyRef.current];
    const { target: newTarget, minMoves: newMinMoves } = generateTarget(diff, combinedHistory, isTut);
    historyRef.current.push(newTarget);
    
    const allowedMistakes = newMinMoves === 2 ? 2 : Math.ceil(newMinMoves * 0.5);
    
    setCurrent(newTarget);
    setMinMoves(newMinMoves);
    setMaxMistakes(allowedMistakes);
    setMoves(0);
    setMistakes(0);
    setFailedDivisors([]);
    setIsWon(false);
    setIsLost(false);
    setScaleKey(k => k + 1);
    
    if (isTut) {
      setBestMove(getBestMove(newTarget));
    } else {
      setBestMove(-1);
    }

    const newGameId = Math.random().toString(36).substring(2, 10);
    gameIdRef.current = newGameId;
    gameStartTimeRef.current = Date.now();
    
    try {
      ByteBrew.newCustomEvent('game_started', {
        session_id: String(playSessionIdRef.current),
        game_id: String(newGameId),
        level: String(diff),
        target: String(newTarget),
        is_tutorial: isTut ? 'true' : 'false',
        test_tag: 'test'
      });
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    initGame(level, level === 1);
  }, [level, initGame]);

  const triggerLoss = (reason: 'impossible' | 'mistakes') => {
    setIsLost(true);
    setLossReason(reason);
    triggerVibrate([100, 50, 100]);
    playLoseGame();
    
    const duration = (Date.now() - gameStartTimeRef.current) / 1000;
    try {
      ByteBrew.newCustomEvent('game_ended', {
        session_id: String(playSessionIdRef.current),
        game_id: String(gameIdRef.current),
        level: String(level),
        outcome: reason === 'mistakes' ? 'lose_mistakes' : 'lose_impossible',
        duration_seconds: String(duration),
        test_tag: 'test'
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDivide = (divisor: number) => {
    if (isWon || isLost) return;
    
    const isCorrect = current % divisor === 0;
    let isDuplicateMistake = false;
    
    if (!isCorrect) {
      isDuplicateMistake = failedDivisors.includes(divisor);
    }
    
    const newMoves = isDuplicateMistake ? moves : moves + 1;
    if (!isDuplicateMistake) {
      setMoves(newMoves);
    }
    
    if (isCorrect) {
      setFailedDivisors([]);
    } else if (!isDuplicateMistake) {
      setFailedDivisors(prev => [...prev, divisor]);
      setMistakes(prev => prev + 1);
    }

    try {
      ByteBrew.newCustomEvent('action_input', {
        session_id: String(playSessionIdRef.current),
        game_id: String(gameIdRef.current),
        level: String(level),
        current_number: String(current),
        divisor_entered: String(divisor),
        is_correct: isCorrect ? 'true' : 'false',
        moves_so_far: String(newMoves),
        test_tag: 'test'
      });
    } catch (e) {
      console.error(e);
    }
    
    if (isCorrect) {
      // Success
      const next = current / divisor;
      if (!(tutorialRef.current && tutorialProgressRef.current === 0)) {
        if (next === 1 && newMoves === minMoves) {
          setFloatingText({ text: "Perfect", isPerfect: true, id: Date.now() });
        } else {
          setFloatingText({ text: `÷ ${divisor}`, isPerfect: false, id: Date.now() });
        }
      }
      triggerVibrate(40);
      
      if (next === 1) {
        playWinLevel();
      } else {
        playCorrectMove();
      }
      
      setCurrent(next);
      setScaleKey(k => k + 1);
      
      if (tutorialRef.current) {
        setBestMove(getBestMove(next));
      }

      if (next === 1) {
        setIsWon(true);
        triggerVibrate([50, 50, 50, 50, 150]);
        
        const duration = (Date.now() - gameStartTimeRef.current) / 1000;
        try {
          ByteBrew.newCustomEvent('game_ended', {
            session_id: String(playSessionIdRef.current),
            game_id: String(gameIdRef.current),
            level: String(level),
            outcome: 'win',
            duration_seconds: String(duration),
            test_tag: 'test'
          });
        } catch (e) {
          console.error(e);
        }

        const currentTheme = getLevelColors(level, tutorialRef.current);
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: [currentTheme.hex, '#c084fc', '#f472b6'],
          disableForReducedMotion: true
        });
        setTimeout(() => {
          if (tutorialRef.current) {
            tutorialProgressRef.current += 1;
            if (tutorialProgressRef.current >= 2) {
              tutorialRef.current = false;
              initGame(1, true);
            } else {
              initGame(1, false);
            }
          } else {
            setLevel(l => {
              if (DEBUG_LEVEL_JUMP) {
                if (l < 10) return 10;
                if (l < 20) return 20;
                if (l < 30) return 30;
                if (l < 40) return 40;
                if (l < 50) return 50;
                if (l < 75) return 75;
                if (l < 100) return 100;
                return l + 25;
              }
              return l + 1;
            });
          }
        }, 300);
      } else {
        const required = getMinimumMoves(next);
        if (required === -1) {
          triggerLoss('impossible');
        }
      }
    } else {
      // Error
      triggerVibrate([30, 40, 30]);
      setShakeKey(k => k + 1);
      
      const totalMistakes = mistakes + 1;
      
      if (totalMistakes > maxMistakes) {
        triggerLoss('mistakes');
      } else {
        const required = getMinimumMoves(current);
        if (required === -1) {
          triggerLoss('impossible');
        } else {
          playWrongMove();
        }
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLost && e.key === ' ') {
        e.preventDefault();
        playClick();
        try {
          ByteBrew.newCustomEvent('game_restarted', {
            session_id: String(playSessionIdRef.current),
            game_id: String(gameIdRef.current),
            level: String(level),
            method: 'spacebar',
            test_tag: 'test'
          });
        } catch (err) {
          console.error(err);
        }
        if (tutorialRef.current) {
          tutorialProgressRef.current = 0;
          initGame(1, true);
        } else {
          tutorialRef.current = false;
          if (level === 1) initGame(1, true);
          else setLevel(1); 
        }
      } else if (!isWon && !isLost) {
        const num = parseInt(e.key, 10);
        if (num >= 2 && num <= 9) {
          handleDivide(num);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLost, isWon, level, initGame, handleDivide]);

  // Auto-play feature for testing
  useEffect(() => {
    if (!DEBUG_AUTO_PLAY || isWon || isLost || current === 0) return;

    const timer = setTimeout(() => {
      const best = getBestMove(current);
      if (best !== -1) {
        handleDivide(best);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [current, isWon, isLost, handleDivide]);

  // Wait for initial generation
  if (current === 0) return <div className="absolute inset-0 bg-slate-950" />;

  const theme = getLevelColors(level, tutorialRef.current);

  return (
    <div className={cn("absolute inset-0 flex items-center justify-center font-sans select-none overflow-hidden transition-colors duration-1000", theme.appBg)}>
      <div 
        style={{
          width: 400,
          height: 850,
          transform: `scale(${scale})`,
          transformOrigin: 'center'
        }}
        className="flex-shrink-0 flex flex-col text-slate-100 p-4 relative"
      >
        {/* Header Section */}
        <div className="w-full flex items-center justify-between mt-4 mb-8 px-4 z-50">
          {/* Left Spacer to balance the right-side buttons and keep Level centered */}
          <div className="w-10 flex-shrink-0" />

          {/* Level Stats */}
          <div className={cn(
            "flex flex-col items-center flex-1 transition-opacity duration-300",
            isLost ? "opacity-0 pointer-events-none" : "opacity-100"
          )}>
            <span className={cn("text-sm font-semibold tracking-wider uppercase transition-colors duration-1000", theme.label)}>Level</span>
            <span className={cn("text-2xl font-black transition-colors duration-1000", theme.value)}>
              {tutorialRef.current ? "TUTORIAL" : level}
            </span>
          </div>

          {/* Action Button Dock (Settings & Mute) */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            {/* Settings Toggle Button */}
            {DEBUG_SETTINGS_TAB && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  playClick();
                  setIsSettingsOpen(true);
                }}
                className={cn(
                  "p-2.5 rounded-full border backdrop-blur-sm shadow-md flex items-center justify-center transition-all duration-300",
                  "bg-[#0f172a]/80", theme.keyBorder, theme.text
                )}
                title="Game Settings"
              >
                <Settings size={18} />
              </motion.button>
            )}

            {/* Sound Toggle Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleMute}
              className={cn(
                "p-2.5 rounded-full border backdrop-blur-sm shadow-md flex items-center justify-center transition-all duration-300",
                muted 
                  ? "bg-slate-800/80 border-slate-700 text-slate-400" 
                  : cn("bg-[#0f172a]/80", theme.keyBorder, theme.text)
              )}
              title={muted ? "Unmute sounds" : "Mute sounds"}
            >
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </motion.button>
          </div>
        </div>

      {/* Main Display Area */}
      <div className="w-full flex-1 flex flex-col items-center justify-center min-h-[300px] relative">
        <AnimatePresence mode="wait">
          {!isLost ? (
            <motion.div
              key="playing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center w-full relative"
            >
              {tutorialRef.current && tutorialProgressRef.current === 0 && (
                <div className="absolute -top-16 text-center w-full">
                  <p className={cn("font-bold uppercase tracking-wider text-sm", theme.text)}>
                    Divide the number to reach 1
                  </p>
                </div>
              )}
              <motion.div
                animate={shakeKey > 0 ? {
                  x: [-8, 8, -6, 6, -4, 4, 0],
                  transition: { duration: 0.4 }
                } : {}}
                className="relative flex items-center justify-center w-full max-w-[320px] h-fit px-6 py-8 rounded-2xl transition-all duration-1000"
              >
                {tutorialRef.current && tutorialProgressRef.current === 0 && (
                  <div className={cn("absolute inset-0 rounded-2xl ring-4 ring-offset-4 ring-offset-slate-950 animate-pulse pointer-events-none", theme.ring)} />
                )}
                <motion.h1
                  key={`scale-${scaleKey}`}
                  initial={{ scale: 1.2, color: theme.hex }}
                  animate={{ scale: 1, color: '#f8fafc' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className={cn(getDynamicTextSize(current), "font-black tracking-tighter text-center w-full flex flex-col items-center justify-center leading-[0.95]")}
                >
                  {formatNumberLines(current).map((line, i) => (
                    <span key={i} className="whitespace-nowrap">{line}</span>
                  ))}
                </motion.h1>
                <AnimatePresence>
                  {floatingText && (
                    <motion.div
                      key={floatingText.id}
                      initial={{ opacity: 0, y: 0, scale: floatingText.isPerfect ? 0.8 : 1 }}
                      animate={{ opacity: floatingText.isPerfect ? [0, 1, 0] : [0, 0.7, 0], y: floatingText.isPerfect ? -40 : -24, scale: floatingText.isPerfect ? 1.1 : 1 }}
                      transition={{ duration: floatingText.isPerfect ? 1.2 : 0.8, ease: "easeOut" }}
                      onAnimationComplete={() => setFloatingText(null)}
                      className="absolute left-0 right-0 -top-6 flex justify-center pointer-events-none z-10"
                    >
                      <span className={cn(
                        "whitespace-nowrap font-bold",
                        floatingText.isPerfect 
                          ? cn("text-3xl", theme.text, theme.dropShadow)
                          : cn("text-xl", theme.textHalf)
                      )}>
                        {floatingText.text}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
                {shakeKey > 0 && (
                  <motion.div
                    key={`shake-${shakeKey}`}
                    initial={{ opacity: 1, scale: 1 }}
                    animate={{ opacity: 0, scale: 1.5 }}
                    transition={{ duration: 0.3 }}
                    className={cn("absolute inset-0 flex flex-col items-center justify-center font-black tracking-tighter text-center text-red-500 pointer-events-none w-full px-2 leading-[0.95]", getDynamicTextSize(current))}
                  >
                    {formatNumberLines(current).map((line, i) => (
                      <span key={i} className="whitespace-nowrap">{line}</span>
                    ))}
                  </motion.div>
                )}
              </motion.div>
              <div className="mt-8 flex flex-col items-center justify-center gap-1 h-16 w-full max-w-[280px] rounded-2xl relative transition-all duration-1000">
                {tutorialRef.current && tutorialProgressRef.current === 1 && (
                  <>
                    <div className={cn("absolute inset-0 rounded-2xl ring-4 ring-offset-4 ring-offset-slate-950 animate-pulse pointer-events-none", theme.ring)} />
                    <div className="absolute -bottom-10 text-center w-full whitespace-nowrap">
                      <p className={cn("font-bold uppercase tracking-wider text-sm", theme.text)}>
                        Watch the mistakes you have left
                      </p>
                    </div>
                  </>
                )}
                {(() => {
                  const mistakesLeft = maxMistakes - mistakes;
                  const hasMistakes = mistakesLeft > 0;
                  const currentMinMoves = getMinimumMoves(current);
                  return (
                    <>
                      {hasMistakes ? (
                        <p className="font-bold text-xl flex items-center gap-2 text-slate-300 transition-colors duration-1000">
                          <span className={cn("transition-colors duration-1000", theme.text)}>
                            {mistakesLeft}
                          </span>{" "}
                          {mistakesLeft === 1 ? "Mistake" : "Mistakes"} Left
                        </p>
                      ) : (
                        <motion.p 
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                          className={cn("font-bold text-xl flex items-center gap-2 transition-colors duration-1000", theme.text)}
                        >
                          No Mistakes Left
                        </motion.p>
                      )}
                      <p className="text-sm text-slate-500 font-medium transition-colors duration-1000">
                        {currentMinMoves === -1 
                            ? "Impossible" 
                            : `Possible in ${currentMinMoves} divisions`}
                      </p>
                    </>
                  );
                })()}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="lost"
              initial={{ opacity: 0, scale: 0.9, filter: "blur(8px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex flex-col items-center w-full flex-1 justify-center py-6 relative"
            >
              {/* Center Content: Reached Level and Messages */}
              <div className="flex flex-col items-center justify-center text-center w-full mt-auto mb-auto relative z-10">
                <span className="text-slate-400 text-sm font-semibold tracking-[0.3em] uppercase mb-6">
                  Level Reached
                </span>
                <h3 className={cn("text-[9rem] font-black leading-none mb-8", getLevelColors(level, false).value)}>
                  {level}
                </h3>
                <h2 className="text-4xl font-bold text-white mb-3">
                  {getGameOverMessage(level).word}
                </h2>
                <p className="text-slate-400 text-lg max-w-[320px] leading-relaxed">
                  {getGameOverMessage(level).note}
                </p>
              </div>
              
              {/* Bottom Content: Out of Divisions UI */}
              <div className="flex flex-col items-center w-full max-w-sm mt-auto bg-red-950/40 p-6 rounded-[2rem] border border-red-900/50 backdrop-blur-md relative z-10">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h4 className="text-red-400 font-bold uppercase tracking-wider text-sm">
                    {lossReason === 'mistakes' ? 'Out of Mistakes' : 'Impossible State'}
                  </h4>
                </div>
                <p className="text-red-200/80 text-sm mb-6 text-center">
                  {lossReason === 'mistakes' 
                    ? "You've used all your allowed mistakes."
                    : "There are no valid divisions left to reach 1."}
                </p>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { 
                    playClick();
                    try {
                      ByteBrew.newCustomEvent('game_restarted', {
                        session_id: String(playSessionIdRef.current),
                        game_id: String(gameIdRef.current),
                        level: String(level),
                        method: 'button',
                        test_tag: 'test'
                      });
                    } catch (err) {
                      console.error(err);
                    }
                    if (tutorialRef.current) {
                      tutorialProgressRef.current = 0;
                      initGame(1, true);
                    } else {
                      tutorialRef.current = false;
                      if (level === 1) initGame(1, true);
                      else setLevel(1); 
                    }
                  }}
                  className="group w-full relative px-6 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-[0_4px_0_0_rgba(153,27,27,1)] hover:shadow-[0_4px_0_0_rgba(185,28,28,1)] active:shadow-none active:translate-y-1 transition-all"
                >
                  <RotateCcw size={20} className="group-hover:-rotate-180 transition-transform duration-500" />
                  Try Again
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Keypad */}
      {!isLost && (
        <div className="w-full mt-auto mb-8">
          <div className={cn("grid grid-cols-4 gap-4 p-4 rounded-3xl border backdrop-blur-sm transition-colors duration-1000", theme.keypadBg, theme.keypadBorder)}>
            {[2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <ActionButton
                key={num}
                number={num}
                onClick={handleDivide}
                disabled={isWon || isLost}
                isHinted={tutorialRef.current && bestMove === num}
                theme={theme}
              />
            ))}
          </div>
        </div>
      )}
        {/* Settings Modal Overlay */}
        <AnimatePresence>
          {isSettingsOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-[100] flex flex-col p-6 text-slate-100 rounded-[2.5rem]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-8 mt-2">
                <h3 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  <Settings className={theme.text} size={24} /> Settings
                </h3>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    playClick();
                    setIsSettingsOpen(false);
                  }}
                  className="p-2 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </motion.button>
              </div>

              {/* Modal Body / Settings List */}
              <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-1">
                {/* Sound Setting Group */}
                <div className="flex flex-col gap-3 p-4 bg-slate-900/50 rounded-2xl border border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-base text-slate-200">Sound Effects</h4>
                      <p className="text-xs text-slate-500">Enable in-game sounds & chimes</p>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={toggleMute}
                      className={cn(
                        "relative w-14 h-8 rounded-full p-1 transition-colors duration-300",
                        !muted ? "bg-emerald-500" : "bg-slate-700"
                      )}
                    >
                      <motion.div
                        className="w-6 h-6 rounded-full bg-white shadow-md"
                        animate={{ x: !muted ? 24 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    </motion.button>
                  </div>

                  {/* Volume Slider Row - only visible when sound is activated */}
                  <AnimatePresence initial={false}>
                    {!muted && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: "auto", marginTop: 4 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        className="overflow-hidden flex flex-col gap-2 border-t border-slate-800/60 pt-3 pb-1.5"
                      >
                        <div className="flex justify-between items-center text-xs text-slate-400 font-semibold px-0.5">
                          <span>Volume</span>
                          <span className="font-mono text-emerald-400">{Math.round(volume * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={volume}
                          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                          className="w-full h-6 bg-transparent appearance-none cursor-pointer outline-none focus:outline-none [&::-webkit-slider-runnable-track]:bg-slate-800 [&::-webkit-slider-runnable-track]:rounded-lg [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:mt-[-5px] [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110 [&::-moz-range-track]:bg-slate-800 [&::-moz-range-track]:rounded-lg [&::-moz-range-track]:h-1.5 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-emerald-500"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Haptics Setting Row */}
                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-800/80">
                  <div>
                    <h4 className="font-bold text-base text-slate-200">Haptic Feedback</h4>
                    <p className="text-xs text-slate-500">Vibration feedback on actions</p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleVibrate}
                    className={cn(
                      "relative w-14 h-8 rounded-full p-1 transition-colors duration-300",
                      vibrateEnabled ? "bg-emerald-500" : "bg-slate-700"
                    )}
                  >
                    <motion.div
                      className="w-6 h-6 rounded-full bg-white shadow-md"
                      animate={{ x: vibrateEnabled ? 24 : 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </motion.button>
                </div>

                {/* How To Play Card */}
                <div className="p-5 bg-slate-900/50 rounded-2xl border border-slate-800/80 flex flex-col gap-3">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <HelpCircle size={16} className={theme.text} /> How to Play
                  </h4>
                  <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                    <li>Divide the current number to reach exactly <strong className="text-white">1</strong>.</li>
                    <li>Choose divisors from <strong className="text-white">2 to 9</strong> on the keypad.</li>
                    <li>Do it within the allowed limit of total <strong className="text-white">divisions</strong>.</li>
                    <li>Avoid impossible states where no divisions remain.</li>
                  </ul>
                </div>

                {/* Game Reset options */}
                <div className="mt-auto pt-4 flex flex-col gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      playClick();
                      setIsSettingsOpen(false);
                      if (tutorialRef.current) {
                        tutorialProgressRef.current = 0;
                        initGame(1, true);
                      } else {
                        initGame(level, true);
                      }
                    }}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl font-bold text-sm transition-colors"
                  >
                    Restart Current Level
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      playClick();
                      setIsSettingsOpen(false);
                      tutorialRef.current = false;
                      setLevel(1);
                      initGame(1, true);
                    }}
                    className="w-full py-3 bg-red-950/40 hover:bg-red-900/40 border border-red-900/50 text-red-400 hover:text-red-300 rounded-xl font-bold text-sm transition-colors"
                  >
                    Reset Progress to Level 1
                  </motion.button>
                </div>
              </div>

              {/* Version info / humble signature */}
              <div className="text-center mt-6 text-[10px] text-slate-600 font-mono">
                v1.1.0 • DIVISIONS GAME
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      
      </div>
    </div>
  );
}
