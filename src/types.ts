export type Phase = "intro" | "game" | "win";

export interface IslandStat {
  label: string;
  value: string | number;
}

export interface Island {
  id: string;
  x: number;
  y: number;
  tag: string;
  name: string;
  subtitle: string;
  url: string;
  founded: string;
  desc: string;
  stats: IslandStat[];
  impact: string;
  fact: string;
  color: string;
}

export interface WakePoint {
  x: number;
  y: number;
  age: number;
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: string;
  wakeTrail: WakePoint[];
}

export interface Camera {
  x: number;
  y: number;
}

export interface HudData {
  x: number;
  y: number;
  dir: string;
  dockVisible: boolean;
  visitedCount: number;
}
