import React, { useState, useEffect } from "react";
import { 
  FileSpreadsheet, 
  Calendar, 
  FileText, 
  HardDrive, 
  Mail, 
  Video, 
  Users, 
  BookOpen, 
  Sparkles, 
  Loader2, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Check,
  Trash2,
  Bookmark,
  MessageSquare,
  Plus,
  RefreshCw,
  ClipboardList,
  FolderOpen
} from "lucide-react";
import { Track } from "../types";
import { 
  exportToGoogleSheets, 
  exportToGoogleDocs, 
  backupProjectToDrive, 
  scheduleStudioSession, 
  sendLyricsMail, 
  saveToGoogleKeep,
  listDriveKeepMemos,
  fetchDriveKeepContent,
  deleteDriveKeepMemo,
  listGoogleChatSpaces,
  createGoogleChatSpace,
  sendGoogleChatMessage,
  createGoogleMeetSpace,
  createLyricsFeedbackForm,
  GoogleContactInfo,
  KeepMemoInfo,
  ChatSpaceInfo
} from "../utils/googleWorkspace";
import { formatLyrics } from "../utils/lyricFormatter";

interface GoogleProductionHubProps {
  track: Track | null;
  googleToken: string | null;
  currentUser: { username: string; favorites: string[]; isGoogle?: boolean } | null;
  googleContacts: GoogleContactInfo[];
  triggerToast: (msg: string) => void;
  onGoogleLogin: () => void;
}

type ActiveTab = "exports" | "chat" | "meet" | "forms" | "keep";

