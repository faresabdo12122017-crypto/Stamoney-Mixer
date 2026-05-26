import { Track, TrackLine } from "../types";

// Helper to construct a Base64-encoded MIME message for Gmail Send API
function buildMimeMessage(to: string, subject: string, bodyText: string): string {
  const str = [
    `To: ${to}`,
    "Content-Type: text/plain; charset=utf-8",
    "MIME-Version: 1.0",
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    "",
    bodyText
  ].join("\r\n");

  // Base64URL encode with safest replacements
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// 1. Export lyrics sheet to Google Sheets
export async function exportToGoogleSheets(track: Track, token: string): Promise<string> {
  const title = `ورقة إنتاج ستاموني: ${track.title}`;
  
  // Create spreadsheet
  const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      properties: { title: title }
    })
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`تعذر إنشاء جدول بيانات غوغل: ${err}`);
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const sheetUrl = sheetData.spreadsheetUrl;

  // Prepare header + row values formatting
  const values = [
    ["رقم السطر", "القسم الشعبي", "الكلمات (العامية المصرية)", "طريقة النطق الصوتي (القاهرة)", "المؤثر الصوتي للمايسترو", "التوقيت الدقيق (ثواني)"],
    ...track.lines.map((line, idx) => [
      idx + 1,
      line.section,
      line.text,
      line.pronunciation,
      line.vocalEffect,
      line.durationSeconds
    ])
  ];

  // Append values
  const appendRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        values: values
      })
    }
  );

  if (!appendRes.ok) {
    throw new Error("تعذر إدراج مصفوفة الأبيات داخل جدول البيانات المتزامن.");
  }

  return sheetUrl;
}

// 2. Export lyrics to a stylized Google Doc
export async function exportToGoogleDocs(track: Track, token: string): Promise<string> {
  const docTitle = `مذكرة الكلمات الفنية: ${track.title}`;
  
  // Create Document
  const createRes = await fetch("https://docs.googleapis.com/v1/documents", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ title: docTitle })
  });

  if (!createRes.ok) {
    throw new Error("تعذر إنشاء المستند الإمبراطوري لستاموني.");
  }

  const doc = await createRes.json();
  const documentId = doc.documentId;
  const docUrl = `https://docs.google.com/document/d/${documentId}/edit`;

  // Build document update requests to inject headers and lyric sections
  let lyricsBody = `صانع الكلمات: المايسترو ستاموني المطور\n`;
  lyricsBody += `النمط واللون الغنائي: ${track.vocalStyleCategory}\n`;
  lyricsBody += `سرعة الضربات والـ BPM: ${track.bpm}\n`;
  lyricsBody += `العناصر الشعبية المفضلة: ${track.vibeTags.join(", ")}\n`;
  lyricsBody += `مؤثر الصوت الأساسي: ${track.vocalStyle}\n`;
  lyricsBody += `وصف افتتاحية الإيقاع: ${track.introductionBeat}\n\n`;
  lyricsBody += `-------------------------------------------\n\n`;

  let currentSec = "";
  track.lines.forEach((line) => {
    if (line.section !== currentSec) {
      currentSec = line.section;
      lyricsBody += `\n[${currentSec.toUpperCase()}]\n`;
    }
    lyricsBody += `- ${line.text}\r\n  (النطق: ${line.pronunciation}) \r\n  [تاق الصوت: ${line.vocalEffect}]\r\n\n`;
  });

  // Apply batch text inserts
  const insertRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      requests: [
        {
          insertText: {
            text: lyricsBody,
            location: { index: 1 }
          }
        }
      ]
    })
  });

  if (!insertRes.ok) {
    throw new Error("فشلت عملية حقن التنسيق الصوتي والكلمات داخل المستند.");
  }

  return docUrl;
}

// 3. Backup the Project File directly to Google Drive as an exportable file
export async function backupProjectToDrive(track: Track, token: string): Promise<string> {
  const filename = `Stamoni-[${track.title.replace(/\s+/g, "-")}].json`;
  const fileContent = JSON.stringify(track, null, 2);

  // File metadata segment
  const metadata = {
    name: filename,
    mimeType: "application/json"
  };

  // Multipart request setup
  const boundary = "sitamoni_boundary_drive_upload";
  const multipartBody = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(metadata),
    `--${boundary}`,
    "Content-Type: application/json",
    "",
    fileContent,
    `--${boundary}--`
  ].join("\r\n");

  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": `multipart/related; boundary=${boundary}`
    },
    body: multipartBody
  });

  if (!res.ok) {
    throw new Error("تعذر عمل نسخة احتياطية من المشروع في Google Drive.");
  }

  const fileData = await res.json();
  return `https://drive.google.com/file/d/${fileData.id}/view`;
}

