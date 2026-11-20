export interface Session {
  id: string;
  title: string;
  sessionDate: string; // midnight UTC, e.g. 2026-11-10T00:00:00.000Z
  startMin: number; // minutes since midnight
  endMin: number;
  groups: string[];
}
