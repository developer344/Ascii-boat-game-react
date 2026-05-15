import type { HudData } from "../types";

interface Props {
  hudData: HudData;
}

export function HUD({ hudData }: Props) {
  const { x, y, dir, dockVisible, visitedCount } = hudData;
  return (
    <div id="hud">
      <div id="hud-coords">
        NETBOAT v2.0
        <br />
        POS &nbsp;X:<span id="hud-x">{String(x).padStart(4, "0")}</span>
        &nbsp;Y:<span id="hud-y">{String(y).padStart(4, "0")}</span>
        <br />
        DIR &nbsp;<span id="hud-dir">{dir}</span>
      </div>
      <div id="hud-controls">
        WASD / &#x2191;&#x2193;&#x2190;&#x2192; MOVE
        <br />
        [E] DOCK
        <br />
        [ESC] CLOSE
      </div>
      <div id="hud-dock" className={dockVisible ? "visible" : ""}>
        &#x2693; DOCK [E]
      </div>
      <div id="hud-progress">
        SITES:{" "}
        <span className="visited" id="hud-visited">
          {visitedCount}
        </span>
        /15
      </div>
    </div>
  );
}
