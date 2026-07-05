import { useState } from "react";
import { motion } from "framer-motion";
import { useGame, slotCap } from "../store/gameStore";
import { useNet } from "../net/net";
import { Avatar } from "../components/Avatar";
import { Dice } from "../components/Dice";
import { itemMeta, POWER_FACES, NEUTRAL_FACES } from "../data/items";
import { tileTypeAt, TILE_META, wrap } from "../data/board";
import { characterById } from "../data/characters";
import type { Route } from "../App";

export function PlayerScreen({ id, nav }: { id: string; nav: (r: Route) => void }) {
  const p = useGame((s) => s.players.find((x) => x.id === id));
  const mode = useGame((s) => s.config.mode);
  const laps = useGame((s) => s.config.laps);
  const order = useGame((s) => s.order);
  const turnIndex = useGame((s) => s.turnIndex);
  const store = useGame();
  const net = useNet();
  const online = net.role !== "local";
  const canEdit = !online || id === net.myPlayerId;
  const isCurrent = order[turnIndex] === id;
  // o dado só é liberado na vez do jogador (em qualquer modo)
  const canRoll = canEdit && isCurrent;
  const [pendingRoll, setPendingRoll] = useState<number | null>(null);
  const [moveBy, setMoveBy] = useState(0);
  const [landing, setLanding] = useState<{ type: string; i: number } | null>(null);
  const [showEffects, setShowEffects] = useState(false);
  const [showPower, setShowPower] = useState(false);
  const [showNeutral, setShowNeutral] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2600); };

  if (!p) return null;
  const char = characterById(p.characterId);
  const board = store.board;
  const traps = store.traps;
  const tile = tileTypeAt(board, p.position);
  const hasBlue = p.effects.some((e) => e.id === "bluemushroom");
  const hasLightning = p.effects.some((e) => e.id === "lightning");
  const hasGolden = p.effects.some((e) => e.id === "golden");
  const onShopTile = tile.type === "shop";

  const applyRoll = (v: number) => {
    setPendingRoll(v);
    let suggested = v;
    // cogumelo dourado: dobra o dado (só vale antes de lançar)
    if (hasGolden) suggested = v * 2;
    // cogumelo azul: cap em 1, a menos que 6 (que quebra o efeito)
    if (hasBlue && v !== 6) suggested = 1;
    // raio: metade arredondada pra baixo
    if (hasLightning) suggested = Math.floor(suggested / 2);
    setMoveBy(suggested);
  };

  const doMove = () => {
    const landingIdx = wrap(p.position + moveBy, board.length);
    const landingType = board[landingIdx];
    store.moveBy(p.id, moveBy);
    if (hasBlue && pendingRoll === 6) store.removeEffect(p.id, "bluemushroom");
    if (hasGolden) store.removeEffect(p.id, "golden");

    // armadilha na casa onde caiu?
    const trap = traps.find((t) => t.tile === landingIdx);
    if (trap) {
      const immune = p.effects.some((e) => e.id === "star");
      const green = p.protections.includes("greenshell");
      if (immune) {
        flash("⭐ Invencível: ignorou a armadilha!");
        store.clearTrap(landingIdx);
      } else if (green && (trap.kind === "armadilha" || trap.kind === "dado_invertido")) {
        store.removeProtection(p.id, "greenshell");
        flash("🐢 Casco verde bloqueou a armadilha!");
        store.clearTrap(landingIdx);
      } else if (trap.kind === "poca_oleo") {
        store.moveBy(p.id, -2);
        flash("🛢️ Poça de óleo: voltou 2 casas!");
        store.clearTrap(landingIdx);
      } else {
        // dado invertido / armadilha => a vítima sorteia um neutralizador pra si
        flash("😈 Caiu numa armadilha! Sorteie um neutralizador…");
        store.clearTrap(landingIdx);
        setPendingRoll(null);
        setMoveBy(0);
        setShowNeutral(true);
        return;
      }
    }
    setLanding({ type: landingType, i: landingIdx });
    setPendingRoll(null);
    setMoveBy(0);
  };

  const back = (n: number) => {
    store.moveBy(p.id, -n);
    setLanding(null);
  };

  return (
    <>
      <div className="topbar">
        <button className="iconbtn" onClick={() => nav({ name: "dashboard" })}>
          ‹
        </button>
        <div className="topbar__title grow">{p.name}</div>
        <button className="iconbtn" onClick={() => setShowEffects(true)} disabled={!canEdit} style={!canEdit ? { opacity: 0.4 } : undefined}>
          ✨
        </button>
      </div>

      {online && !canEdit && (
        <div className="panel center-text" style={{ background: "var(--plum)", color: "#fff", padding: 10 }}>
          👀 Espiando <strong>{p.name}</strong> — só dá pra editar o seu piloto.
        </div>
      )}
      {!isCurrent && (
        <div className="panel center-text tiny" style={{ background: "#fff3bf" }}>
          ⏳ Não é a vez de <strong>{p.name}</strong> — o dado abre só na vez dele.
        </div>
      )}

      {toast && (
        <motion.div
          className="panel center-text"
          style={{ position: "sticky", top: 6, zIndex: 20, background: "var(--ink)", color: "#fff", fontWeight: 700 }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {toast}
        </motion.div>
      )}

      {/* Identity + coins */}
      <div className="panel" style={{ background: `linear-gradient(160deg, ${char.color2}, ${char.color})` }}>
        <div className="row">
          <Avatar characterId={p.characterId} size="lg" />
          <div className="grow">
            <div style={{ fontFamily: "var(--display)", fontSize: "1.7rem", color: "#fff", textShadow: "0 2px 0 rgba(0,0,0,.3)" }}>
              {p.name}
            </div>
            <div className="tiny" style={{ color: "#fff", fontWeight: 600 }}>{char.name}</div>
            <div style={{ marginTop: 6 }}>
              <StatusBadge id={p.id} />
            </div>
          </div>
        </div>

        <div className="row between" style={{ marginTop: 12, background: "rgba(255,255,255,.9)", borderRadius: 16, padding: "8px 12px", border: "3px solid var(--ink)" }}>
          <span style={{ fontFamily: "var(--display)", fontSize: "1.4rem" }}>🪙 {p.coins}</span>
          <div className="row" style={{ gap: 6 }}>
            <button className="btn btn--sm btn--dark" disabled={!canEdit} onClick={() => store.addCoins(p.id, -3)}>−3</button>
            <button className="btn btn--sm btn--ghost" disabled={!canEdit} onClick={() => store.addCoins(p.id, -1)}>−1</button>
            <button className="btn btn--sm btn--gold" disabled={!canEdit} onClick={() => store.addCoins(p.id, 1)}>+1</button>
          </div>
        </div>
      </div>

      {/* Position + move (full mode) */}
      {mode === "full" && (
        <div className="panel stack-12">
          <div className="row between">
            <div>
              <div className="tiny muted" style={{ fontWeight: 700, textTransform: "uppercase" }}>Na pista</div>
              <div style={{ fontFamily: "var(--display)", fontSize: "1.2rem" }}>
                {TILE_META[tile.type].glyph} {TILE_META[tile.type].label}
              </div>
            </div>
            <div className="col" style={{ alignItems: "flex-end" }}>
              <span className="chip">Casa {tile.i}/{board.length - 1}</span>
              <span className="chip chip--coin" style={{ marginTop: 4 }}>🏁 Volta {p.lap + 1}/{laps}</span>
            </div>
          </div>

          {/* Ações que só aparecem conforme a casa onde o piloto está */}
          {canEdit && tile.type === "power" && (
            <button className="btn btn--sky" onClick={() => setShowPower(true)}>
              ❓ Pegar potencializador (casa amarela)
            </button>
          )}
          {canEdit && tile.type === "neutral" && (
            <button
              className="btn"
              style={{ background: "var(--plum)", boxShadow: "0 6px 0 #5a2d75" }}
              onClick={() => setShowNeutral(true)}
            >
              ¿? Sortear neutralizador (casa roxa)
            </button>
          )}

          <Dice kind="number" label="Dado de número" onResult={applyRoll} disabled={!canRoll} />

          {pendingRoll != null && (
            <motion.div className="panel" style={{ background: "#fff" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {(hasBlue || hasLightning) && (
                <div className="tiny" style={{ color: "var(--mario-dark)", fontWeight: 700, marginBottom: 6 }}>
                  {hasBlue && pendingRoll !== 6 && "🔵 Cogumelo azul: anda só 1. "}
                  {hasBlue && pendingRoll === 6 && "🔵 Tirou 6! Efeito quebrado, anda tudo. "}
                  {hasLightning && "⚡ Raio: metade arredondada pra baixo. "}
                </div>
              )}
              <div className="row between">
                <span style={{ fontWeight: 700 }}>Andar</span>
                <div className="stepper">
                  <button onClick={() => setMoveBy(Math.max(-board.length, moveBy - 1))}>−</button>
                  <span className="stepper__val">{moveBy}</span>
                  <button onClick={() => setMoveBy(moveBy + 1)}>＋</button>
                </div>
              </div>
              <div className="tiny muted" style={{ marginTop: 4 }}>
                Ajuste pra usar cogumelo (+1), dourado (x2) etc.
              </div>
              <button className="btn btn--green" style={{ marginTop: 10 }} onClick={doMove}>
                🏎️ Andar {moveBy} casas →
              </button>
            </motion.div>
          )}

          {landing && (
            <motion.div className="panel" style={{ background: "var(--gold)" }} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <div style={{ fontFamily: "var(--display)", fontSize: "1.2rem", textAlign: "center" }}>
                Caiu em: {TILE_META[landing.type as keyof typeof TILE_META]?.glyph} {TILE_META[landing.type as keyof typeof TILE_META]?.label}
              </div>
              <LandingActions
                type={landing.type}
                onPower={() => { setShowPower(true); setLanding(null); }}
                onNeutral={() => { setShowNeutral(true); setLanding(null); }}
                onShop={() => nav({ name: "shop", id: p.id })}
                onHole={() => { store.sendToHole(p.id); setLanding(null); }}
                onPiranha={() => { store.addSkip(p.id, 1); setLanding(null); }}
                onClose={() => setLanding(null)}
              />
            </motion.div>
          )}

          <div className="grid-2">
            <button className="btn btn--ghost btn--sm" style={{ width: "100%" }} onClick={() => back(1)}>◀ Voltar 1</button>
            <button className="btn btn--ghost btn--sm" style={{ width: "100%" }} onClick={() => back(2)}>◀◀ Voltar 2</button>
          </div>
        </div>
      )}

      {/* Dice-only quick roll when no board tracking */}
      {mode === "dice" && (
        <div className="panel">
          <Dice kind="number" label="Dado de número" disabled={!canRoll} />
        </div>
      )}

      {/* Items */}
      <div className="panel stack-8">
        <div className="label" style={{ color: "var(--ink)", textShadow: "none" }}>
          🎒 Itens ({p.items.length}/{slotCap(p)})
        </div>
        {p.items.length === 0 && <div className="tiny muted">Sem itens no momento.</div>}
        {p.items.map((it, i) => {
          const m = itemMeta(it);
          return (
            <div key={i} className="item">
              <span className="item__glyph" style={{ background: "#fff" }}>{m.glyph}</span>
              <div className="grow">
                <div className="item__name">{m.name}</div>
              </div>
              <button
                className="btn btn--sm btn--green"
                disabled={!canEdit}
                onClick={() => flash(store.useItem(p.id, it))}
              >
                ⚡ Usar
              </button>
              <button className="iconbtn" disabled={!canEdit} onClick={() => store.removeItem(p.id, it)} title="Descartar">🗑️</button>
            </div>
          );
        })}
      </div>

      {/* Shop / status quick access */}
      <div className="grid-2">
        <button
          className="btn btn--gold"
          disabled={!canEdit}
          onClick={() => nav({ name: "shop", id: p.id })}
        >
          🛍️ Lojinha {onShopTile ? "" : "(delivery)"}
        </button>
        <button className="btn btn--sky" disabled={!canEdit} onClick={() => setShowEffects(true)}>✨ Efeitos</button>
      </div>

      {/* Encerrar a vez -> passa pro próximo e (modo 1 celular) troca de tela */}
      {isCurrent && canEdit && (
        <div className="actionbar">
          <button className="btn btn--green" onClick={() => store.nextTurn()}>
            ✅ Encerrar a vez de {p.name} ▶
          </button>
        </div>
      )}

      {/* Power-up dice sheet */}
      {showPower && (
        <div className="overlay" onClick={() => setShowPower(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h2 className="center-text" style={{ marginBottom: 12 }}>Caixa ❓ Potencializador</h2>
            {p.effects.some((e) => e.id === "noslot") ? (
              <div className="panel center-text" style={{ background: "#ffe3e3" }}>
                🚫 Slot fechado: este piloto não pega potencializador nesta rodada.
              </div>
            ) : (
              <Dice
                kind="power"
                onResult={(v) => {
                  const face = POWER_FACES.find((f) => f.face === v)!;
                  if (face.id === "coin") store.addCoins(p.id, 1);
                  else if (face.id === "banana") store.moveBy(p.id, -1);
                  else if (face.id === "star")
                    store.addEffect(p.id, { id: "star", label: "Estrela", glyph: "⭐", roundsLeft: 3 });
                  else if (face.id === "greenshell") store.addProtection(p.id, "greenshell");
                  else store.giveItem(p.id, face.id); // mushroom, redshell → inventário
                }}
              />
            )}
            <button className="btn btn--ghost" style={{ marginTop: 12 }} onClick={() => setShowPower(false)}>Fechar</button>
          </div>
        </div>
      )}

      {/* Neutralizer dice sheet */}
      {showNeutral && (
        <div className="overlay" onClick={() => setShowNeutral(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h2 className="center-text" style={{ marginBottom: 12 }}>Caixa ¿? Neutralizador</h2>
            <Dice
              kind="neutral"
              onResult={(v) => {
                const face = NEUTRAL_FACES.find((f) => f.face === v)!;
                if (p.effects.some((e) => e.id === "star")) return; // estrela: imune
                if (face.id === "minus3") store.addCoins(p.id, -3);
                else if (face.id === "oil") store.moveBy(p.id, -2);
                else if (face.id === "bluemushroom")
                  store.addEffect(p.id, { id: "bluemushroom", label: "Cog. Azul", glyph: "🔵", roundsLeft: 2 });
                else if (face.id === "lightning")
                  store.addEffect(p.id, { id: "lightning", label: "Raio", glyph: "⚡", roundsLeft: 3 });
                else if (face.id === "noslot")
                  store.addEffect(p.id, { id: "noslot", label: "Slot fechado", glyph: "🚫", roundsLeft: 1 });
                // boo (face 5): resolvido manualmente (troca com quem tem menos moedas)
              }}
            />
            {p.effects.some((e) => e.id === "star") && (
              <div className="panel center-text" style={{ background: "#fff3bf", marginTop: 10 }}>
                ⭐ Invencível — nenhum neutralizador afeta este piloto.
              </div>
            )}
            <button className="btn btn--ghost" style={{ marginTop: 12 }} onClick={() => setShowNeutral(false)}>Fechar</button>
          </div>
        </div>
      )}

      {/* Effects palette */}
      {showEffects && <EffectsSheet id={p.id} onClose={() => setShowEffects(false)} />}
    </>
  );
}

function LandingActions({
  type, onPower, onNeutral, onShop, onHole, onPiranha, onClose,
}: {
  type: string;
  onPower: () => void;
  onNeutral: () => void;
  onShop: () => void;
  onHole: () => void;
  onPiranha: () => void;
  onClose: () => void;
}) {
  return (
    <div className="stack-8" style={{ marginTop: 10 }}>
      {type === "power" && <button className="btn btn--sky" onClick={onPower}>❓ Rolar potencializador</button>}
      {type === "neutral" && <button className="btn" style={{ background: "var(--plum)", boxShadow: "0 6px 0 #5a2d75" }} onClick={onNeutral}>¿? Rolar neutralizador</button>}
      {type === "shop" && <button className="btn btn--gold" onClick={onShop}>🛍️ Abrir Lojinha</button>}
      {type === "hole" && <button className="btn btn--dark" onClick={onHole}>🕳️ Cair pro buraco anterior</button>}
      {type === "piranha" && <button className="btn" onClick={onPiranha}>🌱 Preso 1 rodada</button>}
      {type === "coin" && <div className="tiny center-text" style={{ fontWeight: 700 }}>🪙 +1 moeda creditada!</div>}
      <button className="btn btn--ghost btn--sm" style={{ width: "100%" }} onClick={onClose}>Ok</button>
    </div>
  );
}

function StatusBadge({ id }: { id: string }) {
  const p = useGame((s) => s.players.find((x) => x.id === id));
  if (!p) return null;
  const badges: string[] = [];
  if (p.finished) badges.push("🏆 Terminou");
  if (p.skipTurns > 0) badges.push(`⛔ Parado ${p.skipTurns}`);
  if (p.protections.includes("greenshell")) badges.push("🐢 Casco verde");
  p.effects.forEach((e) =>
    badges.push(e.id === "star" ? `⭐ Invencível (${e.roundsLeft})` : `${e.glyph} ${e.label} (${e.roundsLeft})`)
  );
  if (badges.length === 0) badges.push("✓ Ativo");
  return (
    <div className="row wrap" style={{ gap: 4 }}>
      {badges.map((b, i) => (
        <span key={i} className="chip" style={{ fontSize: "0.72rem", padding: "2px 8px" }}>{b}</span>
      ))}
    </div>
  );
}

function EffectsSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const store = useGame();
  const p = useGame((s) => s.players.find((x) => x.id === id));
  if (!p) return null;

  const btn = (label: string, fn: () => void, cls = "btn--ghost") => (
    <button className={`btn ${cls} btn--sm`} style={{ width: "100%" }} onClick={fn}>{label}</button>
  );

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginBottom: 6 }}>✨ Efeitos & Status</h2>
        <p className="tiny muted" style={{ marginTop: 0 }}>Aplique/limpe status neste piloto.</p>

        <div className="divider" />
        <div className="label" style={{ color: "var(--ink)", textShadow: "none" }}>Proteções</div>
        <div className="grid-2" style={{ marginTop: 8 }}>
          {btn("⭐ Estrela (3 rod.)", () => store.addEffect(id, { id: "star", label: "Estrela", glyph: "⭐", roundsLeft: 3 }), "btn--gold")}
          {btn("🐢 Casco verde", () => store.addProtection(id, "greenshell"), "btn--green")}
        </div>

        <div className="divider" />
        <div className="label" style={{ color: "var(--ink)", textShadow: "none" }}>Neutralizadores</div>
        <div className="grid-2" style={{ marginTop: 8 }}>
          {btn("💸 −3 moedas", () => store.addCoins(id, -3))}
          {btn("🛢️ Óleo: −2 casas", () => store.moveBy(id, -2))}
          {btn("🔵 Cog. azul (2 rod.)", () => store.addEffect(id, { id: "bluemushroom", label: "Cog. Azul", glyph: "🔵", roundsLeft: 2 }))}
          {btn("⚡ Raio (3 rod.)", () => store.addEffect(id, { id: "lightning", label: "Raio", glyph: "⚡", roundsLeft: 3 }))}
          {btn("🚫 Slot fechado (1)", () => store.addEffect(id, { id: "noslot", label: "Slot fechado", glyph: "🚫", roundsLeft: 1 }))}
          {btn("👻 Boo (trocar moedas)", () => alert("Boo: troque itens/moedas com quem tem menos moedas — ajuste manualmente nas telas dos jogadores."))}
        </div>

        <div className="divider" />
        <div className="label" style={{ color: "var(--ink)", textShadow: "none" }}>Ficar parado</div>
        <div className="grid-2" style={{ marginTop: 8 }}>
          {btn("🌱 Planta (1 rod.)", () => store.addSkip(id, 1), "btn--dark")}
          {btn("🪤 Armadilha (1 rod.)", () => store.addSkip(id, 1), "btn--dark")}
          {btn("🐚 Casco espinhoso (1)", () => store.addSkip(id, 1), "btn--dark")}
          {btn("♻️ Reativar (0)", () => store.updatePlayer(id, { skipTurns: 0 }), "btn--sky")}
        </div>

        <div className="divider" />
        <div className="label" style={{ color: "var(--ink)", textShadow: "none" }}>Limpar</div>
        <div className="stack-8" style={{ marginTop: 8 }}>
          {p.protections.map((pr) => btn(`Remover ${pr}`, () => store.removeProtection(id, pr)))}
          {p.effects.map((e) => btn(`Remover ${e.glyph} ${e.label}`, () => store.removeEffect(id, e.id)))}
          {btn(p.finished ? "↩️ Desmarcar 'terminou'" : "🏆 Marcar como terminou", () =>
            store.updatePlayer(id, { finished: !p.finished }), "btn--green")}
        </div>

        <button className="btn" style={{ marginTop: 14 }} onClick={onClose}>Fechar</button>
      </div>
    </div>
  );
}
