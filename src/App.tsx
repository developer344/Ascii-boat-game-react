import { useState, useCallback } from "react";
import { useGame } from "./hooks/useGame";
import { IntroScreen } from "./components/IntroScreen";
import { WinScreen } from "./components/WinScreen";
import { HUD } from "./components/HUD";
import { InfoPanel } from "./components/InfoPanel";

function App() {
  const {
    canvasRef,
    phase,
    hudData,
    openIsland,
    isNewVisit,
    openPanel,
    closePanel,
    startGame,
    restartGame,
  } = useGame();

  const [showIntro, setShowIntro] = useState(true);

  const handleStart = useCallback(() => {
    startGame();
    setTimeout(() => setShowIntro(false), 900);
  }, [startGame]);

  return (
    <>
      <canvas ref={canvasRef} id="game" />

      {showIntro && <IntroScreen onStart={handleStart} />}

      {(phase === "game" || phase === "win") && (
        <>
          <HUD hudData={hudData} />
          <InfoPanel
            island={openIsland}
            isNewVisit={isNewVisit}
            onClose={closePanel}
          />
        </>
      )}

      {phase === "win" && <WinScreen onRestart={restartGame} />}
    </>
  );
}

export default App;
