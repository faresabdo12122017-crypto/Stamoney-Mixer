import React, { useState, useEffect, useRef } from "react";
import { 
  Music, 
  BookOpen, 
  Gamepad2, 
  Volume2, 
  Trophy, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  ChevronRight,
  Sparkles,
  Award,
  Sliders,
  Radio,
  Eye,
  Disc,
  Smartphone,
  Check,
  Star,
  Activity,
  Flame,
  VolumeX,
  Plus,
  Compass,
  Zap,
  HelpCircle
} from "lucide-react";

// Types for our Instruments
interface FolkInstrument {
  id: string;
  name: string;
  nameEn: string;
  category: "string" | "wind" | "percussion";
  imageEmoji: string;
  historyAr: string;
  styleAr: string;
  notes: { name: string; freq: number; maqamNote?: string }[];
  funFactAr: string;
}

// Traditional instruments dataset with structural Maqam notes mapping
const FOLK_INSTRUMENTS: FolkInstrument[] = [
  {
    id: "oud",
    name: "العود الشرقي",
    nameEn: "Oud (The Lute)",
    category: "string",
    imageEmoji: "🎻",
    historyAr: "يُعتبر العود 'ملك الآلات الموسيقية الشرقية'. تعود جذوره إلى آلاف السنين في مصر القديمة وبلاد الرافدين. تتميز نغماته بالدفء والعمق ويرتكز عليها التخت الشرقي الكلاسيكي.",
    styleAr: "طريقة اللعب تعتمد على ريشة مخصصة للنقر على أوتاره المزدوجة بضربات 'راست' و'محيّر'. يُعرف بالسلطنة والارتجال الطربي البديهي.",
    notes: [
      { name: "دو (C3)", freq: 130.81, maqamNote: "قرار راست" },
      { name: "ري (D3)", freq: 146.83, maqamNote: "دوكاه" },
      { name: "مي بيمول (Eb3)", freq: 155.56, maqamNote: "كردي" },
      { name: "فا (F3)", freq: 174.61, maqamNote: "جهاركاه" },
      { name: "صول (G3)", freq: 196.00, maqamNote: "نوى" },
      { name: "لا بيمول (Ab3)", freq: 207.65, maqamNote: "شوري" },
      { name: "سي بيمول (Bb3)", freq: 233.08, maqamNote: "أوج" },
      { name: "دو (C4)", freq: 261.63, maqamNote: "كردان رنين" }
    ],
    funFactAr: "العود الشرقي لا يحتوي على فواصل عمودية (Frets) على عنقه، مما يسمح للعازف بالنفاذ المطلق لعزف الربع تون وتعديل المقامات الحجازية بحرية كاملة!"
  },
  {
    id: "nay",
    name: "الناي البلدي",
    nameEn: "Nay (Bamboo Flute)",
    category: "wind",
    imageEmoji: "🌬️",
    historyAr: "من أقدم آلات النفخ البسيطة، مصنوع من نبات القصب المجوف ويحتوي على سبعة ثقوب. صُور على جدران المعابد الفرعونية، رمزه هو الروحانية والشجن البالغ الدفء والمناجاة.",
    styleAr: "يعتمد الصوت على مهارة عزل شفة العازف وضخ زاوية الهواء الساقطة، مما يمنحه تنهيدة صوتية دافئة ومزروعة بخشونة ترابية فريدة.",
    notes: [
      { name: "ري (D4)", freq: 293.66, maqamNote: "دوكاه مستقيم" },
      { name: "مي نصف بيمول (Eq4)", freq: 311.13, maqamNote: "سيكاه بلدي" },
      { name: "فا (F4)", freq: 349.23, maqamNote: "جهاركاه" },
      { name: "صول (G4)", freq: 392.00, maqamNote: "نوى دافئ" },
      { name: "لا (A4)", freq: 440.00, maqamNote: "حسيني" },
      { name: "سي بيمول (Bb4)", freq: 466.16, maqamNote: "عجم رفيع" },
      { name: "دو (C5)", freq: 523.25, maqamNote: "جواب جهار" },
      { name: "ري (D5)", freq: 587.33, maqamNote: "جواب دوكاه" }
    ],
    funFactAr: "العازف المحترف يغير نبرة صوته ونصف التونات بتبديل زاوية ميله ورأسه أثناء النفخ، ومجموعته القياسية تسمى 'البند' وتضم عادةً تسعة نايمختلفة الأطوال."
  },
  {
    id: "mizmar",
    name: "المزمار الصعيدي",
    nameEn: "Mizmar (Folk Oboe)",
    category: "wind",
    imageEmoji: "🎺",
    historyAr: "بوق شعبي مزدوج الريشة ومصنوع من خشب المشمش الصلب. هو سيد الاحتفالات الشعبية وصاجات الأفراح وصعيد مصر، نبرته حادة للغاية وثاقبة يمكن سماعها من مسافات بعيدة جداً.",
    styleAr: "يديره العازف بتقنية 'التنفس الدائري' (النفخ المستمر دون توقف لأخذ شهيق)، ممتزجاً مع دقات الطبل البلدي الصاخبة في قلب الحارة.",
    notes: [
      { name: "صول (G4)", freq: 392.00, maqamNote: "نوى صاخب" },
      { name: "لا بيمول (Ab4)", freq: 415.30, maqamNote: "حجاز بوق" },
      { name: "سي (B4)", freq: 493.88, maqamNote: "سهم الشارع" },
      { name: "دو (C5)", freq: 523.25, maqamNote: "بحر النحاس" },
      { name: "ري (D5)", freq: 587.33, maqamNote: "عروس النيل" },
      { name: "مي بيمول (Eb5)", freq: 622.25, maqamNote: "كردي حاد" },
      { name: "فا جهر (F#5)", freq: 698.46, maqamNote: "صوت الرعد" },
      { name: "صول (G5)", freq: 783.99, maqamNote: "رنين الصعيد" }
    ],
    funFactAr: "المزمار مصمم عمداً لإحداث رنين وتردد مضخم للغاية للتغلب على ضوضاء تجمعات الأفراح والساحات الصعيدية المفتوحة ويُصنع جرس البوق من النحاس الخالص أحياناً!"
  },
  {
    id: "tabla",
    name: "الدرابكة والتابلة",
    nameEn: "Tabla (Darabukka)",
    category: "percussion",
    imageEmoji: "🥁",
    historyAr: "العمود الفقري الحركي لكل إيقاعات الرقص الشعبي والمقسوم. إناء مصنوع من الطين الفخاري أو الألمنيوم ومغطى بجلد الماعز أو البلاستيك المقوى، يمنح الموسيقى لغتها الرياضية الساحرة.",
    styleAr: "يتم العزف بكلتا اليدين بطرق أساسية: ضربة وسط الطبلة تسمى 'دم' (جهورية عميقة)، ونقر أطراف الطبلة يسمى 'تك' (حادة وسريعة)، وكتم الصوت يسمى 'صك'.",
    notes: [
      { name: "دمْ (Doum Bass)", freq: 110.00, maqamNote: "الريشة الغليظة" },
      { name: "تكْ (Tak Rim)", freq: 880.00, maqamNote: "حافة الإبهام" },
      { name: "صكْ (Mute Kah)", freq: 350.00, maqamNote: "صفعة الكتم" },
      { name: "رول مكرر (Roll)", freq: 600.00, maqamNote: "موجة الزحف" }
    ],
    funFactAr: "المستمع الشعبي يميز جودة الضريب على الطبلة من سرعة حركات أصابعه الدقيقة وصوت الـ 'شخللة' الذي يزيد الحضور بهجة وانتشاءً."
  },
  {
    id: "riq",
    name: "الرق وصاجات الحارة",
    nameEn: "Riq (Tambourine)",
    category: "percussion",
    imageEmoji: "🔔",
    historyAr: "دف صغير محاط بأزواج من الصلاصل المعدنية ذات الصوت النحاسي الرنان. هو ضابط الإيقاع الرئيسي في التخت الشرقي ويحرك حركة العازفين بدق براهينه الدقيقة.",
    styleAr: "يُعزف بأصابع اليدين بطرق معقدة ومحترفة تشمل الصدمات الفردية، وشخللة الصاجات الجانبية، والاهتزازات المتناغمة مع المقسوم.",
    notes: [
      { name: "دم معدني (Doum)", freq: 160.00, maqamNote: "ميزان نحاسي" },
      { name: "صاجات حادة (Jingle)", freq: 2800.00, maqamNote: "نبرة الكأس" },
      { name: "نقرة حافة (Rim)", freq: 950.00, maqamNote: "خاتم الإيقاع" },
      { name: "رشة سريعة (Shake)", freq: 5000.00, maqamNote: "حمحمة النحاس" }
    ],
    funFactAr: "الرق الصغير قد يبدو بسيطاً، لكنه يُعتبر من أصعب الآلات الإيقاعية لإستلزامه تحكماً مستقلاً نادراً لكل إصبع في اليدين للتحكم في رنين النحاس الصغير!"
  },
  {
    id: "rababa",
    name: "الربابة الصعيدية",
    nameEn: "Rababa (Spike Fiddle)",
    category: "string",
    imageEmoji: "🎻",
    historyAr: "آلة وترية شعبية قديمة تعتمد على القوس وصندوق رنين مصنوع من جوز الهند المغطى بجلد السمك أو الماعز. هي رفيقة حكواتي المقهى الشعبي في سرد سيرة بني هلال الشعبية والأفراح الريفية.",
    styleAr: "تُوضع عمودياً على ركبة العازف ويتم العزف عليها بجر القوس المصنوع من شعر حصان مع تحريك أصابع اليد اليسرى بخفة لزحلقة النغمات الحزينة الحارة.",
    notes: [
      { name: "لا (A3)", freq: 220.00, maqamNote: "مطلع السيرة" },
      { name: "سي نصف بيمول (Bq3)", freq: 235.00, maqamNote: "أبا زيد الهلالي" },
      { name: "دو (C4)", freq: 261.63, maqamNote: "دياب بن غانم" },
      { name: "ري (D4)", freq: 293.66, maqamNote: "شجو الرحيل" },
      { name: "مي بيمول (Eb4)", freq: 311.13, maqamNote: "عتاب قديم" },
      { name: "صول (G4)", freq: 392.00, maqamNote: "رنين المقام" }
    ],
    funFactAr: "الربابة لا نوتة رسمية ثابتة لها، بل تُصنع وتُدوزن تلقائياً ويدوياً بناءً على طبقة صوت الحكواتي أو الشاعر الذي سيتغنى بالسيرة خلفها!"
  }
];

