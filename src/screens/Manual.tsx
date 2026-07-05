import type { ReactNode } from "react";
import { useUI } from "../store/ui";
import { POWER_FACES, NEUTRAL_FACES, SHOP, SHOP_GROUPS, DiceFace } from "../data/items";

const TILES: { glyph: string; name: string; desc: string }[] = [
  { glyph: "🏁", name: "Largada / Chegada", desc: "Onde a corrida começa e termina." },
  { glyph: "🪙", name: "Moeda", desc: "Pare aqui e ganhe 1 moeda." },
  { glyph: "🟨", name: "Caixa “?” (amarela)", desc: "Jogue o dado de potencializadores (item bom)." },
  { glyph: "🟪", name: "Caixa “¿?” (roxa)", desc: "Jogue o dado de neutralizadores (item ruim)." },
  { glyph: "🛍️", name: "Sacola", desc: "Abre a Lojinha do Toad pra comprar itens." },
  { glyph: "🌱", name: "Planta Carnívora", desc: "Ficou preso: perde 1 rodada." },
  { glyph: "🕳️", name: "Buraco", desc: "Cai e volta pro buraco anterior." },
];

const STEPS: [string, string][] = [
  ["Prepare a jogada", "Antes de lançar, ative itens que valem “antes do dado” — como o cogumelo dourado (dobra o resultado)."],
  ["Jogue o dado de número", "Ande a quantidade de casas sorteada. Cogumelos e efeitos podem ajustar esse número."],
  ["Resolva a casa", "Moeda (+1), caixa amarela (item bom), caixa roxa (item ruim), sacola (loja), buraco, planta ou armadilha."],
  ["Ataque ou compre", "Use cascos e trapaças na hora certa, plante armadilhas ou compre por Delivery."],
  ["Encerre a vez", "Passe o dado — e o celular, no modo 1 aparelho — pro próximo piloto."],
];

const TIPS: [string, ReactNode][] = [
  ["🍄", <>O cogumelo pode ser usado <b>depois</b> de jogar o dado, pra pular uma casa ruim.</>],
  ["🌟", <>O cogumelo dourado só dobra se ativado <b>antes</b> de jogar; depois, vale pro <b>próximo</b> dado.</>],
  ["🔵", <>Preso no cogumelo azul? Tirar <b>6</b> quebra o efeito e você anda as 6 casas.</>],
  ["🕳️", <>Se o buraco te jogar cruzando a largada de ré, você <b>perde 1 volta</b>.</>],
  ["🏁", <>Pra vencer você precisa <b>passar</b> a largada completando as voltas — não precisa cair exato.</>],
  ["🛡️", <>Estrela é imune a tudo e não gasta. O casco bloqueia <b>1</b> ataque e some (o verde primeiro).</>],
];

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div
      className="tiny"
      style={{ fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "var(--pipe)", marginBottom: 2 }}
    >
      {children}
    </div>
  );
}

