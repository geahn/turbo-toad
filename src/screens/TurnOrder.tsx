import { useState } from "react";
import { useGame } from "../store/gameStore";
import { useNet } from "../net/net";
import { Avatar } from "../components/Avatar";

function MiniRoller({ value, onRoll, disabled }: { value: number | null; onRoll: (v: number) => void; disabled?: boolean }) {
  const [rolling, setRolling] = useState(false);
  const roll = () => {
    if (rolling || disabled) return;
    setRolling(true);
    if (navigator.vibrate) navigator.vibrate(25);
    let t = 0;
    const tick = () => {
      onRoll(1 + Math.floor(Math.random() * 6));
      t++;
      if (t < 10) setTimeout(tick, 55 + t * 6);
      else {
        onRoll(1 + Math.floor(Math.random() * 6));
        setRolling(false);
      }
    };
    tick();
  };
  return (
    <button
      className="btn btn--gold btn--sm"
      onClick={roll}
      disabled={rolling || disabled}
      style={{ minWidth: 74 }}
    >
      {value == null ? "🎲 Rolar" : rolling ? "…" : `🎲 ${value}`}
    </button>
  );
}

export function TurnOrder() {
  const { players, setOrderRoll, clearOrderRolls, finalizeOrder, beginGame, setPhase } = useGame();
  const net = useNet();
  const online = net.role !== "local";
  const isHost = net.role !== "client"; // host ou local
  const canRoll = (id: string) => !online || id === net.myPlayerId;

  const allRolled = players.every((p) => p.orderRoll != null);

  // detect ties among rolled players
  const counts = new Map<number, string[]>();
  players.forEach((p) => {
    if (p.orderRoll != null) {
      const arr = counts.get(p.orderRoll) ?? [];
      arr.push(p.id);
      counts.set(p.orderRoll, arr);
    }
  });
  const tiedIds = new Set<string>();
  counts.forEach((ids) => ids.length > 1 && ids.forEach((id) => tiedIds.add(id)));
  const hasTie = tiedIds.size > 0;

  const sorted = [...players].sort((a, b) => (b.orderRoll ?? -1) - (a.orderRoll ?? -1));

  const confirm = () => {
    finalizeOrder();
    beginGame();
  };

  const rerollTied = () => {
    useGame.setState((s) => ({
      players: s.players.map((p) => (tiedIds.has(p.id) ? { ...p, orderRoll: null } : p)),
    }));
  };

  return (
    <>
      <div className="topbar">
        <button className="iconbtn" onClick={() => setPhase("setup")}>
          ‹
        </button>
        <div className="topbar__title">Ordem da largada</div>
      </div>

      <div className="panel" style={{ padding: 12, textAlign: "center" }}>
        <p style={{ margin: 0, fontWeight: 600 }}>
          Cada piloto rola o dado. Maior número larga primeiro. 🏁
        </p>
      </div>

      <div className="stack-8">
        {sorted.map((p, idx) => {
          const tied = tiedIds.has(p.id);
          return (
            <div
              key={p.id}
              className="pcard"
              style={tied ? { borderColor: "var(--mario)", background: "#ffe3e3" } : undefined}
            >
              {p.orderRoll != null && !hasTie && (
                <div className={`medal medal--${idx + 1}`}>{idx + 1}</div>
              )}
              <Avatar characterId={p.characterId} />
              <div className="grow">
                <div className="pcard__name">{p.name}</div>
                {tied && <div className="tiny" style={{ color: "var(--mario-dark)", fontWeight: 700 }}>Empate! Rolem de novo</div>}
              </div>
              <MiniRoller value={p.orderRoll} onRoll={(v) => setOrderRoll(p.id, v)} disabled={!canRoll(p.id)} />
            </div>
          );
        })}
      </div>

      <div className="actionbar col" style={{ gap: 10 }}>
        {!isHost ? (
          <div className="panel center-text tiny">Aguardando o host largar a corrida… 🏁</div>
        ) : (
          <>
            <button className="btn btn--ghost btn--sm" style={{ width: "100%" }} onClick={clearOrderRolls}>
              🔄 Rolar tudo de novo
            </button>
            {hasTie ? (
              <button className="btn btn--sky" onClick={rerollTied}>
                ⚠️ Desempatar ({tiedIds.size})
              </button>
            ) : (
              <button className="btn btn--green" disabled={!allRolled} onClick={confirm}>
                {allRolled ? "🏁 Largar!" : "Todos precisam rolar"}
              </button>
            )}
          </>
        )}
      </div>
    </>
  );
}
