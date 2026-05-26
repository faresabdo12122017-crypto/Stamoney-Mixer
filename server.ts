import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize server-side Gemini client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.warn("⚠️ Warning: GEMINI_API_KEY not found in environment. Sitamoni will fallback to offline/default track generation mode.");
}

// ----------------------------------------------------
// MEMORY DATABASE SCHEMA (Saves during development session)
// ----------------------------------------------------
interface DBUser {
  username: string;
  passwordHash: string; // Plain-text or simple base64 hash for direct sandboxed authentication
  favorites: string[];
}

const usersDb: { [username: string]: DBUser } = {
  "fares": { username: "fares", passwordHash: "123456", favorites: ["track-2"] }
};

// ----------------------------------------------------
// DEFAULT PRE-CURATED EGYPTIAN TRACKS (4 DISTINCT STYLES)
// ----------------------------------------------------
const defaultTracks = [
  {
    id: "track-1",
    title: "مهرجان ستاموني الأول (اللي بنّانا كسب معانا)",
    bpm: 128,
    rhythmStyle: "مهرجان سريع مقسوم وبوم-باس عالي",
    vocalStyle: "أوتوتيون مهرجانات حاد مع وقفات بلدي عريضة",
    vocalStyleCategory: "Mahraganat",
    vibeTags: ["مزمار بلدي", "طبلة شعبي", "أورج دودي صاخب", "بيز زلزال", "تأثير ليزر"],
    introductionBeat: "يبدأ بتسارع تدريجي من ضربات الطبلة البلدي المنفردة، ثم يصرخ ميكروفون معدني: 'يا ساري الليل.. ستاموني في الحارة بالكلارنيت ويلف! الشارع جاهز.. يلا نولعها!' ثُم يدخل البيز القوي مع الأورج الشعبي السريع.",
    lines: [
      {
        section: "مقدمة",
        text: "جاهز يا ستاموني يا عم المايسترو؟ وزّع العظمة وخلي الشارع يرقص!",
        pronunciation: "جاهز يا ستاموني يا عم الما ييسترو؟ وزّع العَظَمة وخِلّي الشارع يِرؤُص!",
        vocalEffect: "تأثير الراديو القديم مع صدى عميق وصيحة شعبية",
        durationSeconds: 5
      },
      {
        section: "مقدمة",
        text: "احنا اللي بنّينا الحيط وأنت لسه بتبني في اسمك!",
        pronunciation: "إحنا اللي بَنّينا الحيط وإنت لِسّه بِتبني في إسمك!",
        vocalEffect: "تراجع الصدى ودخول الفلتر المعدني السايرن",
        durationSeconds: 4
      },
      {
        section: "كوبليه",
        text: "في قلبي الحزن ساكن بس عيني باصة لفوق",
        pronunciation: "في ألبي الحزن ساكن بس عيني باصّة لَفُوء",
        vocalEffect: "أوتوتيون حاد مع اهتزاز ميكروفون الكورال الإفتراضي",
        durationSeconds: 5
      },
      {
        section: "كوبليه",
        text: "وصاحبي اللي غدر بيا مسيره يجوع ويدوق طعم الشوق",
        pronunciation: "وصاحبي اللي غَدَر بيّا مسيرُه يجوع ويدوق طَعم الشوء",
        vocalEffect: "أوتوتيون حاد مدمج مع صدى فلانجر",
        durationSeconds: 5
      },
      {
        section: "لازمة",
        text: "يا زميلي الحكاية خلصانة بالحب والشياكة",
        pronunciation: "يا زميلي الحِكاية خَلصانة بالحب والشِياكة",
        vocalEffect: "كورال مرتد متكرر (تأثير الشلّة)",
        durationSeconds: 4
      },
      {
        section: "لازمة",
        text: "احنا في الملعب أساتذة وفي الأصول واخدين ريادة!",
        pronunciation: "إحنا في المَلَعب أساتزة وفي الأصول واخدين ريادة!",
        vocalEffect: "صوت جماعي حاد مع بيز عالي وصيحة إيقاعية",
        durationSeconds: 4
      },
      {
        section: "خاتمة",
        text: "سلام للرجالة الصافية من شبرا للمطرية، ستاموني الماجيكو يحيي الأحباء!",
        pronunciation: "سلام لِلرجّالة الصافية من شُبرا للْمَطَريّة، ستاموني الماجيكو يحيي الأحبّاء!",
        vocalEffect: "تلاشي تدريجي للصوت عدا المزمار والطبلة البلدي",
        durationSeconds: 6
      }
    ]
  },
  {
    id: "track-2",
    title: "موال سلطنة الحارة والمقسوم الصافي",
    bpm: 116,
    rhythmStyle: "مقسوم شرقي طربي بلدي واسع",
    vocalStyle: "طرب بلدي أصيل، أداء هادئ مائل للحزن والخبرة",
    vocalStyleCategory: "Shaabi",
    vibeTags: ["قانون بلدي", "رق شرقي", "كيبورد شرقي", "صوت ناي حزين", "طبلة دم-تك"],
    introductionBeat: "يبدأ بتقسيم هادئ جداً على آلة القانون ترافقه ضربات صاجات ناعمة، ثم تتسلل آهات شرقية ممتدة بالصدى قبل دخول إيقاع المقسوم الطربي المنضبط الكلاسيكي.",
    lines: [
      {
        section: "مقدمة",
        text: "آه يا ليل.. يا حارة مليانة ناس بوجوه مختلفة",
        pronunciation: "آه يا ليل.. يا حارة مليانة ناس بوُجوه مِختِلفَة",
        vocalEffect: "صدى استوديو كلاسيكي دافئ بدون فلاتر صاخبة",
        durationSeconds: 6
      },
      {
        section: "كوبليه",
        text: "قضينا العمر بنصون في عهود ناس باعت في ثانية",
        pronunciation: "أضينا العُمر بِنصون في عُهود ناس باعت في ثانية",
        vocalEffect: "أثر الاهتزاز الطربي الكلاسيكي (عُرَب صوتية مصرية)",
        durationSeconds: 5
      },
      {
        section: "كوبليه",
        text: "ويقولوا القدر والزمن.. وهي النفوس اللي فانية",
        pronunciation: "ويؤولوا الأَدَر والزمن.. وهي النفوس اللي فانية",
        vocalEffect: "طبقة تينور عميقة مع صدى دافئ",
        durationSeconds: 6
      },
      {
        section: "لازمة",
        text: "يا عيني صب الرضا.. ده البحر مالح بس قلبي عطشان",
        pronunciation: "يا عيني صُب الرّضا.. ده البحر مالح بس ألبي عطشان",
        vocalEffect: "صدى خفيف دافئ وصوت ناي جانبي خفي",
        durationSeconds: 5
      },
      {
        section: "خاتمة",
        text: "والصبر أخره دايماً فرح وسلام.. يا حارتنا الطيبة",
        pronunciation: "والصبر آخره دايماً فَرَح وسَلام.. يا حارتنا الطيبة",
        vocalEffect: "صوت قانون منفرد يتلاشى بلطف",
        durationSeconds: 6
      }
    ]
  },
  {
    id: "track-3",
    title: "سلطنة ليل الصبر والناي الحنين",
    bpm: 96,
    rhythmStyle: "سماعيا طربيا هادئ جدا بلمحة العود",
    vocalStyle: "غناء طرب صوفي حزين وممتد النغمة والسلطنة",
    vocalStyleCategory: "Tarab",
    vibeTags: ["عود شرقي", "ناي باكٍ", "رق كلاسيكي", "أصوات أوتار حزينة"],
    introductionBeat: "دخول سماعي من تقاسيم العود الرنان وصوت ناي باكي يرتفع صوته تدريجيًا ويهدئ الصدر، تمهيدًا لبدء موال طربي أصيل يعبر عن الصبر ومتاعب الحياة الزائلة كعادة حكماء شبرا البلد.",
    lines: [
      {
        section: "مقدمة",
        text: "يا صاحب الصبر طال الليل وأنت جميل ومتحلي بالرضا",
        pronunciation: "يا صاحب الصبر طال الليل وإنت جميل ومِتحَلّي بالرّضا",
        vocalEffect: "صدى طويل دافئ مع عمق وتردد صدى الحجرة الكلاسيكية",
        durationSeconds: 6
      },
      {
        section: "كوبليه",
        text: "ما تسألش العيون الحزينة فرحة الأحباء امتى تجينا",
        pronunciation: "ما تسألش العيون الحزينة فرحِت الأحبّاء إمتى تجينا",
        vocalEffect: "اهتزاز طربي شرقي صوفي دافئ",
        durationSeconds: 5
      },
      {
        section: "لازمة",
        text: "يا ليل يا عين ارضى بالقليل، ده رب الكون كفيل يداوينا",
        pronunciation: "يا ليل يا عين إرضى بالقليل، ده رب الكون كفيل يِداوينا",
        vocalEffect: "كورس متناغم دافئ هادئ للغاية",
        durationSeconds: 6
      },
      {
        section: "خاتمة",
        text: "نروق ونرجع نعلي الشغف والطيبة.. دايماً في حارتنا الصبر ليه مكان",
        pronunciation: "نِروء ونِرجع نِعلّي الشغف والطيبة.. دايماً في حارتنا الصبر ليه مكان",
        vocalEffect: "عود منفرد يتلاشى تتدريجيًا مع صفقات كلاسيكية ناعمة",
        durationSeconds: 6
      }
    ]
  },
  {
    id: "track-4",
    title: "أشواق كوزميك في ضي القمر",
    bpm: 112,
    rhythmStyle: "فيوجن بوب الكتروني بلدي",
    vocalStyle: "صوت بوب ناعم وعصري مع طبقة أوتوتيون خفيفة جداً",
    vocalStyleCategory: "Modern Pop",
    vibeTags: ["سينث العودة للمستقبل", "طبلة ديجيتال", "جيتار الكتريك رنان", "بيز بوب عميق"],
    introductionBeat: "يبدأ بمؤثر كيبورد حديث يحاكي السينث بوب مع إيقاع طبلة ديجيتال ناعم، يتخلله صوت تركيبي مبهج مع رنة جيتار كهربائي عصري.",
    lines: [
      {
        section: "مقدمة",
        text: "تحت ضوء القمر في شوارع المحروسة بندور على الحبيب",
        pronunciation: "تحت ضوء القمر في شوارع المحروسة بِندَور على الحبيب",
        vocalEffect: "أوتوتيون ناعم للغاية بوب مع رنين واسع ومستقبلي",
        durationSeconds: 5
      },
      {
        section: "كوبليه",
        text: "كلامنا بسيط بس واصل لكل القلوب اللي صاحية",
        pronunciation: "كلامنا بسيط بس واصل لِكل الألوب اللي صاحية",
        vocalEffect: "طبقة ناعمة دافئة بصدى بانورامي استوديو",
        durationSeconds: 5
      },
      {
        section: "لازمة",
        text: "يا غالي سحر عينك خلاني أسهر الليل وأفكر فيك بكل ثانية وجايز تغيب",
        pronunciation: "يا غالي سِحر عينك خَلاني أسهر الليل وأفكّر فيك بيكل ثانية وجايز تِغيب",
        vocalEffect: "تأثير كورس متألق وعالي الصوت",
        durationSeconds: 6
      },
      {
        section: "خاتمة",
        text: "دي قصة حبنا الجديدة مكتوبة بأسلوب ستاموني الكوزميك العصري!",
        pronunciation: "دي أُصّة حُبّنا الجديدة مَكتوبة بأسلوب ستاموني الكوزميك العصري!",
        vocalEffect: "تلاشي إيقاعي مع استمرار صوت السينث بوب الرنان",
        durationSeconds: 5
      }
    ]
  }
];

