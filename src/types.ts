export interface TrackLine {
  section: string; // مقدمة، كوبليه، لازمة، خاتمة
  text: string;     // الكلمات بالعامية المصرية
  pronunciation: string; // طريقة النطق القاهري
  vocalEffect: string;   // مؤثر عريض، أوتوتيون، صدى
  durationSeconds: number; // مدة غنائية بالثواني
}

export type VocalStyleCategory = "Mahraganat" | "Shaabi" | "Tarab" | "Modern Pop";

export interface Track {
  id: string;
  title: string;
  bpm: number;
  rhythmStyle: string;
  vocalStyle: string; // Detail summary
  vocalStyleCategory: VocalStyleCategory; // Mahraganat | Shaabi | Tarab | Modern Pop
  vibeTags: string[];
  introductionBeat: string;
  lines: TrackLine[];
  creator?: string; // Optional username who generated this
}

export interface UserProfile {
  username: string;
  favorites: string[]; // List of track IDs
  createdTracks: string[]; // List of track IDs
}

export interface MixerSettings {
  masterVol: number;
  synthVol: number; // مزمار
  beatVol: number;  // بوم وفلو (Drums & Bass)
  tablaVol: number; // دم تك (Darabukka)
  vocalVol: number; // صوت المطرب (TTS Speech/Singing)
  vocalSpeechRate: number; // سرعة القراءة
  vocalPitch: number; // طبقة الصوت
  reverbActive: boolean; // صدى الحارة
  mufflerActive: boolean; // فلتر الكاسيت القديم
}
