import React, { useState, useEffect, useRef } from "react";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  Sliders, 
  Sparkles, 
  Radio, 
  Music, 
  Disc, 
  Flame, 
  Settings2, 
  HelpCircle, 
  Terminal, 
  Send,
  Loader2,
  Tv,
  Info,
  User,
  Heart,
  LogIn,
  LogOut,
  Share2,
  Clipboard,
  Check,
  SendHorizontal
} from "lucide-react";
import { Track, TrackLine, MixerSettings, VocalStyleCategory } from "./types";
import { SitamoniAudioEngine } from "./utils/audioEngine";
import { formatLyrics, EXPORT_PLATFORMS, ExportPlatform, getEnglishGenreTags, getEnglishEffect } from "./utils/lyricFormatter";
import { FolkInstrumentsMuseum } from "./components/FolkInstrumentsMuseum";

// Firebase and Google Workspace integrations (Enterprise PRO suite)
import { 
  googleSignIn, 
  googleSignOut, 
  initAuthListener, 
  syncTrackToCloud, 
  fetchCloudTracks, 
  ensureUserProfile, 
  toggleCloudFavorite 
} from "./utils/firebaseService";
import { GoogleProductionHub } from "./components/GoogleProductionHub";
import { GoogleContactInfo } from "./utils/googleWorkspace";


// Utility to parse and display bracket directions stylishly
const renderHighlightedLine = (lineText: string) => {
  if (!lineText.trim()) return <div className="h-2" />;
  const parts = lineText.split(/(\[[^\]]+\])/g);
  return (
    <div className="py-0.5 leading-relaxed text-[11px] font-mono whitespace-pre-wrap select-text text-right">
      {parts.map((part, index) => {
        if (part.startsWith('[') && part.endsWith(']')) {
          return (
            <span key={index} className="text-[#00F0FF] bg-[#00F0FF]/15 border border-[#00F0FF]/30 px-1.5 py-0.5 rounded font-black text-[9px] inline-block mx-1 font-mono hover:bg-[#00F0FF]/25 transition-all" dir="ltr">
              {part}
            </span>
          );
        }
        return <span key={index} className="text-zinc-350">{part}</span>;
      })}
    </div>
  );
};

// Initial Mixer settings fitting the Shaabi signature
const INITIAL_MIXER: MixerSettings = {
  masterVol: 0.85,
  synthVol: 0.7,
  beatVol: 0.8,
  tablaVol: 0.75,
  vocalVol: 0.9,
  vocalSpeechRate: 0.2, // Maps to normal speed
  vocalPitch: 1.05,     // Slight high pitch autotune feel
  reverbActive: true,
  mufflerActive: false
};

// Quick prompt presets based on styles
const PROMPT_PRESETS = [
  { label: "مهرجان الأندال وغدر الكبار", text: "مهرجان سريع عن غدر الصحاب والأصدقاء المزيفين في أزقة القاهرة الشعبية", style: "Mahraganat" },
  { label: "قصة الغريب وصبر الحارة", text: "موال حكايات حزين مفعم بالحكمة عن صبر ابن البلد الطيب الغريب", style: "Shaabi" },
  { label: "سلطنة الليل ودفا الناي في شبرا", text: "موال صوفي هادئ عن الرضا وتجليات الليل مع تقسيم عود نقي حزين", style: "Tarab" },
  { label: "أشواق كوزميك في ممر دجلة", text: "أغنية بوب فيوجن هادئة عن الحب وضي القمر في الممرات العتيقة", style: "Modern Pop" }
];

// Shaabi organic keyboard layout
const KEYBOARD_KEYS = [
  { note: "A3", freq: 220.00, arabic: "دو (شرقي)", label: "شبرا", shortcut: "A" },
  { note: "Bb3", freq: 233.08, arabic: "ري (منخفض)", label: "المعلم", shortcut: "S" },
  { note: "C#4", freq: 277.18, arabic: "مي (ربع تون)", label: "المزمار", shortcut: "D" },
  { note: "D4", freq: 293.66, arabic: "فا", label: "الحارة", shortcut: "F" },
  { note: "E4", freq: 329.63, arabic: "صول", label: "البرنس", shortcut: "G" },
  { note: "F4", freq: 349.23, arabic: "لا", label: "المايسترو", shortcut: "H" },
  { note: "G#4", freq: 415.30, arabic: "سي (نصف)", label: "الروقان", shortcut: "J" },
  { note: "A4", freq: 440.00, arabic: "دو (عالية)", label: "المجيكو", shortcut: "K" }
];