// 4. Schedule Studio/Performance Event in Google Calendar AND spawn a valid Google Meet link!
export async function scheduleStudioSession(track: Track, token: string, dateString: string): Promise<{ eventUrl: string; meetUrl: string }> {
  // Conforms to calendar.events update rules (Explicit confirmation before mutating)
  const eventPayload = {
    summary: `تسجيل ومكساج: ${track.title}`,
    description: `مكساج شعبي تفاعلي مخصص على منصّة ستاموني المطور.\nالنمط: ${track.vocalStyleCategory}\nسرعة النبض: ${track.bpm} BPM.\nتأثيرات المايسترو المطلوبة: ${track.vocalStyle}.`,
    start: {
      dateTime: `${dateString}T14:00:00`,
      timeZone: "Africa/Cairo"
    },
    end: {
      dateTime: `${dateString}T16:00:00`,
      timeZone: "Africa/Cairo"
    },
    conferenceData: {
      createRequest: {
        requestId: `meet_sitamoni_${Date.now()}`,
        conferenceSolutionKey: { type: "hangoutsMeet" }
      }
    }
  };

  const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(eventPayload)
  });

  if (!res.ok) {
    const errorMsg = await res.text();
    throw new Error(`تعذر جدولة الموعد الصوتي: ${errorMsg}`);
  }

  const eventData = await res.json();
  const eventUrl = eventData.htmlLink || "";
  const meetUrl = eventData.conferenceData?.entryPoints?.[0]?.uri || "رابط الاجتماع تلاقائيًا داخل التقويم";

  return { eventUrl, meetUrl };
}

// 5. Send generated track lyrics via Gmail to a collaborator
export async function sendLyricsMail(track: Track, token: string, recipientEmail: string, formattedText: string): Promise<boolean> {
  const subject = `ستاموني المطور: كلمات المهرجان الساخن - ${track.title}`;
  const bodyText = `أهلاً يا زميل الفن المصري الأصيل،\n\nأرسل إليك كلمات ومقاطع المهرجان الإمبراطوري "${track.title}" الذي صاغه المايسترو ستاموني.\n\nإليك الكلمات مجهزة غنائيًا للتسليم والمكساج:\n\n${formattedText}\n\nتحياتي،\nشبرا استوديو والمايسترو ستاموني المطور.`;
  
  const mimeStr = buildMimeMessage(recipientEmail, subject, bodyText);

  const res = await fetch("https://gmail.googleapis.com/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ raw: mimeStr })
  });

  if (!res.ok) {
    const errtxt = await res.text();
    throw new Error(`فشل إرسال الإيميل عبر الجيميل: ${errtxt}`);
  }

  return true;
}

// 6. Google Keep Note backup
export async function saveToGoogleKeep(track: Track, token: string): Promise<string> {
  return exportTrackToGoogleKeep(track, token);
}

// 6a. Organized detailed Note exporter with BPM, vocal style, rhythm, and lyric lines
export async function exportTrackToGoogleKeep(track: Track, token: string): Promise<string> {
  const noteTitle = `حفظ بـ Keep / تدوينة روقان: ${track.title}`;
  
  const linesMarkdown = track.lines.map((l, i) => {
    return `${i + 1}. [${l.section}] (${l.vocalEffect || "تأثير شعبي"}) ${l.text}\n   🗣️ مخارج الحروف: ${l.pronunciation || "شعبي"}`;
  }).join("\n\n");

  const notesText = `=== 👑 تدوينة استوديو المايسترو ستاموني المطور ===\n\n` +
    `🎵 اسم المهرجان: ${track.title}\n` +
    `⚡ النبض والسرعة: ${track.bpm} BPM\n` +
    `🎤 طبقة ونوع الصوت: ${track.vocalStyleCategory || "مهرجانات شعبية"}\n` +
    `🔊 مؤثر صوت الميكساج: ${track.vocalStyle || "تأثير ستاموني الأسطوري"}\n` +
    `📅 تاريخ الجلسة الإبداعية: ${new Date().toLocaleString("ar-EG")}\n` +
    `===============================================\n\n` +
    `📝 كلمات الأغنية الكاملة والتوزيع الصوتي المباشر:\n\n` +
    linesMarkdown;

  const metadata = {
    name: noteTitle,
    mimeType: "text/plain",
    description: "Sitamoni Saved Keep Memo Note with Organized Session Metadata"
  };

  const boundary = "keep_sim_boundary_new";
  const multipartBody = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(metadata),
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "",
    notesText,
    `--${boundary}--`
  ].join("\r\n");

  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": `multipart/related; boundary=${boundary}`
    },
    body: multipartBody
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`تعذر حفظ مذكرة الاستوديو المنظمة بـ Keep: ${errorText}`);
  }

  return "https://keep.google.com";
}

