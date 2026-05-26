import { Track, TrackLine } from "../types";

export type ExportPlatform = "suno" | "udio" | "daw" | "stamoni";

export interface PlatformMetadata {
  id: ExportPlatform;
  name: string;
  nameEn: string;
  description: string;
}

export const EXPORT_PLATFORMS: PlatformMetadata[] = [
  {
    id: "stamoni",
    name: "ستاموني المطور (الافتراضي)",
    nameEn: "Stamoni Enhanced (Native)",
    description: "تنسيق كنسخة مسرحية غنائية متكاملة بآهات وتقاطيع الحارة المصرية."
  },
  {
    id: "suno",
    name: "سونو إيه آي (Suno AI)",
    nameEn: "Suno AI Prompt",
    description: "الأفضل للـ AI السريع. يدرج تاق المود والموسيقى وعلامات المقطع مثل [Verse] و [Chorus]."
  },
  {
    id: "udio",
    name: "يوديو إيه آي (Udio AI)",
    nameEn: "Udio AI Prompt",
    description: "تنسيق غني بمقاطع الهتاف والسينث جيتار مع تحديد تفصيلي للأداء الصوتي القاهري."
  },
  {
    id: "daw",
    name: "إنتاج احترافي (DAW/Local MIDI)",
    nameEn: "DAW / MIDI Production",
    description: "تصدير الكلمات مع تفاصيل سرعة الضربات الـ BPM، سلم النغمة ومؤثرات الفلاتر الفنية."
  }
];

// Helper to convert Arabic section names to standardized English meta brackets
export function getSectionTag(arabicSection: string, platform: ExportPlatform): string {
  const norm = arabicSection.trim();
  switch (norm) {
    case "مقدمة":
      if (platform === "suno") return "[Intro]\n[Shoutout Egyptian Street]";
      if (platform === "udio") return "[Intro]\n[Heavy synthesizer opening, Egyptian scale]";
      return "[Intro / Vocal Scream]";
    case "لازمة":
      if (platform === "suno") return "[Chorus]";
      if (platform === "udio") return "[Chorus]\n[Beat Drop, Heavy autotune]";
      return "[Chorus / Hook]";
    case "خاتمة":
      if (platform === "suno") return "[Outro]\n[Fade Out]";
      if (platform === "udio") return "[Outro]\n[Instrumental solo, fade]";
      return "[Outro / Salutes]";
    case "كوبليه":
    default:
      if (platform === "suno") return "[Verse]";
      if (platform === "udio") return "[Verse]";
      return "[Verse / Couplet]";
  }
}

// Convert vocalStyleCategory to explicit English genre metadata for external generators
export function getEnglishGenreTags(styleCategory: string, bpm: number, rhythm: string): string {
  switch (styleCategory) {
    case "Tarab":
      return `Genre: Egyptian Tarab, Arabic soul music, slow partition, spiritual, Nay flute, Oud guitar, 92 BPM, emotional emotional male vocals`;
    case "Modern Pop":
      return `Genre: Arabic Pop, Egyptian electro synth-pop, groovy commercial beat, acoustic oud, bright electronic chords, 112 BPM`;
    case "Shaabi":
      return `Genre: Egyptian Shaabi, street music, Cairo folk rhythm, local keyboard, organic accordion, 118 BPM, storytelling tone`;
    case "Mahraganat":
    default:
      return `Genre: Egyptian Mahraganat, Cairo street electro-shaabi, heavy bass drops, distorted autotune, mizmarn, hyper percussion, 128 BPM`;
  }
}

/**
 * Main function to format track lyrics according to the selected platform
 */
export function formatLyrics(track: Track, platform: ExportPlatform): string {
  if (!track) return "";

  const lines = track.lines || [];
  let output = "";

  // 1. Header prompts tailored to the specific target platform with core English brackets
  if (platform === "suno") {
    output += `[Style: ${getEnglishGenreTags(track.vocalStyleCategory, track.bpm, track.rhythmStyle)}]\n`;
    output += `[Vocal Accent: Cairo street, extreme auto-tune, heavy vocal double]\n`;
    output += `[Tempo: ${track.bpm} BPM, rhythmic 4/4 clap]\n\n`;
  } else if (platform === "udio") {
    output += `[Descriptor: ${getEnglishGenreTags(track.vocalStyleCategory, track.bpm, track.rhythmStyle)}]\n`;
    output += `[Style: Egyptian electro-shaabi, heavily autotuned male singer, mizmarn, street sirens]\n`;
    output += `[Vocal: High-pitch energetic autotune, passionate storytelling]\n\n`;
  } else if (platform === "daw") {
    output += `# Technical DAW Sync sheet for track: "${track.title}"\n`;
    output += `[BPM: ${track.bpm}]\n`;
    output += `[Rhythm: ${track.rhythmStyle}]\n`;
    output += `[Vocal Effect Target: ${track.vocalStyle}]\n`;
    output += `[Scale recommendation: E-Phrygian / Hijaz Arabic scale]\n\n`;
  } else {
    // Native Stamoni
    output += `[Sitamoni Broadcast Engine v3.0 | Track: ${track.title}]\n`;
    output += `[BPM Speed: ${track.bpm} | Rhythm Vibe: ${track.rhythmStyle}]\n\n`;
  }

  // 2. Format individual lyric blocks
  let currentSection = "";
  
  lines.forEach((line: TrackLine, index: number) => {
    // Section headers
    if (line.section !== currentSection) {
      currentSection = line.section;
      output += `\n${getSectionTag(currentSection, platform)}\n`;
    }

    // Embed performance direction in English meta brackets
    let lineIndicator = "";
    if (line.vocalEffect) {
      // Map vocal effects to precise English meta flags
      const effectEn = getEnglishEffect(line.vocalEffect, track.vocalStyleCategory);
      lineIndicator = `[Singer: ${effectEn}] `;
    }

    output += `${lineIndicator}${line.text}\n`;
  });

  return output.trim();
}

// Convert Arabic vocal effects to clean, beautiful English meta instructions for performers
export function getEnglishEffect(arabicEffect: string, style: string): string {
  const norm = arabicEffect || "";
  if (norm.includes("راديو") || norm.includes("قديم")) return "radio metallic filter, with retro distortion";
  if (norm.includes("حاد") || norm.includes("سريع")) return "intense fast auto-tune glitch";
  if (norm.includes("صدى") || norm.includes("عميق")) return "deep panorama stereo echo";
  if (norm.includes("جماعي") || norm.includes("كورال") || norm.includes("الشلة")) return "group backing vocals, crowd shouting";
  if (norm.includes("دافئ") || norm.includes("طبيعي") || norm.includes("طرب")) return "warm natural vibrato, emotional";
  if (norm.includes("ناي") || norm.includes("قانون")) return "soft acoustic backings";
  if (norm.includes("تلاشي")) return "vocal fade-out";
  
  // High-quality style-based fallback
  if (style === "Mahraganat") return "harsh autotune, rapid street tone";
  if (style === "Tarab") return "passionate extended vocal scale, vibrato";
  if (style === "Shaabi") return "narrative gritty street voice";
  return "studio modern pop echo";
}