// Global dynamic tracks list initialized with the pre-curated hits
// This will survive between dev reloads in-memory
let globalTracks = [...defaultTracks];

// ----------------------------------------------------
// AUTHENTICATION API ENDPOINTS
// ----------------------------------------------------

// User Registration
app.post("/api/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "الرجاء إدخال اسم المستخدم وكلمة المرور كاملاً." });
  }

  const normalized = username.trim().toLowerCase();
  if (usersDb[normalized]) {
    return res.status(400).json({ error: "اسم المستخدم هذا مسجل بالفعل في الحارة!" });
  }

  // Create new user, auto-initialize empty favorites and generated history
  usersDb[normalized] = {
    username: username.trim(),
    passwordHash: password, // Simple sandbox hashing directly
    favorites: []
  };

  res.json({
    success: true,
    user: {
      username: usersDb[normalized].username,
      favorites: usersDb[normalized].favorites
    }
  });
});

// User Login
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "الرجاء إدخال اسم المستخدم وكلمة المرور." });
  }

  const normalized = username.trim().toLowerCase();
  const user = usersDb[normalized];

  if (!user || user.passwordHash !== password) {
    return res.status(400).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة يا بطل." });
  }

  res.json({
    success: true,
    user: {
      username: user.username,
      favorites: user.favorites
    }
  });
});

