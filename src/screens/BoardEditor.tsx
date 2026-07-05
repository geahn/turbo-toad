import { useGame } from "../store/gameStore";
import { TILE_META, TILE_ORDER, TileType } from "../data/board";

export function BoardEditor({ onClose }: { onClose: () => void }) {
  const board = useGame((s) => s.board);
  const setTile = useGame((s) => s.setTile);
  const addTile = useGame((s) => s.addTile);
  const removeTile = useGame((s) => s.removeTile);
  const resetBoard = useGame((s) => s.resetBoard);

  const counts = board.reduce<Record<string, number>>((acc, t) => {
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="overlay" style={{ placeItems: "stretch", padding: 0 }}>
      <div className="app" style={{ background: "var(--track)", overflowY: "auto" }}>
        <div className="topbar" style={{ position: "sticky", top: 0, zIndex: 2, paddingBottom: 8 }}>
          <button className="iconbtn" onClick={onClose}>✓</button>
          <div className="topbar__title grow">Editar Pista</div>
          <span className="chip">{board.length} casas</span>
        </div>

        <div className="panel" style={{ marginBottom: 12 }}>
          <p className="tiny" style={{ margin: 0, fontWeight: 600 }}>
            Conte as casas do seu tabuleiro a partir da largada e ajuste cada uma pra bater 100%.
            A casa 0 deve ser a <strong>largada</strong>. Ordem = sentido da corrida. 🏁
          </p>
          <div className="row wrap" style={{ gap: 6, marginTop: 8 }}>
            {TILE_ORDER.map((t) => (
              <span key={t} className="chip" style={{ fontSize: "0.72rem" }}>
                {TILE_META[t].glyph} {counts[t] ?? 0}
              </span>
            ))}
          </div>
        </div>

        <div className="stack-8" style={{ paddingBottom: 90 }}>
          {board.map((type, i) => (
            <div key={i} className="item" style={{ padding: 10 }}>
              <span
                className="item__glyph"
                style={{ background: TILE_META[type].color, minWidth: 40, fontFamily: "var(--display)", fontSize: "1rem" }}
              >
                {i}
              </span>
              <div className="grow">
                <div className="item__name" style={{ fontSize: "0.85rem" }}>
                  {TILE_META[type].glyph} {TILE_META[type].label}
                </div>
                <select
                  className="input"
                  style={{ padding: "6px 8px", marginTop: 4, fontSize: "0.85rem" }}
                  value={type}
                  onChange={(e) => setTile(i, e.target.value as TileType)}
                >
                  {TILE_ORDER.map((t) => (
                    <option key={t} value={t}>
                      {TILE_META[t].glyph} {TILE_META[t].label}
                    </option>
                  ))}
                </select>
              </div>
              <button className="iconbtn" onClick={() => removeTile(i)} title="Remover casa">🗑️</button>
            </div>
          ))}
        </div>

        <div className="actionbar" style={{ background: "var(--track)" }}>
          <button className="btn btn--ghost" onClick={() => { if (confirm("Restaurar a pista padrão?")) resetBoard(); }}>
            ↺ Padrão
          </button>
          <button className="btn btn--sky" onClick={addTile}>＋ Casa</button>
          <button className="btn btn--green" onClick={onClose}>✓ Pronto</button>
        </div>
      </div>
    </div>
  );
}
