import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with User-Agent set to "aistudio-build"
const geminiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (geminiApiKey) {
  ai = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Ensure database path exists
const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "db.json");

interface Member {
  id: string;
  name: string;
}

interface StatusRecord {
  status: boolean;
  time: string;
}

interface DBStructure {
  config: {
    pk4: string[];  // 3-day cycle servers
    kun2: string[]; // 4-day cycle servers
    baseDate: string; // "YYYY-MM-DD" anchor date for rotation calculations
  };
  members1: Member[]; // Phu 2
  members2: Member[]; // Kun 4
  members3: Member[]; // Kun 2
  statuses: Record<string, StatusRecord>; // Key syntax: "YYYY-MM-DD_boardId_memberName"
}

// Default DB values if no db.json exists
const defaultDB: DBStructure = {
  config: {
    pk4: ["Sever 178", "Sever 179+180", "Sever 177+bach5ti"],
    kun2: ["Sever 177", "Sever 178", "Sever 179", "Sever 180"],
    baseDate: "2026-05-24"
  },
  members1: [],
  members2: [],
  members3: [],
  statuses: {}
};

function readDB(): DBStructure {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(defaultDB, null, 2), "utf-8");
      return defaultDB;
    }
    const data = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading database:", err);
    return defaultDB;
  }
}

function writeDB(data: DBStructure) {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing database:", err);
  }
}

// Time calculations helper
function getDiffDays(date1: Date, date2: Date): number {
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
  const diffTime = d1.getTime() - d2.getTime();
  return Math.floor(diffTime / (24 * 60 * 60 * 1000));
}

function formatDateKey(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDisplayDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}

function getDayName(date: Date): string {
  const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  return days[date.getDay()];
}

// API: Get Full Data for Selected Offsets
app.get("/api/data", (req, res) => {
  const offset3 = parseInt(req.query.offset3 as string) || 0;
  const offset4 = parseInt(req.query.offset4 as string) || 0;

  const db = readDB();
  const { pk4, kun2, baseDate } = db.config;
  const base = new Date(baseDate);

  // Current server-side reference dates
  const today = new Date();
  const date3 = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset3);
  const date4 = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset4);

  const dateStr3 = formatDisplayDate(date3);
  const dateStr4 = formatDisplayDate(date4);

  const dateKey3 = formatDateKey(date3);
  const dateKey4 = formatDateKey(date4);

  // Helper to resolve server index
  const getIndex = (targetDate: Date, cycle: number) => {
    const diff = getDiffDays(targetDate, base);
    return ((diff % cycle) + cycle) % cycle;
  };

  const srvNames = {
    b1: pk4[getIndex(date3, 3)], // Phu 2
    b2: pk4[getIndex(date3, 3)], // Kun 4
    b3: kun2[getIndex(date4, 4)]  // Kun 2
  };

  // Build schedules (typically -3 to +3 days)
  const schedule3 = [];
  const schedule4 = [];

  for (let o = -3; o <= 3; o++) {
    const d3 = new Date(today.getFullYear(), today.getMonth(), today.getDate() + o);
    const d4 = new Date(today.getFullYear(), today.getMonth(), today.getDate() + o);

    schedule3.push({
      offset: o,
      date: formatDisplayDate(d3),
      dayName: getDayName(d3),
      server: pk4[getIndex(d3, 3)]
    });

    schedule4.push({
      offset: o,
      date: formatDisplayDate(d4),
      dayName: getDayName(d4),
      server: kun2[getIndex(d4, 4)]
    });
  }

  // Populate list maps
  const mapList = (members: Member[], boardId: number, dateKey: string) => {
    return members.map((m, index) => {
      const statusKey = `${dateKey}_${boardId}_${m.name}`;
      const record = db.statuses[statusKey] || { status: false, time: "" };
      return {
        stt: index + 1,
        id: m.id,
        name: m.name,
        status: record.status,
        time: record.time,
        dateKey,
        boardId
      };
    });
  };

  const list1 = mapList(db.members1, 1, dateKey3);
  const list2 = mapList(db.members2, 2, dateKey3);
  const list3 = mapList(db.members3, 3, dateKey4);

  // Calculate metrics
  const getMetrics = (list: any[]) => {
    const total = list.length;
    const completed = list.filter((item) => item.status).length;
    const pending = total - completed;
    return { total, completed, pending };
  };

  res.json({
    config: db.config,
    srvNames,
    dateStr3: `${dateStr3} (${getDayName(date3)})`,
    dateStr4: `${dateStr4} (${getDayName(date4)})`,
    dateKey3,
    dateKey4,
    schedule3,
    schedule4,
    list1,
    list2,
    list3,
    metrics1: getMetrics(list1),
    metrics2: getMetrics(list2),
    metrics3: getMetrics(list3)
  });
});

