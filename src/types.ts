export interface Member {
  stt: number;
  id: string;
  name: string;
  status: boolean;
  time: string;
  dateKey: string;
  boardId: number;
}

export interface ScheduleItem {
  offset: number;
  date: string;
  dayName: string;
  server: string;
}

export interface BoardConfig {
  pk4: string[];
  kun2: string[];
  baseDate: string;
}

export interface ServerNames {
  b1: string;
  b2: string;
  b3: string;
}

export interface Metrics {
  total: number;
  completed: number;
  pending: number;
}

export interface DashboardDataResponse {
  config: BoardConfig;
  srvNames: ServerNames;
  dateStr3: string;
  dateStr4: string;
  dateKey3: string;
  dateKey4: string;
  schedule3: ScheduleItem[];
  schedule4: ScheduleItem[];
  list1: Member[];
  list2: Member[];
  list3: Member[];
  metrics1: Metrics;
  metrics2: Metrics;
  metrics3: Metrics;
}
