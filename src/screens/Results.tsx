import { useGame, orderedPlayers, ranking } from "../store/gameStore";
import { Avatar } from "../components/Avatar";

export function Results() {
  const state = useGame();
  const rank = ranking(orderedPlayers(state));
  const resetAll = useGame((s) => s.resetAll);
  const setPhase = useGame((s) => s.setPhase);

  return (
    <>
      <div className="trim" />
      <div className="brand" style={{ marginTop: 8 }}>
        <div className="brand__logo">🏆 PÓDIO</div>
        <div className="brand__tag">Fim da corrida</div>
      </div>

      <div className="stack-8" style={{ marginTop: 8 }}>
        {rank.map((p, i) => (
          <div
            key={p.id}
            className="pcard"
            style={i === 0 ? { background: "var(--gold)", boxShadow: "0 0 0 4px rgba(255,210,63,.5)" } : undefined}
          >
            <div className={`medal medal--${i + 1}`}>{i + 1}</div>
            <Avatar characterId={p.characterId} size={i === 0 ? "lg" : "md"} />
            <div className="grow">
              <div className="pcard__name">{p.name} {i === 0 && "👑"}</div>
              <div className="tiny muted">
                🏁 Volta {p.lap + 1} · Casa {p.position} · 🪙 {p.coins}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="actionbar col" style={{ gap: 10 }}>
        <button className="btn btn--sky" onClick={() => setPhase("playing")}>↩️ Voltar ao jogo</button>
        <button className="btn btn--green" onClick={resetAll}>🏁 Nova corrida</button>
      </div>
    </>
  );
}