// API: Toggle Checkbox Status
app.post("/api/status", (req, res) => {
  const { dateKey, boardId, name, status } = req.body;
  if (!dateKey || !boardId || !name) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const db = readDB();
  const statusKey = `${dateKey}_${boardId}_${name}`;
  
  const currentRecord = db.statuses[statusKey] || { status: false, time: "" };
  let time = currentRecord.time;

  if (status) {
    // If being checked completed, autopopulate with local Vietnam/Server time HH:mm
    const now = new Date();
    const mm = String(now.getMinutes()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    time = `${hh}:${mm}`;
  } else {
    time = "";
  }

  db.statuses[statusKey] = { status, time };
  writeDB(db);
  res.json({ success: true, updated: db.statuses[statusKey] });
});

// API: Edit Member Time
app.post("/api/member/time", (req, res) => {
  const { dateKey, boardId, name, time } = req.body;
  if (!dateKey || !boardId || !name) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const db = readDB();
  const statusKey = `${dateKey}_${boardId}_${name}`;
  const currentRecord = db.statuses[statusKey] || { status: false, time: "" };

  db.statuses[statusKey] = {
    status: currentRecord.status,
    time: time || ""
  };

  writeDB(db);
  res.json({ success: true });
});

// API: Add Member
app.post("/api/member/add", (req, res) => {
  const { boardId, name } = req.body;
  if (!boardId || !name || !name.trim()) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const db = readDB();
  const newMember: Member = {
    id: `m_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name: name.trim()
  };

  if (boardId === 1) db.members1.push(newMember);
  else if (boardId === 2) db.members2.push(newMember);
  else if (boardId === 3) db.members3.push(newMember);

  writeDB(db);
  res.json({ success: true });
});

// API: Edit Member Name
app.post("/api/member/edit", (req, res) => {
  const { boardId, memberId, newName } = req.body;
  if (!boardId || !memberId || !newName || !newName.trim()) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const db = readDB();
  const finder = (list: Member[]) => {
    const item = list.find((m) => m.id === memberId);
    if (item) {
      // Keep statuses historical but migrate keys to new name
      const oldName = item.name;
      item.name = newName.trim();

      // Rename dictionary keys in database for sanity
      Object.keys(db.statuses).forEach((key) => {
        const parts = key.split("_");
        if (parts.length >= 3) {
          const kDate = parts[0];
          const kBoard = parts[1];
          const kName = parts.slice(2).join("_");
          if (kBoard === String(boardId) && kName === oldName) {
            db.statuses[`${kDate}_${kBoard}_${item.name}`] = db.statuses[key];
            delete db.statuses[key];
          }
        }
      });
    }
  };

  if (boardId === 1) finder(db.members1);
  else if (boardId === 2) finder(db.members2);
  else if (boardId === 3) finder(db.members3);

  writeDB(db);
  res.json({ success: true });
});

// API: Move Member (Sort)
app.post("/api/member/move", (req, res) => {
  const { boardId, memberId, direction } = req.body;
  if (!boardId || !memberId || !direction) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const db = readDB();
  const move = (list: Member[]) => {
    const idx = list.findIndex((m) => m.id === memberId);
    if (idx === -1) return;
    if (direction === "up" && idx > 0) {
      const temp = list[idx];
      list[idx] = list[idx - 1];
      list[idx - 1] = temp;
    } else if (direction === "down" && idx < list.length - 1) {
      const temp = list[idx];
      list[idx] = list[idx + 1];
      list[idx + 1] = temp;
    }
  };

  if (boardId === 1) move(db.members1);
  else if (boardId === 2) move(db.members2);
  else if (boardId === 3) move(db.members3);

  writeDB(db);
  res.json({ success: true });
});

// API: Remove Member
app.post("/api/member/remove", (req, res) => {
  const { boardId, memberId } = req.body;
  if (!boardId || !memberId) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const db = readDB();
  if (boardId === 1) db.members1 = db.members1.filter((m) => m.id !== memberId);
  else if (boardId === 2) db.members2 = db.members2.filter((m) => m.id !== memberId);
  else if (boardId === 3) db.members3 = db.members3.filter((m) => m.id !== memberId);

  writeDB(db);
  res.json({ success: true });
});

// API: Reset Table/Board Statuses for Specific selected Date
app.post("/api/table/reset", (req, res) => {
  const { boardId, dateKey } = req.body;
  if (!boardId || !dateKey) {
    return res.status(400).json({ error: "Fields missing" });
  }

  const db = readDB();
  // Clear the statuses for that board and date
  Object.keys(db.statuses).forEach((key) => {
    const parts = key.split("_");
    if (parts[0] === dateKey && parts[1] === String(boardId)) {
      delete db.statuses[key];
    }
  });

  writeDB(db);
  res.json({ success: true });
});

// API: Save server rotation configuration
app.post("/api/config/save", (req, res) => {
  const { pk4, kun2 } = req.body;
  if (!pk4 || !kun2) {
    return res.status(400).json({ error: "Config missing" });
  }

  const db = readDB();
  db.config.pk4 = pk4;
  db.config.kun2 = kun2;

  writeDB(db);
  res.json({ success: true });
});

// API: AI Achievement Report generator
app.post("/api/ai/report", async (req, res) => {
  if (!ai) {
    return res.status(400).json({
      error: "Tính năng AI chưa cấu hình. Vui lòng thêm GEMINI_API_KEY trong tab Settings > Secrets."
    });
  }

  const { stats, lists } = req.body;
  try {
    const prompt = `
Hãy đóng vai một Quân Sư (hoặc Bang Chủ) kỳ cựu tếu táo, hài hước và nhiệt huyết trong game kiếm hiệp võ lâm (như Thiên Long Bát Bộ). Hãy phân tích kết quả đi phó bản/Boss "Phù & Kun" ngày hôm nay dựa trên số liệu thống kê sau và viết một bức "HỊCH BÁO CÁO CHIẾN TÍCH" hoặc "SỚ QUÂN KHU" bằng Tiếng Việt để gửi cổ vũ tinh thần anh em trong Bang.

SỐ LIỆU BAN TỔ CHỨC:
1. Bản đồ Phù 2 ngày hôm nay (Server: ${stats.srv1}):
   - Tổng anh hùng ghi danh: ${stats.b1.total}
   - Đã hoàn thành phó bản: ${stats.b1.completed}
   - Chưa hoàn thành (đang chờ): ${stats.b1.pending}
   - Danh sách chưa tham gia: ${lists.b1Pending.join(", ") || "Không có (toàn bộ đã hoàn thành!)"}

2. Bản đồ Kun 4 ngày hôm nay (Server: ${stats.srv2}):
   - Tổng anh hùng ghi danh: ${stats.b2.total}
   - Đã hoàn thành phó bản: ${stats.b2.completed}
   - Chưa hoàn thành (đang chờ): ${stats.b2.pending}
   - Danh sách chưa tham gia: ${lists.b2Pending.join(", ") || "Không có (toàn bộ đã hoàn thành!)"}

3. Bản đồ Kun 2 ngày hôm nay (Server: ${stats.srv3}):
   - Tổng anh hùng ghi danh: ${stats.b3.total}
   - Đã hoàn thành phó bản: ${stats.b3.completed}
   - Chưa hoàn thành (đang chờ): ${stats.b3.pending}
   - Danh sách chưa tham gia: ${lists.b3Pending.join(", ") || "Không có (toàn bộ đã hoàn thành!)"}

HƯỚNG DẪN VIẾT SỚ:
- Giọng văn: Hài hước võ lâm, kiếm hiệp cổ trang pha lẫn độ 'lầy lội', sử dụng từ ngữ bang hội kiếm hiệp độc đáo (ví dụ: "Thiết phiến bảo kiếm", "Cày ải", "Tốc độ bàn thờ", "Bị Boss đập rớt răng", "Anh em ngủ quên", "Đào ngũ", "Được vinh danh bảng vàng").
- Nếu tỉ lệ hoàn thành 100%: Khen ngợi tột đỉnh, hứa phong thưởng "rượu ngon thịt béo", kêu gọi tối nay liên hoan hóng gió thành Lạc Dương.
- Nếu có thành viên chưa xong (đang chờ): Trêu chọc tinh nghịch nhẹ nhàng một số cái tên cụ thể ngủ quên hoặc mải ngắm mỹ nhân để cổ vũ thúc giục họ làm sớm cho kịp giờ Hoàng Đạo.
- Có cấu trúc rõ ràng: Lời chào, Báo cáo các ải, Tổng kết tuyên cáo bang hội.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.85
      }
    });

    res.json({ report: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error?.message || "Lỗi xử lý ngôn ngữ AI" });
  }
});

// Configure Vite integration for SPA fallback / development assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on host 0.0.0.0 and port ${PORT}`);
  });
}

startServer();
