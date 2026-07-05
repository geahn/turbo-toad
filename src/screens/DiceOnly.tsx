import { useState } from "react";
import { useGame } from "../store/gameStore";
import { Dice } from "../components/Dice";
import { DiceKind } from "../data/items";
import { Avatar } from "../components/Avatar";

const TABS: { kind: DiceKind; label: string; emoji: string }[] = [
  { kind: "number", label: "Número", emoji: "🎲" },
  { kind: "power", label: "Potencializador", emoji: "❓" },
  { kind: "neutral", label: "Neutralizador", emoji: "☠️" },
];

export function DiceOnly({ onBack }: { onBack?: () => void }) {
  const [tab, setTab] = useState<DiceKind>("number");
  const players = useGame((s) => s.players);
  const addCoins = useGame((s) => s.addCoins);
  const resetAll = useGame((s) => s.resetAll);
  const setPhase = useGame((s) => s.setPhase);

  return (
    <>
      <div className="topbar">
        {onBack ? (
          <button className="iconbtn" onClick={onBack}>‹</button>
        ) : (
          <button className="iconbtn" onClick={() => { if (confirm("Sair para o início?")) { resetAll(); } }}>‹</button>
        )}
        <div className="topbar__title grow">Dados</div>
        {!onBack && (
          <button className="iconbtn" onClick={() => setPhase("home")}>🏠</button>
        )}
      </div>

      <div className="seg">
        {TABS.map((t) => (
          <button key={t.kind} aria-pressed={tab === t.kind} onClick={() => setTab(t.kind)}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      <div className="panel" style={{ paddingTop: 22, paddingBottom: 22 }}>
        <Dice
          kind={tab}
          label={
            tab === "number" ? "Quantas casas andar" : tab === "power" ? "Item bom sorteado" : "Item ruim sorteado"
          }
        />
      </div>

      {/* Optional coin tracker if players exist */}
      {players.length > 0 && (
        <div className="panel stack-8">
          <div className="label" style={{ color: "var(--ink)", textShadow: "none" }}>🪙 Moedas</div>
          {players.map((p) => (
            <div key={p.id} className="row between" style={{ padding: "4px 0" }}>
              <div className="row">
                <Avatar characterId={p.characterId} size="sm" />
                <span style={{ fontWeight: 700 }}>{p.name}</span>
              </div>
              <div className="row" style={{ gap: 8 }}>
                <button className="btn btn--sm btn--dark" onClick={() => addCoins(p.id, -1)}>−</button>
                <span style={{ fontFamily: "var(--display)", fontSize: "1.3rem", minWidth: 30, textAlign: "center" }}>{p.coins}</span>
                <button className="btn btn--sm btn--gold" onClick={() => addCoins(p.id, 1)}>＋</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