// Toggle Favorite Song
app.post("/api/favorites/toggle", (req, res) => {
  const { username, trackId } = req.body;
  if (!username) {
    return res.status(400).json({ error: "يجب تسجيل الدخول أولاً لإضافة الأغنية للمفضلة." });
  }

  const normalized = username.trim().toLowerCase();
  const user = usersDb[normalized];
  if (!user) {
    return res.status(404).json({ error: "المستخدم غير موجود." });
  }

  const index = user.favorites.indexOf(trackId);
  let isFavoriteNow = false;

  if (index === -1) {
    user.favorites.push(trackId);
    isFavoriteNow = true;
  } else {
    user.favorites.splice(index, 1);
    isFavoriteNow = false;
  }

  res.json({
    success: true,
    favorites: user.favorites,
    isFavorite: isFavoriteNow
  });
});

// Get user profile updates
app.get("/api/user/:username", (req, res) => {
  const normalized = req.params.username.trim().toLowerCase();
  const user = usersDb[normalized];
  if (!user) {
    return res.status(404).json({ error: "المستخدم غير موجود." });
  }
  res.json({
    success: true,
    user: {
      username: user.username,
      favorites: user.favorites
    }
  });
});

// ----------------------------------------------------
// CORE SONG GENERATOR (NLP + AI MULTI-VOCAL STYLE ENGINE)
// ----------------------------------------------------
app.post("/api/generate", async (req, res) => {
  try {
    const { prompt, vibe, vocalPreference, bpmPreference, vocalStyleCategory, creator } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "الرجاء إدخال البرومبت أو فكرة المهرجان لبدء المعالجة." });
    }

    const targetStyle: string = vocalStyleCategory || "Mahraganat"; 
    const randomBpm = bpmPreference || (targetStyle === "Tarab" ? 95 : targetStyle === "Modern Pop" ? 114 : targetStyle === "Shaabi" ? 120 : 128);

    // Setup style-specific configurations and vocabulary prompts to feedback to Gemini
    let styleGuide = "";
    if (targetStyle === "Mahraganat") {
      styleGuide = `
      - Style selected: Mahraganat (مهرجانات شعبية) - Extreme high energy, intense autotune, loud drops, heavy street slang.
      - Core slang: 'يا زميلي', 'خلصانة بشياكة', 'على وضعنا', 'كرفنا الأندال', 'الحارة ولعت'.
      - Standard speed range: 125-135 BPM.
      - Rhythm description: 'مهرجان سريع مقسوم ملفوف وبوم-باس عالي'.
      `;
    } else if (targetStyle === "Shaabi") {
      styleGuide = `
      - Style selected: Shaabi (شعبي بلدي كلاسيكي) - Street wisdom storytelling, energetic yet highly emotional feel, realistic expressions of alleyways.
      - Core slang: 'صاحب عمري', 'الغدر طبع النفوس', 'يا غالي', 'موال الحارة', 'كتاب بكتب معاني'.
      - Standard speed range: 115-125 BPM.
      - Rhythm description: 'مقسوم بلدي صق وحامي بالأورج التفاعلي'.
      `;
    } else if (targetStyle === "Tarab") {
      styleGuide = `
      - Style selected: Tarab (طرب صوفي وشرقي عميق) - Slow, soul-stirringly artistic, focusing on patience 'الصبر', fate 'القدر', night 'الليل', classical, exquisite lyrics, using oud and nay backings.
      - Core slang: 'يا ليل يا عين', 'الصبر كحيل الشاطر', 'سلطنة زمانا', 'رضا النفس غالي وبديع'.
      - Standard speed range: 85-110 BPM.
      - Rhythm description: 'سماعي ثلاثي طربي متزن بتقاسيم العود والناي'.
      `;
    } else if (targetStyle === "Modern Pop") {
      styleGuide = `
      - Style selected: Modern Pop (بوب بلدي حديث) - Upbeat, youthful expressions, romantic or trendy lifestyle words, lightweight synth-pop with soft percussion, easy hooks.
      - Core slang: 'سحر جمالك', 'ضي القمر وبندور', 'قلبي داب معاك', 'القصة جديدة بشلة بوب'.
      - Standard speed range: 105-120 BPM.
      - Rhythm description: 'فيوجن بوب الكتروني بلدي طبلة وسينث ناعم'.
      `;
    }

    // Checking if API client is available
    if (!ai) {
      console.log("No GEMINI_API_KEY detected. Simulating a custom generated track dynamically based on user selection...");
      // Simulate high quality, non-mock result based on the chosen style
      const pTitle = `${targetStyle === "Tarab" ? "موال" : targetStyle === "Shaabi" ? "قصة" : targetStyle === "Modern Pop" ? "أغنية" : "مهرجان"} ${prompt.substring(0, 30)} (بلمسة ستاموني)`;
      
      const generatedTrackMock = {
        id: `track-${Date.now()}`,
        title: pTitle,
        bpm: randomBpm,
        rhythmStyle: vibe || (targetStyle === "Tarab" ? "سماعي طربي" : targetStyle === "Modern Pop" ? "فيوجن بوب الكتروني" : targetStyle === "Shaabi" ? "مقسوم بلدي دافئ" : "مهرجاناتي سريع ومقسوم"),
        vocalStyle: vocalPreference || `أداء متقن لنمط ${targetStyle}`,
        vocalStyleCategory: targetStyle,
        vibeTags: targetStyle === "Tarab" ? ["قانون", "ناي بلدي", "عود دافئ"] : targetStyle === "Modern Pop" ? ["سينث بوب", "طبلة ديجيتال", "جيتار الكتريك"] : ["طبلة بلدي", "مزمار شعبيّ", "بيز زلزال"],
        introductionBeat: `دخول إيقاعي منظم بنمط ${targetStyle} يليق بكلمات الأغنية وسلطنة ستاموني الرائعة.`,
        lines: [
          {
            section: "مقدمة",
            text: `[Slam street beat] ستاموني يرحب بالحبايب ويبدأ غناء: ${prompt}`,
            pronunciation: `ستاموني يِرحّب بالحبايب وِيِبدأ غُناء: ${prompt}`,
            vocalEffect: "[Radio metallic effect with heavy room echo]",
            durationSeconds: 5
          },
          {
            section: "كوبليه",
            text: targetStyle === "Tarab" 
              ? "[Singer: slow emotional vibrato] يا ليل الصبر قلبي داب من كتر الفكر والأحزان علينا"
              : targetStyle === "Modern Pop" 
              ? "[Chorus: electronic autotunee synth] جمالك غير العادي بنشوفه في شوارع المحروسة يا غالي"
              : "[Heavy beat drop] احنا الشارع اللي علمنا الأصول واحترمنا للحق فرض علينا",
            pronunciation: targetStyle === "Tarab" 
              ? "يا ليل الصبر ألبي داب من كتر الفكر والأحزان علينا"
              : targetStyle === "Modern Pop" 
              ? "جمالك غير العادي بِنشوفه في شوارع المحروسة يا غالي"
              : "إحنا الشارع اللي علّمنا الأصول وإحترامنا لِلحق فرض علينا",
            vocalEffect: "[Warm dynamic autotune filter]",
            durationSeconds: 5
          },
          {
            section: "لازمة",
            text: targetStyle === "Tarab" 
              ? "[Instrument solo: Nay flute] مكتوب علينا السهر والصبر طاب كفوف الحزن طواينا"
              : targetStyle === "Modern Pop" 
              ? "[Synthesizer chorus shift] دوبني السهر وبفكر فيك الليلة طول الليل من الشوق"
              : "[Street siren wave] يا زميلي افهمنا صح مفيش منافس لينا في كل الساحات",
            pronunciation: targetStyle === "Tarab" 
              ? "مكتوب علينا السهر والصبر طاب كفوف الحزن طَواينا"
              : targetStyle === "Modern Pop" 
              ? "دوبني السهر وبفكّر فيك الليلة طول الليل من الشوء"
              : "يا زميلي إفهمنا صح مفيش منافِس لينا في كل الساحات",
            vocalEffect: "[High pitch backing vocals and loud reverb]",
            durationSeconds: 5
          },
          {
            section: "خاتمة",
            text: "[Outro: beat dissipating gradually] تأليف بلمسة حارة كوزميك وصوت المايسترو ستاموني الممتع!",
            pronunciation: "تأليف بلمسة حارة كوزميك وصوت المايسترو ستاموني الممتع!",
            vocalEffect: "[Vocal fade out, mizmarn solo]",
            durationSeconds: 6
          }
        ],
        creator: creator || undefined
      };
  
      globalTracks.unshift(generatedTrackMock);
      return res.json({ success: true, track: generatedTrackMock, source: "offline-dynamic-generator" });
    }
  
    // Call Gemini API server-side
    console.log(`Calling Gemini API to synthesize vocal style: ${targetStyle}...`);
  
    const systemInstruction = `
You are an elite expert in Egyptian Street Dialect, Cairo/Shaabi/Tarab/Mahraganat Culture, and Arabic music lyrics writing.
Your absolute goal is to act as the core "Sitamoni Smart Magic NLP Engine." This system converts user concepts into highly professional, authentic Egyptian lyrics under different vocal genres.

Please apply the following rules strictly based on the chosen singing style:
${styleGuide}

Cairo street style linguistics rules to apply strictly:
1. Normalise the letters phonetically in pronunciation representation:
   - Convert 'ق' (Qaf) into 'ء' (Hamza equivalent) in written pronunciation indicators. For example, "قلبي" is pronounced "ألبي", "قال" is pronounced "آل", "سكة ضيقة" is pronounced "سكة ضية".
   - Replace Alef Layna 'ى' with 'ي' in word endings (e.g. 'على' to 'علي' in phonetic context).
   - Adjust noun constructs properly (e.g., "عيلت" instead of "عيلة").
2. Catchy rhyming, high-energy meter, slang of current Cairo alleyways.
3. Create sections structured from: مقدمة (intro/shoutout), مذهب (main theme/first verse), كوبليهات (verses), لازمة (refrain/hook), and خاتمة (outro/salutes).
4. Assign an appropriate, highly effective timing duration for each line, ranging between 3 to 6 seconds, to synchronize with the beat loop playing in the client.
5. STRICT INSTRUCTION FORMATTING RULE: Any technical, musical commands, artistic directions, performer cues, mood suggestions, beat drops, or instrument annotations (e.g. [Intro], [Heavy beat drop], [Guitar solo], [Outro]) MUST be written in ENGLISH and wrapped in meta brackets. Absolutely NO Arabic characters are allowed inside any meta brackets. Ensure these brackets are placed within the generated lines.

You MUST respond with a strict JSON structure matching the required schema. Ensure the response is pure valid JSON. Never output markdown around or inside the json block (e.g. do NOT output \`\`\`json). Just return the json object directly.
`;

    const userInstructionsPrompt = `
User Concept / Idea for the Song: "${prompt}"
Vibe Selected: "${vibe || "تلقائي حسب طبقة الصوت"}"
Vocal Styling Preference: "${vocalPreference || "موزان تلقائي"}"
Target BPM / Speed Preference: "${randomBpm}"
Vocal Category Theme: "${targetStyle}"

Write a hit Egyptian song in the ${targetStyle} style based on these requirements. Return structured fields for the track with detailed lines conforming to Cairo phonetic pronunciation. Enforce English-only tags inside meta brackets for all performance cues and artistic directions.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userInstructionsPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "اسم الأغنية بالعامية المصرية بلمسة ستاموني السحرية" },
            bpm: { type: Type.INTEGER, description: "سرعة الإيقاع الموصى بها كعدد صحيح بين 80 و 138 حسب نمط الغناء" },
            rhythmStyle: { type: Type.STRING, description: "نوع الإيقاع الرئيسي بالعامية مثل مقسوم سريع، سماعي طربي، فيوجن بوب" },
            vocalStyle: { type: Type.STRING, description: "طبيعة طبقة الصوت والأداء والمؤثر مع English tags in brackets" },
            vibeTags: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "وسوم وعناصر الآلات الموسيقية الملائمة للموديل" 
            },
            introductionBeat: { type: Type.STRING, description: "وصف تفصيلي لكيفية دخول الإيقاع موسيقيًا للإشراق الصوتي مع English directions in brackets" },
            lines: {
              type: Type.ARRAY,
              description: "أبيات الكلمات الغنائية مع بيانات النطق والتوقيت",
              items: {
                type: Type.OBJECT,
                properties: {
                  section: { type: Type.STRING, description: "مقدمة، كوبليه، لازمة، خاتمة" },
                  text: { type: Type.STRING, description: "الكلمات الغنائية بالعامية المصرية مدمج بها توجيهات الأداء بين أقواس بالإنجليزية فقط مثل [Singer: high autotune]" },
                  pronunciation: { type: Type.STRING, description: "النطق الصوتي القاهري الحرفي مع تحويل القاف همزة وتنظيف الإملاء" },
                  vocalEffect: { type: Type.STRING, description: "المؤثر الصوتي المناسب باللغة الإنجليزية حصراً للتوافق مع المايسترو" },
                  durationSeconds: { type: Type.INTEGER, description: "التوقيت المقدر بالأوتوماتيك لغناء السطر (بين 3 و 6 ثوانٍ)" }
                },
                required: ["section", "text", "pronunciation", "vocalEffect", "durationSeconds"]
              }
            }
          },
          required: ["title", "bpm", "rhythmStyle", "vocalStyle", "vibeTags", "introductionBeat", "lines"]
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    const generatedTrack = {
      id: `track-${Date.now()}`,
      vocalStyleCategory: targetStyle,
      creator: creator || undefined,
      ...parsedData
    };

    // Save newly generated track to global memory database so others can access/discover it!
    globalTracks.unshift(generatedTrack);

    return res.json({ success: true, track: generatedTrack, source: "gemini-nlp-engine" });

  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    res.status(500).json({ 
      error: "حصل مشكلة أثناء معالجة الكلمات وتوليد الصوت من ستاموني بالـ AI.", 
      details: error.message || error 
    });
  }
});

// Endpoint to fetch all active tracks (includes custom generated ones)
app.get("/api/tracks", (req, res) => {
  res.json({ success: true, tracks: globalTracks });
});

// Endpoint to fetch a single track for rendering shared URL pages directly
app.get("/api/tracks/:id", (req, res) => {
  const matched = globalTracks.find(t => t.id === req.params.id);
  if (!matched) {
    return res.status(404).json({ error: "المهرجان غير موجود أو تم حذفه من الحارة." });
  }
  res.json({ success: true, track: matched });
});

// Vite server integrations & startup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🎤 Sitamoni Express backend listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("⚠️ Failed to boot Sitamoni server:", err);
});