function LegendList({ faces }: { faces: DiceFace[] }) {
  return (
    <div className="stack-8" style={{ marginTop: 4 }}>
      {faces.map((f) => (
        <div key={f.id} className="row" style={{ alignItems: "flex-start", gap: 10 }}>
          <span
            style={{
              flex: "0 0 auto", width: 26, height: 26, display: "grid", placeItems: "center",
              borderRadius: 8, background: "rgba(0,0,0,.22)", fontFamily: "var(--display)", fontSize: "1rem",
            }}
          >
            {f.face}
          </span>
          <span style={{ flex: "0 0 auto", fontSize: "1.3rem", lineHeight: 1.2 }}>{f.glyph}</span>
          <div style={{ lineHeight: 1.25 }}>
            <div style={{ fontWeight: 700 }}>{f.name}</div>
            <div className="tiny" style={{ opacity: 0.95 }}>{f.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Manual() {
  const close = useUI((s) => s.closeManual);

  return (
    <div className="overlay" style={{ placeItems: "stretch", padding: 0, zIndex: 60 }}>
      <div className="app" style={{ overflowY: "auto" }}>
        <div className="topbar" style={{ position: "sticky", top: 0, zIndex: 2, background: "var(--track)", paddingBottom: 8 }}>
          <button className="iconbtn" onClick={close}>‹</button>
          <div className="topbar__title grow">Manual de Regras</div>
        </div>

        <div className="screen">
          <div className="trim" />
          <div className="brand">
            <div className="brand__logo" style={{ fontSize: "2.6rem" }}>
              TURBO <span className="red">TOAD</span>
            </div>
            <div className="brand__tag">Manual de instruções 🏁</div>
          </div>

          {/* Objetivo */}
          <div className="panel">
            <Eyebrow>🎯 Objetivo</Eyebrow>
            <p style={{ margin: 0, fontWeight: 500 }}>
              Seja o primeiro a completar as voltas combinadas e cruzar a largada. No caminho, junte moedas
              pra comprar na Lojinha do Toad, use potencializadores a seu favor e solte trapaças pra
              atrapalhar os adversários.
            </p>
          </div>

          {/* Preparação */}
          <div className="panel">
            <Eyebrow>🏁 Preparação</Eyebrow>
            <div className="stack-8" style={{ marginTop: 4 }}>
              <div>👥 <b>Pilotos:</b> de 2 a 12 — cada um pega personagem e nome.</div>
              <div>⚙️ <b>Partida:</b> combinem o nº de voltas e as moedas iniciais.</div>
              <div>🎲 <b>Ordem:</b> cada um joga o dado; o maior larga primeiro (empate: rolem de novo).</div>
            </div>
          </div>

          {/* Tabuleiro */}
          <div className="panel stack-8">
            <Eyebrow>🗺️ O Tabuleiro</Eyebrow>
            {TILES.map((t) => (
              <div key={t.name} className="item">
                <span className="item__glyph" style={{ background: "#fff" }}>{t.glyph}</span>
                <div className="grow">
                  <div className="item__name">{t.name}</div>
                  <div className="item__desc">{t.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Três dados */}
          <div className="panel">
            <Eyebrow>🎲 Os Três Dados</Eyebrow>
            <div className="stack-8" style={{ marginTop: 4 }}>
              <div>🎲 <b>Dado de número (1–6):</b> ande essa quantidade de casas.</div>
              <div>🟨 <b>Potencializadores:</b> na caixa amarela, sorteia um item bom.</div>
              <div>🟪 <b>Neutralizadores:</b> na caixa roxa (ou numa armadilha), sorteia um item ruim.</div>
            </div>
          </div>

          {/* Legendas */}
          <div className="panel--sky panel">
            <div className="label center-text" style={{ marginBottom: 4 }}>⭐ Potencializadores</div>
            <LegendList faces={POWER_FACES} />
          </div>
          <div className="panel--orange panel">
            <div className="label center-text" style={{ marginBottom: 4 }}>😈 Neutralizadores</div>
            <LegendList faces={NEUTRAL_FACES} />
          </div>

          {/* A sua vez */}
          <div className="panel stack-8">
            <Eyebrow>🔄 A Sua Vez</Eyebrow>
            {STEPS.map(([t, d], i) => (
              <div key={t} className="row" style={{ alignItems: "flex-start", gap: 12 }}>
                <span
                  style={{
                    flex: "0 0 auto", width: 34, height: 34, display: "grid", placeItems: "center", borderRadius: 11,
                    background: "var(--mario)", color: "#fff", border: "3px solid var(--ink)",
                    fontFamily: "var(--display)", fontSize: "1.2rem", boxShadow: "0 3px 0 var(--mario-dark)",
                  }}
                >
                  {i + 1}
                </span>
                <div>
                  <div style={{ fontWeight: 700 }}>{t}</div>
                  <div className="tiny muted">{d}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Lojinha */}
          <div className="panel stack-8">
            <Eyebrow>🛍️ Lojinha do Toad</Eyebrow>
            <p className="tiny muted" style={{ margin: 0 }}>
              Compre parando numa sacola — ou de qualquer lugar com o Delivery. Com o Cupom, tudo pela metade.
            </p>
            {SHOP_GROUPS.map((g) => (
              <div key={g.id} className="stack-8">
                <div className="label" style={{ color: "var(--ink)", textShadow: "none", marginTop: 4 }}>{g.label}</div>
                {SHOP.filter((s) => s.group === g.id).map((prod) => (
                  <div key={prod.id} className="item">
                    <span className="item__glyph" style={{ background: "#fff" }}>{prod.glyph}</span>
                    <div className="grow">
                      <div className="item__name">{prod.name}</div>
                      <div className="item__desc">{prod.desc}</div>
                    </div>
                    <span className="chip chip--coin">🪙 {prod.price}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Proteções */}
          <div className="panel stack-8">
            <Eyebrow>🛡️ Proteções &amp; Prioridade</Eyebrow>
            <div>⭐ <b>Estrela:</b> imune a quase tudo por 3 rodadas. Não é consumida.</div>
            <div>🐢 <b>Casco Verde:</b> bloqueia 1 ataque (casco vermelho, banana, armadilha, dado invertido) e some.</div>
            <div>🔴 <b>Casco Vermelho:</b> protege igual ao verde enquanto carregado — ou dispare no piloto à frente.</div>
            <div>🥇 <b>Prioridade:</b> com os dois cascos, o verde é gasto primeiro. A estrela sempre vence.</div>
          </div>

          {/* Dicas */}
          <div className="panel stack-8">
            <Eyebrow>💡 Detalhes que confundem</Eyebrow>
            {TIPS.map(([g, node], i) => (
              <div key={i} className="row" style={{ alignItems: "flex-start", gap: 10 }}>
                <span style={{ fontSize: "1.3rem" }}>{g}</span>
                <div className="tiny">{node}</div>
              </div>
            ))}
          </div>

          <button className="btn btn--green" onClick={close}>✓ Fechar manual</button>
          <div className="trim" />
        </div>
      </div>
    </div>
  );
}
