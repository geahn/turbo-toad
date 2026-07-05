import { useState } from "react";
import { useGame } from "../store/gameStore";
import { useNet } from "../net/net";
import { CHARACTERS } from "../data/characters";
import { Avatar } from "../components/Avatar";
import { BoardEditor } from "./BoardEditor";

export function Setup() {
  const { config, setConfig, players, addPlayer, removePlayer, setPhase } = useGame();
  const net = useNet();
  const [selected, setSelected] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const isHost = net.role === "host";

  const taken = new Set(players.map((p) => p.characterId));

  const add = () => {
    if (!selected) return;
    addPlayer(selected, name || CHARACTERS.find((c) => c.id === selected)!.name);
    // no host online, o 1º piloto adicionado é o próprio host (identidade do device)
    if (isHost && !net.myPlayerId) {
      const players = useGame.getState().players;
      net.setMyPlayerId(players[players.length - 1].id);
    }
    setSelected(null);
    setName("");
  };

  const canStart = players.length >= 2;

  return (
    <>
      <div className="topbar">
        <button
          className="iconbtn"
          onClick={() => {
            if (net.role !== "local") net.leave();
            setPhase("home");
          }}
        >
          ‹
        </button>
        <div className="topbar__title">Configurar Partida</div>
      </div>

      {isHost && (
        <div className="panel" style={{ background: "var(--sky)", color: "#fff", textAlign: "center" }}>
          <div className="tiny" style={{ fontWeight: 700, letterSpacing: 1 }}>CÓDIGO DA PISTA</div>
          <div style={{ fontFamily: "var(--display)", fontSize: "2.4rem", letterSpacing: 6 }}>{net.code}</div>
          <div className="tiny">
            Compartilhe o código. {net.peerCount} conectado(s). Adicione seu piloto; os
            outros entram pelo celular deles.
          </div>
        </div>
      )}

      {/* Mode */}
      <div className="panel stack-12">
        <div className="label" style={{ color: "var(--ink)", textShadow: "none" }}>
          Modo de jogo
        </div>
        <div className="seg">
          <button
            aria-pressed={config.mode === "full"}
            onClick={() => setConfig({ mode: "full" })}
          >
            🗺️ Acompanhar pista
          </button>
          <button
            aria-pressed={config.mode === "dice"}
            onClick={() => setConfig({ mode: "dice" })}
          >
            🎲 Só os dados
          </button>
        </div>
        <p className="tiny muted" style={{ margin: 0 }}>
          {config.mode === "full"
            ? "O app rastreia posição na pista, itens, moedas e status de cada piloto."
            : "Sem rastrear a pista — só os 3 dados e o controle de moedas ficam disponíveis."}
        </p>

        {config.mode === "full" && (
          <>
            <div className="row between">
              <span style={{ fontWeight: 600 }}>🏁 Voltas</span>
              <div className="stepper">
                <button onClick={() => setConfig({ laps: Math.max(1, config.laps - 1) })}>−</button>
                <span className="stepper__val">{config.laps}</span>
                <button onClick={() => setConfig({ laps: config.laps + 1 })}>+</button>
              </div>
            </div>
            <button className="btn btn--sm btn--dark" style={{ width: "100%" }} onClick={() => setShowEditor(true)}>
              🗺️ Editar pista (bater com o tabuleiro real)
            </button>
          </>
        )}

        <div className="row between">
          <span style={{ fontWeight: 600 }}>🪙 Moedas iniciais</span>
          <div className="stepper">
            <button onClick={() => setConfig({ startingCoins: Math.max(0, config.startingCoins - 1) })}>
              −
            </button>
            <span className="stepper__val">{config.startingCoins}</span>
            <button onClick={() => setConfig({ startingCoins: config.startingCoins + 1 })}>+</button>
          </div>
        </div>
      </div>

      {/* Character picker */}
      <div className="panel stack-12">
        <div className="label" style={{ color: "var(--ink)", textShadow: "none" }}>
          Escolha o piloto
        </div>
        <div className="grid-3">
          {CHARACTERS.map((c) => {
            const isTaken = taken.has(c.id);
            const isSel = selected === c.id;
            return (
              <button
                key={c.id}
                disabled={isTaken}
                onClick={() => setSelected(isSel ? null : c.id)}
                className="col"
                style={{
                  alignItems: "center",
                  gap: 4,
                  padding: "10px 4px",
                  borderRadius: 16,
                  border: `3px solid ${isSel ? "var(--mario)" : "var(--ink)"}`,
                  background: isSel ? "var(--gold)" : "#fff",
                  opacity: isTaken ? 0.35 : 1,
                  boxShadow: isSel ? "0 4px 0 var(--mario-dark)" : "0 3px 0 #d8d2c2",
                }}
              >
                <Avatar characterId={c.id} size="sm" />
                <span style={{ fontWeight: 700, fontSize: "0.72rem" }}>{c.name}</span>
              </button>
            );
          })}
        </div>

        {selected && (
          <div className="row fade-enter">
            <input
              className="input"
              placeholder="Nome do jogador"
              value={name}
              maxLength={14}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <button className="btn btn--green btn--sm" onClick={add} style={{ flex: "0 0 auto" }}>
              ＋ Add
            </button>
          </div>
        )}
      </div>

      {/* Added players */}
      {players.length > 0 && (
        <div className="stack-8">
          {players.map((p) => (
            <div key={p.id} className="pcard">
              <Avatar characterId={p.characterId} />
              <div className="grow">
                <div className="pcard__name">{p.name}</div>
                <div className="tiny muted">🪙 {p.coins} moedas</div>
              </div>
              <button className="iconbtn" onClick={() => removePlayer(p.id)}>
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="actionbar">
        <button
          className="btn btn--green"
          disabled={!canStart}
          onClick={() => {
            useGame.getState().clearOrderRolls();
            setPhase("order");
          }}
        >
          {canStart ? "🎲 Definir ordem →" : "Adicione ao menos 2 pilotos"}
        </button>
      </div>

      {showEditor && <BoardEditor onClose={() => setShowEditor(false)} />}
    </>
  );
}