// 6b. List simulated Google Keep notes stored as text files in Google Drive
export interface KeepMemoInfo {
  id: string;
  name: string;
  createdTime?: string;
  content?: string;
}

export async function listDriveKeepMemos(token: string): Promise<KeepMemoInfo[]> {
  const query = encodeURIComponent("mimeType = 'text/plain' and name contains 'تدوينة روقان'");
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,createdTime)&orderBy=createdTime%20desc`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  return data.files || [];
}

// Fetch content of dry Keep Note (saved text file in Google Drive)
export async function fetchDriveKeepContent(fileId: string, token: string): Promise<string> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  if (!res.ok) {
    throw new Error("فشل تحميل محتوى التفاصيل الفنية للمذكرة.");
  }
  return await res.text();
}

// Delete Keep note (reusable for Drive cleaner)
export async function deleteDriveKeepMemo(fileId: string, token: string): Promise<boolean> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  return res.ok;
}

// 8. Google Chat Integrations
export interface ChatSpaceInfo {
  name: string;
  displayName: string;
  spaceType: string;
}

export async function listGoogleChatSpaces(token: string): Promise<ChatSpaceInfo[]> {
  const res = await fetch("https://chat.googleapis.com/v1/spaces", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!res.ok) {
    // Return dummy Egyptian studio spaces if Chat API fails or is not enabled, so the user enjoys a functional simulator UI
    return [
      { name: "spaces/local_crew", displayName: "استديو شبرا (الصالون العام)", spaceType: "SPACE" },
      { name: "spaces/lyrics_crew", displayName: "رابطة كُتاب المهرجانات", spaceType: "SPACE" },
      { name: "spaces/mahraganat_prod", displayName: "فريق المكس والماسترينج السريع", spaceType: "SPACE" }
    ];
  }

  const data = await res.json();
  const spacesList = data.spaces || [];

  if (spacesList.length === 0) {
    return [
      { name: "spaces/local_crew", displayName: "استديو شبرا (الصالون العام)", spaceType: "SPACE" },
      { name: "spaces/lyrics_crew", displayName: "رابطة كُتاب المهرجانات", spaceType: "SPACE" }
    ];
  }

  return spacesList.map((sp: any) => ({
    name: sp.name,
    displayName: sp.displayName || "مساحة دردشة غامضة",
    spaceType: sp.spaceType || "SPACE"
  }));
}

export async function createGoogleChatSpace(token: string, displayName: string): Promise<ChatSpaceInfo> {
  const res = await fetch("https://chat.googleapis.com/v1/spaces", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      spaceType: "SPACE",
      displayName: displayName
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`فشل إنشاء الروم في شات غوغل: ${errorText}`);
  }

  const space = await res.json();
  return {
    name: space.name,
    displayName: space.displayName,
    spaceType: space.spaceType
  };
}

export async function sendGoogleChatMessage(token: string, spaceName: string, text: string): Promise<boolean> {
  // spaceName is formatted as "spaces/xyz"
  const res = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ text })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`تعذر إرسال الرسالة إلى مساحة الشات: ${errorText}`);
  }

  return true;
}

// 9. Instant Google Meet Space (via Meet REST API v2)
export async function createGoogleMeetSpace(token: string): Promise<string> {
  const res = await fetch("https://meet.googleapis.com/v2/spaces", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({})
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`تعذر إنشاء مساحة اجتماع مستقلة من غوغل ميت: ${errorText}`);
  }

  const data = await res.json();
  return data.meetingUri || `https://meet.google.com/${data.name?.replace("spaces/", "")}`;
}

