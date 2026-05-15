import { useRef, useState, useCallback, useEffect } from "react";
import type {
  Phase,
  Island,
  Player,
  Camera,
  HudData,
  WakePoint,
} from "../types";
import { ISLANDS } from "../data/islands";
import {
  WORLD_W,
  WORLD_H,
  DOCK_RADIUS,
  PLAYER_SPEED,
  FRICTION,
  FONT,
  GREEN,
  GREEN_DIM,
  GREEN_DARK,
  CYAN,
  AMBER,
  BG,
  WAVE_CHARS,
  NOISE_CHARS,
  ISLAND_ART,
  BOAT_ART,
} from "../constants";

interface GameStateRef {
  player: Player;
  camera: Camera;
  keys: Record<string, boolean>;
  nearIsland: Island | null;
  openIslandId: string | null;
  visitedIds: Set<string>;
  waveOffset: number;
  tick: number;
}

function makeInitialState(): GameStateRef {
  return {
    player: { x: 250, y: 200, vx: 0, vy: 0, facing: "E", wakeTrail: [] },
    camera: { x: 0, y: 0 },
    keys: {},
    nearIsland: null,
    openIslandId: null,
    visitedIds: new Set(),
    waveOffset: 0,
    tick: 0,
  };
}

export function useGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gs = useRef<GameStateRef>(makeInitialState());
  const phaseRef = useRef<Phase>("intro");

  const [phase, setPhase] = useState<Phase>("intro");
  const [hudData, setHudData] = useState<HudData>({
    x: 0,
    y: 0,
    dir: "E",
    dockVisible: false,
    visitedCount: 0,
  });
  const [openIsland, setOpenIsland] = useState<Island | null>(null);
  const [isNewVisit, setIsNewVisit] = useState(false);

  // Stable API refs — implementations set inside useEffect, called via stable wrappers
  const apiRef = useRef({
    openPanel: (_island: Island) => {},
    closePanel: () => {},
    startGame: () => {},
    restartGame: () => {},
  });

  const openPanel = useCallback(
    (island: Island) => apiRef.current.openPanel(island),
    [],
  );
  const closePanel = useCallback(() => apiRef.current.closePanel(), []);
  const startGame = useCallback(() => apiRef.current.startGame(), []);
  const restartGame = useCallback(() => apiRef.current.restartGame(), []);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    // ── API implementations ─────────────────────────────────────────
    apiRef.current.startGame = () => {
      phaseRef.current = "game";
      setPhase("game");
    };

    apiRef.current.restartGame = () => {
      Object.assign(gs.current, makeInitialState());
      phaseRef.current = "game";
      setPhase("game");
      setOpenIsland(null);
      setIsNewVisit(false);
      setHudData({ x: 0, y: 0, dir: "E", dockVisible: false, visitedCount: 0 });
    };

    apiRef.current.openPanel = (island: Island) => {
      const state = gs.current;
      const wasVisited = state.visitedIds.has(island.id);
      state.visitedIds.add(island.id);
      state.openIslandId = island.id;
      setIsNewVisit(!wasVisited);
      setOpenIsland(island);
      setHudData((prev) => ({ ...prev, visitedCount: state.visitedIds.size }));
      if (!wasVisited && state.visitedIds.size === ISLANDS.length) {
        setTimeout(() => {
          phaseRef.current = "win";
          setPhase("win");
        }, 2000);
      }
    };

    apiRef.current.closePanel = () => {
      gs.current.openIslandId = null;
      setOpenIsland(null);
    };

    // ── Resize ──────────────────────────────────────────────────────
    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resize);
    resize();

    // ── Keys ────────────────────────────────────────────────────────
    const GAME_KEYS = new Set([
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "KeyW",
      "KeyA",
      "KeyS",
      "KeyD",
      "KeyE",
      "Escape",
    ]);

    function onKeyDown(e: KeyboardEvent) {
      gs.current.keys[e.code] = true;
      if (phaseRef.current !== "game") return;
      if (GAME_KEYS.has(e.code)) e.preventDefault();
      if (e.code === "KeyE") {
        if (gs.current.openIslandId) apiRef.current.closePanel();
        else if (gs.current.nearIsland)
          apiRef.current.openPanel(gs.current.nearIsland);
      }
      if (e.code === "Escape") apiRef.current.closePanel();
    }
    function onKeyUp(e: KeyboardEvent) {
      gs.current.keys[e.code] = false;
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // ── Draw helpers ────────────────────────────────────────────────
    function wx(worldX: number) {
      return worldX - gs.current.camera.x;
    }
    function wy(worldY: number) {
      return worldY - gs.current.camera.y;
    }

    function drawText(
      text: string,
      x: number,
      y: number,
      color: string,
      size: number,
      align: CanvasTextAlign = "left",
    ) {
      ctx.font = `${size}px ${FONT}`;
      ctx.fillStyle = color;
      ctx.textAlign = align;
      ctx.fillText(text, x, y);
    }

    function withGlow(color: string, blur: number, fn: () => void) {
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = blur;
      fn();
      ctx.restore();
    }

    // ── Draw sea ────────────────────────────────────────────────────
    function drawSea() {
      const state = gs.current;
      const cw = canvas.width,
        ch = canvas.height;
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, cw, ch);

      const cellW = 22,
        cellH = 20;
      const cols = Math.ceil(cw / cellW) + 2;
      const rows = Math.ceil(ch / cellH) + 2;
      const offX = state.camera.x % cellW;
      const offY = state.camera.y % cellH;

      ctx.font = `${cellH - 2}px ${FONT}`;
      ctx.textAlign = "left";

      for (let r = -1; r < rows; r++) {
        const worldRow = Math.floor((state.camera.y + r * cellH) / cellH);
        for (let c = -1; c < cols; c++) {
          const worldCol = Math.floor((state.camera.x + c * cellW) / cellW);
          const seed = (worldRow * 1000 + worldCol) * 2654435761;
          const rng = (seed >>> 0) / 0xffffffff;
          const wavePhase =
            (worldCol * 0.4 + worldRow * 0.2 + state.waveOffset) %
            WAVE_CHARS.length;
          const screenX = c * cellW - offX;
          const screenY = r * cellH - offY + cellH;

          if (rng < 0.22) {
            const wChar =
              WAVE_CHARS[
                Math.abs(Math.floor(wavePhase + rng * 3)) % WAVE_CHARS.length
              ];
            const alpha =
              0.18 +
              Math.sin(
                state.waveOffset * 2.1 + worldCol * 0.5 + worldRow * 0.3,
              ) *
                0.1;
            ctx.fillStyle = `rgba(0,200,60,${alpha})`;
            ctx.fillText(wChar, screenX, screenY);
          } else if (rng < 0.32) {
            const nChar =
              NOISE_CHARS[
                Math.floor(rng * NOISE_CHARS.length * 10) % NOISE_CHARS.length
              ];
            ctx.fillStyle = "rgba(0,100,30,0.09)";
            ctx.fillText(nChar, screenX, screenY);
          }
        }
      }
    }

    // ── Draw island ─────────────────────────────────────────────────
    function drawIsland(isl: Island) {
      const state = gs.current;
      const sx = wx(isl.x);
      const sy = wy(isl.y);
      if (
        sx < -200 ||
        sx > canvas.width + 200 ||
        sy < -200 ||
        sy > canvas.height + 200
      )
        return;

      const isNear = state.nearIsland?.id === isl.id;
      const isVisited = state.visitedIds.has(isl.id);
      const baseColor = isl.color;
      const dimColor = isVisited ? "#00662a" : GREEN_DARK;

      if (isNear) {
        const pulse = 0.18 + 0.08 * Math.sin(state.tick * 0.08);
        ctx.beginPath();
        ctx.arc(sx, sy, DOCK_RADIUS, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0,255,65,${pulse})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = `rgba(0,255,65,${pulse * 0.15})`;
        ctx.fill();
      }

      const lineH = 16;
      const startX = sx - 72;
      const startY = sy - 48;
      withGlow(baseColor, isNear ? 14 : 6, () => {
        ISLAND_ART.forEach((line, i) => {
          const color =
            i < 4
              ? isVisited
                ? dimColor
                : baseColor
              : isNear
                ? CYAN
                : GREEN_DARK;
          drawText(line, startX, startY + i * lineH, color, 18, "left");
        });
      });

      const label = `[ ${isl.tag} ]`;
      withGlow(isNear ? AMBER : baseColor, isNear ? 12 : 4, () => {
        drawText(
          label,
          sx,
          startY - 20,
          isNear ? AMBER : isVisited ? dimColor : baseColor,
          isNear ? 20 : 16,
          "center",
        );
      });

      if (isVisited) {
        withGlow(CYAN, 8, () => {
          drawText("✓", sx + 68, startY - 14, CYAN, 20, "center");
        });
      }
    }

    // ── Draw player ─────────────────────────────────────────────────
    function drawPlayer() {
      const p = gs.current.player;
      const sx = wx(p.x);
      const sy = wy(p.y);
      const wakeChars = ["~", "~", "≈"];

      p.wakeTrail.forEach((w: WakePoint) => {
        const alpha = Math.max(0, 1 - w.age / 28);
        ctx.font = `14px ${FONT}`;
        ctx.fillStyle = `rgba(0,255,65,${alpha * 0.4})`;
        ctx.textAlign = "center";
        ctx.fillText(
          wakeChars[0],
          wx(w.x) + (Math.random() - 0.5) * 6,
          wy(w.y),
        );
        ctx.fillText(
          wakeChars[1],
          wx(w.x) + (Math.random() - 0.5) * 10,
          wy(w.y) + 4,
        );
      });

      withGlow(GREEN, 16, () => {
        ctx.font = `18px ${FONT}`;
        ctx.textAlign = "center";
        BOAT_ART.forEach((line, i) => {
          ctx.fillStyle = i === 0 ? AMBER : i === 1 ? GREEN : CYAN;
          ctx.fillText(line, sx, sy - 14 + i * 16);
        });
      });
    }

    // ── Draw border ─────────────────────────────────────────────────
    function drawBorder() {
      const state = gs.current;
      ctx.save();
      ctx.strokeStyle = GREEN_DARK;
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 8]);
      ctx.strokeRect(-state.camera.x, -state.camera.y, WORLD_W, WORLD_H);
      ctx.restore();
    }

    // ── Draw minimap ────────────────────────────────────────────────
    function drawMinimap() {
      const state = gs.current;
      const MAP_W = 160,
        MAP_H = 120,
        MAP_PAD = 16;
      const mx = canvas.width - MAP_W - MAP_PAD;
      const my = canvas.height - MAP_H - MAP_PAD - 40;
      const scaleX = MAP_W / WORLD_W;
      const scaleY = MAP_H / WORLD_H;

      ctx.fillStyle = "rgba(0,8,0,0.85)";
      ctx.fillRect(mx, my, MAP_W, MAP_H);
      ctx.strokeStyle = GREEN_DARK;
      ctx.lineWidth = 1;
      ctx.strokeRect(mx, my, MAP_W, MAP_H);

      ctx.font = `12px ${FONT}`;
      ctx.fillStyle = GREEN_DIM;
      ctx.textAlign = "left";
      ctx.fillText("CHART", mx + 4, my + 12);

      ctx.shadowBlur = 0;
      ISLANDS.forEach((isl) => {
        const dx = mx + isl.x * scaleX;
        const dy = my + isl.y * scaleY;
        const visited = state.visitedIds.has(isl.id);
        ctx.beginPath();
        ctx.arc(dx, dy, visited ? 4 : 2.5, 0, Math.PI * 2);
        ctx.fillStyle = visited ? CYAN : GREEN_DARK;
        if (visited) {
          ctx.shadowColor = CYAN;
          ctx.shadowBlur = 6;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      const px = mx + state.player.x * scaleX;
      const py = my + state.player.y * scaleY;
      ctx.save();
      ctx.translate(px, py);
      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.lineTo(3.5, 4);
      ctx.lineTo(-3.5, 4);
      ctx.closePath();
      ctx.fillStyle = AMBER;
      ctx.shadowColor = AMBER;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.restore();
    }

    // ── Update ──────────────────────────────────────────────────────
    function update() {
      const state = gs.current;
      if (phaseRef.current !== "game") return;

      const p = state.player;
      const panelOpen = !!state.openIslandId;

      if (!panelOpen) {
        let ax = 0,
          ay = 0;
        if (state.keys["ArrowLeft"] || state.keys["KeyA"]) ax = -1;
        if (state.keys["ArrowRight"] || state.keys["KeyD"]) ax = 1;
        if (state.keys["ArrowUp"] || state.keys["KeyW"]) ay = -1;
        if (state.keys["ArrowDown"] || state.keys["KeyS"]) ay = 1;
        if (ax !== 0 && ay !== 0) {
          ax *= 0.707;
          ay *= 0.707;
        }

        p.vx += ax * PLAYER_SPEED;
        p.vy += ay * PLAYER_SPEED;

        if (ax > 0) p.facing = ay < -0.5 ? "NE" : ay > 0.5 ? "SE" : "E";
        else if (ax < 0) p.facing = ay < -0.5 ? "NW" : ay > 0.5 ? "SW" : "W";
        else if (ay < 0) p.facing = "N";
        else if (ay > 0) p.facing = "S";
      }

      p.vx *= FRICTION;
      p.vy *= FRICTION;
      if (Math.abs(p.vx) < 0.01) p.vx = 0;
      if (Math.abs(p.vy) < 0.01) p.vy = 0;

      if (
        state.tick % 3 === 0 &&
        (Math.abs(p.vx) > 0.3 || Math.abs(p.vy) > 0.3)
      ) {
        p.wakeTrail.push({ x: p.x, y: p.y, age: 0 });
        if (p.wakeTrail.length > 22) p.wakeTrail.shift();
      }
      p.wakeTrail.forEach((w: WakePoint) => w.age++);

      p.x = Math.max(30, Math.min(WORLD_W - 30, p.x + p.vx));
      p.y = Math.max(30, Math.min(WORLD_H - 30, p.y + p.vy));

      const camTargetX = p.x - canvas.width / 2;
      const camTargetY = p.y - canvas.height / 2;
      state.camera.x += (camTargetX - state.camera.x) * 0.12;
      state.camera.y += (camTargetY - state.camera.y) * 0.12;
      state.camera.x = Math.max(
        0,
        Math.min(WORLD_W - canvas.width, state.camera.x),
      );
      state.camera.y = Math.max(
        0,
        Math.min(WORLD_H - canvas.height, state.camera.y),
      );

      let nearest: Island | null = null;
      let nearestDist = Infinity;
      ISLANDS.forEach((isl) => {
        const dx = p.x - isl.x,
          dy = p.y - isl.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < DOCK_RADIUS && d < nearestDist) {
          nearest = isl;
          nearestDist = d;
        }
      });
      state.nearIsland = nearest;

      setHudData({
        x: Math.round(p.x),
        y: Math.round(p.y),
        dir: p.facing,
        dockVisible: !!nearest && !state.openIslandId,
        visitedCount: state.visitedIds.size,
      });

      state.waveOffset += 0.018;
      state.tick++;
    }

    // ── Render ──────────────────────────────────────────────────────
    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (phaseRef.current === "game" || phaseRef.current === "win") {
        drawSea();
        drawBorder();
        ISLANDS.forEach(drawIsland);
        drawPlayer();
        drawMinimap();
      }
    }

    // ── Loop ────────────────────────────────────────────────────────
    let rafId: number;
    function loop() {
      update();
      render();
      rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    canvasRef,
    phase,
    hudData,
    openIsland,
    isNewVisit,
    openPanel,
    closePanel,
    startGame,
    restartGame,
  };
}
