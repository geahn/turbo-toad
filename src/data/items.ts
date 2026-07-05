/* ============================================================
   Item catalog: dice faces (potencializadores / neutralizadores)
   and the Toad Shop products.
   ============================================================ */

export type DiceKind = "number" | "power" | "neutral";

export interface DiceFace {
  face: number; // 1..6
  id: string;
  name: string;
  glyph: string;
  desc: string;
  color: string;
}

/** POTENCIALIZADORES — rolled on a "?" power box (yellow). */
export const POWER_FACES: DiceFace[] = [
  { face: 1, id: "coin", name: "Moeda", glyph: "🪙", color: "#ffd23f", desc: "Ganha 1 moeda pra gastar na Lojinha do Toad." },
  { face: 2, id: "banana", name: "Banana", glyph: "🍌", color: "#ffe066", desc: "Escorregou! Volte 1 casa." },
  { face: 3, id: "mushroom", name: "Cogumelo", glyph: "🍄", color: "#ff6b6b", desc: "Pule 1 casa pra frente quando quiser — dá pra escapar de uma casa ruim." },
  { face: 4, id: "greenshell", name: "Casco Verde", glyph: "🐢", color: "#51cf66", desc: "Proteção contra: casco vermelho, banana, armadilha e dado invertido." },
  { face: 5, id: "redshell", name: "Casco Vermelho", glyph: "🔴", color: "#ff8787", desc: "Atinge o próximo jogador: ele volta 2 casas." },
  { face: 6, id: "star", name: "Estrela", glyph: "⭐", color: "#ffd43b", desc: "Fique invencível! Imune a cascos, banana, armadilha, dado invertido, buraco, óleo, casco espinhoso, raio e planta." },
];

/** NEUTRALIZADORES — the bad-luck die. */
export const NEUTRAL_FACES: DiceFace[] = [
  { face: 1, id: "minus3", name: "-3 Moedas", glyph: "💸", color: "#ff8787", desc: "Perdeu, mané! Menos 3 moedinhas." },
  { face: 2, id: "oil", name: "Mancha de Óleo", glyph: "🛢️", color: "#495057", desc: "Perdeu o controle? Volte 2 casas!" },
  { face: 3, id: "bluemushroom", name: "Cogumelo Azul", glyph: "🔵", color: "#4dabf7", desc: "Por 2 rodadas, só anda 1 casa por vez (mas se tirar 6, o efeito quebra e anda as 6)." },
  { face: 4, id: "lightning", name: "Raio", glyph: "⚡", color: "#ffd43b", desc: "Por 3 rodadas fica lento pela metade (arredonda pra baixo)." },
  { face: 5, id: "boo", name: "Boo", glyph: "👻", color: "#e9ecef", desc: "Suas moedas vão pra quem tem menos." },
  { face: 6, id: "noslot", name: "Slot Fechado", glyph: "🚫", color: "#868e96", desc: "Por 1 rodada, não pega potencializadores." },
];

export interface ShopProduct {
  id: string;
  name: string;
  glyph: string;
  price: number;
  desc: string;
  group: "dados" | "reforcos" | "ataques" | "servicos";
  /** goes into the player's carried-item inventory when bought */
  carryable: boolean;
}

export const SHOP: ShopProduct[] = [
  // Dados
  { id: "dado_duplo", name: "Dado Duplo", glyph: "🎲", price: 5, group: "dados", carryable: true, desc: "Lance o dado 2 vezes." },
  { id: "dado_triplo", name: "Dado Triplo", glyph: "🎲", price: 7, group: "dados", carryable: true, desc: "Lance o dado 3 vezes." },
  { id: "dado_invertido", name: "Dado Invertido", glyph: "🔄", price: 10, group: "dados", carryable: true, desc: "O próximo jogador volta a quantidade sorteada no dado." },
  // Reforços
  { id: "cog_vermelho", name: "Cogumelo Vermelho", glyph: "🍄", price: 4, group: "reforcos", carryable: true, desc: "Salte 1 casa a mais além do sorteio do dado." },
  { id: "cog_dourado", name: "Cogumelo Dourado", glyph: "🌟", price: 8, group: "reforcos", carryable: true, desc: "O sorteio do dado é multiplicado por 2." },
  { id: "slot_extra", name: "Slot Adicional", glyph: "📦", price: 10, group: "reforcos", carryable: false, desc: "Passe a portar até 2 potencializadores ao mesmo tempo." },
  // Ataques
  { id: "boo", name: "Boo", glyph: "👻", price: 3, group: "ataques", carryable: true, desc: "Roube 1 item do próximo jogador com mais moedas e troque a qtd de moedas com ele." },
  { id: "armadilha", name: "Armadilha", glyph: "🪤", price: 7, group: "ataques", carryable: true, desc: "Plante uma armadilha. Quem cair perde 1 rodada e não pega potencializador na próxima." },
  { id: "poca_oleo", name: "Poça de Óleo", glyph: "🛢️", price: 5, group: "ataques", carryable: true, desc: "Quem cair escorrega e volta 3 casas." },
  { id: "casco_espinhoso", name: "Casco Espinhoso", glyph: "🐚", price: 10, group: "ataques", carryable: true, desc: "O 1º colocado atual fica 1 rodada sem jogar." },
  { id: "raio", name: "Raio", glyph: "⚡", price: 12, group: "ataques", carryable: true, desc: "Todos ficam 2x mais lentos por 3 rodadas. Você recupera na 2ª rodada." },
  // Serviços
  { id: "cupom", name: "Cupom de Desconto", glyph: "🏷️", price: 5, group: "servicos", carryable: false, desc: "Deixa todos os produtos da loja 2 moedas mais baratos." },
  { id: "delivery", name: "Delivery do Toad", glyph: "🛵", price: 6, group: "servicos", carryable: false, desc: "Compre um item mesmo fora da loja, pagando +2 moedas de taxa." },
];

export const SHOP_GROUPS: { id: ShopProduct["group"]; label: string }[] = [
  { id: "dados", label: "Dados" },
  { id: "reforcos", label: "Cogumelos & Reforços" },
  { id: "ataques", label: "Trapaças & Ataques" },
  { id: "servicos", label: "Serviços & Vantagens" },
];

export const productById = (id: string): ShopProduct | undefined =>
  SHOP.find((p) => p.id === id);

/** unified lookup for any carryable item's glyph/name (dice items + shop) */
export function itemMeta(id: string): { name: string; glyph: string } {
  const all = [...POWER_FACES, ...NEUTRAL_FACES, ...SHOP];
  const found = all.find((i) => i.id === id);
  return found ? { name: found.name, glyph: found.glyph } : { name: id, glyph: "❓" };
}
