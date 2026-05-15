import { useEffect, useRef, useState } from "react";
import { INTRO_ART } from "../constants";

interface Props {
  onStart: () => void;
}

export function IntroScreen({ onStart }: Props) {
  const [fading, setFading] = useState(false);
  const fadingRef = useRef(false);

  const handleStart = () => {
    if (fadingRef.current) return;
    fadingRef.current = true;
    setFading(true);
    onStart();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Enter" || e.code === "Space") handleStart();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div id="intro" className={fading ? "fade-out" : ""}>
      <pre id="intro-ascii">{INTRO_ART}</pre>
      <div id="intro-subtitle">NAVIGATE THE DIGITAL SEA</div>
      <div id="intro-prompt">[ PRESS ENTER TO SAIL ]</div>
      <div id="intro-instructions">
        WASD / ARROW KEYS — MOVE BOAT
        <br />
        [E] — DOCK AT ISLAND
        <br />
        [ESC] — CLOSE INFO PANEL
        <br />
        VISIT ALL 15 SITES TO COMPLETE THE JOURNEY
      </div>
    </div>
  );
}