// Interactive Education Lessons (Google Play Academy Style)
interface AcademyLesson {
  id: string;
  title: string;
  titleEn: string;
  badge: string;
  difficulty: "مبتدئ" | "متوسط" | "محترف";
  storyAr: string;
  staveFormula: string;
  colorGrade: string;
  duration: string;
  testQuiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

const ACADEMY_LESSONS: AcademyLesson[] = [
  {
    id: "maqam_hijaz",
    title: "مقام الحجاز الأصيل",
    titleEn: "Maqam Hijaz Secrets",
    badge: "سر السلطنة",
    difficulty: "مبتدئ",
    storyAr: "يعتبر مقام الحجاز من أبهى وأشجى المقامات الشرقية. يرتكز في بنيته على تباعد مميز جداً وطويل بين الدرجة الثانية والثالثة (البعد المفرط)، مما يمنحه غموضاً ودفئاً صحراوياً يمس القلوب فوراً في الموال والمزمار.",
    staveFormula: "ري - مي بيمول - فا دييز - صول",
    colorGrade: "from-amber-600 via-yellow-500 to-orange-500",
    duration: "٣ دقائق",
    testQuiz: {
      question: "ما الشعور الفني الأكثر وضوحاً عند سماع مقام الحجاز؟",
      options: [
        "الفرح القوي والقفز السريع",
        "الغموض، الدفء التراثي، والوقار الشجي",
        "الموسيقى الإلكترونية الصاخبة فقط",
        "الملل والرتامة والرغبة في النوم"
      ],
      correctIndex: 1,
      explanation: "مقام الحجاز بنغماته الحارة يوفر عمقاً روحانياً دافئاً، وهو العمود الفقري للمواويل والنداءات الشعبية المصرية."
    }
  },
  {
    id: "said_beat",
    title: "سر نقر السعيدي والربحة",
    titleEn: "Saidi Beat Patterns",
    badge: "ميزان الصعيد",
    difficulty: "متوسط",
    storyAr: "إذا أردت للناس أن ترقص بالتحطيب والعصا، فعليك بإيقاع الصعيد الناري (تفجير الدُم)! يعتمد الدستور الإيقاعي هنا على مضاعفة ضربة دُم دافئة في بدايته (دُم - دُم - تَك) ليهتز الرقص على الأرض بقوة مضاعفة.",
    staveFormula: "دمْ - دمْ - تكْ - دمْ - تكْ",
    colorGrade: "from-cyan-600 via-sky-500 to-emerald-500",
    duration: "٤ دقائق",
    testQuiz: {
      question: "ما الذي يميز وزن السعيدي الأصيل عن المقسوم العادي؟",
      options: [
        "أنه يحتوي على ٢٤ آلة عود في نفس الوقت",
        "يبدأ بضربة (دُم) مزدوجة ثقيلة ومخصصة للتحطيب",
        "أنه هادئ جداً ويُعزف بالناي فحسب",
        "أنه لا يُعزف إلا نهاراً تحت حرارة الشمس"
      ],
      correctIndex: 1,
      explanation: "الـ (دُم) المزدوجة المتتالية في الإيقاع السعيدي تمنحه زخماً رعدياً يتناسب مع الفخر والخيالة وتلاحم العصام الشعبية."
    }
  },
  {
    id: "circular_breathing",
    title: "التنفس الدائري في المزمار",
    titleEn: "Circular Breathing Technique",
    badge: "سر الاستدامة",
    difficulty: "محترف",
    storyAr: "هل تساءلت يوماً كيف ينفخ عازف المزمار البلدي لدقائق طويلة بدون توقف لالتقاط أنفاسه؟ إنه يستخدم تقنية 'التنفس الدائري' الأسطورية! حيث يدخر عازف المزمار الهواء الفائض في وجنتيه لينفخه بينما يتنفس ببطء عبر أنفه.",
    staveFormula: "تثبيت ضغط الوجنتين والنفخ المستدام",
    colorGrade: "from-red-600 via-pink-500 to-violet-500",
    duration: "٥ دقائق",
    testQuiz: {
      question: "كيف يواصل عازف المزمار البلدي النفخ دون أن يختنق؟",
      options: [
        "عن طريق الاستلقاء على الأرض أثناء العزف",
        "بشرب الكثير من الماء البارد قبل الحفلة",
        "بتقنية تخزين الهواء بالوجنتين للاستمرار والشهيق من الأنف",
        "عن طريق عازف بديل يختبئ خلفه تماماً"
      ],
      correctIndex: 2,
      explanation: "التنفس الدائري يمرن الوجنتين لتعمل كمخزن هواء مؤقت يضخ النبض بانتظام أثناء قيام الرئة بإعادة شحن الأكسجين بالتزامن."
    }
  }
];

// Game rhythms definition
interface RhythmPattern {
  name: string;
  nameEn: string;
  steps: { instId: "tabla" | "riq"; hitType: "دم" | "تك" | "صاجات" | "صك" }[];
  descriptionAr: string;
}

const RHYTHM_PATTERNS: RhythmPattern[] = [
  {
    name: "إيقاع المقسوم البلدي (الأساسي)",
    nameEn: "Classic Maksoum Rhythm",
    descriptionAr: "الإيقاع الشعبي الأشهر والأكثر مبهجاً. نمطه الأساسي: دم - تك - تك - دم - تك.",
    steps: [
      { instId: "tabla", hitType: "دم" },
      { instId: "riq", hitType: "صاجات" },
      { instId: "tabla", hitType: "تك" },
      { instId: "tabla", hitType: "دم" },
      { instId: "tabla", hitType: "تك" }
    ]
  },
  {
    name: "إيقاع السعيدي (الربحة)",
    nameEn: "Saidi Rhythm (Dancing)",
    descriptionAr: "إيقاع حماسي ثقيل مخصص للرقص بالعصا والتحطيب. يتميز بدم مزدوجة في البداية: دم - دم - تك - دم - تك.",
    steps: [
      { instId: "tabla", hitType: "دم" },
      { instId: "tabla", hitType: "دم" },
      { instId: "riq", hitType: "صاجات" },
      { instId: "tabla", hitType: "دم" },
      { instId: "tabla", hitType: "تك" }
    ]
  },
  {
    name: "مهرجانات الشارع السريعة",
    nameEn: "Modern Electro Shaabi Beat",
    descriptionAr: "وزن المهرجانات الإلكتروني السريع. ضربات عشوائية متسارعة تلهب السامعين: دم - صك - تك - دم - صاجات.",
    steps: [
      { instId: "tabla", hitType: "دم" },
      { instId: "tabla", hitType: "صك" },
      { instId: "tabla", hitType: "تك" },
      { instId: "tabla", hitType: "دم" },
      { instId: "riq", hitType: "صاجات" }
    ]
  }
];

export const FolkInstrumentsMuseum: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"museum" | "dj_pads" | "academy">("museum");
  const [selectedInst, setSelectedInst] = useState<FolkInstrument>(FOLK_INSTRUMENTS[0]);
  const [isCtxRunning, setIsCtxRunning] = useState(false);
  const [volume, setVolume] = useState(0.85);

