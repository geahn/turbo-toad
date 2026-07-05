/* ============================================================
   BOARD MODEL (modo "Acompanhar pista").
   A sequência de casas é editável DENTRO do app (Editor de Pista)
   e fica salva. Este arquivo guarda só o padrão inicial + helpers.
   ============================================================ */

export type TileType =
  | "start" // largada / chegada
  | "coin" // moeda (+1 ao parar)
  | "power" // caixa "?" amarela (potencializador — dado bom)
  | "neutral" // caixa "¿?" roxa (neutralizador — dado ruim)
  | "shop" // sacola da lojinha do Toad
  | "piranha" // planta carnívora (preso 1 rodada)
  | "hole" // buraco (volta ao buraco anterior)
  | "blank"; // casa livre

export interface Tile {
  i: number;
  type: TileType;
}

/** Traçado do Super Mario Kart Board seguindo a seta da largada.
 *  Contagens: 3 buracos, 2 caixas roxas, 7 caixas amarelas, 4 sacolas,
 *  3 plantas. Ajuste fino no Editor de Pista dentro do app. */
export const DEFAULT_LAYOUT: TileType[] = [
  // largada + borda de baixo (esq -> dir)
  "start", "coin", "hole", "power", "coin", "shop", "piranha", "coin",
  // lateral direita (baixo -> cima)
  "coin", "coin", "power", "coin", "hole", "coin",
  // topo (dir -> esq)
  "coin", "piranha", "shop", "coin", "coin", "power", "hole", "coin", "coin",
  // lateral esquerda (cima -> baixo) — canto tem caixa roxa
  "neutral", "coin", "power", "coin", "shop", "coin",
  // serpentina — faixa de cima
  "coin", "power", "shop", "piranha", "coin", "power", "coin",
  // serpentina — faixa do meio (tem a 2ª caixa roxa)
  "coin", "neutral", "coin", "power", "coin", "coin", "coin", "coin",
];

export const TILE_META: Record<TileType, { label: string; glyph: string; color: string }> = {
  start: { label: "Largada / Chegada", glyph: "🏁", color: "#f8f9fa" },
  coin: { label: "Moeda", glyph: "🪙", color: "#ffd23f" },
  power: { label: "Caixa ? (Potencializador)", glyph: "🟨", color: "#ffd23f" },
  neutral: { label: "Caixa ¿? (Neutralizador)", glyph: "🟪", color: "#7b3f9e" },
  shop: { label: "Lojinha do Toad", glyph: "🛍️", color: "#ff6b6b" },
  piranha: { label: "Planta Carnívora", glyph: "🌱", color: "#51cf66" },
  hole: { label: "Buraco", glyph: "🕳️", color: "#343a40" },
  blank: { label: "Casa livre", glyph: "▫️", color: "#e9ecef" },
};

export const TILE_ORDER: TileType[] = [
  "coin", "power", "neutral", "shop", "piranha", "hole", "start", "blank",
];

/** normaliza índice dentro do tamanho do tabuleiro (loop) */
export function wrap(index: number, size: number): number {
  return ((index % size) + size) % size;
}

export function tileTypeAt(board: TileType[], index: number): Tile {
  const i = wrap(index, board.length);
  return { i, type: board[i] };
}

/** índice do buraco anterior a uma posição (para o efeito do buraco) */
export function previousHole(board: TileType[], index: number): number {
  for (let step = 1; step <= board.length; step++) {
    const idx = wrap(index - step, board.length);
    if (board[idx] === "hole") return idx;
  }
  return 0;
}
