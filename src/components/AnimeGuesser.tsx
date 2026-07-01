import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Trophy, Timer, Volume2, VolumeX, Flame, RotateCcw, Play, CheckCircle, XCircle, Film } from 'lucide-react';
import animeQuestionsData from '../data.json';

interface AnimeQuestion {
  id: number;
  emojis: string;
  answer: string;
  options: string[];
  image: string;
  video: string;
}

const animeQuestions = animeQuestionsData as AnimeQuestion[];

export default function AnimeGuesser({ onClose }: { onClose?: () => void }) {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'reveal' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return Number(localStorage.getItem('agar_anime_highscore') || '0');
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timer, setTimer] = useState(15);
  const [lives, setLives] = useState(3);
  const [streak, setStreak] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answeredCorrectly, setAnsweredCorrectly] = useState<boolean | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const bgmRef = useRef<NodeJS.Timeout | null>(null);

  // Background Music (BGM) Sequencer using Web Audio API
  useEffect(() => {
    if (!soundEnabled || (gameState !== 'playing' && gameState !== 'start')) {
      if (bgmRef.current) {
        clearInterval(bgmRef.current);
        bgmRef.current = null;
      }
      return;
    }

    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    // Chords: Am, G, F, E (8-bit style chiptune chord progression)
    const chords = [
      [220.00, 261.63, 329.63], // Am (A3, C4, E4)
      [196.00, 246.94, 293.66], // G (G3, B3, D4)
      [174.61, 220.00, 261.63], // F (F3, A3, C4)
      [164.81, 207.65, 246.94], // E (E3, G#3, B3)
    ];

    let beat = 0;

    const playStep = () => {
      try {
        const ctx = new AudioContext();
        if (ctx.state === 'suspended') {
          return; // Wait for user interaction
        }
        
        const chordIndex = Math.floor(beat / 4) % chords.length;
        const noteIndex = beat % 4;
        const noteFreq = chords[chordIndex][noteIndex % chords[chordIndex].length];

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // 8-bit retro gaming triangle oscillator
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(noteFreq, ctx.currentTime);

        // Very quiet unobtrusive background music
        gain.gain.setValueAtTime(0.015, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);

        beat++;
      } catch (e) {
        // Suppress errors if context fails to start
      }
    };

    // Slow pleasant chiptune arpeggio (BPM ~133)
    bgmRef.current = setInterval(playStep, 450);

    return () => {
      if (bgmRef.current) {
        clearInterval(bgmRef.current);
        bgmRef.current = null;
      }
    };
  }, [soundEnabled, gameState]);

  // Sound Synthesizer via Web Audio API (No files required!)
  const playSound = (type: 'ding' | 'buzz' | 'bonus' | 'gameover' | 'click' | 'tick' | 'start') => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      if (type === 'ding') {
        // Ding sound: crystal high bell decay
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === 'buzz') {
        // Buzz sound: retro heavy vibrating crash
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(130, ctx.currentTime); // Low Bb2
        osc.frequency.linearRampToValueAtTime(85, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'bonus') {
        // Uplifting energetic sound for streak bonus!
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc1.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        osc1.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
        osc1.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.3); // C6

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1046.50, ctx.currentTime);
        
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        
        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.6);
        osc2.stop(ctx.currentTime + 0.6);
      } else if (type === 'gameover') {
        // Melancholic descending tone for gameover
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
        osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.8); // A2
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.8);
      } else if (type === 'tick') {
        // Timer tick sound: high short blip
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.04);
      } else if (type === 'click') {
        // Click sound: satisfying digital button sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'start') {
        // Start game melody: upbeat ascending arpeggio
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(329.63, ctx.currentTime); // E4
        osc.frequency.setValueAtTime(440.00, ctx.currentTime + 0.08); // A4
        osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.16); // C#5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.24); // E5
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      console.warn('AudioContext not supported or restricted by user gesture', e);
    }
  };

  // Timer Countdown Effect
  useEffect(() => {
    if (gameState !== 'playing') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setTimer(15);

    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        // Play blip tick sound in the final 5 seconds
        if (prev <= 6) {
          playSound('tick');
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, currentIndex]);

  const handleTimeout = () => {
    playSound('buzz');
    setAnsweredCorrectly(false);
    setSelectedOption(null);
    setStreak(0);
    
    const nextLives = lives - 1;
    setLives(nextLives);
    
    setGameState('reveal');
  };

  const handleAnswer = (option: string) => {
    if (gameState !== 'playing') return;
    playSound('click');
    if (timerRef.current) clearInterval(timerRef.current);

    const question = animeQuestions[currentIndex];
    const isCorrect = option === question.answer;

    setSelectedOption(option);
    setAnsweredCorrectly(isCorrect);

    if (isCorrect) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      
      let pointsToAdd = 10;
      let hitBonus = false;

      // Bonus rule: every 3 consecutive correct answers gives +20 points bonus
      if (nextStreak > 0 && nextStreak % 3 === 0) {
        pointsToAdd += 20;
        hitBonus = true;
      }

      if (hitBonus) {
        playSound('bonus');
      } else {
        playSound('ding');
      }

      setScore((prev) => {
        const nextScore = prev + pointsToAdd;
        if (nextScore > highScore) {
          setHighScore(nextScore);
          localStorage.setItem('agar_anime_highscore', nextScore.toString());
          setIsNewHighScore(true);
        }
        return nextScore;
      });
    } else {
      playSound('buzz');
      setStreak(0);
      const nextLives = lives - 1;
      setLives(nextLives);
    }

    setTimeout(() => {
      setGameState('reveal');
    }, 1200);
  };

  const handleNext = () => {
    playSound('click');
    if (lives <= 0) {
      playSound('gameover');
      setGameState('gameover');
      return;
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex >= animeQuestions.length) {
      playSound('gameover');
      setGameState('gameover');
    } else {
      setCurrentIndex(nextIndex);
      setSelectedOption(null);
      setAnsweredCorrectly(null);
      setGameState('playing');
    }
  };

  const startGame = () => {
    playSound('start');
    setScore(0);
    setCurrentIndex(0);
    setLives(3);
    setStreak(0);
    setSelectedOption(null);
    setAnsweredCorrectly(null);
    setIsNewHighScore(false);
    setGameState('playing');
  };

  const getRank = (finalScore: number) => {
    if (finalScore >= 120) return { title: 'Аниме Хаан! 👑', desc: 'Ертөнцийг аврагч дээд отаку!' };
    if (finalScore >= 80) return { title: 'Ахлах Отаку! 🌟', desc: 'Бараг л бүгдийг нь мэддэг юм байна!' };
    if (finalScore >= 40) return { title: 'Аниме сонирхогч 🌱', desc: 'Урагшаа, улам олон цуврал үзээрэй!' };
    return { title: 'Шинэхэн гишүүн 🍀', desc: 'Анимегийн сонирхолтой ертөнцөд тавтай морил!' };
  };

  const currentQuestion = animeQuestions[currentIndex];

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden">
      {/* Top Header Actions */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between">
        {onClose ? (
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-white/60 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer border border-white/5 active:scale-95 text-xs font-semibold"
          >
            ← Буцах
          </button>
        ) : <div />}

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="text-white/40 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer border border-white/5 active:scale-95"
          title={soundEnabled ? "Дуу хаах" : "Дуу нээх"}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-rose-400" /> : <VolumeX className="w-4 h-4 text-white/30" />}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* START SCREEN */}
        {gameState === 'start' && (
          <motion.div
            key="start"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col items-center justify-between py-2 text-center"
          >
            <div className="space-y-3 mt-4">
              <div className="w-14 h-14 bg-rose-500/10 rounded-2xl border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto shadow-[0_0_15px_rgba(244,63,94,0.2)]">
                <Heart className="w-7 h-7 animate-pulse" />
              </div>
              <div>
                <h4 className="text-white font-bold text-base tracking-wide uppercase">Anime Guesser 💮</h4>
                <p className="text-[10px] text-white/40 mt-0.5">Эможигоор аниме таах хөгжөөнт тоглоом</p>
              </div>
            </div>

            {/* Rules Brief Card */}
            <div className="w-full max-w-[320px] bg-white/5 border border-white/5 rounded-2xl p-3.5 space-y-2 text-left text-[11px] text-white/80">
              <div className="flex items-center gap-2">
                <Timer className="w-3.5 h-3.5 text-cyan-400" />
                <span>⏱️ <strong>Хугацаа:</strong> Асуулт бүрт 15 секунд</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-500/20" />
                <span>❤️ <strong>Амь:</strong> 3 амьтай (3 буруу бол дуусна)</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>⭐ <strong>Оноо:</strong> Зөв таавал +10 оноо</span>
              </div>
              <div className="flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span>🔥 <strong>Бонус:</strong> Дараалан 3 зөв бол +20 оноо</span>
              </div>
            </div>

            {/* Highscore & Action Button */}
            <div className="space-y-4 w-full px-4 mb-2">
              {highScore > 0 && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-amber-400/90 font-medium">
                  <Trophy className="w-4 h-4 text-amber-400 animate-bounce" />
                  <span>Дээд оноо: <strong>{highScore}</strong></span>
                </div>
              )}
              <button
                onClick={startGame}
                className="w-full bg-white hover:bg-neutral-200 text-black text-xs font-semibold py-3 rounded-xl transition-all active:scale-95 cursor-pointer shadow-[0_8px_20px_rgba(255,255,255,0.1)] flex items-center justify-center gap-1.5 group"
              >
                <Play className="w-3.5 h-3.5 fill-black group-hover:scale-110 transition-transform" />
                Тоглоомыг эхлүүлэх
              </button>
            </div>
          </motion.div>
        )}

        {/* PLAYING SCREEN */}
        {gameState === 'playing' && currentQuestion && (
          <motion.div
            key={`playing-${currentIndex}`}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col justify-between"
          >
            {/* Top Stat Header */}
            <div className="flex justify-between items-center text-xs pb-2 border-b border-white/5 text-white/70">
              <div className="flex items-center gap-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Heart
                    key={i}
                    className={`w-4 h-4 transition-all ${
                      i < lives ? 'text-rose-500 fill-rose-500/30 scale-100' : 'text-neutral-700 scale-90'
                    }`}
                  />
                ))}
              </div>

              {/* Score & Streak */}
              <div className="flex items-center gap-2.5">
                <span className="bg-white/5 px-2 py-0.5 rounded-full border border-white/5 text-[10px]">
                  Оноо: <strong className="text-white">{score}</strong>
                </span>
                {streak > 0 && (
                  <span className="flex items-center gap-0.5 text-orange-400 font-semibold text-[10px] bg-orange-500/10 px-1.5 py-0.5 rounded-md border border-orange-500/20 animate-pulse">
                    <Flame className="w-3 h-3 fill-orange-400" />
                    {streak} дараалсан
                  </span>
                )}
              </div>
            </div>

            {/* Timer visual bar and count */}
            <div className="space-y-1 py-1.5">
              <div className="flex justify-between text-[10px] text-white/50">
                <span>Асуулт {currentIndex + 1}/10</span>
                <span className={`flex items-center gap-1 ${timer <= 5 ? 'text-rose-400 font-bold animate-pulse' : 'text-cyan-400'}`}>
                  <Timer className="w-3 h-3" />
                  {timer} сек
                </span>
              </div>
              <div className="w-full h-1 bg-neutral-900 rounded-full overflow-hidden border border-white/5">
                <motion.div
                  className={`h-full ${timer <= 5 ? 'bg-rose-500' : timer <= 10 ? 'bg-amber-400' : 'bg-cyan-500'}`}
                  initial={{ width: '100%' }}
                  animate={{ width: `${(timer / 15) * 100}%` }}
                  transition={{ duration: 1, ease: 'linear' }}
                />
              </div>
            </div>

            {/* Clue Stage (Emojis + Trailer Video) */}
            <div className="flex-1 grid grid-cols-5 gap-4 my-3 h-[220px] md:h-[310px]">
              {/* Emoji Clue Box */}
              <div className="col-span-2 flex flex-col items-center justify-center bg-white/[0.02] border border-white/5 rounded-2xl relative group overflow-hidden">
                <div className="absolute inset-0 bg-radial-gradient from-white/[0.04] to-transparent pointer-events-none" />
                <span className="text-[10px] text-white/30 tracking-widest uppercase mb-2">асуултын эможи</span>
                <motion.span
                  animate={{
                    y: [0, -6, 0],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="text-4xl md:text-5xl filter drop-shadow-[0_4px_16px_rgba(255,255,255,0.15)] select-text selection:bg-rose-500/30"
                >
                  {currentQuestion.emojis}
                </motion.span>
              </div>

              {/* Image Poster Clue (Zoom-cropped to hide top/bottom text spoilers) */}
              <div className="col-span-3 rounded-2xl overflow-hidden border border-white/10 bg-neutral-900 flex flex-col relative group">
                <img
                  src={currentQuestion.image}
                  alt="Anime Hint"
                  referrerPolicy="no-referrer"
                  className="absolute inset-x-0 top-1/2 -translate-y-1/2 w-full h-[185%] object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-2 left-2 z-10 bg-black/60 backdrop-blur-sm rounded-md px-2 py-1 text-[9px] text-white/80 flex items-center gap-1.5">
                  <Film className="w-3 h-3 text-rose-400" />
                  <span>Анимэ зураг</span>
                </div>
              </div>
            </div>

            {/* Options grid */}
            <div className="grid grid-cols-2 gap-3 mt-3">
              {currentQuestion.options.map((option) => {
                const isSelected = selectedOption === option;
                const isCorrect = option === currentQuestion.answer;
                const hasAnswered = selectedOption !== null;

                let btnStyle = "bg-neutral-900 border-white/10 text-white hover:bg-neutral-800 hover:border-white/30 hover:shadow-[0_0_15px_rgba(255,255,255,0.08)] hover:scale-[1.03]";

                if (hasAnswered) {
                  if (isCorrect) {
                    btnStyle = "bg-emerald-600 border-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.45)]";
                  } else if (isSelected) {
                    btnStyle = "bg-rose-600 border-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.45)]";
                  } else {
                    btnStyle = "bg-neutral-950/40 border-white/5 text-white/30 opacity-40 cursor-not-allowed";
                  }
                }

                return (
                  <motion.button
                    key={option}
                    disabled={hasAnswered}
                    onClick={() => handleAnswer(option)}
                    animate={hasAnswered && isSelected && !isCorrect ? {
                      x: [0, -6, 6, -6, 6, 0]
                    } : {}}
                    transition={{ duration: 0.4 }}
                    className={`${btnStyle} border rounded-2xl py-4 px-3 text-sm md:text-base font-semibold text-center transition-all active:scale-95 cursor-pointer break-words`}
                  >
                    {option}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* REVEAL SCREEN */}
        {gameState === 'reveal' && currentQuestion && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex-1 flex flex-col justify-between"
          >
            {/* Answer feedback title */}
            <div className="text-center pb-2 border-b border-white/5">
              {selectedOption === null ? (
                <div className="flex items-center justify-center gap-1.5 text-rose-400 font-bold text-sm">
                  <XCircle className="w-4 h-4 animate-bounce" />
                  <span>Хугацаа дууслаа! ⏰</span>
                </div>
              ) : answeredCorrectly ? (
                <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold text-sm">
                  <CheckCircle className="w-4 h-4 animate-bounce" />
                  <span>Зөв хариуллаа! +10 оноо 🎉</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1.5 text-rose-400 font-bold text-sm">
                  <XCircle className="w-4 h-4 animate-shake" />
                  <span>Буруу хариуллаа! ❌</span>
                </div>
              )}
              <p className="text-[10px] text-white/50 mt-0.5">Зөв хариулт: <strong className="text-white">{currentQuestion.answer}</strong></p>
            </div>

            {/* Media Show Area (Image Poster + YouTube Clip) */}
            <div className="flex-1 grid grid-cols-5 gap-4 my-4 h-[220px] md:h-[310px]">
              {/* Image Poster */}
              <div className="col-span-2 rounded-2xl overflow-hidden border border-white/10 relative bg-neutral-900 group">
                <img
                  src={currentQuestion.image}
                  alt={currentQuestion.answer}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                  <span className="text-[11px] font-bold text-white tracking-wide truncate w-full">{currentQuestion.answer}</span>
                </div>
              </div>

              {/* YouTube Iframe Embed Video */}
              <div className="col-span-3 rounded-2xl overflow-hidden border border-white/10 bg-black flex flex-col relative">
                <div className="absolute top-2 left-2 z-10 bg-black/60 backdrop-blur-sm rounded-md px-2 py-1 text-[9px] text-white/80 flex items-center gap-1.5">
                  <Film className="w-3 h-3 text-rose-400" />
                  <span>Трэйлер үзэх</span>
                </div>
                <iframe
                  title="Anime Trailer"
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${currentQuestion.video}?autoplay=1&mute=${soundEnabled ? 0 : 1}&controls=0&modestbranding=1&playsinline=1&enablejsapi=1`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  style={{ border: 0 }}
                />
              </div>
            </div>

            {/* Streak Bonus feedback overlay if applicable */}
            {answeredCorrectly && streak > 0 && streak % 3 === 0 && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-rose-500/20 border border-amber-500/30 rounded-xl p-2 text-center text-[11px] text-amber-300 font-medium mb-2 animate-pulse"
              >
                🔥 ГАЙХАЛТАЙ! 3 дараалсан зөв хариултад <strong>+20 БОНУС</strong> оноо нэмэгдлээ!
              </motion.div>
            )}

            {/* Next Action Button */}
            <button
              onClick={handleNext}
              className="w-full bg-white hover:bg-neutral-200 text-black text-xs font-semibold py-3 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1"
            >
              <span>{lives <= 0 ? 'Үр дүнг харах' : 'Дараагийн асуулт'}</span>
              <span>➔</span>
            </button>
          </motion.div>
        )}

        {/* GAME OVER SCREEN */}
        {gameState === 'gameover' && (
          <motion.div
            key="gameover"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col items-center justify-between py-2 text-center"
          >
            <div className="space-y-3 mt-4">
              <div className="w-14 h-14 bg-amber-500/10 rounded-2xl border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-bounce">
                <Trophy className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm md:text-base uppercase tracking-wider">Тоглоом дууслаа! 🎮</h4>
                <p className="text-[10px] text-white/40 mt-0.5">таны аниме мэдлэгийн сорилтын дүн</p>
              </div>
            </div>

            {/* Rank and Performance Card */}
            <div className="w-full max-w-[320px] bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3 text-center">
              <div>
                <p className="text-xs text-white/40">Таны авсан оноо</p>
                <h3 className="text-white font-black text-3xl tracking-tight mt-1">{score} <span className="text-xs text-white/60 font-medium">оноо</span></h3>
              </div>

              {isNewHighScore && (
                <div className="inline-flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full animate-pulse mx-auto">
                  🏆 ШИНЭ ДЭЭД ОНОО! 🏆
                </div>
              )}

              <div className="pt-2 border-t border-white/5">
                <h5 className="text-rose-400 font-bold text-xs">{getRank(score).title}</h5>
                <p className="text-[10px] text-white/50 mt-0.5">{getRank(score).desc}</p>
              </div>
            </div>

            {/* Replay action */}
            <button
              onClick={startGame}
              className="w-full max-w-[320px] bg-white hover:bg-neutral-200 text-black text-xs font-semibold py-3 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 mb-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Дахин тоглох
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
