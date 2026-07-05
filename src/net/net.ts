import Peer, { DataConnection } from "peerjs";
import { create } from "zustand";
import { useGame, pickSync } from "../store/gameStore";
import { netBridge } from "./bridge";

export type Role = "local" | "host" | "client";
export type NetStatus = "idle" | "connecting" | "online" | "error";

interface Msg {
  type: "state" | "action" | "join" | "joined";
  [k: string]: unknown;
}

interface NetState {
  role: Role;
  code: string | null;
  status: NetStatus;
  error: string | null;
  myPlayerId: string | null;
  peerCount: number;
  setMyPlayerId: (id: string) => void;
  host: () => Promise<string>;
  join: (code: string, character: string, name: string) => Promise<void>;
  leave: () => void;
}

let peer: Peer | null = null;
let conns: DataConnection[] = []; // host: clients; client: [hostConn]
let unsub: (() => void) | null = null;

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const genCode = () =>
  Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");
const peerId = (code: string) => `turbotoad-${code.toUpperCase()}`;

function broadcast() {
  const snap = pickSync(useGame.getState());
  const msg: Msg = { type: "state", state: snap };
  conns.forEach((c) => c.open && c.send(msg));
}

function cleanup() {
  if (unsub) { unsub(); unsub = null; }
  conns.forEach((c) => { try { c.close(); } catch { /* noop */ } });
  conns = [];
  if (peer) { try { peer.destroy(); } catch { /* noop */ } peer = null; }
  netBridge.forward = () => false;
}

export const useNet = create<NetState>((set, get) => ({
  role: "local",
  code: null,
  status: "idle",
  error: null,
  myPlayerId: null,
  peerCount: 0,

  setMyPlayerId: (id) => set({ myPlayerId: id }),

  host: () =>
    new Promise<string>((resolve, reject) => {
      cleanup();
      const code = genCode();
      set({ status: "connecting", role: "host", code, error: null, myPlayerId: null });
      peer = new Peer(peerId(code));

      peer.on("open", () => {
        set({ status: "online" });
        // host aplica localmente e retransmite a cada mudança do jogo
        unsub = useGame.subscribe(() => broadcast());
        resolve(code);
      });

      peer.on("connection", (conn) => {
        conns.push(conn);
        set({ peerCount: conns.length });
        conn.on("open", () => conn.send({ type: "state", state: pickSync(useGame.getState()) } as Msg));
        conn.on("data", (raw) => {
          const msg = raw as Msg;
          const g = useGame.getState() as unknown as Record<string, (...a: unknown[]) => unknown>;
          if (msg.type === "action" && typeof msg.name === "string") {
            g[msg.name]?.(...((msg.args as unknown[]) ?? []));
          } else if (msg.type === "join") {
            useGame.getState().addPlayer(msg.character as string, msg.name as string);
            const players = useGame.getState().players;
            const np = players[players.length - 1];
            conn.send({ type: "joined", playerId: np.id } as Msg);
            broadcast();
          }
        });
        conn.on("close", () => {
          conns = conns.filter((c) => c !== conn);
          set({ peerCount: conns.length });
        });
      });

      peer.on("error", (e) => {
        set({ status: "error", error: e.message });
        reject(e);
      });
    }),

  join: (code, character, name) =>
    new Promise<void>((resolve, reject) => {
      cleanup();
      set({ status: "connecting", role: "client", code: code.toUpperCase(), error: null, myPlayerId: null });
      peer = new Peer();
      peer.on("open", () => {
        const conn = peer!.connect(peerId(code), { reliable: true });
        conns = [conn];
        conn.on("open", () => {
          set({ status: "online" });
          // no cliente, toda ação da store vai pro host
          netBridge.forward = (_name, _args) => {
            conn.send({ type: "action", name: _name, args: _args } as Msg);
            return true;
          };
          conn.send({ type: "join", character, name } as Msg);
          resolve();
        });
        conn.on("data", (raw) => {
          const msg = raw as Msg;
          if (msg.type === "state") {
            useGame.setState(msg.state as object);
          } else if (msg.type === "joined") {
            set({ myPlayerId: msg.playerId as string });
          }
        });
        conn.on("close", () => set({ status: "error", error: "Conexão encerrada" }));
      });
      peer.on("error", (e) => {
        set({ status: "error", error: e.message });
        reject(e);
      });
    }),

  leave: () => {
    cleanup();
    set({ role: "local", code: null, status: "idle", error: null, myPlayerId: null, peerCount: 0 });
  },
}));
