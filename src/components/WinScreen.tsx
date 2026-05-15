import { useEffect } from "react";
import { WIN_ART } from "../constants";

interface Props {
  onRestart: () => void;
}

export function WinScreen({ onRestart }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Enter" || e.code === "Space") onRestart();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onRestart]);

  return (
    <div id="win-screen" className="show">
      <pre id="win-ascii">{WIN_ART}</pre>
      <div id="win-title">JOURNEY COMPLETE</div>
      <div id="win-sub">You have charted the full internet archipelago.</div>
      <button id="win-restart" onClick={onRestart}>
        [ SAIL AGAIN ]
      </button>
    </div>
  );
}