export function GoogleProductionHub({
  track,
  googleToken,
  currentUser,
  googleContacts,
  triggerToast,
  onGoogleLogin
}: GoogleProductionHubProps) {
  // Navigation / Tabs structure
  const [activeTab, setActiveTab] = useState<ActiveTab>("exports");

  // Processing load indicators
  const [loadingStates, setLoadingStates] = useState<{ [key: string]: boolean }>({});
  
  // Base export results
  const [sheetUrl, setSheetUrl] = useState<string>("");
  const [docUrl, setDocUrl] = useState<string>("");
  const [driveUrl, setDriveUrl] = useState<string>("");

  // Meet and Calendar States
  const [calendarResult, setCalendarResult] = useState<{ eventUrl: string; meetUrl: string } | null>(null);
  const [instantMeetUrl, setInstantMeetUrl] = useState<string>("");
  const [recordingDate, setRecordingDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });

  // Gmail & Contacts
  const [gmailSent, setGmailSent] = useState<boolean>(false);
  const [recipientEmail, setRecipientEmail] = useState<string>("");
  const [recipientName, setRecipientName] = useState<string>("");
  const [isContactsOpen, setIsContactsOpen] = useState<boolean>(false);

  // Google Chat States
  const [chatSpaces, setChatSpaces] = useState<ChatSpaceInfo[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<string>("");
  const [newSpaceName, setNewSpaceName] = useState<string>("");
  const [customChatMessage, setCustomChatMessage] = useState<string>("");

  // Google Forms States
  const [generatedForm, setGeneratedForm] = useState<{ formUrl: string; responsesUrl: string; formId: string } | null>(null);

  // Google Keep (Drive Simulated Sticky Notes) States
  const [keepNotes, setKeepNotes] = useState<KeepMemoInfo[]>([]);
  const [activeKeepNoteContent, setActiveKeepNoteContent] = useState<string | null>(null);
  const [activeKeepNoteId, setActiveKeepNoteId] = useState<string | null>(null);
  const [keepUrl, setKeepUrl] = useState<string>("");

  // Sync / Load tab-specific data on change or login
  useEffect(() => {
    if (googleToken) {
      if (activeTab === "chat") {
        fetchChatSpaces();
      } else if (activeTab === "keep") {
        fetchKeepNotes();
      }
    }
  }, [activeTab, googleToken]);

  // Safely wrapper for actions that mutate or read Google Workspace APIs
  const runGoogleAction = async (actionKey: string, actionFn: () => Promise<void>, isMutation: boolean = false) => {
    if (!googleToken) {
      triggerToast("🔒 يجب ربط حساب غوغل أولاً لاستخدام هذه الخدمة السحابية!");
      return;
    }
    
    // Explicit user confirmation before destructive/mutating operations (Mandatory Workspace Pillar)
    if (isMutation) {
      const isConfirmed = window.confirm(
        `تنبيه المايسترو: هل تود المضي قدماً وإكمال تفاعلات غوغل في حسابك السحابي؟ هذه العملية ستقوم بإجراء تعديل أو إرسال بيانات بالنيابة عنك.`
      );
      if (!isConfirmed) return;
    }

    setLoadingStates(prev => ({ ...prev, [actionKey]: true }));
    try {
      await actionFn();
    } catch (error: any) {
      console.error(error);
      triggerToast(`⚠️ عذراً، حصل خلل أثناء تشغيل الخدمة: ${error.message || error}`);
    } finally {
      setLoadingStates(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  // --- 1. Base Exports Triggers ---
  const handleExportSheets = () => {
    if (!track) return;
    runGoogleAction("sheets", async () => {
      const url = await exportToGoogleSheets(track, googleToken!);
      setSheetUrl(url);
      triggerToast("💚 تم تصدير جدول البيانات Lyrics Sheet بنجاح وبنطق الحارة!");
    });
  };

  const handleExportDocs = () => {
    if (!track) return;
    runGoogleAction("docs", async () => {
      const url = await exportToGoogleDocs(track, googleToken!);
      setDocUrl(url);
      triggerToast("💙 تم حفظ ورقة الكلمات بنجاح في Google Docs بمؤثرات ستاموني!");
    });
  };

  const handleBackupDrive = () => {
    if (!track) return;
    runGoogleAction("drive", async () => {
      const url = await backupProjectToDrive(track, googleToken!);
      setDriveUrl(url);
      triggerToast("💛 تم عمل نسخة احتياطية من ملف مشروع الأغنية بنجاح في Google Drive!");
    });
  };

  // --- 2. Google Chat Crew Triggers ---
  const fetchChatSpaces = async () => {
    runGoogleAction("fetch_spaces", async () => {
      const list = await listGoogleChatSpaces(googleToken!);
      setChatSpaces(list);
      if (list.length > 0 && !selectedSpace) {
        setSelectedSpace(list[0].name);
      }
    });
  };

  const handleCreateSpace = () => {
    if (!newSpaceName.trim()) {
      triggerToast("يرجى كتابة اسم الروم الجديد أولاً!");
      return;
    }
    runGoogleAction("create_space", async () => {
      const created = await createGoogleChatSpace(googleToken!, newSpaceName.trim());
      setNewSpaceName("");
      triggerToast(`🎉 تم إنشاء مساحة الدردشة الجديدة "${created.displayName}" بنجاح!`);
      await fetchChatSpaces();
      setSelectedSpace(created.name);
    }, true);
  };

  const handleSendToSpace = () => {
    if (!track) return;
    if (!selectedSpace) {
      triggerToast("يرجى تحديد مساحة دردشة أولاً!");
      return;
    }
    runGoogleAction("send_chat", async () => {
      const linesText = track.lines.map(l => `[${l.section}] ${l.text}`).join("\n");
      const chosenSpaceObj = chatSpaces.find(s => s.name === selectedSpace);
      const spaceDisplayName = chosenSpaceObj ? chosenSpaceObj.displayName : "الروم";

      const msg = customChatMessage.trim() || `🎤 *مهرجان جديد من الاستديو: ${track.title}* \n🎨 *التاق*: ${track.vocalStyleCategory}\n⚡ *السرعة*: ${track.bpm} BPM\n🔊 *المؤثر*: ${track.vocalStyle}\n\n*الكلمات مجهزة للغناء:*\n${linesText}`;
      
      await sendGoogleChatMessage(googleToken!, selectedSpace, msg);
      setCustomChatMessage("");
      triggerToast(`💬 تم إرسال كلمات المهرجان بنجاح إلى "${spaceDisplayName}" عبر شات غوغل!`);
    }, true);
  };

  // --- 3. Google Meet & Calendar Triggers ---
  const handleScheduleCalendar = () => {
    if (!track || !recordingDate) return;
    runGoogleAction("calendar", async () => {
      const res = await scheduleStudioSession(track, googleToken!, recordingDate);
      setCalendarResult(res);
      triggerToast("📅 تم جدولة موعد تسجيل البروفة فوريًا وإنشاء رابط لقاء Google Meet!");
    }, true);
  };

  const handleInstantMeet = () => {
    runGoogleAction("instant_meet", async () => {
      const url = await createGoogleMeetSpace(googleToken!);
      setInstantMeetUrl(url);
      triggerToast("🎥 تم تشغيل غرفة بث Google Meet حية وفورية للبروفات الفنية!");
    }, true);
  };

  // --- 4. Google Forms Feedback Triggers ---
  const handleCreateFeedbackForm = () => {
    if (!track) return;
    runGoogleAction("forms_create", async () => {
      const form = await createLyricsFeedbackForm(track, googleToken!);
      setGeneratedForm(form);
      triggerToast("📊 تم تجهيز استمارة استطلاع الرأي للجمهور من Google Forms بنجاح!");
    }, true);
  };

  // --- 5. Google Keep (Simulated Sticky Notes) Triggers ---
  const fetchKeepNotes = async () => {
    runGoogleAction("fetch_keep", async () => {
      const list = await listDriveKeepMemos(googleToken!);
      setKeepNotes(list);
    });
  };

  const handleSaveKeepNote = () => {
    if (!track) return;
    runGoogleAction("keep", async () => {
      const url = await saveToGoogleKeep(track, googleToken!);
      setKeepUrl(url);
      triggerToast("📝 تم حفظ الكلمات ونوتات المهرجان كمسودة Keep سحابية!");
      await fetchKeepNotes();
    }, true);
  };

  const handleLoadNoteContent = (noteId: string) => {
    runGoogleAction("load_note", async () => {
      const content = await fetchDriveKeepContent(noteId, googleToken!);
      setActiveKeepNoteContent(content);
      setActiveKeepNoteId(noteId);
    });
  };

  const handleDeleteKeepNote = (noteId: string) => {
    if (!noteId) return;
    runGoogleAction("delete_note", async () => {
      const success = await deleteDriveKeepMemo(noteId, googleToken!);
      if (success) {
        triggerToast("🗑️ تم حذف المسودة من الكيب السحابي بنجاح.");
        setActiveKeepNoteContent(null);
        setActiveKeepNoteId(null);
        await fetchKeepNotes();
      }
    }, true);
  };

  // Gmail Send Helper
  const handleSendGmail = () => {
    if (!track || !recipientEmail) {
      triggerToast("الرجاء إدخال البريد الإلكتروني للمستلم أولاً!");
      return;
    }
    runGoogleAction("gmail", async () => {
      const formatted = formatLyrics(track, "stamoni");
      await sendLyricsMail(track, googleToken!, recipientEmail, formatted);
      setGmailSent(true);
      triggerToast("❤️ تم إرسال قالب الكلمات والتوقيت الغنائي والمكساج بنجاح عبر بريد Gmail!");
      setTimeout(() => setGmailSent(false), 5000);
    }, true);
  };

  return (
    <div className="bg-[#121214] border-2 border-[#CCFF00]/40 rounded p-5 flex flex-col gap-5 shadow-[5px_5px_0px_rgba(204,255,0,0.08)] text-right">
      <div className="flex justify-between items-center border-b border-zinc-850 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00F0FF] animate-pulse"></div>
          <h4 className="text-sm sm:text-base font-black text-white tracking-wide">
            بوابة المايسترو لخدمات Google Workspace السحابية
          </h4>
        </div>
        <span className="text-[10px] font-mono text-[#CCFF00] bg-[#CCFF00]/10 border border-[#CCFF00]/30 px-2 py-0.5 rounded uppercase">
          Pro Suite Suite
        </span>
      </div>

      {!googleToken ? (
        // Locked State
        <div className="text-center py-6 px-4 bg-zinc-950/40 rounded border border-zinc-900 flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#CCFF00]">
            <HardDrive className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h5 className="text-xs font-black text-white">تفعيل الجناح السحابي المتكامل لخدمات Google</h5>
            <p className="text-[10.5px] text-zinc-500 leading-relaxed max-w-sm">
              اربط حسابك لتفعيل مصفوفة الأدوات المتكاملة: Google Chat لإرسال الكلمات لفريقك، Google Meet لغرف المكساج الحية، Google Forms لاستبصار رأي الجمهور، و Google Keep لحفظ المسودات السريعة!
            </p>
          </div>
          
          <button
            onClick={onGoogleLogin}
            className="bg-white hover:bg-[#CCFF00] text-black font-black text-xs px-5 py-3 rounded-md transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            </svg>
            ربط حساب Google وتدشين الأستوديو السحابي
          </button>
        </div>
      ) : (
        // Connected controls state
        <div className="space-y-4 text-right">
          
          <div className="flex items-center justify-between bg-emerald-950/20 border border-emerald-900/40 p-2.5 rounded-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px] text-emerald-400 font-bold">حسابك السحابي نشط ومعتمد لدى المايسترو</span>
            </div>
            <span className="text-[9px] text-[#CCFF00] font-mono bg-zinc-950 px-1.5 py-0.5 rounded">
              PRO SUITE ACTIVE
            </span>
          </div>

          {!track ? (
            <div className="text-center py-5 text-zinc-600 text-xs font-bold bg-[#0a0a0d] border border-zinc-900 rounded">
              ⚠️ الرجاء توليد أو اختيار مهرجان نشط من الأستوديو لتفعيل ميزات مجمع جوجل.
            </div>
          ) : (
            <div className="space-y-4">
              
              <div className="p-3 bg-zinc-950/70 border border-zinc-900 rounded flex justify-between items-center">
                <div>
                  <span className="text-[9px] text-zinc-500 block">المشروع النشط المراد معالجته سحابيًا:</span>
                  <span className="text-xs font-extrabold text-[#CCFF00]">{track.title}</span>
                </div>
                <span className="text-[9.5px] text-zinc-400 bg-zinc-900 px-2 py-1 rounded inline-block font-mono">
                  {track.bpm} BPM | {track.vocalStyleCategory}
                </span>
              </div>

              {/* Navigation Tabs - Beautiful Retro Styling */}
              <div className="flex flex-wrap border-b border-zinc-800 gap-1 pb-1">
                <button
                  onClick={() => setActiveTab("exports")}
                  className={`px-3 py-2 text-[11px] rounded-t font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === "exports" 
                      ? "bg-zinc-900 text-[#CCFF00] border-t-2 border-[#CCFF00]" 
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>الأساسي والتصدير</span>
                </button>

                <button
                  onClick={() => setActiveTab("chat")}
                  className={`px-3 py-2 text-[11px] rounded-t font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === "chat" 
                      ? "bg-zinc-900 text-[#00F0FF] border-t-2 border-[#00F0FF]" 
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Google Chat</span>
                </button>

                <button
                  onClick={() => setActiveTab("meet")}
                  className={`px-3 py-2 text-[11px] rounded-t font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === "meet" 
                      ? "bg-zinc-900 text-sky-400 border-t-2 border-sky-400" 
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Meetings & Meet</span>
                </button>

                <button
                  onClick={() => setActiveTab("forms")}
                  className={`px-3 py-2 text-[11px] rounded-t font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === "forms" 
                      ? "bg-zinc-900 text-purple-400 border-t-2 border-purple-400" 
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span>استبيانات Forms</span>
                </button>

                <button
                  onClick={() => setActiveTab("keep")}
                  className={`px-3 py-2 text-[11px] rounded-t font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === "keep" 
                      ? "bg-zinc-900 text-yellow-500 border-t-2 border-yellow-500" 
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>مسودات Keep</span>
                </button>
              </div>

              {/* TAB CONTENT 1: EXPORTS (Sheets, Docs, Backup, Gmail) */}
              {activeTab === "exports" && (
                <div className="space-y-4 animation-fadeIn">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Sheets */}
                    <div className="bg-zinc-950 p-3 border border-zinc-900 rounded flex flex-col justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <FileSpreadsheet className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <h5 className="text-[11px] font-black text-zinc-200">تصدير Google Sheets</h5>
                          <p className="text-[9.5px] text-zinc-500 leading-tight">ورقة عمل وتوزيع مقسم بالأعمدة والسرعات وثواني التوقيت.</p>
                        </div>
                      </div>
                      {sheetUrl ? (
                        <a 
                          href={sheetUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-full bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-800 text-emerald-400 text-[9.5px] font-bold py-1.5 rounded flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>فتح جدول المهرجان</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <button
                          onClick={handleExportSheets}
                          disabled={loadingStates["sheets"]}
                          className="w-full bg-zinc-900 hover:bg-emerald-500 hover:text-black text-zinc-300 text-[9.5px] font-bold py-1.5 rounded transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          {loadingStates["sheets"] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <>توليد جدول الأبيات</>}
                        </button>
                      )}
                    </div>

                    {/* Docs */}
                    <div className="bg-zinc-950 p-3 border border-zinc-900 rounded flex flex-col justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <FileText className="w-6 h-6 text-blue-500 shrink-0 mt-0.5" />
                        <div>
                          <h5 className="text-[11px] font-black text-zinc-200">مستند Google Docs</h5>
                          <p className="text-[9.5px] text-zinc-500 leading-tight">تنسيق ورقة الكلمات بطريقة جمالية لسهولة النطق والغناء بمرونة.</p>
                        </div>
                      </div>
                      {docUrl ? (
                        <a 
                          href={docUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-full bg-blue-950/40 hover:bg-blue-900/40 border border-blue-800 text-blue-400 text-[9.5px] font-bold py-1.5 rounded flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>فتح مستند الكلمات</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <button
                          onClick={handleExportDocs}
                          disabled={loadingStates["docs"]}
                          className="w-full bg-zinc-900 hover:bg-blue-500 hover:text-black text-zinc-300 text-[9.5px] font-bold py-1.5 rounded transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          {loadingStates["docs"] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <>توليد مستند التحرير</>}
                        </button>
                      )}
                    </div>

                    {/* Drive Backup */}
                    <div className="bg-zinc-950 p-3 border border-zinc-900 rounded flex flex-col justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <HardDrive className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <h5 className="text-[11px] font-black text-zinc-200">نسخ Google Drive</h5>
                          <p className="text-[9.5px] text-zinc-500 leading-tight">أرشفة وحفظ كود المهرجان البرمجي سحابياً لإعادته بأي وقت.</p>
                        </div>
                      </div>
                      {driveUrl ? (
                        <a 
                          href={driveUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-full bg-amber-950/40 hover:bg-amber-900/40 border border-amber-800 text-amber-400 text-[9.5px] font-bold py-1.5 rounded flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>عرض الملف في درايف</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <button
                          onClick={handleBackupDrive}
                          disabled={loadingStates["drive"]}
                          className="w-full bg-zinc-900 hover:bg-amber-500 hover:text-black text-zinc-300 text-[9.5px] font-bold py-1.5 rounded transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          {loadingStates["drive"] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <>نسخة احتياطية كود</>}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Gmail Section inside exports */}
                  <div className="bg-zinc-950 p-4 border border-zinc-900 rounded space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-rose-500" />
                        <h5 className="text-xs font-black text-zinc-200">إرسال الكلمات وتوجيهات الأورج عبر بريد Gmail</h5>
                      </div>
                      <button
                        onClick={() => setIsContactsOpen(!isContactsOpen)}
                        className="text-[9px] text-[#00F0FF] hover:underline font-bold"
                      >
                        {isContactsOpen ? "إغلاق جهات غوغل" : "شلة الاستديو (Contacts)"}
                      </button>
                    </div>

                    {isContactsOpen && (
                      <div className="bg-zinc-900 p-2 rounded max-h-36 overflow-y-auto space-y-1 mt-1 border border-zinc-800">
                        <span className="text-[9px] text-zinc-500 block pb-1 border-b border-zinc-800 font-bold">اختر فناناً من شلتك السحابية:</span>
                        {googleContacts.map((contact, i) => (
                          <div 
                            key={i}
                            onClick={() => {
                              setRecipientEmail(contact.email);
                              setRecipientName(contact.name);
                              triggerToast(`👥 تم تحديد الفنان: ${contact.name}`);
                              setIsContactsOpen(false);
                            }}
                            className="p-1 px-2 rounded hover:bg-[#CCFF00]/10 hover:text-[#CCFF00] text-[10.5px] cursor-pointer text-zinc-300 flex justify-between"
                          >
                            <span className="font-bold truncate max-w-[140px]">{contact.name}</span>
                            <span className="font-mono text-zinc-500 text-[9px] truncate max-w-[160px]">{contact.email}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input 
                          type="email"
                          placeholder="أدخل ايميل عازف الأورج، الموزع أو المغني..."
                          value={recipientEmail}
                          onChange={(e) => setRecipientEmail(e.target.value)}
                          className="flex-1 bg-zinc-900 text-xs p-2 border border-zinc-800 text-white rounded outline-none placeholder-zinc-600 focus:border-[#CCFF00]"
                        />
                        <button
                          onClick={handleSendGmail}
                          disabled={loadingStates["gmail"]}
                          className="bg-[#CCFF00] hover:bg-white text-black font-black text-[10.5px] px-4 py-2 rounded transition-all cursor-pointer"
                        >
                          {loadingStates["gmail"] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <>إرسال ورقة العمل</>}
                        </button>
                      </div>
                      {recipientName && (
                        <span className="text-[9.5px] text-[#00F0FF] block">
                          👤 المستلم المختار: <strong className="font-bold">{recipientName}</strong> ({recipientEmail})
                        </span>
                      )}
                      {gmailSent && (
                        <span className="text-[10px] text-emerald-400 block font-bold">
                          ✓ تم تسليم الرسالة بنجاح عبر بريدك الشخصي في Gmail!
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB CONTENT 2: GOOGLE CHAT (Full Feature Integration) */}
              {activeTab === "chat" && (
                <div className="space-y-4 animation-fadeIn bg-zinc-950 p-4 border border-zinc-900 rounded">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[#00F0FF]" />
                      <h5 className="text-xs font-black text-zinc-200">الربط التفاعلي مع غرف Google Chat</h5>
                    </div>
                    <button 
                      onClick={fetchChatSpaces}
                      disabled={loadingStates["fetch_spaces"]}
                      className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingStates["fetch_spaces"] ? "animate-spin" : ""}`} />
                      <span>تحديث الغرف</span>
                    </button>
                  </div>

                  <p className="text-[10px] text-zinc-500 leading-tight">
                    اختر الغرفة أو الروم المناسب من Google Chat لربطه بالأستوديو فوراً، وسيقوم المايسترو ببث الكلمات والتأثيرات والـ BPM لنقاشها مع فريق العمل والفرقة!
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left Panel: Choose space and send lyric message */}
                    <div className="space-y-3 bg-zinc-900/60 p-3 rounded border border-zinc-800">
                      <div>
                        <label className="text-[9.5px] text-zinc-400 block mb-1">اختر غرفة الدردشة المتصلة:</label>
                        <select 
                          value={selectedSpace}
                          onChange={(e) => setSelectedSpace(e.target.value)}
                          className="w-full bg-zinc-950 text-xs text-[#00F0FF] p-2 border border-zinc-800 rounded outline-none"
                        >
                          {chatSpaces.length === 0 ? (
                            <option>تحميل الغرف المتاحة...</option>
                          ) : (
                            chatSpaces.map((space) => (
                              <option key={space.name} value={space.name}>{space.displayName} ({space.spaceType === "SPACE" ? "روم عام" : "شات ثنائي"})</option>
                            ))
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="text-[9.5px] text-zinc-400 block mb-1">رسالة مخصصة قبل الكلمات (اختياري):</label>
                        <textarea
                          placeholder="اكتب ملاحظة لفريق الأورج والدرامز (مثال: محتاجين نركز على سرعة الدفوف هنا يا شباب)..."
                          value={customChatMessage}
                          onChange={(e) => setCustomChatMessage(e.target.value)}
                          rows={2}
                          className="w-full bg-zinc-950 text-xs p-2 border border-zinc-800 text-zinc-200 rounded outline-none placeholder-zinc-700 focus:border-[#00F0FF] resize-none"
                        />
                      </div>

                      <button
                        onClick={handleSendToSpace}
                        disabled={loadingStates["send_chat"] || !selectedSpace}
                        className="w-full bg-[#00F0FF] hover:bg-white text-black font-black text-[10.5px] py-2 rounded transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        {loadingStates["send_chat"] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <>بث كلمات المهرجان إلى شات غوغل 💬</>}
                      </button>
                    </div>

                    {/* Right Panel: Create new Space */}
                    <div className="space-y-4 bg-zinc-900/30 p-3 rounded border border-zinc-850 flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-zinc-300 block">هل تود تدشين غرفة عامة جديدة؟</span>
                        <p className="text-[9.5px] text-zinc-550 leading-tight">
                          قم بتأسيس مساحة دردشة ونقاش ومكساج مخصصة في Google Chat للأغنية الحالية، وسننقل إليها كل زملائك من الاستديو آلياً.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <input 
                          type="text"
                          placeholder="اسم الروم الجديد (مثال: مهرجان الإمبراطور شات)..."
                          value={newSpaceName}
                          onChange={(e) => setNewSpaceName(e.target.value)}
                          className="w-full bg-zinc-950 text-xs p-2 border border-zinc-800 text-white rounded outline-none focus:border-[#00F0FF]"
                        />
                        <button
                          onClick={handleCreateSpace}
                          disabled={loadingStates["create_space"]}
                          className="w-full bg-zinc-850 hover:bg-zinc-800 text-[#00F0FF] border border-[#00F0FF]/30 font-black text-[10px] py-2 rounded transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          {loadingStates["create_space"] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Plus className="w-3.5 h-3.5" /> تدشين مساحة دردشة جديدة</>}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT 3: MEET & CALENDAR Meetings */}
              {activeTab === "meet" && (
                <div className="space-y-4 animation-fadeIn bg-zinc-950 p-4 border border-zinc-900 rounded">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-sky-400" />
                      <h5 className="text-xs font-black text-zinc-200">غرف وتجمعات Google Meet التحريرية الحية</h5>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left side: Instant Meet Creation */}
                    <div className="bg-zinc-900/60 p-3.5 rounded border border-zinc-800 flex flex-col justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-[11px] font-black text-zinc-300 block">صالون الأوج السريع (Instant Meet Lounge)</span>
                        <p className="text-[9.5px] text-zinc-500 leading-tight">
                          هل يحتاج العازف لتوجيه فوري؟ قم بإنشاء لقاء بث مباشر فوري على Google Meet بنقرة واحدة لدعوة كافة المتعاونين على الهاتف أو الكمبيوتر في الغناء الحي.
                        </p>
                      </div>

                      {instantMeetUrl ? (
                        <div className="bg-[#CCFF00]/10 border border-[#CCFF00]/20 p-2.5 rounded text-center space-y-2">
                          <span className="text-[10px] text-[#CCFF00] font-bold block">✓ غرفتك التحريرية الحية جاهزة الآن:</span>
                          <a 
                            href={instantMeetUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-[#CCFF00] text-black font-black text-[11px] py-1.5 px-3 rounded inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>انضم لبث الأورج الآن 🎬</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ) : (
                        <button
                          onClick={handleInstantMeet}
                          disabled={loadingStates["instant_meet"]}
                          className="w-full bg-sky-600 hover:bg-sky-500 text-white font-black text-[10.5px] py-2 rounded transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          {loadingStates["instant_meet"] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <>توليد رابط Meet تفاعلي فوري 🎥</>}
                        </button>
                      )}
                    </div>

                    {/* Right side: Scheduled Meetings on Calendar */}
                    <div className="bg-zinc-900/60 p-3.5 rounded border border-zinc-800 space-y-3">
                      <div className="space-y-1">
                        <span className="text-[11px] font-black text-zinc-300 block">جدولة بروفة وتسجيل بالتقويم والميت</span>
                        <p className="text-[9.5px] text-zinc-500 leading-tight">
                          احجز يوماً مخصصاً في تقويم Google وسنقوم آلياً بربطه برابط تصفح Google Meet مسبق التجهيز لإقراطه لشلتك الفنية.
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <input 
                          type="date"
                          value={recordingDate}
                          onChange={(e) => setRecordingDate(e.target.value)}
                          className="flex-1 bg-zinc-950 text-xs text-[#CCFF00] p-1.5 border border-zinc-800 font-mono rounded"
                        />
                        <button
                          onClick={handleScheduleCalendar}
                          disabled={loadingStates["calendar"]}
                          className="bg-[#CCFF00] hover:bg-white text-black font-black text-[10px] px-3.5 py-1.5 rounded transition-all cursor-pointer"
                        >
                          {loadingStates["calendar"] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <>احجز الجلسة</>}
                        </button>
                      </div>

                      {calendarResult && (
                        <div className="bg-sky-950/20 border border-sky-900/40 p-2.5 rounded space-y-1 text-center">
                          <span className="text-[9.5px] text-zinc-400 block">رابط الحجز ولقاء الميت في التقويم:</span>
                          <a 
                            href={calendarResult.meetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-[#00F0FF] hover:underline font-mono truncate block"
                          >
                            {calendarResult.meetUrl}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT 4: GOOGLE FORMS surveys (Full integration) */}
              {activeTab === "forms" && (
                <div className="space-y-4 animation-fadeIn bg-zinc-950 p-4 border border-zinc-900 rounded">
                  <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
                    <ClipboardList className="w-4 h-4 text-purple-400" />
                    <h5 className="text-xs font-black text-zinc-200">مسبار الجمهور واستبصار الرأي بـ Google Forms</h5>
                  </div>

                  <p className="text-[10px] text-zinc-500 leading-relaxed">
                    قم بتوليد نموذج رسمي واستبيان مخصص من Google Forms يتساءل تلقائياً عن رأي الموزعين والمستمعين في سرعة الـ <strong>({track.bpm} BPM)</strong> للمهرجان ونبرة الصوت الغنائية <strong>({track.vocalStyle})</strong> ومقاطع الأقسام الشعبية!
                  </p>

                  {!generatedForm ? (
                    <div className="bg-zinc-900/50 p-4 rounded text-center border border-zinc-800 space-y-3">
                      <div className="max-w-sm mx-auto text-[10.5px] text-zinc-400 leading-normal text-center">
                        سيقوم المايسترو بإنشاء استمارة متكاملة وربطها بحساب Google ووضع أربعة أسئلة هامة ومنسقة بالأجوبة المتعددة لجمع النقد الفني للمهرجان!
                      </div>
                      <button
                        onClick={handleCreateFeedbackForm}
                        disabled={loadingStates["forms_create"]}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-black text-[11px] py-2 px-5 rounded transition-all cursor-pointer inline-flex items-center gap-1.5"
                      >
                        {loadingStates["forms_create"] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <>توليد استبانة المهرجان فوريًا 📊</>}
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-purple-950/20 border border-purple-900/40 rounded space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-purple-400">✓ تم إنشاء قالب الاستطلاع بنجاح!</span>
                        <span className="text-[9px] text-zinc-550 font-mono">FORM ID: {generatedForm.formId.slice(0, 10)}...</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <a 
                          href={generatedForm.formUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3.5 bg-zinc-900 border border-zinc-800 hover:border-purple-500 rounded text-center flex flex-col justify-center items-center gap-1 transition-all"
                        >
                          <span className="text-purple-300 font-bold text-xs">مستعرض الجمهور للتصويت</span>
                          <span className="text-[9.5px] text-zinc-500 font-mono truncate w-full">{generatedForm.formUrl}</span>
                        </a>

                        <a 
                          href={generatedForm.responsesUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3.5 bg-zinc-900 border border-zinc-800 hover:border-[#CCFF00] rounded text-center flex flex-col justify-center items-center gap-1 transition-all"
                        >
                          <span className="text-[#CCFF00] font-bold text-xs">استديو إدارة الردود والتحليلات</span>
                          <span className="text-[9.5px] text-zinc-500 font-bold">مشاهدة وتحليل ردود ونقد الحارة المباشر</span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB CONTENT 5: GOOGLE KEEP SIMULATION NOTES */}
              {activeTab === "keep" && (
                <div className="space-y-4 animation-fadeIn bg-zinc-950 p-4 border border-zinc-900 rounded">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                    <div className="flex items-center gap-2">
                      <Bookmark className="w-4 h-4 text-yellow-500" />
                      <h5 className="text-xs font-black text-zinc-200">مسودات ومفكرات الكلمات السريعة (Sitamoni Elite Keep)</h5>
                    </div>
                    <button 
                      onClick={fetchKeepNotes}
                      disabled={loadingStates["fetch_keep"]}
                      className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingStates["fetch_keep"] ? "animate-spin" : ""}`} />
                      <span>تحديث الجرائد</span>
                    </button>
                  </div>

                  <div className="p-3 bg-yellow-950/10 border border-yellow-900/30 rounded flex justify-between items-center">
                    <div className="space-y-1">
                      <span className="text-[10.5px] font-bold text-yellow-500 block">مسودة ورش الأغنية السريعة</span>
                      <p className="text-[9.5px] text-zinc-500 leading-tight">
                        احفظ ملفات الكلمات الحالية فورا كقصاصات نوت بوك سحابية. سنقوم بتأمينها في حساب Google الخاص بك لتتمكن من الوصول لنسخها في أي مكان بالهاتف!
                      </p>
                    </div>

                    <button
                      onClick={handleSaveKeepNote}
                      disabled={loadingStates["keep"]}
                      className="bg-yellow-500 hover:bg-yellow-400 text-black font-black text-[10px] px-3.5 py-2 rounded shrink-0 transition-all cursor-pointer flex items-center gap-1"
                    >
                      {loadingStates["keep"] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <>حفظ المسامير السريعة بـ Keep 📝</>}
                    </button>
                  </div>

                  {/* List of Keep Notes shown as lovely sticky notes */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>مفكرات المهرجانات السريعة المخزنة سحابياً لقراءة المايسترو:</span>
                    </div>

                    {loadingStates["fetch_keep"] ? (
                      <div className="text-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto text-yellow-500" />
                      </div>
                    ) : keepNotes.length === 0 ? (
                      <div className="text-center py-6 text-[10.5px] text-zinc-650 bg-zinc-900/30 rounded border border-zinc-900 text-zinc-500">
                        لا توجد مسودات Keep سريعة منشأة حتى الآن لمهرجان "{track.title}". اضغط على الحفظ السحابي في الأعلى لصنع المسودة الآن!
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {keepNotes.map((note) => (
                          <div 
                            key={note.id}
                            className={`p-3 rounded border text-right transition-all flex flex-col justify-between gap-3 ${
                              activeKeepNoteId === note.id 
                                ? "bg-amber-900/20 border-yellow-500" 
                                : "bg-zinc-950 hover:bg-zinc-900/70 border-zinc-800"
                            }`}
                          >
                            <div className="space-y-0.5">
                              <span className="text-[11px] font-black text-yellow-400 block truncate">{note.name.replace("حفظ بـ Keep / تدوينة روقان:", "📝 ")}</span>
                              <span className="text-[8.5px] text-zinc-500 font-mono block">تاريخ الحفظ: {note.createdTime ? new Date(note.createdTime).toLocaleString("ar-EG") : "غير معروف"}</span>
                            </div>

                            <div className="flex gap-1">
                              <button
                                onClick={() => handleLoadNoteContent(note.id)}
                                disabled={loadingStates["load_note"]}
                                className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-yellow-400 text-[9px] font-bold py-1 px-2 rounded cursor-pointer border border-[#CCFF00]/10"
                              >
                                {loadingStates["load_note"] && activeKeepNoteId === note.id ? "جاري القراءة..." : "عرض المسودة الكاملة"}
                              </button>
                              <button
                                onClick={() => handleDeleteKeepNote(note.id)}
                                disabled={loadingStates["delete_note"]}
                                className="p-1 px-2 bg-zinc-900 hover:bg-rose-950/50 hover:text-rose-400 text-zinc-600 rounded transition-colors cursor-pointer border border-zinc-800"
                                title="مسح المسودة من السحاب"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Keep detailed content preview */}
                    {activeKeepNoteContent && (
                      <div className="bg-yellow-950/10 border-l-4 border-yellow-500 p-4 rounded text-[#CCFF00] space-y-2 mt-2 font-mono text-[10.5px]">
                        <div className="flex justify-between items-center pb-2 border-b border-yellow-900/30">
                          <span className="font-bold font-sans text-[11px] text-white">تفاصيل المسودة المحددة:</span>
                          <button 
                            onClick={() => {
                              setActiveKeepNoteContent(null);
                              setActiveKeepNoteId(null);
                            }}
                            className="text-[9.5px] text-zinc-400 hover:text-white"
                          >
                            إغلاق المعاينة [X]
                          </button>
                        </div>
                        <pre className="whitespace-pre-wrap leading-relaxed overflow-x-auto text-zinc-300 font-mono max-h-48 text-[10px]">
                          {activeKeepNoteContent}
                        </pre>

                        <div className="pt-2 border-t border-yellow-900/30 flex justify-between items-center text-[9px] text-zinc-400 font-sans">
                          <span>* لحفظها بـ Keep الرسمي برابط خارجي:</span>
                          <a 
                            href="https://keep.google.com" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[#CCFF00] hover:underline font-bold"
                          >
                            الذهاب لتطبيق Google Keep ويب ↗
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      )}
    </div>
  );
}
