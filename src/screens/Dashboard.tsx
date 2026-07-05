import { useState } from "react";
import { useGame, orderedPlayers, ranking } from "../store/gameStore";
import { useNet } from "../net/net";
import { useUI } from "../store/ui";
import { Avatar } from "../components/Avatar";
import { itemMeta } from "../data/items";
import { tileTypeAt, TILE_META } from "../data/board";
import { BoardEditor } from "./BoardEditor";
import type { Route } from "../App";

export function Dashboard({ nav }: { nav: (r: Route) => void }) {
  const state = useGame();
  const { round, turnIndex, order, config, board, nextTurn, resetAll, setPhase } = state;
  const players = orderedPlayers(state);
  const rank = ranking(players);
  const [menu, setMenu] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const net = useNet();
  const online = net.role !== "local";
  const isHost = net.role !== "client";

  const currentId = order[turnIndex];
  const current = players.find((p) => p.id === currentId);
  const canPass = !online || isHost || currentId === net.myPlayerId;

  const rankOf = (id: string) => rank.findIndex((p) => p.id === id) + 1;

  return (
    <>
      <div className="topbar">
        <div className="topbar__title grow">Rodada {round}</div>
        <button className="iconbtn" onClick={() => nav({ name: "dice" })}>
          🎲
        </button>
        <button className="iconbtn" onClick={() => setMenu(true)}>
          ☰
        </button>
      </div>

      {/* Current turn spotlight */}
      {current && (
        <button
          className="panel"
          style={{ background: "var(--gold)", textAlign: "left", width: "100%" }}
          onClick={() => nav({ name: "player", id: current.id })}
        >
          <div className="tiny" style={{ fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
            É a vez de
          </div>
          <div className="row" style={{ marginTop: 6 }}>
            <Avatar characterId={current.characterId} size="lg" />
            <div className="grow">
              <div style={{ fontFamily: "var(--display)", fontSize: "1.9rem", lineHeight: 1 }}>
                {current.name}
              </div>
              <div className="row wrap" style={{ gap: 6, marginTop: 6 }}>
                <span className="chip chip--coin">🪙 {current.coins}</span>
                {config.mode === "full" && (
                  <span className="chip">
                    🏁 Volta {current.lap + 1}/{config.laps}
                  </span>
                )}
                <StatusChip playerId={current.id} />
              </div>
            </div>
            <div style={{ fontFamily: "var(--display)", fontSize: "1.2rem" }}>Jogar ›</div>
          </div>
        </button>
      )}

      {/* Player list */}
      <div className="stack-8">
        {players.map((p) => {
          const isTurn = p.id === currentId;
          const down = p.skipTurns > 0 || p.finished;
          const tile = tileTypeAt(board, p.position);
          return (
            <button
              key={p.id}
              className={`pcard ${isTurn ? "pcard--turn" : ""} ${down ? "pcard--down" : ""}`}
              onClick={() => nav({ name: "player", id: p.id })}
            >
              <div className={`medal medal--${rankOf(p.id)}`}>{rankOf(p.id)}</div>
              <Avatar characterId={p.characterId} />
              <div className="grow">
                <div className="pcard__name">
                  {p.name} {p.finished && "🏆"}
                </div>
                <div className="row wrap tiny" style={{ gap: 6, marginTop: 3 }}>
                  <span className="chip chip--coin" style={{ fontSize: "0.72rem", padding: "2px 7px" }}>
                    🪙 {p.coins}
                  </span>
                  {config.mode === "full" && (
                    <span className="chip" style={{ fontSize: "0.72rem", padding: "2px 7px" }}>
                      {TILE_META[tile.type].glyph} {tile.i}
                    </span>
                  )}
                  {p.items.map((it, i) => (
                    <span key={i} title={itemMeta(it).name}>
                      {itemMeta(it).glyph}
                    </span>
                  ))}
                </div>
              </div>
              {p.skipTurns > 0 && <span className="chip chip--bad">⛔ {p.skipTurns}</span>}
            </button>
          );
        })}
      </div>

      <div className="actionbar">
        <button className="btn btn--green" onClick={nextTurn} disabled={!canPass}>
          {canPass ? "Passar a vez ▶" : "Aguardando o jogador da vez…"}
        </button>
      </div>

      {menu && (
        <div className="overlay" onClick={() => setMenu(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: 12 }}>Menu</h2>
            <div className="stack-12">
              <button className="btn btn--sky" onClick={() => nav({ name: "dice" })}>
                🎲 Abrir os dados
              </button>
              <button className="btn btn--ghost" onClick={() => { setMenu(false); useUI.getState().openManual(); }}>
                📖 Manual de regras
              </button>
              {config.mode === "full" && isHost && (
                <button className="btn btn--gold" onClick={() => { setMenu(false); setShowEditor(true); }}>
                  🗺️ Editar pista
                </button>
              )}
              {isHost && (
                <button
                  className="btn btn--dark"
                  onClick={() => {
                    setPhase("finished");
                    setMenu(false);
                  }}
                >
                  🏆 Encerrar e ver resultado
                </button>
              )}
              {online ? (
                <button className="btn" onClick={() => { net.leave(); setPhase("home"); }}>
                  🚪 Sair da sala
                </button>
              ) : (
                <button
                  className="btn"
                  onClick={() => {
                    if (confirm("Começar um jogo novo? A partida atual será apagada.")) resetAll();
                  }}
                >
                  🗑️ Novo jogo
                </button>
              )}
              <button className="btn btn--ghost" onClick={() => setMenu(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditor && <BoardEditor onClose={() => setShowEditor(false)} />}
    </>
  );
}

function StatusChip({ playerId }: { playerId: string }) {
  const p = useGame((s) => s.players.find((x) => x.id === playerId));
  if (!p) return null;
  if (p.finished) return <span className="chip chip--ok">🏆 Terminou</span>;
  if (p.skipTurns > 0) return <span className="chip chip--bad">⛔ Parado {p.skipTurns}</span>;
  if (p.effects.some((e) => e.id === "star")) return <span className="chip chip--warn">⭐ Invencível</span>;
  if (p.effects.length > 0)
    return <span className="chip chip--warn">{p.effects[0].glyph} {p.effects[0].label}</span>;
  return <span className="chip chip--ok">✓ Ativo</span>;
}
