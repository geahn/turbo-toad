import { useState } from "react";
import { useGame } from "../store/gameStore";
import { useNet } from "../net/net";
import { useUI } from "../store/ui";
import { CHARACTERS } from "../data/characters";
import { Avatar } from "../components/Avatar";

export function Home() {
  const setPhase = useGame((s) => s.setPhase);
  const setConfig = useGame((s) => s.setConfig);
  const resetAll = useGame((s) => s.resetAll);
  const net = useNet();
  const [view, setView] = useState<"menu" | "join">("menu");

  const startLocal = () => {
    net.leave();
    resetAll();
    setPhase("setup");
  };

  const quickDice = () => {
    net.leave();
    resetAll();
    setConfig({ mode: "dice" });
    setPhase("playing");
  };

  const createRoom = async () => {
    resetAll();
    try {
      await net.host();
      setPhase("setup");
    } catch {
      /* erro exibido pelo status */
    }
  };

  return (
    <div className="col" style={{ gap: 20, flex: 1, justifyContent: "center" }}>
      <div className="trim" />
      <div className="brand">
        <div className="brand__logo">
          TURBO <span className="red">TOAD</span>
        </div>
        <div className="brand__tag">Placar oficial da corrida 🏁</div>
      </div>

      {view === "menu" ? (
        <>
          <div className="panel" style={{ textAlign: "center", padding: 14 }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: "0.92rem" }}>
              Dados, moedas, itens, Lojinha do Toad e a posição de cada piloto — num
              celular só ou com cada um no seu.
            </p>
          </div>

          <div className="stack-12">
            <button className="btn btn--green" onClick={startLocal}>
              📱 1 celular (passa e joga)
            </button>
            <button className="btn btn--mario" onClick={createRoom} style={{ background: "var(--mario)" }}>
              🌐 Criar sala online
            </button>
            <button className="btn btn--sky" onClick={() => setView("join")}>
              🔑 Entrar numa sala
            </button>
            <button className="btn btn--gold" onClick={quickDice}>
              🎲 Modo Rápido (só dados)
            </button>
            <button className="btn btn--ghost" onClick={() => useUI.getState().openManual()}>
              📖 Manual de regras
            </button>
          </div>
        </>
      ) : (
        <JoinForm onBack={() => setView("menu")} />
      )}

      {net.status === "connecting" && (
        <div className="panel center-text">Conectando… ⏳</div>
      )}
      {net.status === "error" && net.error && (
        <div className="panel center-text" style={{ background: "#ffe3e3" }}>
          ⚠️ {net.error}
        </div>
      )}

      <div className="trim" />
    </div>
  );
}

function JoinForm({ onBack }: { onBack: () => void }) {
  const net = useNet();
  const [code, setCode] = useState("");
  const [character, setCharacter] = useState<string | null>(null);
  const [name, setName] = useState("");

  const canJoin = code.trim().length >= 3 && character && net.status !== "connecting";

  const join = async () => {
    if (!character) return;
    try {
      await net.join(code.trim(), character, name || CHARACTERS.find((c) => c.id === character)!.name);
    } catch {
      /* erro exibido pelo status */
    }
  };

  return (
    <div className="panel stack-12 fade-enter">
      <div className="row between">
        <div className="label" style={{ color: "var(--ink)", textShadow: "none" }}>Entrar numa sala</div>
        <button className="chip" onClick={onBack}>‹ Voltar</button>
      </div>
      <input
        className="input"
        placeholder="CÓDIGO DA PISTA (ex: AB12)"
        value={code}
        maxLength={4}
        style={{ textAlign: "center", letterSpacing: 4, fontFamily: "var(--display)", textTransform: "uppercase" }}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
      />
      <div className="tiny muted" style={{ marginTop: -4 }}>Escolha seu piloto:</div>
      <div className="grid-3">
        {CHARACTERS.map((c) => {
          const sel = character === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setCharacter(sel ? null : c.id)}
              className="col"
              style={{
                alignItems: "center", gap: 4, padding: "8px 4px", borderRadius: 14,
                border: `3px solid ${sel ? "var(--mario)" : "var(--ink)"}`,
                background: sel ? "var(--gold)" : "#fff",
              }}
            >
              <Avatar characterId={c.id} size="sm" />
              <span style={{ fontWeight: 700, fontSize: "0.68rem" }}>{c.name}</span>
            </button>
          );
        })}
      </div>
      <input
        className="input"
        placeholder="Seu nome"
        value={name}
        maxLength={14}
        onChange={(e) => setName(e.target.value)}
      />
      <button className="btn btn--green" disabled={!canJoin} onClick={join}>
        🔑 Entrar na sala
      </button>
      <p className="tiny muted" style={{ margin: 0 }}>
        Dica: funciona melhor com todos no mesmo Wi-Fi. O piloto aparece pro host
        assim que conectar.
      </p>
    </div>
  );
}