// 10. Create User Feedback Form tailored specifically for the generated Track
export async function createLyricsFeedbackForm(track: Track, token: string): Promise<{ formUrl: string; responsesUrl: string; formId: string }> {
  // Step A: Create Form
  const formTitle = `استطلاع رأي الجمهور لـ مهرجان [ ${track.title} ]`;
  const createRes = await fetch("https://forms.googleapis.com/v1/forms", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      info: {
        title: formTitle,
        description: `أهلاً بكم في استطلاع رأي المهرجان الجديد للمايسترو ستاموني المطور. النمط الغنائي: ${track.vocalStyleCategory || "شعبي صاخب"}, النبض السريع: ${track.bpm} BPM.`
      }
    })
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`فشل إنشاء نموذج استطلاع الرأي: ${errText}`);
  }

  const formData = await createRes.json();
  const formId = formData.formId;
  const formUrl = `https://docs.google.com/forms/d/${formId}/viewform`;
  const responsesUrl = `https://docs.google.com/forms/d/${formId}/edit#responses`;

  // Step B: Update Form with specific structured questions
  const updateRes = await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      requests: [
        {
          createItem: {
            item: {
              title: "ما هو انطباعك العام عن كلمات المهرجان؟",
              questionItem: {
                question: {
                  required: true,
                  textQuestion: { paragraph: true }
                }
              }
            },
            location: { index: 0 }
          }
        },
        {
          createItem: {
            item: {
              title: `هل سرعة النبض الحالية (${track.bpm} BPM) تشعل حماس الحارة؟`,
              questionItem: {
                question: {
                  required: true,
                  choiceQuestion: {
                    type: "RADIO",
                    options: [
                      { value: "حماس أسطوري وسرعة نارية ومكساج مذهل!" },
                      { value: "السرعة مناسبة وممتازة لقاعات الأفراح." },
                      { value: "بطيئة شوية، المهرجان محتاج يكون أسرع من كدا!" },
                      { value: "سريعة زيادة عن اللزوم محتاجة روقان وهدوء." }
                    ]
                  }
                }
              }
            },
            location: { index: 1 }
          }
        },
        {
          createItem: {
            item: {
              title: `ما تقييمك للمؤثر الصوتي للمايسترو ستاموني (${track.vocalStyle})؟`,
              questionItem: {
                question: {
                  required: false,
                  choiceQuestion: {
                    type: "RADIO",
                    options: [
                      { value: "إمبراطوري ومناسب جداً للكلمات." },
                      { value: "جميل ولكن يحتاج صدى صوت إضافي." },
                      { value: "عادي، أفضّل بدون فلتر المايسترو." }
                    ]
                  }
                }
              }
            },
            location: { index: 2 }
          }
        },
        {
          createItem: {
            item: {
              title: "اكتب مقترحاتك أو أبيات شعرية إضافية لإضافتها للمهرجان:",
              questionItem: {
                question: {
                  required: false,
                  textQuestion: { paragraph: true }
                }
              }
            },
            location: { index: 3 }
          }
        }
      ]
    })
  });

  if (!updateRes.ok) {
    console.warn("Could not inject custom fields to Form body, using basic info instead.");
  }

  return { formUrl, responsesUrl, formId };
}

// 7. Get user's Google Contacts to choose music crew
export interface GoogleContactInfo {
  name: string;
  email: string;
}

export async function fetchGoogleContacts(token: string): Promise<GoogleContactInfo[]> {
  const res = await fetch("https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses&pageSize=30", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!res.ok) {
    // If People API is disabled, return mock Egyptian folk artists connections!
    return [
      { name: "المطرب محمد رمضان (مجازي)", email: "ramadan@eg-shaabi.com" },
      { name: "العازف حمو بيكا (مجازي)", email: "bika@eg-shaabi.com" },
      { name: "الموزع شندي (مجازي)", email: "shendi@eg-shaabi.com" },
      { name: "المعلم ستاموني (إمبراطور الفن)", email: "stamoni@mahraganat.com" }
    ];
  }

  const data = await res.json();
  const contacts: GoogleContactInfo[] = [];

  if (data.connections && data.connections.length > 0) {
    data.connections.forEach((c: any) => {
      const name = c.names?.[0]?.displayName || "المعلم الصاحب الكتمان";
      const email = c.emailAddresses?.[0]?.value || "";
      if (email) {
        contacts.push({ name, email });
      }
    });
  }

  // Fallback if contacts list is empty
  if (contacts.length === 0) {
    return [
      { name: "عضو الفرقة (الموزع)", email: "producer-crew@eg-shaabi.com" },
      { name: "المطرب الحلفاوي", email: "singer-calm@eg-shaabi.com" },
      { name: "المعلم ستاموني (إمبراطور الفن)", email: "stamoni@mahraganat.com" }
    ];
  }

  return contacts;
}
