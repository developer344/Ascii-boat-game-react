import { useEffect, useRef, useState } from "react";
import type { Island } from "../types";

interface Props {
  island: Island | null;
  isNewVisit: boolean;
  onClose: () => void;
}

export function InfoPanel({ island, isNewVisit, onClose }: Props) {
  const [showStamp, setShowStamp] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!island) {
      setShowStamp(false);
      return;
    }
    if (panelRef.current) panelRef.current.scrollTop = 0;
    setShowStamp(false);
    if (!isNewVisit) return;
    const timer = setTimeout(() => setShowStamp(true), 400);
    return () => clearTimeout(timer);
  }, [island?.id, isNewVisit]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div id="info-panel" className={island ? "open" : ""} ref={panelRef}>
      <button className="panel-close" id="panel-close-btn" onClick={onClose}>
        [ &times; CLOSE ]
      </button>

      {island && (
        <>
          <div className="panel-tag">{island.tag}</div>
          <div className="panel-title">{island.name}</div>
          <div className="panel-subtitle">{island.subtitle}</div>
          <div className="panel-url">
            &#x238B; {island.url}&nbsp;&nbsp;[Est. {island.founded}]
          </div>

          <div className="panel-section-label">ABOUT</div>
          <div className="panel-desc">{island.desc}</div>

          <div className="panel-section-label">KEY STATS</div>
          <ul className="panel-stats">
            {island.stats.map((s, i) => (
              <li key={i}>
                <span className="stat-label">{s.label}:</span>
                <span className="stat-value"> {s.value}</span>
              </li>
            ))}
          </ul>

          <div className="panel-section-label">CULTURAL IMPACT</div>
          <div className="panel-impact">{island.impact}</div>

          <div className="panel-section-label">FUN FACT</div>
          <div className="panel-fun-fact">{island.fact}</div>

          <div className={`panel-visited-stamp${showStamp ? " show" : ""}`}>
            &#x2713; SITE CHARTED
          </div>
        </>
      )}
    </div>
  );
}
