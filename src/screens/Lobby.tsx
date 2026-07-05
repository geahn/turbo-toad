import { useGame } from "../store/gameStore";
import { useNet } from "../net/net";
import { Avatar } from "../components/Avatar";

export function Lobby() {
  const players = useGame((s) => s.players);
  const net = useNet();

  return (
    <div className="col" style={{ gap: 18, flex: 1, justifyContent: "center" }}>
      <div className="trim" />
      <div className="brand">
        <div className="brand__logo" style={{ fontSize: "2.4rem" }}>SALA</div>
        <div className="brand__tag">Código {net.code}</div>
      </div>

      <div className="panel center-text">
        <p style={{ margin: 0, fontWeight: 600 }}>
          🎮 Você está na sala! Aguarde o host começar a corrida…
        </p>
      </div>

      <div className="panel stack-8">
        <div className="label" style={{ color: "var(--ink)", textShadow: "none" }}>
          Pilotos ({players.length})
        </div>
        {players.length === 0 && <div className="tiny muted">Ninguém ainda…</div>}
        {players.map((p) => {
          const mine = p.id === net.myPlayerId;
          return (
            <div key={p.id} className="pcard" style={mine ? { background: "var(--gold)" } : undefined}>
              <Avatar characterId={p.characterId} />
              <div className="grow">
                <div className="pcard__name">{p.name}</div>
                {mine && <div className="tiny" style={{ fontWeight: 700 }}>★ Você</div>}
              </div>
            </div>
          );
        })}
      </div>

      <button className="btn btn--ghost btn--sm" style={{ width: "100%" }} onClick={() => net.leave()}>
        Sair da sala
      </button>
      <div className="trim" />
    </div>
  );
}