  // Pro DJ Deck Modulator States
  const [pitchBend, setPitchBend] = useState<number>(0); // cents shift (-600 to +600)
  const [cutoffFilter, setCutoffFilter] = useState<number>(1800); // Lowpass cutoff (150 to 4500Hz)
  const [delayFeedback, setDelayFeedback] = useState<number>(0.3); // delay decay (0 to 0.8)
  const [distortionDrive, setDistortionDrive] = useState<number>(2); // clipping level (0 to 10)
  const [discRotation, setDiscRotation] = useState<number>(0); // visual spin degrees
  const [pulseMeter, setPulseMeter] = useState<number>(0); // flash strength for VU meter

  // Academy dashboard states
  const [selectedLesson, setSelectedLesson] = useState<AcademyLesson>(ACADEMY_LESSONS[0]);
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [userStars, setUserStars] = useState<Record<string, number>>({}); // record of stars won
  const [lessonProgress, setLessonProgress] = useState<Record<string, boolean>>({}); // read status

  // Game/Pad states
  const [gameLevel, setGameLevel] = useState(0);
  const [gameState, setGameState] = useState<"idle" | "playing_pattern" | "waiting_user" | "correct" | "fail" | "completed">("idle");
  const [userSteps, setUserSteps] = useState<{ instId: "tabla" | "riq"; hitType: string }[]>([]);
  const [activeStepHighlight, setActiveStepHighlight] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [unlockedTitle, setUnlockedTitle] = useState("مستمع هاوي");

  const audioContextRef = useRef<AudioContext | null>(null);

  // Auto spin disk decorator over time or note plays
  useEffect(() => {
    if (pulseMeter > 0) {
      const timer = setTimeout(() => setPulseMeter(0), 180);
      return () => clearTimeout(timer);
    }
  }, [pulseMeter]);

  // Initialize Web Audio
  const initAudio = () => {
    if (audioContextRef.current) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioContextRef.current = new AudioContextClass();
    setIsCtxRunning(true);
  };

