import { DashboardDataResponse, Member as ResponseMember } from "../types";

export interface LocalDB {
  config: {
    pk4: string[];
    kun2: string[];
    baseDate: string;
  };
  members1: { id: string; name: string }[];
  members2: { id: string; name: string }[];
  members3: { id: string; name: string }[];
  statuses: Record<string, { status: boolean; time: string }>;
}

const DEFAULT_DB: LocalDB = {
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

export function readLocalDB(): LocalDB {
  try {
    const data = localStorage.getItem("phukun_db");
    if (!data) {
      localStorage.setItem("phukun_db", JSON.stringify(DEFAULT_DB));
      return DEFAULT_DB;
    }
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading fallback local storage db:", err);
    return DEFAULT_DB;
  }
}

export function writeLocalDB(db: LocalDB) {
  try {
    localStorage.setItem("phukun_db", JSON.stringify(db));
  } catch (err) {
    console.error("Error writing fallback local storage db:", err);
  }
}

export function getDiffDays(date1: Date, date2: Date): number {
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
  const diffTime = d1.getTime() - d2.getTime();
  return Math.floor(diffTime / (24 * 60 * 60 * 1000));
}

export function formatDateKey(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function formatDisplayDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}

export function getDayName(date: Date): string {
  const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  return days[date.getDay()];
}

export function getLocalDashboardData(offset3: number, offset4: number): DashboardDataResponse {
  const db = readLocalDB();
  const { pk4, kun2, baseDate } = db.config;
  const base = new Date(baseDate);

  const today = new Date();
  const date3 = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset3);
  const date4 = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset4);

  const dateStr3 = formatDisplayDate(date3);
  const dateStr4 = formatDisplayDate(date4);

  const dateKey3 = formatDateKey(date3);
  const dateKey4 = formatDateKey(date4);

  const getIndex = (targetDate: Date, cycle: number) => {
    const diff = getDiffDays(targetDate, base);
    return ((diff % cycle) + cycle) % cycle;
  };

  const srvNames = {
    b1: pk4[getIndex(date3, 3)],
    b2: pk4[getIndex(date3, 3)],
    b3: kun2[getIndex(date4, 4)]
  };

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

  const mapList = (members: { id: string; name: string }[], boardId: number, dateKey: string): ResponseMember[] => {
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

  const getMetrics = (list: any[]) => {
    const total = list.length;
    const completed = list.filter((item) => item.status).length;
    const pending = total - completed;
    return { total, completed, pending };
  };

  return {
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
  };
}

export function localToggleStatus(boardId: number, name: string, status: boolean, dateKey: string) {
  const db = readLocalDB();
  const statusKey = `${dateKey}_${boardId}_${name}`;
  let time = "";
  if (status) {
    const now = new Date();
    const mm = String(now.getMinutes()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    time = `${hh}:${mm}`;
  }
  db.statuses[statusKey] = { status, time };
  writeLocalDB(db);
}

export function localEditTime(boardId: number, name: string, time: string, dateKey: string) {
  const db = readLocalDB();
  const statusKey = `${dateKey}_${boardId}_${name}`;
  const currentRecord = db.statuses[statusKey] || { status: false, time: "" };
  db.statuses[statusKey] = {
    status: currentRecord.status,
    time: time || ""
  };
  writeLocalDB(db);
}

export function localAddNewMember(boardId: number, name: string) {
  const db = readLocalDB();
  const newMember = {
    id: `m_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name: name.trim()
  };
  if (boardId === 1) db.members1.push(newMember);
  else if (boardId === 2) db.members2.push(newMember);
  else if (boardId === 3) db.members3.push(newMember);
  writeLocalDB(db);
}

export function localEditName(boardId: number, memberId: string, newName: string) {
  const db = readLocalDB();
  const finder = (list: { id: string; name: string }[]) => {
    const item = list.find((m) => m.id === memberId);
    if (item) {
      const oldName = item.name;
      item.name = newName.trim();
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
  writeLocalDB(db);
}

export function localMoveRow(boardId: number, memberId: string, direction: "up" | "down") {
  const db = readLocalDB();
  const move = (list: { id: string; name: string }[]) => {
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
  writeLocalDB(db);
}

export function localRemoveMember(boardId: number, memberId: string) {
  const db = readLocalDB();
  if (boardId === 1) db.members1 = db.members1.filter((m) => m.id !== memberId);
  else if (boardId === 2) db.members2 = db.members2.filter((m) => m.id !== memberId);
  else if (boardId === 3) db.members3 = db.members3.filter((m) => m.id !== memberId);
  writeLocalDB(db);
}

export function localResetTable(boardId: number, dateKey: string) {
  const db = readLocalDB();
  Object.keys(db.statuses).forEach((key) => {
    const parts = key.split("_");
    if (parts[0] === dateKey && parts[1] === String(boardId)) {
      delete db.statuses[key];
    }
  });
  writeLocalDB(db);
}

export function localSaveConfig(cfg: { pk4: string[]; kun2: string[] }) {
  const db = readLocalDB();
  db.config.pk4 = cfg.pk4;
  db.config.kun2 = cfg.kun2;
  writeLocalDB(db);
}
