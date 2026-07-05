import { create, StateCreator } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_LAYOUT, TileType, tileTypeAt, previousHole, wrap } from "../data/board";
import { productById } from "../data/items";
import { netBridge } from "../net/bridge";

export type GameMode = "full" | "dice";
export type Phase = "home" | "setup" | "order" | "playing" | "finished";

export interface Effect {
  id: string;
  label: string;
  glyph: string;
  roundsLeft: number;
}

export interface Player {
  id: string;
  characterId: string;
  name: string;
  coins: number;
  items: string[]; // carried item ids
  slots: number; // max carried items
  position: number; // tile index
  lap: number; // completed laps
  effects: Effect[];
  skipTurns: number; // rounds unable to play (planta, armadilha, casco espinhoso...)
  protections: string[]; // one-shot / active protections: greenshell, star
  finished: boolean;
  orderRoll: number | null;
}

interface Config {
  mode: GameMode;
  laps: number;
  startingCoins: number;
}

export interface Trap {
  tile: number;
  kind: "dado_invertido" | "armadilha" | "poca_oleo";
  owner: string;
}

interface GameState {
  phase: Phase;
  config: Config;
  board: TileType[];
  players: Player[];
  traps: Trap[];
  order: string[]; // player ids
  turnIndex: number;
  round: number;
  cupomActive: boolean;

  // setup
  setPhase: (p: Phase) => void;

  // board editor
  setTile: (index: number, type: TileType) => void;
  addTile: () => void;
  removeTile: (index: number) => void;
  resetBoard: () => void;
  setConfig: (c: Partial<Config>) => void;
  addPlayer: (characterId: string, name: string) => void;
  updatePlayer: (id: string, patch: Partial<Player>) => void;
  removePlayer: (id: string) => void;

  // order
  setOrderRoll: (id: string, value: number) => void;
  clearOrderRolls: () => void;
  finalizeOrder: () => void;

  // game flow
  beginGame: () => void;
  nextTurn: () => void;
  resetAll: () => void;

  // player mutations
  addCoins: (id: string, n: number) => void;
  giveItem: (id: string, itemId: string) => boolean;
  removeItem: (id: string, itemId: string) => void;
  buy: (id: string, productId: string, deliveryFee: boolean) => boolean;
  moveBy: (id: string, delta: number) => { landedOn: TileType; lapUp: boolean; lap: number };
  setPosition: (id: string, pos: number) => void;
  sendToHole: (id: string) => void;
  addEffect: (id: string, e: Effect) => void;
  removeEffect: (id: string, effectId: string) => void;
  addProtection: (id: string, prot: string) => void;
  removeProtection: (id: string, prot: string) => void;
  addSkip: (id: string, rounds: number) => void;
  toggleCupom: () => void;
  finishPlayer: (id: string) => void;

  // itens & armadilhas
  placeTrap: (tile: number, kind: Trap["kind"], owner: string) => void;
  clearTrap: (tile: number) => void;
  useItem: (playerId: string, itemId: string, targetId?: string) => string;
  consumeShield: (id: string) => void;
}

/** o jogador tem escudo (casco verde OU casco vermelho no inventário) */
export function hasShield(p: Player): boolean {
  return p.protections.includes("greenshell") || p.items.includes("redshell");
}

/** proteções: retorna true se o alvo escapou (e consome casco verde) */
function shieldBlocks(p: Player, attack: "redshell" | "banana" | "armadilha" | "dado_invertido" | "oil" | "spiny"): boolean {
  if (p.effects.some((e) => e.id === "star")) {
    // estrela é imune a quase tudo
    if (["redshell", "banana", "armadilha", "dado_invertido", "oil", "spiny"].includes(attack)) return true;
  }
  return false;
}

const uid = () => Math.random().toString(36).slice(2, 9);

function newPlayer(characterId: string, name: string, coins: number): Player {
  return {
    id: uid(),
    characterId,
    name: name.trim() || "Jogador",
    coins,
    items: [],
    slots: 1,
    position: 0,
    lap: 0,
    effects: [],
    skipTurns: 0,
    protections: [],
    finished: false,
    orderRoll: null,
  };
}