export default function App() {
  // --- States ---
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [activeLineIndex, setActiveLineIndex] = useState<number>(-1);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  
  // Custom API configuration states
  const [userPrompt, setUserPrompt] = useState<string>("مهرجان السهرة في شبرا - توزيع مزمار بلدي مع بيز تقيل جداً وكلاكسات");
  const [selectedVibe, setSelectedVibe] = useState<string>("مهرجان سريع مقسوم وبوم-باس");
  const [vocalPreference, setVocalPreference] = useState<string>("أوتوتيون حاد وسريع مع فلاتر حادة");
  const [vocalStyleCategory, setVocalStyleCategory] = useState<VocalStyleCategory>("Mahraganat");
  const [bpmPreference, setBpmPreference] = useState<number>(128);
  
  // User Profile States
  const [currentUser, setCurrentUser] = useState<{ username: string; favorites: string[]; isGoogle?: boolean; uid?: string } | null>(null);
  const [authUsername, setAuthUsername] = useState<string>("");
  const [authPassword, setAuthPassword] = useState<string>("");
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>("");
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string>("");

  // Google Workspace & Firebase Cloud OAuth State Integration (PRO System)
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [googleContacts, setGoogleContacts] = useState<GoogleContactInfo[]>([]);


  // Share system states
  const [copiedTrackId, setCopiedTrackId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [isToastActive, setIsToastActive] = useState<boolean>(false);

  // Mixer and Control States
  const [mixer, setMixer] = useState<MixerSettings>(INITIAL_MIXER);
  const [isKeyboardGlow, setIsKeyboardGlow] = useState<string | null>(null);
  const [generationSource, setGenerationSource] = useState<string>("");
  const [latencyTime, setLatencyTime] = useState<string>("0.8s");
  const [errorText, setErrorText] = useState<string>(" ");
  
  // Custom external lyrics copy and AI platform export/adaptor states
  const [exportPlatform, setExportPlatform] = useState<ExportPlatform>("stamoni");
  const [copiedLyrics, setCopiedLyrics] = useState<boolean>(false);
  const [isAdaptorModalOpen, setIsAdaptorModalOpen] = useState<boolean>(false);

  // Refs for tracking audio loops
  const audioEngineRef = useRef<SitamoniAudioEngine | null>(null);
  const lyricTimerRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visualLoopRef = useRef<number | null>(null);
  const karaokeScrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Jump smoothly to a specific line index in the active karaoke stream
  const handleJumpToLine = (index: number) => {
    if (!selectedTrack) return;
    if (lyricTimerRef.current) {
      clearTimeout(lyricTimerRef.current);
    }
    if (!isPlaying) {
      if (audioEngineRef.current) {
        audioEngineRef.current.start(selectedTrack.bpm);
      }
      setIsPlaying(true);
    }
    setActiveLineIndex(index);
    if (audioEngineRef.current) {
      audioEngineRef.current.singLine(selectedTrack.lines[index].text);
    }
    triggerNextLyricStep(selectedTrack, index);
  };

  // Auto-scroll logic for Karaoke container to center activeLineIndex perfectly
  useEffect(() => {
    if (karaokeScrollContainerRef.current && activeLineIndex !== -1) {
      const activeEl = karaokeScrollContainerRef.current.querySelector(
        `[data-karaoke-line-index="${activeLineIndex}"]`
      ) as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [activeLineIndex]);

  // --- Google Workspace & Firebase Auth session binder (PRO Mode) ---
  useEffect(() => {
    const unsubscribe = initAuthListener(
      async (user, token) => {
        setGoogleToken(token);
        try {
          const profile = await ensureUserProfile(user);
          const mergedUser = {
            username: profile.username,
            favorites: profile.favorites,
            isGoogle: true,
            uid: user.uid
          };
          setCurrentUser(mergedUser);
          localStorage.setItem("stamoni_user", JSON.stringify(mergedUser));
          
          // Explicit retrieve Contacts connections
          import("./utils/googleWorkspace").then(async ({ fetchGoogleContacts }) => {
            const contacts = await fetchGoogleContacts(token);
            setGoogleContacts(contacts);
          });
        } catch (e) {
          console.warn("Contacts or account syncing issue:", e);
        }
      },
      () => {
        // Not logged in or expired. Clean states
        setGoogleToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // --- Initialise Audio Client & URL Parsing ---
  useEffect(() => {
    // Instantiate Audio Engine
    audioEngineRef.current = new SitamoniAudioEngine(mixer);
    
    // Register step callback to trigger visual sequencer tracker
    audioEngineRef.current.setCallback((step: number) => {
      setCurrentStep(step);
    });

    // Check query params for shared song link
    const searchParams = new URLSearchParams(window.location.search);
    const sharedTrackId = searchParams.get("track");

    // Fetch initial tracks list from server
    fetchTracks(sharedTrackId);

    // Bind physical keyboard to play Live Folk Synth
    const handlePhysicalKeyDown = (e: KeyboardEvent) => {
      const keyMap: { [key: string]: typeof KEYBOARD_KEYS[0] } = {
        a: KEYBOARD_KEYS[0], A: KEYBOARD_KEYS[0],
        s: KEYBOARD_KEYS[1], S: KEYBOARD_KEYS[1],
        d: KEYBOARD_KEYS[2], D: KEYBOARD_KEYS[2],
        f: KEYBOARD_KEYS[3], F: KEYBOARD_KEYS[3],
        g: KEYBOARD_KEYS[4], G: KEYBOARD_KEYS[4],
        h: KEYBOARD_KEYS[5], H: KEYBOARD_KEYS[5],
        j: KEYBOARD_KEYS[6], J: KEYBOARD_KEYS[6],
        k: KEYBOARD_KEYS[7], K: KEYBOARD_KEYS[7],
      };

      const matched = keyMap[e.key];
      if (matched && audioEngineRef.current) {
        audioEngineRef.current.triggerKeyboardNote(matched.freq);
        setIsKeyboardGlow(matched.note);
        setTimeout(() => setIsKeyboardGlow(null), 180);
      }
    };

    window.addEventListener("keydown", handlePhysicalKeyDown);

    // Try loading auth from localStorage fallback to persist session
    const savedUser = localStorage.getItem("stamoni_user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
        // Fetch fresh copy from server
        fetch(`/api/user/${parsed.username}`)
          .then(res => res.json())
          .then(data => {
            if (data.success && data.user) {
              setCurrentUser(data.user);
              localStorage.setItem("stamoni_user", JSON.stringify(data.user));
            }
          })
          .catch(err => console.error("Error refreshing user session:", err));
      } catch (err) {
        console.error("Stale user session data");
      }
    }

    return () => {
      if (audioEngineRef.current) {
        audioEngineRef.current.stop();
      }
      if (lyricTimerRef.current) {
        clearTimeout(lyricTimerRef.current);
      }
      if (visualLoopRef.current) {
        cancelAnimationFrame(visualLoopRef.current);
      }
      window.removeEventListener("keydown", handlePhysicalKeyDown);
    };
  }, []);

  // Sync mixer settings down to Audio engine context
  useEffect(() => {
    if (audioEngineRef.current) {
      audioEngineRef.current.updateMixer(mixer);
    }
  }, [mixer]);

  // Frequency wave visualizer loop
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const renderWave = () => {
      const analyser = audioEngineRef.current?.getAnalyser();
      const bufferLength = analyser ? analyser.frequencyBinCount : 128;
      const dataArray = new Uint8Array(bufferLength);

      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(dataArray);
      } else {
        // Fallback simulated ambient waves when paused
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = Math.sin(Date.now() * 0.003 + i * 0.15) * 15 + 20;
        }
      }

      ctx.fillStyle = "#080808";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 1.6;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] * 0.75;
        
        // Use neon green/yellow styling
        ctx.fillStyle = isPlaying ? `rgba(204, 255, 0, ${0.4 + (barHeight/150)})` : "rgba(204, 255, 0, 0.15)";
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);

        // Mirror wave center line styling
        ctx.fillStyle = isPlaying ? `rgba(204, 255, 0, 0.2)` : "rgba(204, 255, 0, 0.05)";
        ctx.fillRect(x, 0, barWidth - 1, barHeight * 0.3);

        x += barWidth;
      }

      visualLoopRef.current = requestAnimationFrame(renderWave);
    };

    renderWave();
  }, [isPlaying]);

  // Adjust recommended speed based on selected vocal style
  useEffect(() => {
    if (vocalStyleCategory === "Tarab") {
      setBpmPreference(92);
      setMixer(prev => ({
        ...prev,
        vocalPitch: 0.9,       // Deeper soul pitch
        vocalSpeechRate: -0.1,  // Slow reflective tempo flow
        reverbActive: true
      }));
    } else if (vocalStyleCategory === "Modern Pop") {
      setBpmPreference(112);
      setMixer(prev => ({
        ...prev,
        vocalPitch: 1.0,       // Balanced pitch
        vocalSpeechRate: 0.1,  // Medium tempo flow
        reverbActive: true
      }));
    } else if (vocalStyleCategory === "Shaabi") {
      setBpmPreference(118);
      setMixer(prev => ({
        ...prev,
        vocalPitch: 1.05,
        vocalSpeechRate: 0.2,
        reverbActive: true
      }));
    } else { // Mahraganat
      setBpmPreference(128);
      setMixer(prev => ({
        ...prev,
        vocalPitch: 1.15,      // Intense high pitch autotune feel
        vocalSpeechRate: 0.3,  // High speed rhythm
        reverbActive: true
      }));
    }
  }, [vocalStyleCategory]);

  // --- API Integrations & Shared Link checks ---

  const fetchTracks = async (sharedTrackId?: string | null) => {
    try {
      const response = await fetch("/api/tracks");
      const data = await response.json();
      if (data.success && data.tracks.length > 0) {
        setTracks(data.tracks);
        
        // Priority selection
        if (sharedTrackId) {
          const matchedShared = data.tracks.find((t: Track) => t.id === sharedTrackId);
          if (matchedShared) {
            setSelectedTrack(matchedShared);
            triggerToast("🎵 تم تحميل المهرجان المشترك من الحارة تلقائياً!");
          } else {
            // Fetch directly from server if not inside standard list
            try {
              const sharedResponse = await fetch(`/api/tracks/${sharedTrackId}`);
              const sharedData = await sharedResponse.json();
              if (sharedData.success && sharedData.track) {
                setTracks(prev => [sharedData.track, ...prev]);
                setSelectedTrack(sharedData.track);
                triggerToast("🎵 تم تحميل المهرجان المشترك بالرابط بنجاح!");
              } else {
                setSelectedTrack(data.tracks[0]);
              }
            } catch (err) {
              setSelectedTrack(data.tracks[0]);
            }
          }
        } else {
          setSelectedTrack(data.tracks[0]);
        }
      }
    } catch (e) {
      console.error("Failed to load tracks library:", e);
    }
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setIsToastActive(true);
    setTimeout(() => {
      setIsToastActive(false);
    }, 4500);
  };

  const generateMahragan = async () => {
    if (!userPrompt.trim()) return;
    setIsGenerating(true);
    setErrorText("");
    
    // Stop currently running playback first
    stopPlayback();

    const startTime = Date.now();

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userPrompt,
          vibe: selectedVibe,
          vocalPreference: vocalPreference,
          bpmPreference: bpmPreference,
          vocalStyleCategory: vocalStyleCategory,
          creator: currentUser?.username || undefined
        })
      });

      const data = await response.json();
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1) + "s";
      setLatencyTime(elapsed);

      if (data.success && data.track) {
        const newTrack: Track = data.track;
        setTracks(prev => [newTrack, ...prev]);
        setSelectedTrack(newTrack);
        setGenerationSource(data.source === "gemini-nlp-engine" ? "حزمة ذكاء اصطناعي معالجة" : "توليد محاكاة الشارع");
        
        triggerToast("🚀 تم توليد الكلمات والأوزان الموسيقية بنجاح!");

        // Auto sync with Firestore tracks collections if logged in to Google/Firebase
        if (currentUser?.isGoogle && currentUser?.uid) {
          try {
            await syncTrackToCloud(newTrack, currentUser.uid);
          } catch (cloudErr) {
            console.warn("Unable to save generated track directly to Firestore clouds:", cloudErr);
          }
        }

        // Auto start playing
        setTimeout(() => {
          startPlayback(newTrack);
        }, 800);
      } else {
        setErrorText(data.error || "عذراً.. تعذر استدعاء ستاموني لمعالجة الأغنية.");
      }
    } catch (e: any) {
      setErrorText("حدث خطأ في الاتصال بالشبكة لستاموني.");
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  // --- Auth Handlers ---

  const handleGoogleLogin = async () => {
    setAuthError("");
    setAuthSuccessMsg("");
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleToken(result.accessToken);
        const profile = await ensureUserProfile(result.user);
        const mergedUser = {
          username: profile.username,
          favorites: profile.favorites,
          isGoogle: true,
          uid: result.user.uid
        };
        setCurrentUser(mergedUser);
        localStorage.setItem("stamoni_user", JSON.stringify(mergedUser));
        triggerToast(`🎤 مرحباً بك في الكلاود يا بطل الحارة ${profile.username}!`);
      }
    } catch (e: any) {
      setAuthError(e.message || "فشل تسجيل الدخول بواسطة غوغل السحابي.");
      console.error(e);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccessMsg("");

    if (!authUsername.trim() || !authPassword.trim()) {
      setAuthError("الرجاء تعبئة اسم المستخدم وكلمة مرور حارتك.");
      return;
    }

    const endpoint = isRegisterMode ? "/api/register" : "/api/login";
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: authUsername.trim(),
          password: authPassword.trim()
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setCurrentUser(data.user);
        localStorage.setItem("stamoni_user", JSON.stringify(data.user));
        setAuthSuccessMsg(isRegisterMode ? "تهانينا! تم تسجيل بطاقتك الشخصية في الحارة." : "مرحباً بك مجدداً في حارتنا!");
        setAuthUsername("");
        setAuthPassword("");
        triggerToast(`🎤 مرحباً بك يا معلم ${data.user.username}`);
      } else {
        setAuthError(data.error || "عذراً، تعذر إتمام العملية.");
      }
    } catch (err) {
      setAuthError("خطأ بشبكة الاتصال مع سيرفر ستاموني.");
    }
  };

  const handleLogout = async () => {
    if (currentUser?.isGoogle) {
      try {
        await googleSignOut();
        setGoogleToken(null);
      } catch (e) {
        console.warn("Error signing out of google sessions:", e);
      }
    }
    setCurrentUser(null);
    localStorage.removeItem("stamoni_user");
    triggerToast("👋 مع السلامة يا بطل.. نراك قريباً في الاستيديو!");
  };

  const toggleFavorite = async (trackId: string) => {
    if (!currentUser) {
      triggerToast("🔒 يجب تسجيل الدخول أولاً لحفظ المهرجانات في المفضلة!");
      return;
    }

    if (currentUser.isGoogle && currentUser.uid) {
      // Firebase cloud toggle
      try {
        const isFav = currentUser.favorites.includes(trackId);
        const updatedFavorites = await toggleCloudFavorite(currentUser.uid!, trackId, isFav);
        const updatedUser = { ...currentUser, favorites: updatedFavorites };
        setCurrentUser(updatedUser);
        localStorage.setItem("stamoni_user", JSON.stringify(updatedUser));
        
        if (!isFav) {
          triggerToast("❤️ تم إضافة المهرجان لمفضلتك السحابية في فيربيز!");
        } else {
          triggerToast("💔 تم إزالة المهرجان من مفضلتك السحابية.");
        }
      } catch (err) {
        console.error("Cloud database syncing favorites failed:", err);
        triggerToast("⚠️ فشل مزامنة المفضلة مع قاعدة البيانات السحابية.");
      }
      return;
    }

    try {
      const response = await fetch("/api/favorites/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: currentUser.username,
          trackId: trackId
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        const updatedUser = { ...currentUser, favorites: data.favorites };
        setCurrentUser(updatedUser);
        localStorage.setItem("stamoni_user", JSON.stringify(updatedUser));
        
        if (data.isFavorite) {
          triggerToast("❤️ تم إضافة المهرجان لمفضلتك الخاصة!");
        } else {
          triggerToast("💔 تم إزالة المهرجان من مفضلتك.");
        }
      }
    } catch (err) {
      console.error("Error toggling favorite status:", err);
    }
  };


  // --- Playback Sync Master Logic ---

  const startPlayback = (track: Track) => {
    if (!audioEngineRef.current) return;
    
    // Start synthesize beat loop
    audioEngineRef.current.start(track.bpm);
    setIsPlaying(true);
    setActiveLineIndex(0);

    // Sing first line
    if (track.lines && track.lines.length > 0) {
      audioEngineRef.current.singLine(track.lines[0].text);
      triggerNextLyricStep(track, 0);
    }
  };

  const triggerNextLyricStep = (track: Track, currentIdx: number) => {
    if (lyricTimerRef.current) {
      clearTimeout(lyricTimerRef.current);
    }

    const currentLine = track.lines[currentIdx];
    const delayMs = (currentLine?.durationSeconds || 5) * 1000;

    lyricTimerRef.current = setTimeout(() => {
      const nextIdx = currentIdx + 1;
      if (nextIdx < track.lines.length) {
        setActiveLineIndex(nextIdx);
        if (audioEngineRef.current) {
          audioEngineRef.current.singLine(track.lines[nextIdx].text);
        }
        triggerNextLyricStep(track, nextIdx);
      } else {
        // Track finished! Loop or reset
        setActiveLineIndex(-1);
        stopPlayback();
      }
    }, delayMs);
  };

  const stopPlayback = () => {
    if (audioEngineRef.current) {
      audioEngineRef.current.stop();
    }
    if (lyricTimerRef.current) {
      clearTimeout(lyricTimerRef.current);
    }
    setIsPlaying(false);
    setActiveLineIndex(-1);
  };

  const loadPresetPrompt = (preset: typeof PROMPT_PRESETS[0]) => {
    setUserPrompt(preset.text);
    setVocalStyleCategory(preset.style as VocalStyleCategory);
  };

  // Trigger Sound Board Effects
  const triggerSiren = () => {
    if (audioEngineRef.current) audioEngineRef.current.triggerSirenEffect();
  };

  const triggerGunshot = () => {
    if (audioEngineRef.current) audioEngineRef.current.triggerGunshotEffect();
  };

  const triggerLaser = () => {
    if (audioEngineRef.current) audioEngineRef.current.triggerLaserSweep();
  };

  // Keyboard note play trigger
  const playKeyboardLive = (freq: number, noteId: string) => {
    if (audioEngineRef.current) {
      audioEngineRef.current.triggerKeyboardNote(freq);
    }
    setIsKeyboardGlow(noteId);
    setTimeout(() => setIsKeyboardGlow(null), 180);
  };

  // --- Share Song Link Generators ---

  const copyShareLink = (track: Track) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?track=${track.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedTrackId(track.id);
      triggerToast("📋 تم نسخ الرابط المباشر للمهرجان!");
      setTimeout(() => setCopiedTrackId(null), 3000);
    }).catch(err => {
      console.error("Failed to copy link:", err);
    });
  };

  // Direct Social platforms generator
  const getSocialShareUrl = (platform: "whatsapp" | "twitter" | "facebook" | "telegram", track: Track) => {
    const shareUrl = encodeURIComponent(`${window.location.origin}${window.location.pathname}?track=${track.id}`);
    const messageText = encodeURIComponent(`🔥 اسمع المهرجان الخيالي "${track.title}" المولد بالذكاء الاصطناعي مع أورج ستاموني الإلكتروني الرائع! من هنا: `);
    
    switch (platform) {
      case "whatsapp":
        return `https://api.whatsapp.com/send?text=${messageText}${shareUrl}`;
      case "twitter":
        return `https://twitter.com/intent/tweet?url=${shareUrl}&text=${messageText}`;
      case "facebook":
        return `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
      case "telegram":
        return `https://t.me/share/url?url=${shareUrl}&text=${messageText}`;
      default:
        return "#";
    }
  };

  // Copy plain lyrics text with platform optimization
  const handleCopyFullLyrics = (track: Track) => {
    const formatted = formatLyrics(track, exportPlatform);
    navigator.clipboard.writeText(formatted).then(() => {
      setCopiedLyrics(true);
      triggerToast("✍️ تم نسخ الكلمات الأصلية المنسقة للترقية لموديلك الخارجي!");
      setTimeout(() => setCopiedLyrics(false), 3000);
    }).catch(err => {
      console.error("Failed to copy lyrics:", err);
    });
  };

  // Direct Social platforms generator for the raw formatted lyrics contents themselves
  const getSocialShareLyricsUrl = (platform: "whatsapp" | "twitter" | "telegram", track: Track) => {
    const rawLyrics = formatLyrics(track, exportPlatform);
    const messageText = `🎤 كلمات مهرجان: "${track.title}" المولد عبر ستاموني\n\n${rawLyrics}\n\nاصنع أغنيتك وتصفح الميكسر المجاني هنا: ${window.location.origin}?track=${track.id}`;
    
    switch (platform) {
      case "whatsapp":
        return `https://api.whatsapp.com/send?text=${encodeURIComponent(messageText)}`;
      case "twitter": {
        const promoText = `🎤 كلمات مهرجان: "${track.title}" \n\n${rawLyrics.slice(0, 160)}...\n\n#STAMONI ${window.location.origin}?track=${track.id}`;
        return `https://twitter.com/intent/tweet?text=${encodeURIComponent(promoText)}`;
      }
      case "telegram":
        return `https://t.me/share/url?url=${encodeURIComponent(window.location.origin + "?track=" + track.id)}&text=${encodeURIComponent(messageText)}`;
      default:
        return "#";
    }
  };

  return (
    <div className="bg-[#080808] text-[#f0f0f0] min-h-screen w-full font-sans flex flex-col p-4 md:p-8 border-4 border-[#CCFF00] relative" dir="rtl">
      
      {/* FLOATING DIRECT TOAST FEEDBACK PANEL */}
      <div className={`fixed top-4 left-4 z-50 bg-[#CCFF00] text-black border-2 border-black font-extrabold text-xs sm:text-sm px-4 py-3 shadow-[4px_4px_0px_#000] flex items-center gap-2 transition-all duration-300 ${
        isToastActive ? "translate-y-0 opacity-100" : "-translate-y-12 opacity-0 pointer-events-none"
      }`}>
        <Radio className="w-4 h-4 animate-pulse text-rose-600" />
        <span>{toastMessage}</span>
      </div>

      {/* HEADER SECTION - High Cyber Stadium Typography */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b-2 border-[#CCFF00] pb-6 gap-4">
        <div className="flex flex-col">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none text-[#CCFF00] italic select-none">
            STAMONI
          </h1>
          <p className="text-sm md:text-lg font-bold uppercase tracking-[0.3em] opacity-95 text-zinc-300 mt-1">
            ستاموني • نظام الذكاء الاصطناعي لتوليد المهرجانات والمقسومات الشعبية
          </p>
        </div>
        
        {/* Real-time Cluster State/Auth integration */}
        <div className="flex flex-wrap gap-4 items-center">
          {currentUser ? (
            <div className="bg-[#111] border border-zinc-800 p-2.5 flex items-center gap-3 shadow rounded-sm">
              <div className="w-8 h-8 rounded-full bg-[#CCFF00] text-black font-black flex items-center justify-center text-sm">
                {currentUser.username[0].toUpperCase()}
              </div>
              <div className="text-right">
                <div className="text-[10px] text-zinc-500 font-mono">مطرب الحارة النشط</div>
                <div className="text-xs font-bold text-[#CCFF00]">{currentUser.username}</div>
              </div>
              <button 
                onClick={handleLogout}
                className="text-zinc-400 hover:text-rose-500 transition-colors p-1"
                title="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="text-xs text-zinc-400 font-bold bg-[#111] p-2 border border-zinc-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              أنت تستخدم وضع الزائر الاستعراضي
            </div>
          )}

          <div className="flex gap-4 items-center">
            <div className="text-right hidden sm:block">
              <div className="text-[10px] uppercase tracking-widest text-[#CCFF00] font-mono">System Gateway</div>
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-zinc-300">
                <span className="w-2.5 h-2.5 rounded-full bg-[#CCFF00] animate-ping"></span>
                K8S STAMONI MASTER
              </div>
            </div>
            <div className="w-14 h-14 rounded-full border-2 border-[#CCFF00] bg-zinc-950 flex items-center justify-center font-black text-[#CCFF00] text-lg hover:bg-[#CCFF00] hover:text-black transition-all">
              شعبي
            </div>
          </div>
        </div>
      </header>

      {/* USER PROFILE & SIGNUP FLOATING CONSOLE (بوابة تسجيل مطربين الحارة) */}
      {!currentUser && (
        <div className="bg-[#111] border-2 border-[#CCFF00] p-4 mb-8 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[4px_4px_0px_rgba(204,255,0,0.15)]">
          <div>
            <h3 className="text-md sm:text-lg font-extrabold text-[#CCFF00] flex items-center gap-2">
              <User className="w-5 h-5" />
              سجل عضويتك الفنية مجاناً (Personal Performer Console)
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              عليك تسجيل الدخول لحفظ مهرجاناتك المفضلة، تتبع تاريخ غنائك، ونشر أغانيك باسمك في حافلة الاستيديو!
            </p>
          </div>
          
          <form onSubmit={handleAuth} className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <input 
              type="text" 
              placeholder="اسم الشهرة..."
              value={authUsername}
              onChange={(e) => setAuthUsername(e.target.value)}
              className="bg-zinc-950 text-xs font-bold p-2 border border-zinc-800 rounded focus:border-[#CCFF00] outline-none text-[#f0f0f0] placeholder-zinc-600 flex-1 md:w-36"
            />
            <input 
              type="password" 
              placeholder="الباسورد..."
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              className="bg-zinc-950 text-xs font-bold p-2 border border-zinc-800 rounded focus:border-[#CCFF00] outline-none text-[#f0f0f0] placeholder-zinc-600 flex-1 md:w-32"
            />
            
            <button 
              type="submit" 
              className="bg-[#CCFF00] hover:bg-white text-black font-extrabold text-xs px-4 py-2 rounded transition-colors"
            >
              {isRegisterMode ? "سجل كفنان جديد" : "دخول كفنان"}
            </button>

            <button 
              type="button" 
              onClick={handleGoogleLogin}
              className="bg-white hover:bg-zinc-100 text-black font-extrabold text-[10.5px] px-3 py-2 rounded flex items-center gap-2 transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              غوغل سحابي
            </button>

            <button 
              type="button"
              onClick={() => setIsRegisterMode(!isRegisterMode)}
              className="text-[10px] text-[#00F0FF] hover:underline font-bold px-1"
            >
              {isRegisterMode ? "لديك حساب؟ ادخل" : "ليس لديك حساب؟ سجل"}
            </button>
          </form>

          {authError && (
            <div className="text-xs text-rose-500 font-bold bg-rose-950/20 p-2 border-r-2 border-rose-600">
              {authError}
            </div>
          )}
          {authSuccessMsg && (
            <div className="text-xs text-emerald-500 font-bold bg-emerald-950/20 p-2 border-r-2 border-emerald-600">
              {authSuccessMsg}
            </div>
          )}
        </div>
      )}

      {/* MAIN TWO-COLUMN CONTAINER */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUMN 1: Generating Input & Quick Parameters (Scol: 7) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Main Prompt Input Terminal */}
          <div className="bg-[#111] border-l-8 border-[#CCFF00] p-6 flex flex-col justify-between shadow-2xl">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-xs uppercase tracking-widest text-[#CCFF00] font-mono font-bold flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#CCFF00]" />
                  البرومبت الصوتي والفكري (Egyptian AI Input)
                </label>
                <span className="text-xs text-zinc-500 font-mono">STAMONI STYLIZED v3.0</span>
              </div>
              
              <textarea 
                className="bg-zinc-950/60 text-lg md:text-2xl font-bold w-full h-32 outline-none resize-none p-3 border border-zinc-900 rounded focus:border-[#CCFF00] text-[#f0f0f0] placeholder-zinc-700 transition-colors"
                placeholder="اكتب فكرة الأغنية أو الكلمات بالعامية المصرية... مثل: (غدر الأحباب، الفرح والندالة، الروقان في شبرا)"
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
              />
            </div>

            {/* EXPANDED VOCAL SYNTHESIS STYLES SELECTOR (NEW SECTION) */}
            <div className="my-4 pt-4 border-t border-zinc-900">
              <label className="text-xs font-black uppercase text-[#CCFF00] block mb-2 tracking-wider">
                🎤 اختر نمط وطبقة الأداء الغنائي (Vocal Singing Styles)
              </label>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { value: "Mahraganat", arabic: "مهرجانات شعبية", desc: "أوتوتيون حاد وسريع واهتزاز بيز صاخب", icon: "🔥", bpm: 128 },
                  { value: "Shaabi", arabic: "شعبي بلدي", desc: "أداء إلقائي وقصصي قوي من حكايات الشارع", icon: "👑", bpm: 118 },
                  { value: "Tarab", arabic: "طرب وسلطنة", desc: "آهات صوفية ممتدة ومواويل حكيمة دافئة", icon: "🎻", bpm: 92 },
                  { value: "Modern Pop", arabic: "بوب حديث لوكس", desc: "سينث الكتروني عصري بطبقة ناعمة مبهجة", icon: "✨", bpm: 112 }
                ].map((styleObj) => {
                  const isActive = vocalStyleCategory === styleObj.value;
                  return (
                    <button
                      key={styleObj.value}
                      type="button"
                      onClick={() => setVocalStyleCategory(styleObj.value as VocalStyleCategory)}
                      className={`text-right p-2.5 border transition-all cursor-pointer flex flex-col justify-between h-[84px] rounded-sm ${
                        isActive 
                          ? "bg-[#CCFF00] text-black border-black font-black shadow-[3px_3px_0px_#00F0FF]" 
                          : "bg-zinc-950/80 text-zinc-300 border-zinc-850 hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-xs font-black leading-none">{styleObj.arabic}</span>
                        <span className="text-sm leading-none">{styleObj.icon}</span>
                      </div>
                      <div className={`text-[9px] leading-tight font-medium mt-1 ${isActive ? "text-zinc-900" : "text-zinc-500"}`}>
                        {styleObj.desc}
                      </div>
                      <div className={`text-[8px] font-mono font-bold mt-1 ${isActive ? "text-slate-800" : "text-[#00F0FF]"}`}>
                        {styleObj.bpm} BPM الموصى بها
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Prompt Quick Pills */}
            <div className="my-3 pt-2">
              <span className="text-xs text-zinc-500 block mb-2">أفكار ومواويل منتقاة للحارة وبسرعة الإيقاع:</span>
              <div className="flex flex-wrap gap-2">
                {PROMPT_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => loadPresetPrompt(preset)}
                    className="text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-3 py-1.5 border border-zinc-800 rounded transition-all cursor-pointer"
                  >
                    🚀 {preset.label} <span className="text-[#CCFF55] text-[10px]">({preset.style})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic AI parameters config */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 pt-3 border-t border-zinc-900">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">نوع المقسوم والإيقاع</label>
                <select 
                  className="bg-zinc-900 text-xs text-zinc-205 w-full p-2 rounded outline-none border border-zinc-800"
                  value={selectedVibe}
                  onChange={(e) => setSelectedVibe(e.target.value)}
                >
                  <option value="مهرجان سريع مقسوم وبوم-باس">مهرجان سريع مقسوم صاخب</option>
                  <option value="ملفوف بلدي هادئ مع مزمار">ملفوف بلدي حالم</option>
                  <option value="مزمار صعيدي حامي وسريع">مزمار صعيدي عالي الهياج</option>
                  <option value="موال دافئ بتقسيم ناي وقانون">موال سلطنة طربي هادئ</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">مؤثر أوتوتيون إضافي</label>
                <select 
                  className="bg-zinc-900 text-xs text-zinc-205 w-full p-2 rounded outline-none border border-zinc-800"
                  value={vocalPreference}
                  onChange={(e) => setVocalPreference(e.target.value)}
                >
                  <option value="أوتوتيون حاد وسريع مع فلاتر حادة">أوتوتيون حاد ومكثف</option>
                  <option value="حنجرة دافئة بطرب بلدي أصيل">حنجرة موال شرقي طبيعي</option>
                  <option value="إلقاء هيب هوب شعبي حماسي">إلقاء هيب هوب سريع</option>
                  <option value="كورس جماعي شعبي قوي">كورس الشلة (متعدد المخارج)</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs text-zinc-400">سرعة ضربات العازف</label>
                  <span className="text-xs text-[#CCFF00] font-mono">{bpmPreference} BPM</span>
                </div>
                <input 
                  type="range"
                  min="80"
                  max="138"
                  value={bpmPreference}
                  onChange={(e) => setBpmPreference(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#CCFF00] mt-2"
                />
              </div>
            </div>

            {errorText && (
              <div className="mb-4 text-rose-500 text-xs font-bold font-mono bg-rose-950/20 p-2.5 border-l-2 border-rose-600">
                🚨 {errorText}
              </div>
            )}

            {/* Action buttons with neon theme pulse */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-end mt-2">
              <div className="flex gap-4 items-center">
                <div className="px-3 py-1.5 bg-zinc-900 rounded border border-zinc-800 text-[10px] font-mono uppercase text-zinc-400">
                  MODEL: <span className="text-[#CCFF00]">GEMINI-3.5-FLASH</span>
                </div>
                {generationSource && (
                  <div className="px-3 py-1.5 bg-zinc-900 rounded border border-zinc-800 text-[10px] font-mono uppercase text-[#00F0FF]">
                    {generationSource}
                  </div>
                )}
              </div>
              
              <button 
                onClick={generateMahragan}
                disabled={isGenerating}
                className="bg-[#CCFF00] text-black hover:bg-white hover:text-black font-black text-xl py-4 px-10 flex items-center justify-center gap-2 tracking-tight transition-all duration-300 disabled:opacity-45 neon-btn-red"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جاري توزين النغمات والصوت...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-black" />
                    توزين و توليد المهرجان بالـ AI
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Performance statistics dashboard widget */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#111] p-4 border border-zinc-800 flex flex-col justify-center items-center shadow">
              <div className="text-3xl md:text-4xl font-black text-[#00F0FF]">100%</div>
              <div className="text-[10px] font-bold font-mono uppercase tracking-widest opacity-80 mt-1 text-center">
                موال مصري أصيل
              </div>
            </div>
            
            <div className="bg-[#111] p-4 border border-zinc-800 flex flex-col justify-center items-center shadow">
              <div className="text-3xl md:text-4xl font-black text-[#FF3E00]">{latencyTime}</div>
              <div className="text-[10px] font-bold font-mono uppercase tracking-widest opacity-80 mt-1 text-center">
                سرعة الاستجابة
              </div>
            </div>

            <div className="bg-[#111] p-4 border border-zinc-800 flex flex-col justify-center items-center shadow">
              <div className="text-3xl md:text-4xl font-black text-[#CCFF00]">{vocalStyleCategory}</div>
              <div className="text-[9px] font-bold font-mono uppercase tracking-widest opacity-80 mt-1 text-center">
                الطبقة الحالية
              </div>
            </div>
          </div>

          {/* SINGER CONTROLS & LYRICS TRACKER */}
          <div className="bg-zinc-950 p-6 border-2 border-zinc-900 flex-1 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4 border-b border-zinc-900 pb-3">
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5 text-[#CCFF00]" />
                <h3 className="text-lg font-black tracking-tight text-[#CCFF00]">مسرح الكلمات والموال المباشر</h3>
              </div>
              {selectedTrack && (
                <div className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded font-bold text-xs text-[#00F0FF] flex items-center gap-1">
                  <span>{selectedTrack.title}</span>
                  <span className="text-[9px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded uppercase">
                    {selectedTrack.vocalStyleCategory || "Mahraganat"}
                  </span>
                </div>
              )}
            </div>

            {/* Displaying Current Highlighted Lyrics Block - Karaoke Style Focal Point */}
            <div className="bg-zinc-950/95 p-6 md:p-10 rounded-xl border-4 border-[#CCFF00] min-h-[600px] flex flex-col justify-between relative overflow-hidden shadow-[0_0_35px_rgba(204,255,0,0.25)] transition-all duration-300">
              {/* Animated scanning bar for active simulation karaoke look */}
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-[#CCFF00] to-transparent animate-pulse opacity-75 z-20 pointer-events-none"></div>
              
              {/* Retro backdrop layout noise */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-zinc-900 pb-3 mb-4 z-20">
                <div className="flex gap-1.5 items-center font-mono text-[10px] text-[#CCFF05] font-black bg-zinc-950/80 px-2 py-0.5 rounded">
                  <Radio className="w-4 h-4 text-[#CCFF00] animate-pulse" /> شاشة الأداء الصوتي الحي للمايسترو
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] text-zinc-500 bg-zinc-950/80 px-2 py-0.5 rounded">
                    KARAOKE DESK v3.5
                  </span>
                  {selectedTrack && (
                    <button
                      onClick={() => setIsAdaptorModalOpen(true)}
                      className="bg-zinc-900 hover:bg-[#CCFF00] text-[#CCFF00] hover:text-black border border-zinc-800 text-[10px] font-black px-2.5 py-1 rounded transition-all cursor-pointer flex items-center gap-1 shadow"
                    >
                      <Settings2 className="w-3 h-3" />
                      مهايئ الذكاء الاصطناعي ({exportPlatform.toUpperCase()})
                    </button>
                  )}
                </div>
              </div>

              {selectedTrack ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1 z-10">
                  {/* Left column: Active scrolling Karaoke Screen */}
                  <div className="lg:col-span-8 bg-zinc-900/40 border border-zinc-900/80 rounded-xl p-6 md:p-8 flex flex-col justify-between relative overflow-hidden min-h-[600px] shadow-[0_0_40px_rgba(204,255,0,0.06)]">
                    
                    {/* Karaoke Interactive Header and direct External Platform Selector */}
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center pb-4 border-b border-zinc-900/80 mb-4 gap-3 z-10">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse block" />
                        <div className="text-right">
                          <span className="text-xs uppercase font-extrabold text-[#CCFF00] tracking-wider font-mono block">
                            LIVE PERFORMANCE MONITOR
                          </span>
                          <span className="text-[9px] text-zinc-500 font-mono">SCROLL LOCKED • SYNCED WITH MIXER</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setIsAdaptorModalOpen(true)}
                        className="bg-[#00F0FF]/15 hover:bg-[#00F0FF] text-[#00F0FF] hover:text-black border border-[#00F0FF]/35 hover:border-[#00F0FF] px-3.5 py-2 rounded-xl text-[10px] font-black tracking-tight transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow"
                        title="توصيل وإعداد تنسيق الكلمات بـ Suno / Udio أو DAW"
                      >
                        <Music className="w-3.5 h-3.5 text-current animate-spin" style={{ animationDuration: '3s' }} />
                        تصدير لمنصات الموسيقى الخارجية (Suno / Udio)
                      </button>
                    </div>

                    <div 
                      ref={karaokeScrollContainerRef} 
                      className="w-full h-[440px] md:h-[480px] overflow-y-auto overflow-x-hidden relative scroll-smooth px-2 flex flex-col pt-0 pb-0"
                      style={{ scrollbarWidth: "thin" }}
                    >
                      {/* Top scrolling space helper */}
                      <div className="h-32 sm:h-36 flex-shrink-0" />

                      {selectedTrack.lines.map((line, idx) => {
                        const isActive = idx === activeLineIndex;
                        return (
                          <div
                            key={idx}
                            data-karaoke-line-index={idx}
                            onClick={() => handleJumpToLine(idx)}
                            className={`py-8 px-4 transition-all duration-500 cursor-pointer flex flex-col justify-center items-center select-text text-center rounded-2xl scroll-mt-28 ${
                              isActive
                                ? "scale-[1.02] opacity-100 z-10 py-10 bg-zinc-900/60 border-2 border-[#CCFF00]/40 shadow-[0_0_30px_rgba(204,255,0,0.08)] ring-1 ring-[#CCFF00]/10"
                                : "scale-90 opacity-20 hover:opacity-50 z-0 hover:scale-95"
                            }`}
                          >
                            {isActive ? (
                              <div className="space-y-4 w-full">
                                {/* 1. Technical instructions (meta brackets) separated in its own visual styled block */}
                                <div className="bg-zinc-950/90 border border-zinc-850 rounded-xl p-3 max-w-lg mx-auto flex flex-col gap-1.5 shadow-inner">
                                  <div className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider text-center">
                                    📋 تعليمات الأداء الفنية الحالية (Technical Meta-Brackets)
                                  </div>
                                  <div className="flex flex-wrap items-center justify-center gap-1.5 mt-0.5">
                                    <span className="text-[10px] bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 px-3 py-1 rounded-full font-black font-mono">
                                      [{line.section.toUpperCase()}]
                                    </span>
                                    <span className="text-[10px] bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/30 px-3 py-1 rounded-full font-black font-mono">
                                      [SINGER: {line.vocalEffect.toUpperCase()}]
                                    </span>
                                    <span className="text-[10px] bg-red-500/15 text-red-400 border border-red-500/30 px-3 py-1 rounded-full font-black font-mono">
                                      [BPM: {selectedTrack.bpm}]
                                    </span>
                                  </div>
                                </div>

                                {/* 2. Bold and gorgeous raw karaoke display text */}
                                <h4 className="text-2xl sm:text-3xl md:text-5xl font-black text-[#CCFF00] tracking-tight leading-relaxed transition-all duration-300 drop-shadow-[0_4px_12px_rgba(204,255,0,0.6)]">
                                  "{line.text}"
                                </h4>
                                
                                {/* 3. Raw clean lyrics text in a copy-safe, selectable input directly under the lyrics */}
                                <div className="text-xs sm:text-sm text-zinc-200 font-bold bg-zinc-950/95 border border-zinc-800 p-3 rounded-xl max-w-xl mx-auto shadow-md space-y-2">
                                  <div className="flex items-center justify-between text-[11px] pb-1.5 border-b border-zinc-900">
                                    <span className="text-[#00F0FF]">🗣️ نطق قاهري مسموع: {line.pronunciation}</span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(line.text);
                                        setToastMessage("تم نسخ السطر الحالي!");
                                        setIsToastActive(true);
                                        setTimeout(() => setIsToastActive(false), 1200);
                                      }}
                                      className="text-[9px] bg-zinc-900 hover:bg-[#CCFF00] hover:text-black border border-zinc-800 hover:border-[#CCFF00] px-2 py-0.5 rounded font-black transition-all cursor-pointer"
                                    >
                                      نسخ السطر
                                    </button>
                                  </div>
                                  <input
                                    type="text"
                                    readOnly
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      (e.target as HTMLInputElement).select();
                                    }}
                                    className="w-full bg-zinc-900 border border-zinc-850 rounded px-2.5 py-1 text-center font-mono text-xs text-zinc-300 cursor-text select-all outline-none focus:border-[#CCFF00]"
                                    value={line.text}
                                    title="الكلمات الخام للسطر الحالي قابلة للنسخ المباشر"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2 text-center">
                                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest bg-zinc-900/40 px-2 py-0.5 rounded border border-zinc-900/40">
                                  {line.section}
                                </span>
                                <h5 className="text-lg sm:text-2xl font-black text-zinc-400 hover:text-white transition-colors leading-relaxed animate-pulse">
                                  {line.text}
                                </h5>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Bottom scrolling space helper */}
                      <div className="h-32 sm:h-36 flex-shrink-0" />
                    </div>
                  </div>

                  {/* Right column: Splitted Raw copy-safe lyrics + Technical Meta prompts box */}
                  <div className="lg:col-span-4 flex flex-col gap-4">
                    {/* Block A: Copyable Raw Lyric Text Area */}
                    <div className="flex flex-col flex-1 bg-zinc-900/30 border border-zinc-900 rounded-xl p-3.5 justify-between gap-2.5">
                      <div className="flex justify-between items-center pb-2 border-b border-zinc-850">
                        <span className="text-[10px] font-black text-zinc-300 flex items-center gap-1">
                          📄 الكلمات المجهزة للنسخ (Raw Lyrics)
                        </span>
                        <span className="text-[8px] bg-emerald-950/50 text-emerald-400 border border-emerald-900/50 px-1.5 py-0.2 rounded font-mono font-bold">
                          RAW TEXT
                        </span>
                      </div>

                      {/* Pure raw lyrics display block selectable & copy-safe */}
                      <textarea
                        readOnly
                        onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                        className="w-full h-[140px] md:h-[160px] bg-zinc-950 text-zinc-300 text-xs font-mono p-2.5 border border-zinc-900 rounded-lg resize-none leading-relaxed whitespace-pre font-medium focus:ring-1 focus:ring-[#CCFF00] select-all cursor-text outline-none"
                        value={selectedTrack.lines.map(line => line.text).join("\n")}
                        title="انقر لتحديد الكلمات الموالية بالكامل"
                      />

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedTrack.lines.map(line => line.text).join("\n"));
                          setToastMessage("تم نسخ كلمات المهرجان الخام بنجاح!");
                          setIsToastActive(true);
                          setTimeout(() => setIsToastActive(false), 2000);
                        }}
                        className="w-full bg-[#CCFF00] hover:bg-white text-black font-black py-2 rounded text-[10px] transition-all cursor-pointer flex items-center justify-center gap-1 shadow"
                      >
                        <Clipboard className="w-3.5 h-3.5" />
                        نسخ الكلمات الـ Raw كامل
                      </button>
                    </div>

                    {/* Block B: Technical Meta Brackets and Prompts Panel */}
                    <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-3.5 flex flex-col justify-between gap-2.5 relative overflow-hidden h-[330px] md:h-[365px]">
                      <div className="absolute top-0 right-0 w-[100px] h-[100px] bg-[#00F0FF]/5 blur-[30px] rounded-full pointer-events-none" />
                      
                      <div className="flex justify-between items-center pb-1.5 border-b border-zinc-850 z-10">
                        <span className="text-[10px] font-black text-zinc-300 flex items-center gap-1">
                          ⚙️ مهايئ وأقواس الذكاء الإصطناعي التوجيهية
                        </span>
                        
                        <button
                          onClick={() => setIsAdaptorModalOpen(true)}
                          className="bg-[#00F0FF]/10 hover:bg-[#00F0FF] text-[#00F0FF] hover:text-black border border-[#00F0FF]/30 text-[9px] font-black px-2 py-0.5 rounded transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                          title="إعداد مهايئ المنصات الموسيقية الخارجية"
                        >
                          <Settings2 className="w-3 h-3" />
                          مهايئ الذكاء الإصطناعي
                        </button>
                      </div>

                      {/* Instant Platform Selector Pills inside the container directly */}
                      <div className="grid grid-cols-4 gap-1 z-10">
                        {EXPORT_PLATFORMS.map((platform) => {
                          const isSel = exportPlatform === platform.id;
                          return (
                            <button
                              key={platform.id}
                              onClick={() => {
                                setExportPlatform(platform.id);
                                setToastMessage(`تم التحويل إلى تنسيق: ${platform.nameEn}`);
                                setIsToastActive(true);
                                setTimeout(() => setIsToastActive(false), 1500);
                              }}
                              className={`text-[9px] font-black py-1.5 px-0.5 rounded transition-all cursor-pointer text-center truncate ${
                                isSel
                                  ? "bg-[#00F0FF] text-black shadow-md border border-[#00F0FF]"
                                  : "bg-zinc-950 text-zinc-500 border border-zinc-900 hover:text-zinc-300 hover:bg-zinc-900"
                              }`}
                              title={platform.description}
                            >
                              {platform.id.toUpperCase()}
                            </button>
                          );
                        })}
                      </div>

                      {/* Glowing Synthesizer Code Display Window showing technical meta-bracket directions structurally highlighted */}
                      <div className="flex-1 bg-zinc-950 border border-zinc-900 rounded-lg p-2.5 overflow-y-auto font-mono text-right relative min-h-[140px]" style={{ scrollbarWidth: 'thin' }}>
                        {formatLyrics(selectedTrack, exportPlatform).split("\n").map((lineText, linenum) => {
                          return (
                            <div key={linenum}>
                              {renderHighlightedLine(lineText)}
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex gap-2 items-center z-10 pt-1.5 border-t border-zinc-850/50">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(formatLyrics(selectedTrack, exportPlatform));
                            setToastMessage("تم نسخ الكود والكلمات كاملة بتنسيق المنصة المحددة!");
                            setIsToastActive(true);
                            setTimeout(() => setIsToastActive(false), 2000);
                          }}
                          className="w-full bg-zinc-900 hover:bg-[#00F0FF] text-[#00F0FF] hover:text-black border border-[#00F0FF]/30 hover:border-[#00F0FF] transition-all py-1.5 rounded font-black text-[10px] cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                        >
                          <Clipboard className="w-3.5 h-3.5" />
                          نسخ الكود والكلمات المنسقة كاملة
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 space-y-4 my-auto z-10">
                  <div className="w-16 h-16 rounded-full bg-[#111] flex items-center justify-center mx-auto border border-zinc-800 shadow-lg mb-2">
                    <Music className="w-8 h-8 text-[#CCFF00] animate-pulse" />
                  </div>
                  <p className="text-zinc-300 font-black text-xl md:text-2xl">اختر مهرجاناً أو ولد نغمة جديدة للحصول على موال الكاريوكي الفوري!</p>
                  <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
                    نظام ستاموني يقوم بفك الأكواد الموسيقية وبث التوجيهات الفنية للشاشات الراقصة بنطق محكم.
                  </p>
                </div>
              )}
            </div>

            {/* Master Play / Pause Deck Controls + SHARING SHORTCUT ON PLAY PANEL */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center mt-6 pt-4 border-t border-zinc-900">
              <div className="flex gap-2.5 items-center">
                {selectedTrack && (
                  <>
                    {!isPlaying ? (
                      <button 
                        onClick={() => startPlayback(selectedTrack)}
                        className="bg-[#CCFF00] text-black font-extrabold text-sm px-5 py-2.5 flex items-center gap-1.5 cursor-pointer hover:bg-white transition-all rounded shadow-md"
                      >
                        <Play className="w-4 h-4 text-black fill-black" />
                        شغل المهرجان الحالي
                      </button>
                    ) : (
                      <button 
                        onClick={stopPlayback}
                        className="bg-rose-600 text-white font-extrabold text-sm px-5 py-2.5 flex items-center gap-1.5 cursor-pointer hover:bg-rose-500 transition-all rounded shadow-md animate-pulse"
                      >
                        <Pause className="w-4 h-4" />
                        إيقاف الكاسيت
                      </button>
                    )}
                  </>
                )}
                
                <button 
                  onClick={stopPlayback} 
                  className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm font-bold p-2.5 hover:text-white hover:bg-zinc-850"
                  title="إعادة الكلمات"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {selectedTrack && (
                  <button
                    onClick={() => toggleFavorite(selectedTrack.id)}
                    className={`p-2.5 border rounded-sm transition-colors cursor-pointer ${
                      currentUser && currentUser.favorites.includes(selectedTrack.id)
                        ? "bg-rose-950/40 text-rose-500 border-rose-900/60 hover:bg-rose-900/20"
                        : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-rose-500 hover:bg-zinc-850"
                    }`}
                    title={currentUser && currentUser.favorites.includes(selectedTrack.id) ? "إزالة من المفضلة" : "إضافة للمفضلة"}
                  >
                    <Heart className={`w-4 h-4 ${currentUser && currentUser.favorites.includes(selectedTrack.id) ? "fill-rose-500" : ""}`} />
                  </button>
                )}
              </div>

              {selectedTrack && (
                <div className="flex flex-col sm:items-end gap-1.5 font-mono text-xs">
                  <div className="text-zinc-400">
                    ⚡ الإيقاع: <span className="text-[#CCFF00] font-bold">{selectedTrack.bpm} BPM</span> | {selectedTrack.rhythmStyle}
                  </div>
                  
                  {/* QUICK SOCIAL SHARES FOR SELECTED SONG */}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-zinc-500 font-bold font-sans">أنشر الأغنية:</span>
                    <button 
                      onClick={() => copyShareLink(selectedTrack)}
                      className="text-zinc-400 hover:text-[#CCFF00] transition-colors"
                      title="نسخ رابط حصري"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <a 
                      href={getSocialShareUrl("whatsapp", selectedTrack)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-emerald-500 hover:underline text-[10px] font-sans font-bold"
                      title="مشاركة واتساب"
                    >
                      واتساب
                    </a>
                    <a 
                      href={getSocialShareUrl("twitter", selectedTrack)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#00F0FF] hover:underline text-[10px] font-sans font-bold"
                      title="مشاركة على إكس/تويتر"
                    >
                      إكس / تويتر
                    </a>
                    <a 
                      href={getSocialShareUrl("telegram", selectedTrack)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sky-500 hover:underline text-[10px] font-sans font-bold"
                      title="تليجرام"
                    >
                      تليجرام
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* DYNAMIC LYRIC SHEET ENGINE & EXTERNAL AI ADAPTOR PORTING (NEW FEATURE) */}
          {selectedTrack && (
            <div className="bg-[#111] p-6 border-2 border-zinc-900 shadow-xl rounded-lg space-y-6 mt-4">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-zinc-850 pb-4 gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-[#00F0FF] rounded-full animate-ping"></div>
                  <h3 className="text-md sm:text-lg font-black text-[#00F0FF] tracking-tight">
                    🖨️ مهايئ تصدير الكلمات للموديلات الخارجية (External AI Music Adaptor)
                  </h3>
                </div>
                <span className="text-[10px] bg-zinc-900 px-2 py-1 border border-zinc-800 rounded text-zinc-400 font-mono">
                  ACTUAL LYRICS INJECTOR
                </span>
              </div>

              {/* Formulating the External platform Selector Questions directly */}
              <div className="space-y-3">
                <div className="bg-zinc-950 p-4 border border-zinc-900 rounded-lg">
                  <p className="text-xs text-zinc-300 font-bold mb-3 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-[#CCFF00]" />
                    أين تنوي استخدام هذه الكلمات غنائياً؟ (أختر موديل الموسيقى الخارجي لتوفير التنسيق والأقواس الفعالة):
                  </p>
                  
                  {/* Selector Pills */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {EXPORT_PLATFORMS.map((platform) => {
                      const isActive = exportPlatform === platform.id;
                      return (
                        <button
                          key={platform.id}
                          type="button"
                          onClick={() => setExportPlatform(platform.id)}
                          className={`text-right p-3 border rounded transition-all cursor-pointer flex flex-col justify-between ${
                            isActive 
                              ? "bg-zinc-900 border-[#00F0FF] text-[#00F0FF] ring-2 ring-[#00F0FF]/25 scale-[1.01]" 
                              : "bg-zinc-950 text-zinc-400 border-zinc-850 hover:border-zinc-700"
                          }`}
                        >
                          <div className="flex justify-between items-center w-full">
                            <span className="text-xs font-black">{platform.name}</span>
                            <span className="text-[9px] font-mono text-zinc-500 uppercase">{platform.id}</span>
                          </div>
                          <p className={`text-[10px] mt-1.5 leading-tight ${isActive ? "text-zinc-300" : "text-zinc-650"} font-medium`}>
                            {platform.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Two Blocks Display Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                
                {/* Block 1: Raw Copyable/Selectable Lyrics Container */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center bg-zinc-950 p-2.5 border border-zinc-900 rounded-t">
                    <span className="text-xs font-bold text-zinc-350">
                      📄 بلوك 1: الكلمات الخام المنسقة للتسجيل (Selectable Copy Sheet)
                    </span>
                    <span className="text-[9px] bg-emerald-950/40 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold uppercaseEdge">
                      COPY SAFE
                    </span>
                  </div>
                  
                  {/* Selectable and copyable block of text */}
                  <textarea
                    readOnly
                    className="w-full h-80 bg-zinc-950 text-zinc-300 text-xs font-mono p-4 outline-none border border-t-0 border-zinc-900 resize-none select-all focus:ring-1 focus:ring-[#00F0FF] rounded-b leading-relaxed whitespace-pre"
                    value={formatLyrics(selectedTrack, exportPlatform)}
                    title="انقر وحدد لتنسخ ما تريد"
                  />
                  
                  {/* Copy & Share Buttons */}
                  <div className="flex flex-col gap-2 mt-1">
                    <button
                      onClick={() => handleCopyFullLyrics(selectedTrack)}
                      className="bg-[#00F0FF] hover:bg-white text-black font-black p-3 text-xs flex items-center justify-center gap-1.5 transition-all rounded shadow cursor-pointer"
                    >
                      <Clipboard className="w-4 h-4 text-black" />
                      {copiedLyrics ? "تم نسخ النص بنجاح!" : "نسخ الكلمات كاملة بتنسيق هذا الموديل"}
                    </button>

                    {/* Original lyrics sharing block - allows sharing original words to networks */}
                    <div className="w-full grid grid-cols-3 gap-2 mt-1">
                      <a
                        href={getSocialShareLyricsUrl("whatsapp", selectedTrack)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] p-2 flex items-center justify-center gap-1 rounded transition-colors"
                        title="ارسل الكلمات كاملة على واتساب"
                      >
                        واتساب
                      </a>
                      <a
                        href={getSocialShareLyricsUrl("twitter", selectedTrack)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-zinc-800 hover:bg-zinc-700 text-white font-black text-[11px] p-2 flex items-center justify-center gap-1 rounded transition-colors"
                        title="غرّد بالكلمات على إكس"
                      >
                        تويتر / إكس
                      </a>
                      <a
                        href={getSocialShareLyricsUrl("telegram", selectedTrack)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-sky-800 hover:bg-sky-700 text-white font-black text-[11px] p-2 flex items-center justify-center gap-1 rounded transition-colors"
                        title="ارسل كامل الكلمات عبر تليجرام"
                      >
                        تليجرام
                      </a>
                    </div>
                  </div>
                </div>

                {/* Block 2: Format & Style appropriate to the Egyptian Song Style */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center bg-zinc-950 p-2.5 border border-zinc-900 rounded-t">
                    <span className="text-xs font-bold text-[#CCFF00]">
                      🎭 بلوك 2: أدلة الأداء وصيغة الغناء (Performance Sheet)
                    </span>
                    <span className="text-[9px] text-[#CCFF00] font-mono font-bold uppercase bg-[#CCFF00]/10 px-1.5 py-0.5 rounded">
                      {selectedTrack.vocalStyleCategory || "STYLE SINGER"}
                    </span>
                  </div>

                  <div className="w-full h-80 bg-zinc-950/60 p-4 border border-t-0 border-zinc-900 rounded-b text-sm font-sans max-h-80 overflow-y-auto space-y-4" dir="rtl">
                    <div className="text-[11px] text-zinc-500 font-mono pb-2 border-b border-zinc-900 leading-loose text-right">
                      <div className="text-zinc-300 font-black">⚙️ إعدادات الصياغة الحالية لمسرح {selectedTrack.vocalStyleCategory}:</div>
                      • سرعة الإيقاع: {selectedTrack.bpm} ضربة/دقيقة <br/>
                      • قالب النوتة: {selectedTrack.vocalStyleCategory === "Tarab" ? "موشح مقام الراست" : selectedTrack.vocalStyleCategory === "Shaabi" ? "حكواتي حارة" : "مقسوم فيوجن كوزميك"}<br/>
                      • مؤثر الميكس: {selectedTrack.rhythmStyle}
                    </div>

                    <div className="space-y-3.5 pt-1 pr-1.5 border-r border-[#CCFF00]/30 mr-1 text-right">
                      {selectedTrack.lines.map((line, lIdx) => (
                        <div key={lIdx} className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-row-reverse justify-end">
                            <span className="text-[9px] font-mono text-[#00F0FF] uppercase bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">
                              {line.section}
                            </span>
                            
                            {/* Technical and artistic directions in English brackets */}
                            <span className="text-[9px] font-mono bg-[#CCFF00]/15 text-[#CCFF00] px-1.5 py-0.5 rounded border border-[#CCFF00]/10 font-bold truncate max-w-[180px]" title="Musical performance instruction">
                              {line.vocalEffect.startsWith("[") ? line.vocalEffect : `[${line.vocalEffect}]`}
                            </span>
                          </div>
                          
                          {/* Text lyrics in appropriate formatted Arabic song look */}
                          <div className="text-zinc-200 font-black tracking-wide text-xs">
                            {line.text}
                          </div>
                          
                          {/* Pronunciation helpful transcription helper */}
                          <div className="text-[9px] text-zinc-500 italic pr-2">
                             🗣️ نطق: {line.pronunciation}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="text-[10px] text-zinc-500 leading-relaxed text-center mt-1">
                    * يقوم بلوك 2 بتوضيح نوتة الأداء الصوتي مع مخارج الحروف القاهرية المحددة (تحويل القاف همزة) لتطابق التوزيع مع الميكسر وموديلات الـ AI.
                  </p>

                </div>

              </div>

            </div>
          )}
        </div>

        {/* COLUMN 2: MIXER, SOUNDBOARD, LIVE ORGAN & USER FAVORITES PANEL (Scol: 5) */}
        <div className="lg:col-span-5 flex flex-col gap-6">

          {/* GOOGLE INTEGRATED PRODUCTION SUITE (PRO SYSTEM) */}
          <GoogleProductionHub 
            track={selectedTrack}
            googleToken={googleToken}
            currentUser={currentUser}
            googleContacts={googleContacts}
            triggerToast={triggerToast}
            onGoogleLogin={handleGoogleLogin}
          />

          {/* SINGER PROFILE CONSOLE & DIRECT USER FAVORITES (NEW CARD) */}
          {currentUser && (
            <div className="bg-[#111] border-r-4 border-[#CCFF00] p-4 flex flex-col gap-3 shadow rounded-sm">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                <span className="text-xs uppercase font-extrabold text-zinc-300 flex items-center gap-2">
                  <User className="text-[#CCFF00] w-4 h-4" />
                  استوديو الفناّن {currentUser.username} • المفضلة والمحفوظات
                </span>
                <span className="text-[10px] bg-[#CCFF00]/10 text-[#CCFF00] px-2 py-0.5 rounded font-bold">
                  {currentUser.favorites.length} أغنية مفضلة
                </span>
              </div>

              {/* Favorites collection */}
              {currentUser.favorites.length > 0 ? (
                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {tracks
                    .filter(t => currentUser.favorites.includes(t.id))
                    .map(favTrack => (
                      <div 
                        key={favTrack.id}
                        onClick={() => {
                          setSelectedTrack(favTrack);
                          stopPlayback();
                        }}
                        className={`flex items-center justify-between p-2 rounded cursor-pointer transition-all border text-xs ${
                          selectedTrack?.id === favTrack.id 
                            ? "bg-zinc-900 border-[#CCFF00]" 
                            : "bg-zinc-950/60 border-zinc-900 hover:border-zinc-800"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 shrink-0" />
                          <span className="font-extrabold truncate max-w-[140px]">{favTrack.title}</span>
                          <span className="text-[8px] bg-zinc-800 text-zinc-400 px-1 rounded">
                            {favTrack.vocalStyleCategory || "Mahraganat"}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono opacity-80">{favTrack.bpm} BPM</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(favTrack.id);
                            }}
                            className="text-zinc-650 hover:text-rose-500 p-0.5"
                            title="إزالة"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-4 bg-zinc-950/40 rounded border border-zinc-90 w-full">
                  <p className="text-[11px] text-zinc-500">لا يوجد أغانٍ مفضلة حالياً.</p>
                  <p className="text-[10px] text-zinc-650 mt-0.5">اضغط على زر القلب بجانب الأغنية لإدراجها هنا.</p>
                </div>
              )}

              {/* Creator tracks summary */}
              <div className="pt-2 border-t border-zinc-900 flex justify-between text-[11px] text-zinc-450">
                <span>تاريخ الـ AI المصنوع:</span>
                <span className="font-bold text-[#CCFF00]">
                  {tracks.filter(t => t.creator === currentUser.username).length} أغنيات مولدة باسمك
                </span>
              </div>
            </div>
          )}
          
          {/* THE AI PIPELINE / CLOUD BACKEND LAYERS GRAPHIC */}
          <div className="bg-[#CCFF00] text-black p-5 flex flex-col justify-between shadow-2xl relative overflow-hidden">
            <h2 className="text-2xl font-black uppercase leading-none tracking-tighter mb-4">
              AI ARCHITECTURE CONSOLE (ستاموني المطور)
            </h2>
            
            <div className="space-y-4">
              <div className="border-b border-black/20 pb-3 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-sm">
                    <span className="w-2 h-2 rounded-full bg-black animate-ping"></span>
                    <span>01 STAMONI NLP LAYER</span>
                  </div>
                  <p className="text-[11px] font-medium leading-tight text-zinc-850 mt-1">
                    محرك التون والفلترة وتوطين القاف همزة وضبط نهايات النطق القاهري.
                  </p>
                </div>
                <span className="text-[10px] bg-black text-[#CCFF00] px-1.5 py-0.5 font-mono font-bold rounded">
                  {isGenerating ? "معالجة" : "نشط"}
                </span>
              </div>

              <div className="border-b border-black/20 pb-3 flex items-start justify-between">
                <div>
                  <div className="font-bold text-sm flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-black animate-bounce' : 'bg-black/40'}`}></span>
                    <span>02 AUDIO DIFFUSION BEAT ENGINE</span>
                  </div>
                  <p className="text-[11px] font-medium leading-tight text-zinc-850 mt-1">
                    توليد الإيقاعات الحية والمقسومات والمزامير بمحرك الويب المطور.
                  </p>
                </div>
                <span className="text-[10px] bg-black text-[#CCFF00] px-1.5 py-0.5 font-mono font-bold rounded">
                  {isPlaying ? "توليف" : "جاهز"}
                </span>
              </div>

              <div className="pb-2 flex items-start justify-between">
                <div>
                  <div className="font-bold text-sm flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-850 animate-pulse' : 'bg-black/40'}`}></span>
                    <span>03 VOCAL VOCALSYNTH (TTS)</span>
                  </div>
                  <p className="text-[11px] font-medium leading-tight text-zinc-850 mt-1">
                    محاكاة العُرَب وطريقة أداء مطربي الشعبي عن طريق توجيه نبرة الإلقاء والطبقة الموازنة.
                  </p>
                </div>
                <span className="text-[10px] bg-black text-[#CCFF00] px-1.5 py-0.5 font-mono font-bold rounded">
                  {isPlaying ? "غناء" : "جاهز"}
                </span>
              </div>
            </div>

            <div className="mt-3 font-mono text-[9px] uppercase bg-black text-[#CCFF00] p-1.5 text-center tracking-tight">
              PostgreSQL / MongoDB / Custom Vocal Synthesis Engine Active
            </div>
          </div>

          {/* REALTIME SOUND MIXER PANEL (ميكسر استوديو الحارة) */}
          <div className="bg-zinc-950 p-6 border border-zinc-900 shadow rounded flex flex-col gap-4">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
              <span className="text-xs uppercase font-extrabold text-[#CCFF00] flex items-center gap-1">
                <Sliders className="w-4 h-4 text-[#CCFF00]" />
                ميكسر استوديو الحارة التفاعلي (Mixer Desk)
              </span>
              <span className="text-[9px] bg-zinc-900 text-zinc-300 font-mono px-2 py-0.5 rounded border border-zinc-800">
                LIVE OUTPUT
              </span>
            </div>

            {/* Mixer controls list */}
            <div className="space-y-3 pt-2">
              
              {/* Master volume info */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-300 font-bold">الماستر الرئيسي (Master Vol)</span>
                  <span className="text-[#CCFF55] font-mono">{(mixer.masterVol * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={mixer.masterVol}
                  onChange={(e) => setMixer(prev => ({ ...prev, masterVol: Number(e.target.value) }))}
                  className="w-full h-1 bg-zinc-900 rounded appearance-none cursor-pointer accent-[#CCFF00]"
                />
              </div>

              {/* Mezmar synth volume info */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-300 font-bold">صوت المزمار والأورج اليدوي</span>
                  <span className="text-[#CCFF55] font-mono">{(mixer.synthVol * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={mixer.synthVol}
                  onChange={(e) => setMixer(prev => ({ ...prev, synthVol: Number(e.target.value) }))}
                  className="w-full h-1 bg-zinc-900 rounded appearance-none cursor-pointer accent-[#CCFF00]"
                />
              </div>

              {/* Bass Kick volume info */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-300 font-bold">بوم الباص والدرامز (Bass Drum)</span>
                  <span className="text-[#CCFF55] font-mono">{(mixer.beatVol * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={mixer.beatVol}
                  onChange={(e) => setMixer(prev => ({ ...prev, beatVol: Number(e.target.value) }))}
                  className="w-full h-1 bg-zinc-900 rounded appearance-none cursor-pointer accent-[#CCFF00]"
                />
              </div>

              {/* Tabla volume info */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-300 font-bold">الدم تك وإيقاع الطبلة (Tabla)</span>
                  <span className="text-[#CCFF55] font-mono">{(mixer.tablaVol * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={mixer.tablaVol}
                  onChange={(e) => setMixer(prev => ({ ...prev, tablaVol: Number(e.target.value) }))}
                  className="w-full h-1 bg-[#151515] rounded appearance-none cursor-pointer accent-[#CCFF00]"
                />
              </div>

              {/* Vocal Volume speech */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-300 font-bold">مستوى غناء المطرب (Sing Volume)</span>
                  <span className="text-[#CCFF55] font-mono">{(mixer.vocalVol * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={mixer.vocalVol}
                  onChange={(e) => setMixer(prev => ({ ...prev, vocalVol: Number(e.target.value) }))}
                  className="w-full h-1 bg-zinc-900 rounded appearance-none cursor-pointer accent-[#CCFF00]"
                />
              </div>

              {/* Vocal Pitch Tuning sliders */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-0.5">طبقة صوت المغني</label>
                  <input 
                    type="range"
                    min="0.6"
                    max="1.7"
                    step="0.05"
                    value={mixer.vocalPitch}
                    onChange={(e) => setMixer(prev => ({ ...prev, vocalPitch: Number(e.target.value) }))}
                    className="w-full h-1 bg-zinc-900 appearance-none cursor-pointer accent-[#00F0FF]"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-0.5">سرعة الإلقاء الصوتي</label>
                  <input 
                    type="range"
                    min="-0.6"
                    max="0.8"
                    step="0.1"
                    value={mixer.vocalSpeechRate}
                    onChange={(e) => setMixer(prev => ({ ...prev, vocalSpeechRate: Number(e.target.value) }))}
                    className="w-full h-1 bg-zinc-900 appearance-none cursor-pointer accent-[#00F0FF]"
                  />
                </div>
              </div>

              {/* Sound filters and processors toggles */}
              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-300">
                  <input
                    type="checkbox"
                    checked={mixer.reverbActive}
                    onChange={(e) => setMixer(prev => ({ ...prev, reverbActive: e.target.checked }))}
                    className="accent-[#CCFF00] rounded focus:ring-0"
                  />
                  صدى صوت الحارة
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-300">
                  <input
                    type="checkbox"
                    checked={mixer.mufflerActive}
                    onChange={(e) => setMixer(prev => ({ ...prev, mufflerActive: e.target.checked }))}
                    className="accent-[#CCFF00] rounded focus:ring-0"
                  />
                  فلتر كاسيت مشوش
                </label>
              </div>

            </div>
          </div>

          {/* DYNAMIC REALTIME SEQUENCER / MATRIX GRID TRACKER */}
          <div className="bg-zinc-950 p-4 border border-zinc-900 rounded">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs uppercase font-extrabold text-[#CCFF00] flex items-center gap-1">
                <Tv className="w-4 h-4 text-[#CCFF00]" />
                مخطط تسلسل الإيقاعات (16-Step Beat Tracker)
              </span>
              <span className="text-[9px] text-[#00F0FF] font-mono animate-pulse">
                {isPlaying ? "RUNNING BEAT" : "STOPPED"}
              </span>
            </div>
            
            {/* 16 grid step buttons showing the sequencer loop bar lighting up */}
            <div className="grid grid-cols-8 gap-2">
              {Array.from({ length: 16 }).map((_, stepIdx) => {
                const isCurrent = currentStep === stepIdx && isPlaying;
                
                // Mahragan classic signature beats steps highlight
                const hasKick = [0, 6, 8, 12].includes(stepIdx);
                const hasTabla = [2, 4, 10, 14].includes(stepIdx);

                let colorClass = "bg-zinc-900 border-zinc-805 text-zinc-650";
                if (isCurrent) {
                  colorClass = "bg-[#CCFF00] text-black border-[#CCFF00] font-bold shadow-md scale-105";
                } else if (hasKick) {
                  colorClass = "bg-rose-950/40 border-rose-900/40 text-rose-400";
                } else if (hasTabla) {
                  colorClass = "bg-cyan-950/40 border-cyan-900/40 text-[#00F0FF]";
                }

                return (
                  <div 
                    key={stepIdx} 
                    className={`p-1.5 text-center text-[10px] font-mono border rounded transition-all duration-100 ${colorClass}`}
                  >
                    {stepIdx + 1}
                    <div className="text-[8px] scale-90 opacity-60">
                      {hasKick ? "بوم" : hasTabla ? "تك" : "سكت"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STREET PARTY LIVE CONTROLS & EFFECTS (سرينات اللقطة) */}
          <div className="bg-zinc-950 p-4 border border-zinc-900 shadow rounded flex flex-col gap-3">
            <span className="text-xs uppercase font-extrabold text-[#CCFF00] flex items-center gap-1 pb-1 border-b border-zinc-900">
              <Flame className="w-4 h-4 text-[#CCFF00]" />
              سرينات حفلات الحارة المباشرة (Shaabi Soundboard)
            </span>
            
            <div className="grid grid-cols-3 gap-3 pt-1">
              <button 
                onClick={triggerSiren}
                className="bg-zinc-900 hover:bg-[#CCFF00] hover:text-black border border-zinc-800 p-3 rounded font-bold text-xs flex flex-col items-center gap-1.5 transition-all text-zinc-300 cursor-pointer"
              >
                🚨
                <span>سرينة هيلكوبتر</span>
              </button>

              <button 
                onClick={triggerGunshot}
                className="bg-zinc-900 hover:bg-[#CCFF00] hover:text-black border border-zinc-800 p-3 rounded font-bold text-xs flex flex-col items-center gap-1.5 transition-all text-zinc-300 cursor-pointer"
              >
                💥
                <span>ضرب نار متتالي</span>
              </button>

              <button 
                onClick={triggerLaser}
                className="bg-zinc-900 hover:bg-[#CCFF00] hover:text-black border border-zinc-800 p-3 rounded font-bold text-xs flex flex-col items-center gap-1.5 transition-all text-zinc-300 cursor-pointer"
              >
                ⚡
                <span>ليزرات المجيكو</span>
              </button>
            </div>
          </div>

          {/* GLOWING REALTIME FREQUENCY CANVAS */}
          <div className="bg-[#111] p-3 border border-zinc-900 rounded relative overflow-hidden h-24">
            <canvas 
              ref={canvasRef} 
              width={280} 
              height={80} 
              className="w-full h-full block" 
            />
            <div className="absolute bottom-1 right-2 pointer-events-none">
              <span className="text-[9px] font-bold text-[#CCFF00]/60 font-mono tracking-widest uppercase">
                STAMONI VISUAL BUFFER • 44.1 KHZ
              </span>
            </div>
          </div>

          {/* FOLK ORGAN KEYBOARD PLAYGROUND (أورج الحارة الإلكتروني) */}
          <div className="bg-[#111] border-r-4 border-[#CCFF00] p-4 flex flex-col gap-2 shadow rounded">
            <div className="flex justify-between items-center mb-2 pb-1 border-b border-zinc-900">
              <span className="text-xs uppercase font-extrabold text-zinc-350">
                🎹 العب مع الإيقاع! أورج ستاموني الإلكتروني (Folk Keyboard)
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                مقياس حجاز كار (Double Harmonic)
              </span>
            </div>

            {/* Note keys mapping layout */}
            <div className="grid grid-cols-8 gap-2">
              {KEYBOARD_KEYS.map((key) => {
                const isGlowing = isKeyboardGlow === key.note;
                return (
                  <button
                    key={key.note}
                    onClick={() => playKeyboardLive(key.freq, key.note)}
                    className={`${
                      isGlowing 
                        ? "bg-[#CCFF00] text-black scale-95" 
                        : "bg-zinc-950 text-zinc-300 border-zinc-900 hover:border-[#CCFF00]"
                    } border p-3 rounded flex flex-col items-center justify-between h-20 transition-all cursor-pointer`}
                  >
                    <span className="text-[10px] font-bold tracking-tight block max-w-full text-center truncate">
                      {key.label}
                    </span>
                    <span className="text-[8px] font-mono text-zinc-500 block">
                      [{key.shortcut}]
                    </span>
                    <span className="text-[9px] block text-zinc-400 font-mono">
                      {key.note}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* HISTORICAL CREATED QUEUE & SELECTED ARCHIVES */}
          <div className="bg-zinc-950 p-4 border border-zinc-905 rounded">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs uppercase font-extrabold text-[#00F0FF]">
                مكتبة الأغاني والمهرجانات الجاهزة (Tracks Library)
              </span>
              <span className="text-[9px] bg-[#00F0FF]/10 text-[#00F0FF] px-2 py-0.5 rounded border border-[#00F0FF]/20 font-mono">
                SHARED DISCOVERY
              </span>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto">
              {tracks.map((track) => (
                <div 
                  key={track.id}
                  onClick={() => {
                    setSelectedTrack(track);
                    stopPlayback();
                  }}
                  className={`flex flex-col p-2.5 rounded cursor-pointer transition-all border ${
                    selectedTrack?.id === track.id 
                      ? "bg-zinc-900 border-[#CCFF00]" 
                      : "bg-zinc-900/40 border-zinc-905 hover:bg-zinc-900 hover:border-zinc-800"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Disc className={`w-5 h-5 text-zinc-400 shrink-0 ${selectedTrack?.id === track.id && isPlaying ? "animate-spin text-[#CCFF00]" : ""}`} />
                      <div>
                        <div className="text-sm font-bold text-zinc-200">{track.title}</div>
                        <div className="text-[10px] uppercase font-mono text-zinc-500 flex items-center gap-1.5 mt-0.5">
                          <span className="text-[#00F0FF] font-sans font-bold">
                            [{track.vocalStyleCategory || "Mahraganat"}]
                          </span>
                          <span>{track.rhythmStyle} • {track.bpm} BPM</span>
                          {track.creator && (
                            <span className="text-amber-500 font-sans font-bold">
                              • بقلم: {track.creator}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(track.id);
                        }}
                        className="text-zinc-500 hover:text-rose-500 p-1 cursor-pointer"
                        title="أعجبني"
                      >
                        <Heart className={`w-3.5 h-3.5 ${currentUser && currentUser.favorites.includes(track.id) ? "fill-rose-500 text-rose-500" : ""}`} />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyShareLink(track);
                        }}
                        className="text-zinc-500 hover:text-[#00F0FF] p-1 cursor-pointer"
                        title="شارك الأغنية"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* MINI SOCIAL SHARE BAR FOR EACH ITEM */}
                  {selectedTrack?.id === track.id && (
                    <div className="mt-2.5 pt-2 border-t border-zinc-800 flex justify-between items-center text-[10px] text-zinc-400">
                      <span>رابط الأغنية جاهز:</span>
                      <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => copyShareLink(track)}
                          className="hover:text-white flex items-center gap-1 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800"
                        >
                          <Clipboard className="w-2.5 h-2.5" />
                          <span>نسخ الرابط</span>
                        </button>
                        <a 
                          href={getSocialShareUrl("whatsapp", track)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-emerald-400 text-emerald-500 font-bold"
                        >
                          واتساب
                        </a>
                        <a 
                          href={getSocialShareUrl("twitter", track)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-sky-300 text-[#00F0FF] font-bold"
                        >
                          إكس
                        </a>
                      </div>
                    </div>
                  )}

                </div>
              ))}
            </div>
          </div>

        </div>

      </main>

      {/* EDUCATIONAL & ENTERTAINMENT SECTION - FOLK INSTRUMENTS MUSEUM */}
      <div className="mt-12 mb-8">
        <FolkInstrumentsMuseum />
      </div>

      {/* FOOTER - Technical details and Credits */}
      <footer className="mt-8 pt-6 border-t border-zinc-900 flex flex-col sm:flex-row justify-between items-center font-mono text-[10px] uppercase tracking-widest text-zinc-500 gap-4">
        <div>
          ستاموني مبني على معمارية الخدمات المصغرة • Web Audio API Core • Gemini Flash AI Synths
        </div>
        <div>
          © {new Date().getFullYear()} STAMONI AI SYSTEMS • CAIRO / EGYPT
        </div>
      </footer>

      {/* PLATFORM ADAPTOR MODAL popup */}
      {isAdaptorModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in" dir="rtl">
          <div className="bg-zinc-950 border-4 border-[#00F0FF] max-w-2xl w-full rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,240,255,0.25)] flex flex-col relative">
            
            {/* Laser line border decorative */}
            <div className="h-1 bg-gradient-to-r from-transparent via-[#00F0FF] to-transparent w-full" />
            
            {/* Header */}
            <div className="p-5 border-b border-zinc-900 flex justify-between items-center bg-zinc-950/90">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30 rounded">🎛️</span>
                <div className="text-right">
                  <h3 className="font-black text-base text-[#00F0FF] tracking-tight">مهايئ ومُهندس تهيئة الذكاء الاصطناعي</h3>
                  <p className="text-[10px] text-zinc-400">قم بملائمة وتصدير كلمات المهرجان كمسار ذكي لـ Suno AI أو Udio AI أو DAW</p>
                </div>
              </div>
              
              <button 
                onClick={() => setIsAdaptorModalOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 max-h-[80vh]">
              
              {/* Formulating the External platform Selector Questions */}
              <div className="space-y-3">
                <p className="text-xs text-zinc-350 font-bold mb-2 text-right">
                  أختر مولد الموسيقى الخارجي المستهدف لتوليد الأكواد المناسبة له:
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-right">
                  {EXPORT_PLATFORMS.map((platform) => {
                    const isActive = exportPlatform === platform.id;
                    return (
                      <button
                        key={platform.id}
                        type="button"
                        onClick={() => {
                          setExportPlatform(platform.id);
                        }}
                        className={`text-right p-3.5 border rounded-xl transition-all cursor-pointer flex flex-col justify-between ${
                          isActive 
                            ? "bg-zinc-900 border-[#00F0FF] text-[#00F0FF] ring-2 ring-[#00F0FF]/25 scale-[1.01]" 
                            : "bg-zinc-950 text-zinc-400 border-zinc-900 hover:border-zinc-800"
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="text-xs font-black">{platform.name}</span>
                          <span className="text-[9px] font-mono text-zinc-500 bg-zinc-950 px-1.5 py-0.5 rounded">{platform.id.toUpperCase()}</span>
                        </div>
                        <p className={`text-[10px] mt-2 leading-tight ${isActive ? "text-zinc-300" : "text-zinc-500"} font-medium`}>
                          {platform.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Results view customized */}
              {selectedTrack ? (
                <div className="space-y-3 pt-3 border-t border-zinc-900 text-right">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-450 font-bold">📋 كلمات منسقة وملائمة وجاهزة للنسخ الفوري:</span>
                    <span className="text-[9px] bg-slate-900 border border-slate-800 text-zinc-350 px-2 rounded font-mono font-bold">
                      {exportPlatform.toUpperCase()} COMPATIBLE
                    </span>
                  </div>

                  <textarea
                    readOnly
                    onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                    className="w-full h-56 bg-zinc-950 text-zinc-350 text-xs font-mono p-4 border border-zinc-900 rounded-xl resize-none leading-relaxed select-all block outline-none text-right"
                    value={formatLyrics(selectedTrack, exportPlatform)}
                    dir="ltr"
                  />

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(formatLyrics(selectedTrack, exportPlatform));
                        setCopiedLyrics(true);
                        setToastMessage("تم النسخ بنجاح للتصدير الفوري لمولد الذكاء الاصطناعي!");
                        setIsToastActive(true);
                        setTimeout(() => {
                          setCopiedLyrics(false);
                          setIsToastActive(false);
                        }, 2000);
                      }}
                      className="flex-1 bg-[#00F0FF] hover:bg-white text-black font-black p-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                    >
                      <Clipboard className="w-4 h-4" />
                      {copiedLyrics ? "تم النسخ بنجاح!" : "نسخ الكود والكلمات جاهزة للمولد الخارجي"}
                    </button>
                    
                    <button
                      onClick={() => setIsAdaptorModalOpen(false)}
                      className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 text-zinc-300 font-black px-5 py-3 rounded-lg text-xs cursor-pointer"
                    >
                      حفظ وإغلاق
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-850 text-center text-xs text-zinc-400">
                  يرجى تحديد مهرجان أو توليد كلمات الأغنية أولاً حتى تلائمها وتصدرها.
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}