  // Synthesize instruments sounds on click with dynamic Pro EQ / FX chains
  const playSynthesis = (instId: string, freq: number, hitType?: string) => {
    initAudio();
    const ctx = audioContextRef.current;
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    setDiscRotation(prev => (prev + 45) % 360);
    setPulseMeter(8); // trigger VU level meter jump

    const now = ctx.currentTime;
    
    // Create FX Nodes
    const masterGain = ctx.createGain();
    const lowpass = ctx.createBiquadFilter();
    const delay = ctx.createDelay();
    const feedback = ctx.createGain();
    const distortion = ctx.createWaveShaper();

    // Set Master volume
    masterGain.gain.setValueAtTime(volume * 0.75, now);

    // Apply Lowpass Cutoff Knob
    lowpass.type = "lowpass";
    lowpass.frequency.setValueAtTime(cutoffFilter, now);
    lowpass.Q.setValueAtTime(2.5, now);

    // Calculate dynamic frequency with pitch bend slider
    const bentFreq = freq * Math.pow(2, pitchBend / 1200);

    // Setup Delay Effect Loop
    delay.delayTime.setValueAtTime(0.28, now); // fixed delay tempo
    feedback.gain.setValueAtTime(delayFeedback, now);

    // Distortion wave curve builder
    const makeDistortionCurve = (amount: number) => {
      const k = typeof amount === 'number' ? amount : 50;
      const n_samples = 44100;
      const curve = new Float32Array(n_samples);
      const deg = Math.PI / 180;
      for (let i = 0 ; i < n_samples; ++i ) {
        const x = (i * 2) / n_samples - 1;
        curve[i] = ( (3 + k) * x * 20 * deg ) / ( Math.PI + k * Math.abs(x) );
      }
      return curve;
    };
    distortion.curve = makeDistortionCurve(distortionDrive * 12);
    distortion.oversample = "4x";

    // 🔗 CONNECT ROUTING CHAIN: 
    // Source -> Distortion -> Lowpass -> Delay loop option -> Master Gain -> Destination
    
    const connectToFX = (sourceNode: AudioNode, stopTime: number) => {
      sourceNode.connect(distortion);
      distortion.connect(lowpass);
      
      // Wire up delay echo path
      if (delayFeedback > 0.05) {
        lowpass.connect(delay);
        delay.connect(feedback);
        feedback.connect(delay); // feedback loop
        delay.connect(masterGain);
      }
      
      lowpass.connect(masterGain);
      masterGain.connect(ctx.destination);
    };

    // Instrument custom wave shapes
    if (instId === "oud") {
      const triggerPluck = (detuneVal: number, delayMs: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(bentFreq, now + delayMs);
        osc.detune.setValueAtTime(detuneVal, now + delayMs);

        gain.gain.setValueAtTime(0, now + delayMs);
        gain.gain.linearRampToValueAtTime(0.45, now + delayMs + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delayMs + 0.58);

        osc.connect(gain);
        connectToFX(gain, now + delayMs + 0.6);
        osc.start(now + delayMs);
        osc.stop(now + delayMs + 0.65);
      };

      // Stereo double string chorus pluck simulation
      triggerPluck(-3, 0);
      triggerPluck(3, 0.016);
    } 
    else if (instId === "nay") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const vibrato = ctx.createOscillator();
      const vibratoGain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(bentFreq, now);

      vibrato.frequency.setValueAtTime(7.0, now); // 7Hz organic breeze vibrato
      vibratoGain.gain.setValueAtTime(10, now);

      vibrato.connect(vibratoGain);
      vibratoGain.connect(osc.frequency);

      // Organic breath noise layer
      try {
        const bufferSize = ctx.sampleRate * 0.5;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = "bandpass";
        noiseFilter.frequency.setValueAtTime(bentFreq, now);
        noiseFilter.Q.setValueAtTime(12, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.05, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(masterGain);

        noise.start(now);
        noise.stop(now + 0.45);
      } catch (e) {}

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.4, now + 0.09); // swell
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      connectToFX(gain, now + 0.65);

      vibrato.start(now);
      vibrato.stop(now + 0.65);
      osc.start(now);
      osc.stop(now + 0.65);
    } 
    else if (instId === "mizmar") {
      // Buzzy twin oboe
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sawtooth";
      osc2.type = "sawtooth";

      osc1.frequency.setValueAtTime(bentFreq, now);
      osc2.frequency.setValueAtTime(bentFreq * 1.015, now); // intense detuned double reed

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.012); // lightning quick transient attack
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      connectToFX(gain, now + 0.5);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.5);
      osc2.stop(now + 0.5);
    } 
    else if (instId === "tabla") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (hitType === "دم") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(155, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.18);

        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      } else if (hitType === "صك") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(310, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);

        gain.gain.setValueAtTime(0.42, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      } else {
        // High snappy slap "تك"
        osc.type = "triangle";
        osc.frequency.setValueAtTime(640, now);
        osc.frequency.linearRampToValueAtTime(1050, now + 0.05);

        gain.gain.setValueAtTime(0.32, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      }

      osc.connect(gain);
      connectToFX(gain, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.3);
    } 
    else if (instId === "riq") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (hitType?.includes("صاجات")) {
        // synthesize noble metal shimmers
        try {
          const bufferSize = ctx.sampleRate * 0.1;
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
          }
          const whiteNoise = ctx.createBufferSource();
          whiteNoise.buffer = buffer;

          const hpFilter = ctx.createBiquadFilter();
          hpFilter.type = "highpass";
          hpFilter.frequency.setValueAtTime(3200, now);

          const noiseGain = ctx.createGain();
          noiseGain.gain.setValueAtTime(0.4, now);
          noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

          whiteNoise.connect(hpFilter);
          hpFilter.connect(noiseGain);
          noiseGain.connect(masterGain);

          whiteNoise.start(now);
          whiteNoise.stop(now + 0.11);
        } catch(e) {}
      } else {
        // snare wood click
        osc.type = "sine";
        osc.frequency.setValueAtTime(210, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.09);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        connectToFX(gain, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      }
    } 
    else if (instId === "rababa") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(bentFreq * 0.88, now); // smooth glide up
      osc.frequency.exponentialRampToValueAtTime(bentFreq, now + 0.14);

      lfo.frequency.setValueAtTime(7.4, now); // earthy tension bow vibrato
      lfoGain.gain.setValueAtTime(12, now);

      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.06); // bow rub attack
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

      osc.connect(gain);
      connectToFX(gain, now + 0.55);

      lfo.start(now);
      lfo.stop(now + 0.55);
      osc.start(now);
      osc.stop(now + 0.55);
    }
  };

  // Simon Says rhythm player sequencer
  const playPatternDemo = async (pattern: RhythmPattern) => {
    setGameState("playing_pattern");
    setUserSteps([]);

    for (let i = 0; i < pattern.steps.length; i++) {
      const step = pattern.steps[i];
      setActiveStepHighlight(i);

      // Trigger the sound
      if (step.instId === "tabla") {
        const freqIndex = step.hitType === "دم" ? 0 : step.hitType === "صك" ? 2 : 1;
        const noteObj = FOLK_INSTRUMENTS.find(x => x.id === "tabla")?.notes[freqIndex];
        playSynthesis("tabla", noteObj?.freq || 110, step.hitType);
      } else {
        playSynthesis("riq", 2800, "صاجات");
      }

      await new Promise(resolve => setTimeout(resolve, 450));
    }

    setActiveStepHighlight(null);
    setGameState("waiting_user");
  };

  const handleUserHit = (id: "tabla" | "riq", hitType: "دم" | "تك" | "صاجات" | "صك") => {
    initAudio();
    
    // Play sound immediately
    if (id === "tabla") {
      const f = hitType === "دم" ? 110 : hitType === "صك" ? 350 : 880;
      playSynthesis("tabla", f, hitType);
    } else {
      playSynthesis("riq", 2800, "صاجات");
    }

    if (gameState !== "waiting_user") return;

    const newSteps = [...userSteps, { instId: id, hitType }];
    setUserSteps(newSteps);

    const currentPattern = RHYTHM_PATTERNS[gameLevel];
    const targetStep = currentPattern.steps[newSteps.length - 1];

    if (targetStep.instId !== id || targetStep.hitType !== hitType) {
      setGameState("fail");
      setTimeout(() => {
        setGameState("idle");
        setUserSteps([]);
      }, 1500);
      return;
    }

    if (newSteps.length === currentPattern.steps.length) {
      setGameState("correct");
      const nextScore = score + 120 + (gameLevel * 60);
      setScore(nextScore);

      // street titles
      let title = "مستمع هاوي";
      if (nextScore >= 350) title = "مايسترو الحارة الأكبر 👑";
      else if (nextScore >= 240) title = "نبطشي مهرجانات معتمد 🎚️";
      else if (nextScore >= 120) title = "ضابط إيقاع موهوب 🥁";
      setUnlockedTitle(title);

      setTimeout(() => {
        if (gameLevel + 1 < RHYTHM_PATTERNS.length) {
          setGameLevel(gameLevel + 1);
          setGameState("idle");
          setUserSteps([]);
        } else {
          setGameState("completed");
        }
      }, 1500);
    }
  };

  // Submit academy lesson quiz
  const handleQuizSubmit = (index: number) => {
    setSelectedQuizAnswer(index);
    setQuizSubmitted(true);
    
    // Check if correct index
    const isCorrect = index === selectedLesson.testQuiz.correctIndex;
    if (isCorrect) {
      // Award Stars in profile!
      setUserStars(prev => ({
        ...prev,
        [selectedLesson.id]: 3
      }));
      setScore(prev => prev + 50);
    } else {
      setUserStars(prev => ({
        ...prev,
        [selectedLesson.id]: Math.max(prev[selectedLesson.id] || 0, 1)
      }));
    }

    setLessonProgress(prev => ({
      ...prev,
      [selectedLesson.id]: true
    }));
  };

  const selectNextLesson = (lesson: AcademyLesson) => {
    setSelectedLesson(lesson);
    setSelectedQuizAnswer(null);
    setQuizSubmitted(false);
  };

  const resetGame = () => {
    setGameLevel(0);
    setScore(0);
    setUnlockedTitle("مستمع هاوي");
    setGameState("idle");
    setUserSteps([]);
  };

  return (
    <div id="folk-instruments-museum" className="bg-[#0b0c10] border-4 border-[#CCFF00] rounded-3xl p-4 sm:p-8 space-y-8 shadow-[0_0_50px_rgba(204,255,0,0.18)] relative overflow-hidden" dir="rtl">
      
      {/* Carbon fiber grid texture pattern background decoration */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#CCFF00_1px,transparent_1px)] [background-size:16px_16px]" />
      
      {/* Traditional Egyptian warm amber glass look overlay */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-gradient-to-br from-[#CCFF00]/10 to-transparent blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-gradient-to-t from-[#00F0FF]/10 to-transparent blur-[110px] rounded-full pointer-events-none" />

      {/* TOP HEADER - App Store & DJ Console Integrated layout */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center border-b-2 border-zinc-800 pb-6 gap-5 z-10 relative">
        
        {/* Play-Store Badge and Academy Status */}
        <div className="space-y-1.5 text-right flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-black bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/30 px-3 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
              جاهز للتصدير والتفاعل كلوحة دي جي
            </span>
            <span className="text-xs font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 rounded">
              VER 3.8 / GOOGLE PLAY ACADEMY
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#CCFF00] to-[#00F0FF] p-[2px] shadow-[0_4px_15px_rgba(204,255,0,0.25)] flex items-center justify-center">
              <div className="w-full h-full rounded-[10px] bg-[#0c0d12] flex items-center justify-center text-xl">
                🎛️
              </div>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                مسرح السامبلر التراثي ومدرسة الصولفيج المفتوحة
              </h2>
              <p className="text-xs text-zinc-400 font-bold">
                ادمج النوتات الشرقية بحرية كاملة مع مهايئ المؤثرات التماثلي وتعلّم علم المقامات المصرية
              </p>
            </div>
          </div>
        </div>

        {/* Pro Switch Tabs Selector (App Store Style App Navigation) */}
        <div className="flex bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800 self-stretch xl:self-auto shadow-inner">
          <button
            onClick={() => setActiveTab("museum")}
            className={`flex-1 xl:flex-initial px-5 py-2.5 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "museum"
                ? "bg-gradient-to-r from-[#CCFF00] to-[#baff00] text-black shadow-lg shadow-[#CCFF00]/15"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            استوديو السينث البلدي
          </button>
          
          <button
            onClick={() => setActiveTab("dj_pads")}
            className={`flex-1 xl:flex-initial px-5 py-2.5 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
              activeTab === "dj_pads"
                ? "bg-gradient-to-r from-[#00F0FF] to-[#00d8ff] text-black shadow-lg shadow-[#00F0FF]/15"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            تحدي إيقاع المقسوم
            {gameState === "idle" && (
              <span className="absolute -top-1 -left-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#CCFF00] opacity-80"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#CCFF00]"></span>
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("academy")}
            className={`flex-1 xl:flex-initial px-5 py-2.5 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "academy"
                ? "bg-gradient-to-r from-[#FF0055] to-[#ff003c] text-white shadow-lg shadow-[#FF0055]/15"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
            }`}
          >
            <Award className="w-4 h-4" />
            أكاديمية الموسيقى 
            <span className="mr-1 py-0.2 px-1 text-[8px] bg-[#FF0055] text-white rounded font-mono font-bold">PLAY</span>
          </button>
        </div>

      </div>

      {/* TAB 1: STUDIO SYNTHESIZER & DJ EFFECTS CONTROLS PANEL */}
      {activeTab === "museum" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
          
          {/* LEFT DECK Column: Selective list of Instruments */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <div className="flex justify-between items-center text-xs font-bold text-zinc-400 mb-1">
              <span>🗂️ اختر بنك الصوت للأداة:</span>
              <span className="text-[10px] text-zinc-500 font-mono">BANK A / FOLK</span>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5">
              {FOLK_INSTRUMENTS.map((inst) => {
                const isSelected = selectedInst.id === inst.id;
                return (
                  <button
                    key={inst.id}
                    onClick={() => {
                      setSelectedInst(inst);
                      initAudio();
                      // Play root key note
                      if (inst.notes.length > 0) {
                        playSynthesis(inst.id, inst.notes[0].freq, inst.id === "tabla" ? "دم" : undefined);
                      }
                    }}
                    className={`text-right p-4 border rounded-2xl flex items-center gap-3.5 transition-all cursor-pointer relative group overflow-hidden ${
                      isSelected
                        ? "bg-[#14151a] border-[#CCFF00] text-[#CCFF00] shadow-[0_0_20px_rgba(204,255,0,0.12)] scale-[1.01]"
                        : "bg-[#0b0c0f] text-zinc-400 border-zinc-850 hover:border-zinc-800 hover:bg-[#111218]/40"
                    }`}
                  >
                    {/* Glowing active neon bars */}
                    {isSelected && (
                      <span className="absolute right-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#CCFF00] to-amber-500" />
                    )}

                    <span className="text-2xl w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center select-none group-hover:scale-110 transition-transform">
                      {inst.imageEmoji}
                    </span>
                    <div className="flex-1">
                      <div className="font-extrabold text-xs sm:text-sm tracking-tight text-white group-hover:text-[#CCFF00] transition-colors">{inst.name}</div>
                      <div className="text-[9px] font-mono text-zinc-500 uppercase mt-0.5">{inst.nameEn}</div>
                    </div>
                    
                    {/* Tiny category pill */}
                    <span className="text-[8px] bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 text-zinc-450 uppercase font-mono">
                      {inst.category}
                    </span>
                  </button>
                );
              })}
            </div>
            
            {/* Master Gain & Volume Deck slider */}
            <div className="mt-2 bg-gradient-to-b from-[#14151c] to-[#0c0d12] p-4 rounded-2xl border border-zinc-850 shadow-inner space-y-3">
              <div className="flex items-center justify-between text-[11px] text-zinc-300 font-bold">
                <span className="flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-[#00F0FF]" /> قوة مكبر الصوت الرئيسي:
                </span>
                <span className="font-mono text-[10px] text-[#00F0FF]">{Math.round(volume * 100)}%</span>
              </div>
              
              <div className="flex gap-3 items-center">
                <button 
                  onClick={() => setVolume(prev => prev > 0 ? 0 : 0.8)} 
                  className="p-1.5 bg-zinc-950 rounded border border-zinc-800 text-zinc-400 hover:text-[#00F0FF] transition-all cursor-pointer"
                  title="كتم الصوت مألوف"
                >
                  {volume === 0 ? <VolumeX className="w-3.5 h-3.5 text-red-500" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                <input 
                  type="range" 
                  min="0" 
                  max="1.5" 
                  step="0.05" 
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="flex-1 accent-[#00F0FF] cursor-pointer h-1.5 bg-zinc-950 rounded-lg appearance-none"
                />
              </div>

              {/* Instant Level Meter LED Visualization */}
              <div className="grid grid-cols-8 gap-1 pt-1">
                {[...Array(8)].map((_, i) => {
                  const isActive = pulseMeter > i;
                  let ledBg = "bg-zinc-900";
                  if (isActive) {
                    ledBg = i < 4 ? "bg-emerald-500" : i < 6 ? "bg-yellow-400" : "bg-red-500";
                  }
                  return (
                    <div 
                      key={i} 
                      className={`h-2.5 rounded-sm transition-all duration-150 ${ledBg}`} 
                    />
                  );
                })}
              </div>
            </div>

          </div>

          {/* MAIN DJ CONSOLE DECK WRAPPER */}
          <div className="lg:col-span-8 flex flex-col gap-5 bg-gradient-to-b from-[#111217] to-[#0a0b0e] p-5 sm:p-7 rounded-3xl border border-zinc-900 relative shadow-2xl">
            
            {/* Top Interactive DJ Header & Vinyl Table */}
            <div className="flex flex-col md:flex-row gap-5 items-stretch md:items-center justify-between border-b border-zinc-850 pb-5">
              
              <div className="flex items-center gap-4">
                {/* Visual Turntable rotating disc like a genuine DJ Deck! */}
                <div 
                  className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#111] via-zinc-820 to-[#444] border-2 border-[#CCFF00]/40 flex items-center justify-center shadow-lg relative cursor-pointer select-none overflow-hidden group active:scale-95 transition-transform"
                  style={{ transform: `rotate(${discRotation}deg)`, transition: "transform 0.4s ease-out" }}
                  onClick={() => {
                    if (selectedInst.notes.length > 0) {
                      playSynthesis(selectedInst.id, selectedInst.notes[0].freq, selectedInst.id === "tabla" ? "دم" : undefined);
                    }
                  }}
                  title="أنقر على القرص لخدش الصوت!"
                >
                  {/* Turntable Vinyl Grooves */}
                  <div className="absolute inset-2 rounded-full border border-zinc-800 opacity-60" />
                  <div className="absolute inset-4 rounded-full border border-zinc-900 opacity-80" />
                  <div className="absolute inset-6 rounded-full border border-zinc-700 opacity-30" />
                  
                  {/* Central Core Emoji Label */}
                  <span className="text-xl z-10 group-hover:scale-125 transition-transform select-none">
                    📀
                  </span>

                  {/* Laser needle decoration */}
                  <div className="absolute top-1 right-2 w-1 h-6 bg-[#CCFF00] rounded-full origin-top transform rotate-12 opacity-85" />
                </div>

                <div className="text-right">
                  <div className="flex gap-1.5 items-center">
                    <span className="text-[9px] bg-[#CCFF00]/10 text-[#CCFF00] px-2 py-0.5 rounded-full font-black border border-[#CCFF00]/25">
                      {selectedInst.category === "string" ? "آلة وترية" : selectedInst.category === "wind" ? "آلة هوائية" : "إيقاعية بلدي"}
                    </span>
                    <span className="text-[9px] bg-[#00F0FF]/10 text-[#00F0FF] px-2 py-0.5 rounded-full font-mono">
                      LATENCY: LOW
                    </span>
                  </div>
                  
                  <h3 className="text-lg sm:text-xl font-bold text-white mt-1">
                    {selectedInst.name}
                  </h3>
                  <div className="text-[10px] font-mono text-[#00F0FF] uppercase">{selectedInst.nameEn}</div>
                </div>
              </div>

              {/* Maqam & Scale Indicator Board */}
              <div className="bg-zinc-950 p-3 border border-zinc-850 rounded-xl leading-relaxed text-right flex flex-col justify-between max-w-xs gap-1.5">
                <span className="text-[10px] bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/25 px-2 py-0.5 rounded font-bold w-fit self-end">
                  ميزان المقامات: ربع تون بلدي
                </span>
                
                <p className="text-[11px] text-zinc-400">
                  السلم الأساس من روت مقام <strong className="text-white">البياتي والحجاز</strong>. يتناسب هذا البنك تلقائياً مع وتد الألحان.
                </p>
              </div>
            </div>

            {/* REAL-TIME DJ EFFCTS DIALS (لوحة تحكم إف إكس احترافية) */}
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-900/80 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-900 text-xs">
                <span className="text-[#CCFF00] font-black flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-[#CCFF00]" /> ديسك التحكم ومهايئات الصوت التماثلية (PRO FX DECK)
                </span>
                <span className="text-[9px] text-[#00F0FF] font-mono uppercase tracking-widest">Web Audio DSP Hooked</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                
                {/* FX Node A: Pitch bend */}
                <div className="bg-[#111218]/80 p-3 rounded-xl border border-zinc-850 flex flex-col justify-between items-center gap-2">
                  <span className="text-[10px] text-zinc-400 font-bold">تغيير التون (Pitch Shift)</span>
                  <input 
                    type="range" 
                    min="-600" 
                    max="600" 
                    step="50" 
                    value={pitchBend}
                    onChange={(e) => setPitchBend(parseInt(e.target.value))}
                    className="w-full accent-[#CCFF00] h-1.5 bg-zinc-900 rounded-lg cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-[#CCFF00] font-black">
                    {pitchBend > 0 ? `+${pitchBend/100}` : `${pitchBend/100}`} ربع مقام
                  </span>
                </div>

                {/* FX Node B: Lowpass filter */}
                <div className="bg-[#111218]/80 p-3 rounded-xl border border-zinc-850 flex flex-col justify-between items-center gap-2">
                  <span className="text-[10px] text-zinc-400 font-bold">فلتر التنعيم (FX Cutoff)</span>
                  <input 
                    type="range" 
                    min="150" 
                    max="4500" 
                    step="100" 
                    value={cutoffFilter}
                    onChange={(e) => setCutoffFilter(parseInt(e.target.value))}
                    className="w-full accent-[#00F0FF] h-1.5 bg-zinc-900 rounded-lg cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-[#00F0FF] font-black">
                    {cutoffFilter} Hz
                  </span>
                </div>

                {/* FX Node C: Echo Delay Feedback */}
                <div className="bg-[#111218]/80 p-3 rounded-xl border border-zinc-850 flex flex-col justify-between items-center gap-2">
                  <span className="text-[10px] text-zinc-400 font-bold">صدى الصوت (Eco Delay)</span>
                  <input 
                    type="range" 
                    min="0" 
                    max="0.8" 
                    step="0.05" 
                    value={delayFeedback}
                    onChange={(e) => setDelayFeedback(parseFloat(e.target.value))}
                    className="w-full accent-pink-500 h-1.5 bg-zinc-900 rounded-lg cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-pink-500 font-black">
                    {delayFeedback === 0 ? "متوقف" : `${Math.round(delayFeedback * 100)}%`} Feedback
                  </span>
                </div>

                {/* FX Node D: Distortion Drive */}
                <div className="bg-[#111218]/80 p-3 rounded-xl border border-zinc-850 flex flex-col justify-between items-center gap-2">
                  <span className="text-[10px] text-zinc-400 font-bold">إشباع وغشاوة (Drive Analog)</span>
                  <input 
                    type="range" 
                    min="0" 
                    max="10" 
                    step="0.5" 
                    value={distortionDrive}
                    onChange={(e) => setDistortionDrive(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 h-1.5 bg-zinc-900 rounded-lg cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-amber-500 font-black">
                    x {distortionDrive} تضخيم
                  </span>
                </div>

              </div>

              {/* Reset Dials utility button */}
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => {
                    setPitchBend(0);
                    setCutoffFilter(1800);
                    setDelayFeedback(0.3);
                    setDistortionDrive(2);
                  }}
                  className="bg-zinc-900 hover:bg-[#CCFF00] text-zinc-400 hover:text-black hover:border-[#CCFF00] border border-zinc-800 text-[9px] font-black px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3 h-3" /> إعادة تعيين مهايئ المؤثرات للوضع القياسي
                </button>
              </div>

            </div>

            {/* HIGH-END INTERACTIVE SYNTH MUSIC KEYBOARD PADS */}
            <div className="bg-[#050507] p-4 sm:p-5 rounded-2xl border border-zinc-850 text-right space-y-4 shadow-inner relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[120px] h-[120px] bg-[#CCFF00]/5 blur-[35px] pointer-events-none rounded-full" />

              <div className="flex justify-between items-center pb-2 border-b border-zinc-800 leading-none">
                <span className="text-xs font-black text-[#CCFF00] flex items-center gap-1.5">
                  🎹 لوحة العزف والارتجال الطربي الحي ({selectedInst.name})
                </span>
                <span className="text-[9px] text-[#00F0FF] font-mono tracking-widest uppercase">MPC performance pads</span>
              </div>

              {/* Keyboard keys - Pro Launchpad block layout */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" dir="ltr">
                {selectedInst.notes.map((note, idx) => {
                  return (
                    <button
                      key={idx}
                      onClick={() => playSynthesis(selectedInst.id, note.freq, selectedInst.id === "tabla" ? note.name.split(" ")[0] : undefined)}
                      className="bg-zinc-900/90 hover:bg-gradient-to-tr hover:from-[#CCFF00] hover:to-amber-400 hover:text-black border border-zinc-805 hover:border-[#CCFF00] text-zinc-300 font-bold p-4 rounded-xl text-xs transition-all active:scale-95 cursor-pointer flex flex-col justify-between items-start text-left min-h-[90px] font-mono relative group shadow-[0_4px_10px_rgba(0,0,0,0.3)] hover:shadow-[#CCFF00]/15"
                    >
                      {/* Active decorative led dots */}
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-zinc-800 group-hover:bg-black transition-colors" />

                      <div className="flex justify-between w-full items-center">
                        <span className="text-xl group-hover:scale-125 transition-transform select-none">{selectedInst.imageEmoji}</span>
                        <span className="text-[8px] bg-black/40 px-1.5 py-0.2 rounded font-normal text-zinc-400 group-hover:text-black group-hover:bg-white/20">
                          PAD {idx + 1}
                        </span>
                      </div>
                      
                      <div className="mt-2 text-right w-full">
                        <div className="text-[11px] font-black tracking-tight leading-none text-white group-hover:text-black">{note.name}</div>
                        {note.maqamNote && (
                          <div className="text-[9px] text-zinc-450 group-hover:text-black/70 font-bold mt-1 tracking-tight">
                            {note.maqamNote}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Technical story with beautiful design */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
              <div className="bg-zinc-950/70 p-4 rounded-2xl border border-zinc-900 space-y-2">
                <span className="text-[11px] text-[#00F0FF] font-black block border-b border-zinc-900 pb-1.5 flex items-center gap-1">
                  🕵️ السيرة والتاريخ التراثي
                </span>
                <p className="text-xs text-zinc-350 leading-relaxed font-semibold">
                  {selectedInst.historyAr}
                </p>
              </div>

              <div className="bg-zinc-950/70 p-4 rounded-2xl border border-zinc-900 space-y-2">
                <span className="text-[11px] text-[#CCFF00] font-black block border-b border-zinc-900 pb-1.5 flex items-center gap-1">
                  📯 حركة الأداء والعزف الشعبي
                </span>
                <p className="text-xs text-zinc-350 leading-relaxed font-semibold">
                  {selectedInst.styleAr}
                </p>
              </div>
            </div>

            {/* Informational play store banner */}
            <div className="bg-[#CCFF00]/5 border border-[#CCFF00]/15 p-3.5 rounded-xl text-right flex gap-3 items-start">
              <span className="text-lg">💡</span>
              <p className="text-[11px] text-[#CCFF00] font-bold leading-relaxed">
                <strong>نصيحة معلم الحارة:</strong> حرك مفتاح "إشباع وغشاوة (Drive Analog)" للأعلى بجرأة بالتزامن مع عزف آلة المزمار، لتبني صوت الرعد الصاخب الذي يستحوذ على الأذن بالكامل ويتغلب على صخب الحارة!
              </p>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: INTERACTIVE SIMON SAYS GAME WITH DETAILED GRAPHICS */}
      {activeTab === "dj_pads" && (
        <div className="space-y-6 relative z-10 text-right">
          
          {/* Pro Level status track */}
          <div className="bg-gradient-to-r from-[#111217] to-[#0a0b0e] p-6 rounded-3xl border border-zinc-850 flex flex-col md:flex-row justify-between items-center gap-5 shadow-xl">
            
            <div className="space-y-1.5 w-full md:w-auto">
              <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-widest block flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-[#00F0FF] animate-pulse" /> رتبة المايسترو ودرجة الشارع الفخرية:
              </span>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏆</span>
                <span className="text-[#CCFF00] font-black text-lg sm:text-2xl">
                  {unlockedTitle}
                </span>
                <span className="text-[10px] bg-zinc-950 px-3 py-1 border border-zinc-800 rounded-full font-mono text-[#00F0FF] font-bold">
                  LEVEL {gameLevel + 1}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                أطرب السامعين بقرع التابل والرق معاً وطابق الميزان بالتناوب لتستحق الأكاليل الفخرية.
              </p>
            </div>

            {/* App Store style high scores and level indicators */}
            <div className="flex gap-4 items-center w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-zinc-800 pt-3 md:pt-0">
              
              <div className="bg-zinc-950 px-5 py-3 rounded-2xl border border-zinc-850 text-center flex-1 sm:flex-initial min-w-[100px]">
                <span className="block text-[9px] text-zinc-500 uppercase font-mono font-bold">TOTAL SCORE</span>
                <span className="text-[#00F0FF] text-xl font-black">{score}</span>
              </div>

              <div className="bg-zinc-950 px-5 py-3 rounded-2xl border border-zinc-850 text-center flex-1 sm:flex-initial min-w-[100px]">
                <span className="block text-[9px] text-zinc-500 uppercase font-mono font-bold">MAP ROAD</span>
                <span className="text-zinc-200 text-xl font-black">{gameLevel + 1} / {RHYTHM_PATTERNS.length}</span>
              </div>

            </div>
          </div>

          {gameState === "completed" ? (
            <div className="bg-zinc-900/60 border-2 border-green-550/40 p-8 rounded-3xl text-center space-y-5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] bg-emerald-500/10 blur-[90px] rounded-full pointer-events-none" />
              
              <div className="w-20 h-20 rounded-full bg-emerald-950/40 border-2 border-emerald-400 flex items-center justify-center mx-auto shadow-inner text-4xl animate-bounce">
                👑
              </div>
              
              <h3 className="text-2xl font-black text-emerald-400">
                مبروك! لقد أحكمت المقامات ونالت رقصتك العلامة الكاملة!
              </h3>
              
              <p className="text-sm text-zinc-300 max-w-xl mx-auto leading-relaxed font-medium">
                لقد طابقت بنجاح إيقاع المقسوم الهادي، الربحة الصعيدية الصارمة، وإيقاع المهرجانات السريع دون أي تمايل أو خطأ وحيد. رصيدك الحالي هو <strong className="text-[#CCFF00]">{score} درجة</strong> وحصلت على رتبة فخرية عليا <strong className="text-[#00F0FF]">{unlockedTitle}</strong> الموثقة بختم المايسترو!
              </p>

              <button
                onClick={resetGame}
                className="bg-[#CCFF00] hover:bg-white text-black font-black px-6 py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 mx-auto transition-all cursor-pointer shadow-lg shadow-[#CCFF00]/15"
              >
                <RotateCcw className="w-4 h-4" /> العودة لبداية خريطة الألعاب وإثبات جدارتك ثانياً
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Pattern detail card details */}
              <div className="lg:col-span-5 bg-zinc-900/50 p-5 rounded-3xl border border-zinc-900 space-y-5">
                
                <div className="space-y-1 text-right">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] bg-sky-950 text-[#00F0FF] border border-sky-900 px-3 py-1 rounded-full font-black uppercase">
                       المعزوفة الحالية: التحدي {gameLevel + 1}
                    </span>
                    <span className="text-[9px] text-zinc-500 font-mono">MAP: RHYTHM_ROAD</span>
                  </div>

                  <h4 className="text-base font-black text-white mt-3">
                     {RHYTHM_PATTERNS[gameLevel]?.name}
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed font-semibold">
                    {RHYTHM_PATTERNS[gameLevel]?.descriptionAr}
                  </p>
                </div>

                {/* Stave layout visualization */}
                <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-850 space-y-3.5 shadow-inner">
                  <span className="text-[10px] text-zinc-450 font-bold block">📊 لوحة ميزان الضربات المطلوب تقليده بالثواني:</span>
                  
                  <div className="flex gap-2.5 justify-start items-center overflow-x-auto py-2" dir="ltr">
                    {RHYTHM_PATTERNS[gameLevel]?.steps.map((step, idx) => {
                      const isHighlighted = idx === activeStepHighlight;
                      const hasCompleted = userSteps.length > idx;
                      return (
                        <div
                          key={idx}
                          className={`flex-1 min-w-[65px] p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
                            isHighlighted 
                              ? "bg-gradient-to-tr from-[#CCFF00] to-yellow-400 text-black border-[#CCFF00] scale-110 shadow-lg shadow-[#CCFF00]/25" 
                              : hasCompleted 
                              ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/60" 
                              : "bg-[#0b0c10] text-zinc-400 border-zinc-900"
                          }`}
                        >
                          <span className="text-[9px] uppercase font-mono tracking-tight font-bold">{step.instId}</span>
                          <span className="text-xs font-black mt-1">{step.hitType}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Simulated game guidance prompt based on state */}
                <div className="pt-1">
                  {gameState === "idle" || gameState === "fail" ? (
                    <button
                      onClick={() => playPatternDemo(RHYTHM_PATTERNS[gameLevel])}
                      className="w-full bg-gradient-to-r from-[#00F0FF] to-sky-500 hover:bg-white text-black font-black p-4 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#00F0FF]/15"
                    >
                      <Play className="w-4 h-4 fill-black" />
                      استمع لمثال الإيقاع من المايسترو أولاً
                    </button>
                  ) : gameState === "playing_pattern" ? (
                    <div className="w-full bg-zinc-950 text-zinc-400 border border-zinc-850 py-4 rounded-xl text-xs text-center font-black flex items-center justify-center gap-2 animate-pulse">
                      🔊 انتبه! المايسترو يسرد الميزان الإيقاعي الآن سماعياً...
                    </div>
                  ) : gameState === "waiting_user" ? (
                    <div className="w-full bg-yellow-950/40 text-yellow-400 border border-yellow-905 py-4 rounded-xl text-xs text-center font-black flex items-center justify-center gap-2 animate-pulse">
                      👉 دورك الآن! انقر على الآلات الإيقاعية بنفس الميزان من اليسار لليمين!
                    </div>
                  ) : gameState === "correct" ? (
                    <div className="w-full bg-emerald-950/60 text-emerald-400 border border-emerald-850 py-4 rounded-xl text-xs text-center font-black flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-bounce" /> أحسنت يا فنان! التزامن ممتاز 100%
                    </div>
                  ) : (
                    <div className="w-full bg-red-950/60 text-red-400 border border-red-850 py-4 rounded-xl text-xs text-center font-black flex items-center justify-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400" /> خطأ ضربة! كرر المحاولة الطربية ثانية بالتركيز على التزامن!
                    </div>
                  )}
                </div>

              </div>

              {/* Game Interactive Playing Soundboard (لوحة طبل ورش حقيقية) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex justify-between items-center text-xs font-bold text-zinc-400 text-right">
                  <span>🥁 لوحة الضرب والقرع الحية (PRACTICE SOUNDBOARD):</span>
                  <span className="text-[10px] text-zinc-500 font-mono">WAVE TRIGGERS</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* TABLA PLAYSTATION DECK */}
                  <div className="bg-[#121318] p-5 rounded-3xl border border-zinc-850 space-y-4 text-center">
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                      <span className="text-[10px] text-zinc-500 uppercase font-mono font-bold">DRUM TRIGGER</span>
                      <span className="text-xs font-black text-zinc-300">درابكة وتابلة المقسوم</span>
                    </div>

                    {/* Skewomorphic Drum Pad Touch design */}
                    <div className="w-28 h-28 rounded-full bg-gradient-to-b from-[#1c1d25] to-[#0d0e12] border-4 border-zinc-750 flex items-center justify-center mx-auto text-4xl shadow-2xl relative group active:scale-95 transition-all select-none">
                      <div className="absolute inset-1.5 rounded-full border border-zinc-700 opacity-20" />
                      <div className="absolute inset-4 rounded-full border border-[#CCFF00]/10" />
                      🥁
                    </div>

                    {/* Tabla hit pads with colored active feedback */}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleUserHit("tabla", "دم")}
                        className="bg-zinc-950 hover:bg-[#CCFF00] hover:text-black border border-zinc-850 text-zinc-300 font-black p-3.5 rounded-xl text-xs transition-colors active:scale-90 cursor-pointer"
                      >
                        دُم (Deep)
                      </button>
                      <button
                        onClick={() => handleUserHit("tabla", "تك")}
                        className="bg-zinc-950 hover:bg-[#00F0FF] hover:text-black border border-zinc-850 text-zinc-300 font-black p-3.5 rounded-xl text-xs transition-colors active:scale-90 cursor-pointer"
                      >
                        تَك (Sharp)
                      </button>
                      <button
                        onClick={() => handleUserHit("tabla", "صك")}
                        className="bg-zinc-950 hover:bg-zinc-750 text-[#fff] border border-zinc-850 text-zinc-300 font-black p-3.5 rounded-xl text-xs transition-colors active:scale-90 cursor-pointer"
                      >
                        صَك (Mute)
                      </button>
                    </div>
                  </div>

                  {/* RIQ JINGLES DECK */}
                  <div className="bg-[#121318] p-5 rounded-3xl border border-zinc-850 space-y-4 text-center">
                    <div className="flex justify-between items-center border-b border-zinc-805 pb-2">
                      <span className="text-[10px] text-zinc-500 uppercase font-mono font-bold">BRASS CYMBAL</span>
                      <span className="text-xs font-black text-zinc-300">صاجات ورق الحارة</span>
                    </div>

                    {/* Skewomorphic Cymbal Pad Touch design */}
                    <div className="w-28 h-28 rounded-full bg-gradient-to-b from-[#1c1d25] to-[#0d0e12] border-4 border-zinc-750 flex items-center justify-center mx-auto text-4xl shadow-2xl relative group active:scale-95 transition-all select-none">
                      <div className="absolute inset-1.5 rounded-full border border-zinc-700 opacity-20" />
                      <div className="absolute inset-4 rounded-full border border-pink-500/15" />
                      🔔
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleUserHit("riq", "صاجات")}
                        className="bg-zinc-950 hover:bg-pink-500 hover:text-black border border-zinc-850 text-zinc-300 font-black p-3.5 rounded-xl text-xs transition-colors active:scale-90 cursor-pointer"
                      >
                        شخال (Cymbal)
                      </button>
                      <button
                        onClick={() => handleUserHit("riq", "تك")}
                        className="bg-zinc-950 hover:bg-cyan-500 hover:text-black border border-zinc-850 text-zinc-300 font-black p-3.5 rounded-xl text-xs transition-colors active:scale-90 cursor-pointer"
                      >
                        نقرة (Rim)
                      </button>
                    </div>
                  </div>

                </div>

                <div className="p-4 bg-[#111218]/50 rounded-2xl border border-zinc-900 text-right flex items-start gap-2.5">
                  <span className="text-xs">💡</span>
                  <p className="text-[11px] text-zinc-500 leading-normal font-bold">
                    <strong>الدليل الإرشادي:</strong> انتبه لمسار الضربات الملونة في الأعلى عندما يصدرها المايسترو، ثم كرر الضرب بنفس القوة للحصول على أعلى رصيد والانتقال للمهرجانات الصاخبة!
                  </p>
                </div>

              </div>

            </div>
          )}
        </div>
      )}

      {/* TAB 3: GOOGLE-PLAY MUSIC ACADEMY ACUTE LESSONS (مدرسة المقامات والتراث المفتوح) */}
      {activeTab === "academy" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 text-right">
          
          {/* Side Lesson Path selector map */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest text-right mb-1">
              🎖️ مسار دروس السامبلر والمقامات:
            </h4>

            <div className="flex flex-col gap-3">
              {ACADEMY_LESSONS.map((lesson, idx) => {
                const isSelected = selectedLesson.id === lesson.id;
                const starsWon = userStars[lesson.id] || 0;
                const done = lessonProgress[lesson.id];

                return (
                  <button
                    key={lesson.id}
                    onClick={() => selectNextLesson(lesson)}
                    className={`text-right p-4.5 border rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-3 relative overflow-hidden ${
                      isSelected 
                        ? "bg-[#16171d] border-[#FF0055] text-white shadow-[0_0_20px_rgba(255,0,85,0.1)] scale-[1.01]" 
                        : "bg-[#0b0c10] text-zinc-400 border-zinc-850 hover:border-zinc-800"
                    }`}
                  >
                    {/* Lesson numbering badge */}
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black select-none ${
                        isSelected ? "bg-[#FF0055] text-white" : "bg-zinc-900 text-zinc-500 border border-zinc-850"
                      }`}>
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex gap-1.5 items-center">
                          <span className="text-[8px] bg-zinc-900 text-[#FF0055] px-1.5 py-0.2 rounded border border-zinc-800 font-bold">
                            {lesson.difficulty}
                          </span>
                          <span className="text-[9px] text-zinc-500 font-bold">{lesson.badge}</span>
                        </div>
                        <h5 className="font-extrabold text-xs sm:text-sm text-white mt-1">{lesson.title}</h5>
                      </div>
                    </div>

                    {/* Stars achieved visual feedback - Play store style */}
                    <div className="flex flex-col items-end gap-1 font-mono">
                      <div className="flex gap-0.5">
                        {[1, 2, 3].map((s) => (
                          <Star 
                            key={s} 
                            className={`w-3 h-3 ${s <= starsWon ? "text-yellow-400 fill-yellow-400" : "text-zinc-800"}`} 
                          />
                        ))}
                      </div>
                      <span className="text-[9px] text-zinc-500">{lesson.duration}</span>
                    </div>

                  </button>
                );
              })}
            </div>

            {/* Total academy stats */}
            <div className="bg-[#12131a] p-4 rounded-xl border border-zinc-850/60 flex items-center justify-between gap-3 mt-4">
              <span className="text-[10px] text-zinc-400 font-bold flex items-center gap-1.5">
                <Award className="w-4 h-4 text-yellow-400" /> رصيد نجوم الأكاديمية:
              </span>
              <span className="text-sm text-yellow-400 font-black flex items-center gap-1">
                {(Object.values(userStars) as number[]).reduce((a: number, b: number) => a + b, 0)} <Star className="w-3.5 h-3.5 fill-current" />
              </span>
            </div>
          </div>

          {/* ACTIVE ACADEMY LESSON CANVAS */}
          <div className="lg:col-span-8 bg-zinc-900/40 p-5 sm:p-7 rounded-3xl border border-zinc-900 relative flex flex-col gap-6">
            
            {/* Class Title and header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-850 pb-4">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#FF0055] font-black">
                  🎓 GOOGLE PLAY MUSIC LESSON / FREE CLASS
                </span>
                <h3 className="text-xl font-bold text-white mt-1">
                  الحصة: {selectedLesson.title}
                </h3>
                <span className="text-[10px] text-zinc-500 font-mono uppercase font-bold">COURSE: {selectedLesson.titleEn}</span>
              </div>

              <span className="text-xs bg-zinc-950 text-yellow-400 font-bold border border-zinc-800 px-3 py-1.5 rounded-xl">
                 🏆 مكافأة النجاح: +٥٠ نقطة فخرية
              </span>
            </div>

            {/* Detailed theory narrative */}
            <div className="bg-[#0b0c10] p-5 rounded-2xl border border-zinc-850 leading-relaxed space-y-3 relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 w-2.5 bg-gradient-to-b from-[#FF0055] to-orange-500" />
              
              <h5 className="text-xs font-black text-zinc-200">📖 ملخص ومفهوم المعلم في الشرح الحواري:</h5>
              <p className="text-xs sm:text-sm text-zinc-350 font-semibold leading-relaxed">
                {selectedLesson.storyAr}
              </p>
            </div>

            {/* Formula visualization representing Sheet Music / Maqam structure */}
            <div className="bg-zinc-950 p-4.5 rounded-2xl border border-zinc-900 text-center space-y-2">
              <span className="text-[10px] text-[#00F0FF] font-bold block uppercase tracking-wider">
                🎼 الصيغة النغمية وتدرج السلم (Stave / Maqam Formula):
              </span>
              <div className="text-sm font-black text-white bg-[#0e0f14] py-3 px-6 rounded-xl border border-zinc-850 w-fit mx-auto font-mono">
                {selectedLesson.staveFormula}
              </div>
            </div>

            {/* Interactive Lesson Quiz */}
            <div className="bg-[#121319] p-5 rounded-2.5xl border border-zinc-850 space-y-4">
              <div className="flex justify-between items-center text-xs pb-2 border-b border-zinc-800">
                <span className="text-yellow-400 font-black flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-yellow-400" /> اختبار قياس المفهوم للدرس (INSTANT QUIZ CARD)
                </span>
                <span className="text-[9px] text-zinc-500 font-mono">1 QUESTION CHALLENGE</span>
              </div>

              <div className="space-y-3 text-right">
                <h6 className="text-xs sm:text-sm font-bold text-white pr-1">
                  ❓ {selectedLesson.testQuiz.question}
                </h6>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1.5">
                  {selectedLesson.testQuiz.options.map((option, opIdx) => {
                    const isSelected = selectedQuizAnswer === opIdx;
                    const isCorrectAnswer = opIdx === selectedLesson.testQuiz.correctIndex;
                    
                    let opStyle = "bg-zinc-950 text-zinc-400 border-zinc-850 hover:border-zinc-800";
                    if (quizSubmitted) {
                      if (isCorrectAnswer) {
                        opStyle = "bg-emerald-950/50 text-emerald-400 border-emerald-800";
                      } else if (isSelected) {
                        opStyle = "bg-red-950/50 text-red-400 border-red-900";
                      }
                    } else if (isSelected) {
                      opStyle = "bg-zinc-900 border-[#FF0055] text-white";
                    }

                    return (
                      <button
                        key={opIdx}
                        onClick={() => {
                          if (!quizSubmitted) {
                            handleQuizSubmit(opIdx);
                          }
                        }}
                        className={`text-right p-3.5 border rounded-xl  transition-all text-xs cursor-pointer flex items-center justify-between ${opStyle}`}
                        disabled={quizSubmitted}
                      >
                        <span>{option}</span>
                        {quizSubmitted && isCorrectAnswer && <Check className="w-4 h-4 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>

                {/* Question explanation after submission */}
                {quizSubmitted && (
                  <div className="mt-4 p-3 bg-zinc-950/80 rounded-xl border border-zinc-900 text-right space-y-1">
                    <span className="text-[10px] text-zinc-500 font-bold block flex items-center gap-1">
                      💡 تفسير المعلم للحل:
                    </span>
                    <p className="text-[11px] text-zinc-400 leading-normal font-semibold">
                      {selectedLesson.testQuiz.explanation}
                    </p>
                    
                    {selectedQuizAnswer === selectedLesson.testQuiz.correctIndex ? (
                      <div className="text-[11px] font-black text-emerald-400 pt-1.5 flex items-center gap-1">
                        🎉 إجابة صحيحة بالكامل! تم إضافة النجوم والنقاط الفخرية لرصيدك!
                      </div>
                    ) : (
                      <div className="text-[11px] font-black text-red-400 pt-1.5 flex items-center gap-1">
                        ❌ الإجابة المحددة غير صحيحة. اقرأ الدرس جيداً وحاول في الدروس الأخرى!
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
