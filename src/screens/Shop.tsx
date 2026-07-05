import { useState } from "react";
import { motion } from "framer-motion";
import { useGame } from "../store/gameStore";
import { SHOP, SHOP_GROUPS } from "../data/items";
import { tileTypeAt } from "../data/board";
import { Avatar } from "../components/Avatar";
import type { Route } from "../App";

export function Shop({ id, nav }: { id: string; nav: (r: Route) => void }) {
  const p = useGame((s) => s.players.find((x) => x.id === id));
  const mode = useGame((s) => s.config.mode);
  const board = useGame((s) => s.board);
  const cupomActive = useGame((s) => s.cupomActive);
  const buy = useGame((s) => s.buy);
  const [flash, setFlash] = useState<string | null>(null);

  if (!p) return null;
  const onShopTile = mode === "full" ? tileTypeAt(board, p.position).type === "shop" : true;
  const [delivery, setDelivery] = useState(!onShopTile);

  const priceOf = (base: number) => {
    let v = base;
    if (cupomActive) v = Math.max(1, v - 2);
    if (delivery) v += 2;
    return v;
  };

  const tryBuy = (prodId: string, name: string) => {
    const ok = buy(id, prodId, delivery);
    setFlash(ok ? `✅ ${name} comprado!` : `❌ Sem moedas ou slot cheio`);
    setTimeout(() => setFlash(null), 1600);
  };

  return (
    <>
      <div className="topbar">
        <button className="iconbtn" onClick={() => nav({ name: "player", id })}>‹</button>
        <div className="topbar__title grow">Lojinha do Toad 🍄</div>
      </div>

      <div className="panel row between" style={{ background: "var(--paper-2)" }}>
        <div className="row">
          <Avatar characterId={p.characterId} size="sm" />
          <div>
            <div style={{ fontWeight: 700 }}>{p.name}</div>
            <div className="tiny muted">Slots: {p.items.length}/{p.slots}</div>
          </div>
        </div>
        <span className="chip chip--coin" style={{ fontSize: "1rem" }}>🪙 {p.coins}</span>
      </div>

      <div className="row wrap" style={{ gap: 8 }}>
        {cupomActive && <span className="chip chip--ok">🏷️ Cupom ativo −2</span>}
        {!onShopTile && (
          <button
            className="chip"
            style={{ background: delivery ? "var(--sky)" : "#fff", color: delivery ? "#fff" : "var(--ink)" }}
            onClick={() => setDelivery((d) => !d)}
          >
            🛵 Delivery {delivery ? "ON (+2)" : "OFF"}
          </button>
        )}
      </div>

      {flash && (
        <motion.div className="panel center-text" style={{ background: "var(--gold)" }} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <strong>{flash}</strong>
        </motion.div>
      )}

      {SHOP_GROUPS.map((g) => (
        <div key={g.id} className="stack-8">
          <div className="label" style={{ marginTop: 4 }}>{g.label}</div>
          {SHOP.filter((s) => s.group === g.id).map((prod) => {
            const price = priceOf(prod.price);
            const affordable = p.coins >= price && (!prod.carryable || p.items.length < p.slots);
            return (
              <div key={prod.id} className="item">
                <span className="item__glyph" style={{ background: "#fff" }}>{prod.glyph}</span>
                <div className="grow">
                  <div className="item__name">{prod.name}</div>
                  <div className="item__desc">{prod.desc}</div>
                </div>
                <button
                  className={`btn btn--sm ${affordable ? "btn--green" : "btn--ghost"}`}
                  disabled={!affordable}
                  onClick={() => tryBuy(prod.id, prod.name)}
                  style={{ flex: "0 0 auto" }}
                >
                  🪙 {price}
                </button>
              </div>
            );
          })}
        </div>
      ))}

      <div className="actionbar">
        <button className="btn" onClick={() => nav({ name: "player", id })}>Voltar ao piloto</button>
      </div>
    </>
  );
}
