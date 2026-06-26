import { useState, useRef, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Edit2, Play, Pause, Compass, Heart, GraduationCap, Gamepad2, Volume2, VolumeX } from 'lucide-react';

interface Anime {
  id: string;
  title: string;
  rating: string;
  genre: string;
}

export default function App() {
  const [videoPlaying, setVideoPlaying] = useState(true);
  const [activeTab, setActiveTab] = useState<'hobbies' | 'anime' | 'school' | 'game'>('hobbies');
  const [showAnimeModal, setShowAnimeModal] = useState(false);
  const [animeList, setAnimeList] = useState<Anime[]>(() => {
    const saved = localStorage.getItem('agar_anime_list');
    return saved ? JSON.parse(saved) : [
      { id: '1', title: 'solo leveling', rating: '10/10', genre: 'action / fantasy' },
      { id: '2', title: 'demon slayer', rating: '9.5/10', genre: 'shonen / action' },
      { id: '3', title: 'naruto shippuden', rating: '10/10', genre: 'adventure / classic' }
    ];
  });
  const [newTitle, setNewTitle] = useState('');
  const [newRating, setNewRating] = useState('10/10');
  const [newGenre, setNewGenre] = useState('');

  // Game States
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [shield, setShield] = useState(100);
  const [highScore, setHighScore] = useState(() => {
    return Number(localStorage.getItem('agar_game_highscore') || '0');
  });
  const [threats, setThreats] = useState<{ id: string; x: number; y: number; type: 'threat' | 'patch'; born: number }[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    localStorage.setItem('agar_anime_list', JSON.stringify(animeList));
  }, [animeList]);

  // Game Loop
  useEffect(() => {
    if (!gameStarted || activeTab !== 'game') {
      setThreats([]);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      
      // Remove stale threats and reduce shield for missed ones
      setThreats(prev => {
        let shieldDamage = 0;
        const kept = prev.filter(t => {
          const age = now - t.born;
          if (age > 2200) {
            if (t.type === 'threat') {
              shieldDamage += 15;
            }
            return false;
          }
          return true;
        });

        if (shieldDamage > 0) {
          setShield(s => {
            const nextShield = Math.max(0, s - shieldDamage);
            if (nextShield <= 0) {
              setGameStarted(false);
            }
            return nextShield;
          });
        }
        return kept;
      });

      // Spawn new item
      const rand = Math.random();
      const type = rand > 0.85 ? 'patch' : 'threat';
      const newItem = {
        id: Math.random().toString(),
        x: 10 + Math.random() * 80, // % from left
        y: 10 + Math.random() * 80, // % from top
        type: type as 'threat' | 'patch',
        born: now
      };

      setThreats(prev => [...prev, newItem]);
    }, 850);

    return () => clearInterval(interval);
  }, [gameStarted, activeTab]);

  // Update high score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('agar_game_highscore', score.toString());
    }
  }, [score, highScore]);

  const startGame = () => {
    setScore(0);
    setShield(100);
    setThreats([]);
    setGameStarted(true);
  };

  const handleThreatClick = (id: string, type: 'threat' | 'patch') => {
    if (!gameStarted) return;
    setThreats(prev => prev.filter(t => t.id !== id));
    if (type === 'threat') {
      setScore(s => s + 10);
    } else {
      setShield(s => Math.min(100, s + 20));
      setScore(s => s + 5);
    }
  };

  const toggleVideo = () => {
    if (videoRef.current) {
      if (videoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch((err) => console.log("video play failed: ", err));
      }
      setVideoPlaying(!videoPlaying);
    }
  };

  const handleAddAnime = (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const newAnime: Anime = {
      id: Date.now().toString(),
      title: newTitle.toLowerCase(),
      rating: newRating,
      genre: (newGenre || 'action').toLowerCase()
    };
    setAnimeList([...animeList, newAnime]);
    setNewTitle('');
    setNewGenre('');
  };

  const handleDeleteAnime = (id: string) => {
    setAnimeList(animeList.filter(item => item.id !== id));
  };

  // Content configuration for each tab
  const tabContent = {
    hobbies: {
      words: ["welcome", "to my", "hub"],
      desc: "чөлөөт цагаараа counter-strike 2 тоглож, найзуудтайгаа сагсан бөмбөг тоглож, мөн фикси дугуйгаа унадаг.",
      stats: {
        top: { val: "global", label: "cs2 цол" },
        left: { val: "fixed", label: "зуурах хурд" },
        right: { val: "street", label: "спорт хобби" }
      },
      icon: <Gamepad2 className="w-4 h-4 text-orange-400" />
    },
    anime: {
      words: ["anime", "otaku", "dreams"],
      desc: "чөлөөт цагаараа аниме үзэх дуртай. доорх аниме жагсаалт хэсгээс өөрийн дуртай цувралуудыг нэмж удирдах боломжтой.",
      stats: {
        top: { val: "solo", label: "сонирхогч" },
        left: { val: "+12", label: "үзсэн цуврал" },
        right: { val: "shonen", label: "үндсэн төрөл" }
      },
      icon: <Heart className="w-4 h-4 text-rose-400" />
    },
    school: {
      words: ["school", "number", "thirty-one"],
      desc: "би 31-р сургуульд сурдаг. энд миний сурлага хөдөлмөр, сургуулийн амьдрал болон өдөр тутмын тэмдэглэл бий.",
      stats: {
        top: { val: "no. 31", label: "ерөнхий боловсрол" },
        left: { val: "100%", label: "идэвх оролцоо" },
        right: { val: "ub", label: "улаанбаатар" }
      },
      icon: <GraduationCap className="w-4 h-4 text-cyan-400" />
    },
    game: {
      words: ["cyber", "defense", "game"],
      desc: "кибер аюулуудыг устгаж өгөгдлөө хамгаалаарай. улаан цэгийг устгавал оноо авч, цэнхэр цэг хамгаалалтыг сэргээнэ.",
      stats: {
        top: { val: `${score} pts`, label: "оноо" },
        left: { val: `${shield}%`, label: "хамгаалалт" },
        right: { val: `${highScore}`, label: "дээд оноо" }
      },
      icon: <Gamepad2 className="w-4 h-4 text-emerald-400" />
    }
  };

  const current = tabContent[activeTab];

  return (
    <section className="relative h-screen w-full overflow-hidden bg-black select-none">
      {/* Background video */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover opacity-60 md:opacity-70 transition-opacity duration-1000"
        autoPlay
        loop
        muted
        playsInline
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_063509_7d167302-4fd4-480b-8260-18ab572333d4.mp4"
      />

      {/* Cyberpunk grid overlay & gradient to give premium asset vibe */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="absolute inset-0 bg-radial-at-c from-transparent via-black/30 to-black/90 pointer-events-none" />

      {/* Floating pill-shaped Navbar */}
      <header className="absolute z-20 px-6 md:px-10 pt-6 top-0 left-0 right-0">
        <nav className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
          {/* Left pill (Securify Logo transformed to Agar's Dev Hub) */}
          <div className="flex items-center gap-2 bg-neutral-950/80 backdrop-blur rounded-full pl-4 pr-5 py-2.5 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <svg
              viewBox="0 0 256 256"
              className="h-5 w-5 animate-pulse"
              fill="#ffffff"
            >
              <path d="M 128 192 L 128 256 L 64.5 256 L 32 223 L 0 192 L 0 128 L 64 128 Z M 256 192 L 256 256 L 192.5 256 L 160 223 L 128 192 L 128 128 L 192 128 Z M 128 64 L 128 128 L 64.5 128 L 32 95 L 0 64 L 0 0 L 64 0 Z M 256 64 L 256 128 L 192.5 128 L 160 95 L 128 64 L 128 0 L 192 0 Z" />
            </svg>
            <span className="text-white text-sm font-semibold tracking-wide">securify</span>
          </div>

          {/* Center pill (Dynamic Interactive Tabs for E.Agar) */}
          <div className="bg-neutral-950/80 backdrop-blur rounded-full p-1.5 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex items-center gap-0.5">
            {(['hobbies', 'anime', 'school', 'game'] as const).map((tab) => {
              const isActive = activeTab === tab;
              const mongolianLabels = {
                hobbies: 'хобби',
                anime: 'аниме',
                school: 'сургууль',
                game: 'тоглоом'
              };
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative text-xs md:text-sm font-medium px-4 py-2 rounded-full transition-all cursor-pointer ${
                    isActive ? 'text-black' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 bg-white rounded-full -z-10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="flex items-center gap-1.5">
                    {isActive && tabContent[tab].icon}
                    {mongolianLabels[tab]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Action Button (Interactive Contact Option) */}
          <button 
            onClick={() => window.location.href = "mailto:agarenkhbold999@gmail.com"}
            className="hidden sm:block bg-white text-black text-sm font-medium rounded-full px-6 py-2.5 hover:bg-neutral-200 active:scale-95 transition-all cursor-pointer border border-white/20 shadow-md"
          >
            холбогдох
          </button>
        </nav>
      </header>

      {/* Foreground Content Wrapper with dynamic animations */}
      <div className="relative h-full w-full max-w-7xl mx-auto z-10 pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            {/* Three giant staggered headline words */}
            <h1 className="hero-title absolute text-white font-medium text-[14vw] md:text-[13vw] left-4 md:left-10 top-[18%] select-none tracking-tighter filter drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
              {current.words[0]}
            </h1>

            <h1 className="hero-title absolute text-white font-medium text-[14vw] md:text-[13vw] right-4 md:right-10 top-[38%] select-none tracking-tighter text-right filter drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
              {current.words[1]}
            </h1>

            <h1 className="hero-title absolute text-white font-medium text-[14vw] md:text-[13vw] left-[18%] md:left-[28%] top-[58%] select-none tracking-tighter filter drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
              {current.words[2]}
            </h1>

            {/* Description paragraph */}
            <div className="absolute left-6 md:left-10 top-[46%] max-w-[280px] select-none pointer-events-auto">
              <p className="text-[14px] md:text-[15px] leading-relaxed text-white/95 font-light">
                {current.desc}
              </p>
              {activeTab === 'anime' && (
                <button
                  onClick={() => setShowAnimeModal(true)}
                  className="mt-4 flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-4 py-2 rounded-full backdrop-blur border border-white/10 transition-all cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  жагсаалт харах / нэмэх
                </button>
              )}
            </div>

            {/* Cyber Defense Game Widget */}
            {activeTab === 'game' && (
              <div className="absolute right-4 md:right-12 top-[54%] md:top-[30%] w-[calc(100%-2rem)] md:w-[380px] h-[280px] md:h-[320px] bg-neutral-950/90 backdrop-blur-md rounded-2xl border border-white/10 p-4 flex flex-col pointer-events-auto shadow-2xl select-none">
                {!gameStarted ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="p-3 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-emerald-400">
                      <Gamepad2 className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium text-sm">cyber data defense</h4>
                      <p className="text-xs text-neutral-400 mt-1 max-w-[280px]">
                        систем рүү дайрч буй улаан цэгүүдийг устгаж өгөгдлөө хамгаалаарай! цэнхэр цэг нь хамгаалалтыг сэргээнэ.
                      </p>
                    </div>
                    <button
                      onClick={startGame}
                      className="bg-white text-black hover:bg-neutral-200 text-xs font-semibold px-6 py-2.5 rounded-full transition-colors active:scale-95 cursor-pointer"
                    >
                      тоглох
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col">
                    {/* Game Header stats */}
                    <div className="flex justify-between items-center pb-2 border-b border-white/5 text-xs text-white/60">
                      <span>оноо: <strong className="text-emerald-400">{score}</strong></span>
                      <div className="flex items-center gap-2">
                        <span>хамгаалалт:</span>
                        <div className="w-16 h-2 bg-neutral-900 rounded-full overflow-hidden border border-white/5">
                          <div 
                            className={`h-full transition-all duration-300 ${shield > 40 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                            style={{ width: `${shield}%` }}
                          />
                        </div>
                        <span className={shield > 40 ? 'text-emerald-400' : 'text-rose-400'}>{shield}%</span>
                      </div>
                    </div>

                    {/* Game Arena bounds */}
                    <div className="flex-1 relative overflow-hidden bg-neutral-900/50 rounded-xl border border-white/5 mt-2">
                      <AnimatePresence>
                        {threats.map((threat) => (
                          <motion.button
                            key={threat.id}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            onClick={() => handleThreatClick(threat.id, threat.type)}
                            className={`absolute -translate-x-1/2 -translate-y-1/2 p-3.5 rounded-full transition-all flex items-center justify-center cursor-pointer active:scale-90 ${
                              threat.type === 'threat' 
                                ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
                                : 'bg-cyan-500 hover:bg-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                            }`}
                            style={{ left: `${threat.x}%`, top: `${threat.y}%` }}
                          >
                            <span className="absolute w-2 h-2 bg-white rounded-full animate-ping" />
                          </motion.button>
                        ))}
                      </AnimatePresence>
                      {threats.length === 0 && (
                        <p className="absolute inset-0 flex items-center justify-center text-[11px] text-white/20">
                          систем аюулгүй байна...
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Stat block — top-right */}
            <div className="absolute right-6 md:right-24 top-[14%] text-right select-none pointer-events-auto">
              <div className="flex items-center gap-3 justify-end">
                <div className="hidden md:block h-px w-24 bg-white/40 rotate-[20deg]" />
                <span className="text-4xl md:text-5xl font-medium tracking-tight text-white">{current.stats.top.val}</span>
              </div>
              <p className="text-xs md:text-sm text-white/70 mt-1 text-right">{current.stats.top.label}</p>
            </div>

            {/* Stat block — bottom-left */}
            <div className="absolute left-6 md:left-20 bottom-20 md:bottom-24 text-left select-none pointer-events-auto">
              <div className="flex items-center gap-3">
                <span className="text-4xl md:text-5xl font-medium tracking-tight text-white">{current.stats.left.val}</span>
                <div className="hidden md:block h-px w-24 bg-white/40 rotate-[-20deg]" />
              </div>
              <p className="text-xs md:text-sm text-white/70 mt-1">{current.stats.left.label}</p>
            </div>

            {/* Stat block — bottom-right */}
            <div className="absolute right-6 md:right-20 bottom-16 md:bottom-20 text-right select-none pointer-events-auto">
              <div className="flex items-center gap-3 justify-end">
                <div className="hidden md:block h-px w-24 bg-white/40 rotate-[-20deg]" />
                <span className="text-4xl md:text-5xl font-medium tracking-tight text-white">{current.stats.right.val}</span>
              </div>
              <p className="text-xs md:text-sm text-white/70 mt-1 text-right">{current.stats.right.label}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Interactive Anime List Modal Drawer */}
      <AnimatePresence>
        {showAnimeModal && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-30 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-neutral-900 border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium text-lg">миний аниме жагсаалт</h3>
                  <p className="text-xs text-white/50">агарын хамгийн дуртай цувралууд</p>
                </div>
                <button
                  onClick={() => setShowAnimeModal(false)}
                  className="text-white/60 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors cursor-pointer"
                >
                  хаах
                </button>
              </div>

              {/* Anime List */}
              <div className="p-6 overflow-y-auto space-y-3 flex-1">
                {animeList.length === 0 ? (
                  <p className="text-center text-white/40 text-sm py-8">жагсаалт хоосон байна</p>
                ) : (
                  animeList.map((anime) => (
                    <div
                      key={anime.id}
                      className="bg-white/5 border border-white/5 p-3 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-colors group"
                    >
                      <div>
                        <h4 className="text-white text-sm font-medium capitalize">{anime.title}</h4>
                        <p className="text-[11px] text-white/40 tracking-wider">{anime.genre}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold px-2 py-1 bg-white/10 text-white rounded-lg">
                          {anime.rating}
                        </span>
                        <button
                          onClick={() => handleDeleteAnime(anime.id)}
                          className="text-neutral-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add New Anime Form */}
              <form onSubmit={handleAddAnime} className="p-6 border-t border-white/5 bg-neutral-950/40 space-y-3">
                <h4 className="text-xs font-semibold text-white/60 tracking-widest">шинэ аниме нэмэх</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="аниме нэр..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="bg-neutral-950 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 flex-1 focus:outline-none focus:border-white/30 transition-colors"
                  />
                  <input
                    type="text"
                    placeholder="төрөл (жишээ нь: action)"
                    value={newGenre}
                    onChange={(e) => setNewGenre(e.target.value)}
                    className="bg-neutral-950 border border-white/10 text-white text-sm rounded-xl px-3 py-2.5 w-1/3 focus:outline-none focus:border-white/30 transition-colors"
                  />
                </div>
                <div className="flex items-center justify-between gap-4 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/50">үнэлгээ:</span>
                    <select
                      value={newRating}
                      onChange={(e) => setNewRating(e.target.value)}
                      className="bg-neutral-950 border border-white/10 text-white text-xs rounded-lg px-2 py-1 focus:outline-none"
                    >
                      {["10/10", "9.5/10", "9/10", "8.5/10", "8/10", "7.5/10"].map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="bg-white hover:bg-neutral-200 text-black text-xs font-medium px-4 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    жагсаалтад нэмэх
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating control widget */}
      <div className="absolute bottom-6 left-6 right-6 z-20 flex items-center justify-between pointer-events-none">
        {/* Custom audio visualizer track vibe on left */}
        <div className="flex items-center gap-2 bg-neutral-950/80 backdrop-blur px-4 py-2 rounded-full border border-white/10 pointer-events-auto">
          <div className="flex items-end gap-0.5 h-3">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  height: videoPlaying ? ["4px", "12px", "4px"] : "4px"
                }}
                transition={{
                  duration: 0.8 + i * 0.1,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-0.5 bg-white/60 rounded-full"
              />
            ))}
          </div>
          <span className="text-[10px] text-white/50 font-mono tracking-wider">
            {activeTab === 'hobbies' ? 'cs2_ambient.mp3' : 'agar_vibe_track.flac'}
          </span>
        </div>

        {/* Video Control on right */}
        <button
          onClick={toggleVideo}
          className="bg-neutral-950/80 hover:bg-neutral-800 text-white/80 hover:text-white text-xs px-3.5 py-2 rounded-full border border-white/10 backdrop-blur transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 pointer-events-auto shadow-md"
          title={videoPlaying ? "pause video" : "play video"}
        >
          <span className="relative flex h-2 w-2">
            {videoPlaying && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${videoPlaying ? 'bg-emerald-500' : 'bg-white/40'}`}></span>
          </span>
          <span className="text-[11px] font-medium tracking-wide">
            {videoPlaying ? "видео: идэвхтэй" : "видео: зогссон"}
          </span>
        </button>
      </div>

      {/* Bottom gradient overlay */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-b from-transparent to-black" />
    </section>
  );
}