const DEFAULT_CONFIG: Config = { mode: "full", laps: 3, startingCoins: 0 };

/** Campos serializáveis que o host transmite pros clientes. */
export const SYNC_KEYS = [
  "phase", "config", "board", "players", "traps", "order", "turnIndex", "round", "cupomActive",
] as const;

export type SyncState = Pick<GameState, (typeof SYNC_KEYS)[number]>;

export function pickSync(s: GameState): SyncState {
  return {
    phase: s.phase, config: s.config, board: s.board, players: s.players, traps: s.traps,
    order: s.order, turnIndex: s.turnIndex, round: s.round, cupomActive: s.cupomActive,
  };
}

/** Middleware: no cliente, cada ação é encaminhada ao host em vez de rodar local. */
const netForward =
  (fn: StateCreator<GameState>): StateCreator<GameState> =>
  (set, get, api) => {
    const state = fn(set, get, api);
    const wrapped = {} as Record<string, unknown>;
    for (const [k, v] of Object.entries(state)) {
      wrapped[k] =
        typeof v === "function"
          ? (...args: unknown[]) => (netBridge.forward(k, args) ? undefined : (v as (...a: unknown[]) => unknown)(...args))
          : v;
    }
    return wrapped as unknown as GameState;
  };

export const useGame = create<GameState>()(
  persist(
    netForward((set, get) => ({
      phase: "home",
      config: { ...DEFAULT_CONFIG },
      board: [...DEFAULT_LAYOUT],
      players: [],
      traps: [],
      order: [],
      turnIndex: 0,
      round: 1,
      cupomActive: false,

      setPhase: (p) => set({ phase: p }),
      setConfig: (c) => set((s) => ({ config: { ...s.config, ...c } })),

      setTile: (index, type) =>
        set((s) => {
          const board = [...s.board];
          if (index >= 0 && index < board.length) board[index] = type;
          return { board };
        }),
      addTile: () => set((s) => ({ board: [...s.board, "coin"] })),
      removeTile: (index) =>
        set((s) => (s.board.length > 2 ? { board: s.board.filter((_, i) => i !== index) } : {})),
      resetBoard: () => set({ board: [...DEFAULT_LAYOUT] }),

      addPlayer: (characterId, name) =>
        set((s) => ({
          players: [...s.players, newPlayer(characterId, name, s.config.startingCoins)],
        })),

      updatePlayer: (id, patch) =>
        set((s) => ({
          players: s.players.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),

      removePlayer: (id) =>
        set((s) => ({ players: s.players.filter((p) => p.id !== id) })),

      setOrderRoll: (id, value) =>
        set((s) => ({
          players: s.players.map((p) => (p.id === id ? { ...p, orderRoll: value } : p)),
        })),

      clearOrderRolls: () =>
        set((s) => ({ players: s.players.map((p) => ({ ...p, orderRoll: null })) })),

      finalizeOrder: () =>
        set((s) => {
          const sorted = [...s.players].sort(
            (a, b) => (b.orderRoll ?? 0) - (a.orderRoll ?? 0)
          );
          return { order: sorted.map((p) => p.id) };
        }),

      beginGame: () =>
        set((s) => ({
          phase: "playing",
          turnIndex: 0,
          round: 1,
          players: s.players.map((p) => ({
            ...p,
            coins: p.coins || s.config.startingCoins,
          })),
        })),

      nextTurn: () =>
        set((s) => {
          if (s.order.length === 0) return {};
          let idx = s.turnIndex;
          let round = s.round;
          const players = s.players.map((p) => ({ ...p }));
          // advance until we find a player who is not finished and not skipping
          for (let guard = 0; guard < s.order.length + 1; guard++) {
            idx += 1;
            if (idx >= s.order.length) {
              idx = 0;
              round += 1;
            }
            const pid = s.order[idx];
            const p = players.find((x) => x.id === pid);
            if (!p) continue;
            if (p.finished) continue;
            if (p.skipTurns > 0) {
              p.skipTurns -= 1;
              continue;
            }
            // tick this player's effects (a new round begins for them)
            p.effects = p.effects
              .map((e) => ({ ...e, roundsLeft: e.roundsLeft - 1 }))
              .filter((e) => e.roundsLeft > 0);
            break;
          }
          return { turnIndex: idx, round, players };
        }),

      resetAll: () =>
        set((s) => ({
          phase: "home",
          config: { ...DEFAULT_CONFIG },
          board: s.board, // mantém a pista editada entre partidas
          players: [],
          traps: [],
          order: [],
          turnIndex: 0,
          round: 1,
          cupomActive: false,
        })),

      addCoins: (id, n) =>
        set((s) => ({
          players: s.players.map((p) =>
            p.id === id ? { ...p, coins: Math.max(0, p.coins + n) } : p
          ),
        })),

      giveItem: (id, itemId) => {
        const s = get();
        const p = s.players.find((x) => x.id === id);
        if (!p) return false;
        if (p.items.length >= slotCap(p)) return false;
        set({
          players: s.players.map((x) =>
            x.id === id ? { ...x, items: [...x.items, itemId] } : x
          ),
        });
        return true;
      },

      removeItem: (id, itemId) =>
        set((s) => ({
          players: s.players.map((p) => {
            if (p.id !== id) return p;
            const i = p.items.indexOf(itemId);
            if (i === -1) return p;
            const items = [...p.items];
            items.splice(i, 1);
            return { ...p, items };
          }),
        })),

      buy: (id, productId, deliveryFee) => {
        const s = get();
        const prod = productById(productId);
        const p = s.players.find((x) => x.id === id);
        if (!prod || !p) return false;
        let price = prod.price;
        if (s.cupomActive) price = Math.max(1, Math.ceil(price / 2)); // cupom: metade do preço
        if (deliveryFee) price += 2;
        if (p.coins < price) return false;
        // enforce slot limit for carryable items
        if (prod.carryable && p.items.length >= slotCap(p)) return false;

        set((state) => ({
          players: state.players.map((x) => {
            if (x.id !== id) return x;
            const patch: Partial<Player> = { coins: x.coins - price };
            if (prod.carryable) patch.items = [...x.items, prod.id];
            // slot adicional: +1 slot por 2 rodadas (efeito temporário)
            if (prod.id === "slot_extra")
              patch.effects = [
                ...x.effects.filter((e) => e.id !== "slot_extra"),
                { id: "slot_extra", label: "Slot +1", glyph: "📦", roundsLeft: 2 },
              ];
            return { ...x, ...patch };
          }),
          cupomActive: prod.id === "cupom" ? true : state.cupomActive,
        }));
        return true;
      },

      moveBy: (id, delta) => {
        const s = get();
        const size = s.board.length;
        const p = s.players.find((x) => x.id === id);
        if (!p) return { landedOn: "blank" as TileType, lapUp: false, lap: 0 };
        let raw = p.position + delta;
        let lap = p.lap;
        let lapUp = false;
        while (raw >= size) {
          raw -= size;
          lap += 1;
          lapUp = true;
        }
        while (raw < 0) {
          raw += size;
          lap = Math.max(0, lap - 1); // andou de ré cruzando a largada: -1 volta
        }
        const landedOn = tileTypeAt(s.board, raw).type;
        const finished = lap >= s.config.laps; // vitória: passou a largada nas voltas
        set({
          players: s.players.map((x) =>
            x.id === id
              ? {
                  ...x,
                  position: raw,
                  lap,
                  // casa de moeda credita +1 ao parar
                  coins: landedOn === "coin" ? x.coins + 1 : x.coins,
                  finished: x.finished || finished,
                }
              : x
          ),
        });
        return { landedOn, lapUp, lap };
      },

      // buraco: volta ao último buraco; se cruzar a largada de ré, -1 volta
      sendToHole: (id) =>
        set((s) => {
          const p = s.players.find((x) => x.id === id);
          if (!p) return {};
          const target = previousHole(s.board, p.position);
          const wrapped = target >= p.position; // buraco anterior está "à frente" => deu a volta pra trás
          const lap = wrapped ? Math.max(0, p.lap - 1) : p.lap;
          return {
            players: s.players.map((x) =>
              x.id === id ? { ...x, position: target, lap } : x
            ),
          };
        }),

      setPosition: (id, pos) =>
        set((s) => ({
          players: s.players.map((p) =>
            p.id === id ? { ...p, position: wrap(pos, s.board.length) } : p
          ),
        })),

      addEffect: (id, e) =>
        set((s) => ({
          players: s.players.map((p) =>
            p.id === id
              ? { ...p, effects: [...p.effects.filter((x) => x.id !== e.id), e] }
              : p
          ),
        })),

      removeEffect: (id, effectId) =>
        set((s) => ({
          players: s.players.map((p) =>
            p.id === id
              ? { ...p, effects: p.effects.filter((e) => e.id !== effectId) }
              : p
          ),
        })),

      addProtection: (id, prot) =>
        set((s) => ({
          players: s.players.map((p) =>
            p.id === id && !p.protections.includes(prot)
              ? { ...p, protections: [...p.protections, prot] }
              : p
          ),
        })),

      removeProtection: (id, prot) =>
        set((s) => ({
          players: s.players.map((p) =>
            p.id === id
              ? { ...p, protections: p.protections.filter((x) => x !== prot) }
              : p
          ),
        })),

      addSkip: (id, rounds) =>
        set((s) => ({
          players: s.players.map((p) =>
            p.id === id ? { ...p, skipTurns: p.skipTurns + rounds } : p
          ),
        })),

      toggleCupom: () => set((s) => ({ cupomActive: !s.cupomActive })),

      finishPlayer: (id) =>
        set((s) => ({
          players: s.players.map((p) =>
            p.id === id ? { ...p, finished: true } : p
          ),
        })),

      placeTrap: (tile, kind, owner) =>
        set((s) => ({ traps: [...s.traps.filter((t) => t.tile !== tile), { tile, kind, owner }] })),

      clearTrap: (tile) => set((s) => ({ traps: s.traps.filter((t) => t.tile !== tile) })),

      // gasta 1 escudo: casco verde primeiro; senão 1 casco vermelho do inventário
      consumeShield: (id) =>
        set((s) => ({
          players: s.players.map((p) => {
            if (p.id !== id) return p;
            if (p.protections.includes("greenshell"))
              return { ...p, protections: p.protections.filter((x) => x !== "greenshell") };
            const i = p.items.indexOf("redshell");
            if (i !== -1) {
              const items = [...p.items];
              items.splice(i, 1);
              return { ...p, items };
            }
            return p;
          }),
        })),

      useItem: (playerId, itemId, targetId) => {
        const s = get();
        const me = s.players.find((p) => p.id === playerId);
        if (!me || !me.items.includes(itemId)) return "Item indisponível.";
        const consume = () => get().removeItem(playerId, itemId);
        const size = s.board.length;

        switch (itemId) {
          case "mushroom":
          case "cog_vermelho":
            consume();
            get().moveBy(playerId, 1);
            return "🍄 Pulou 1 casa à frente.";

          case "cog_dourado":
            consume();
            get().addEffect(playerId, { id: "golden", label: "Dourado x2", glyph: "🌟", roundsLeft: 1 });
            return "🌟 Próximo dado vale em dobro (aplique antes de lançar).";

          case "redshell": {
            consume();
            // alvo = jogador imediatamente à frente na pista
            const others = s.players.filter((p) => p.id !== playerId && !p.finished);
            let target = others.find((p) => p.id === targetId);
            if (!target) {
              let best: Player | null = null;
              let bestGap = Infinity;
              for (const o of others) {
                const gap = ((o.position - me.position) % size + size) % size || size;
                if (gap < bestGap) { bestGap = gap; best = o; }
              }
              target = best ?? undefined;
            }
            if (!target) return "🔴 Ninguém à frente pra atingir.";
            if (shieldBlocks(target, "redshell")) return `🔴 ${target.name} estava invencível!`;
            if (hasShield(target)) {
              get().consumeShield(target.id);
              return `🛡️ ${target.name} bloqueou com um casco!`;
            }
            get().moveBy(target.id, -2);
            return `🔴 ${target.name} voltou 2 casas!`;
          }

          case "dado_invertido":
            consume();
            get().placeTrap(me.position, "dado_invertido", playerId);
            return "🔄 Dado invertido deixado na casa: quem cair joga o dado e volta esse tanto.";

          case "armadilha":
            consume();
            get().placeTrap(me.position, "armadilha", playerId);
            return "🪤 Armadilha plantada: quem cair ativa um neutralizador.";

          case "poca_oleo":
            consume();
            get().placeTrap(me.position, "poca_oleo", playerId);
            return "🛢️ Poça de óleo deixada nesta casa (quem cair volta 2 casas).";

          case "boo": {
            consume();
            const others = s.players.filter((p) => p.id !== playerId && !p.finished);
            if (others.length === 0) return "👻 Ninguém pra assombrar.";
            const nearest = (list: Player[]) =>
              [...list].sort(
                (a, b) =>
                  (((a.position - me.position) % size + size) % size || size) -
                  (((b.position - me.position) % size + size) % size || size)
              )[0];
            // próximo jogador com MAIS moedas que ele; se ninguém, o mais próximo
            const richer = others.filter((o) => o.coins > me.coins);
            const target = richer.length ? nearest(richer) : nearest(others);
            const stolen = target.items[0];
            set((st) => ({
              players: st.players.map((p) => {
                if (p.id === me.id) {
                  const items = stolen && p.items.length < slotCap(p) ? [...p.items, stolen] : p.items;
                  return { ...p, items, coins: target.coins };
                }
                if (p.id === target.id) {
                  const items = stolen ? p.items.filter((_, i) => i !== 0) : p.items;
                  return { ...p, items, coins: me.coins };
                }
                return p;
              }),
            }));
            return `👻 Boo em ${target.name}: moedas trocadas${stolen ? " e 1 item roubado" : ""}.`;
          }

          case "casco_espinhoso": {
            consume();
            const leader = ranking(s.players.filter((p) => !p.finished))[0];
            if (!leader) return "🐚 Sem líder pra atingir.";
            if (leader.id === playerId) return "🐚 Você é o líder — não faz sentido.";
            if (shieldBlocks(leader, "spiny")) return `🐚 ${leader.name} estava invencível!`;
            const lost = Math.min(10, leader.coins);
            get().addSkip(leader.id, 1);
            get().addCoins(leader.id, -lost);
            return `🐚 ${leader.name} (líder) fica 1 rodada parado e perde ${lost} moedas!`;
          }

          case "raio":
            consume();
            s.players.forEach((p) => {
              if (p.finished) return;
              if (p.effects.some((e) => e.id === "star")) return;
              const rounds = p.id === playerId ? 1 : 3; // lançador fica lento só na 1ª rodada
              get().addEffect(p.id, { id: "lightning", label: "Raio", glyph: "⚡", roundsLeft: rounds });
            });
            return "⚡ Todos lentos pela metade por 3 rodadas (você só na 1ª)!";

          case "dado_duplo":
            consume();
            return "🎲🎲 Lance o dado 2× e some os resultados no 'Andar'.";
          case "dado_triplo":
            consume();
            return "🎲🎲🎲 Lance o dado 3× e some os resultados no 'Andar'.";

          default:
            consume();
            return "Item usado.";
        }
      },
    })),
    {
      name: "turbo-toad-game",
      version: 1,
      partialize: (s) => pickSync(s) as unknown as GameState,
    }
  )
);

/** helpers derived from state */
export function orderedPlayers(state: GameState): Player[] {
  return state.order
    .map((id) => state.players.find((p) => p.id === id))
    .filter((p): p is Player => !!p);
}

/** capacidade de slots: 1 + slot adicional temporário (2 rodadas) */
export function slotCap(p: Player): number {
  return 1 + (p.effects.some((e) => e.id === "slot_extra") ? 1 : 0);
}

/** ranking: laps desc, then position desc */
export function ranking(players: Player[]): Player[] {
  return [...players].sort(
    (a, b) => b.lap - a.lap || b.position - a.position || b.coins - a.coins
  );
}
