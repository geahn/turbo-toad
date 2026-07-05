import { useState } from "react";
import { useGame } from "./store/gameStore";
import { useNet } from "./net/net";
import { Home } from "./screens/Home";
import { Setup } from "./screens/Setup";
import { Lobby } from "./screens/Lobby";
import { TurnOrder } from "./screens/TurnOrder";
import { Dashboard } from "./screens/Dashboard";
import { PlayerScreen } from "./screens/PlayerScreen";
import { Shop } from "./screens/Shop";
import { DiceOnly } from "./screens/DiceOnly";
import { Results } from "./screens/Results";

export type Route =
  | { name: "dashboard" }
  | { name: "player"; id: string }
  | { name: "shop"; id: string }
  | { name: "dice" };

export function App() {
  const phase = useGame((s) => s.phase);
  const mode = useGame((s) => s.config.mode);
  const role = useNet((s) => s.role);
  const [route, setRoute] = useState<Route>({ name: "dashboard" });

  const isClient = role === "client";
  let content: React.ReactNode = null;

  if (phase === "home") content = <Home />;
  else if (phase === "setup") content = isClient ? <Lobby /> : <Setup />;
  else if (phase === "order") content = <TurnOrder />;
  else if (phase === "finished" && mode === "full") content = <Results />;
  else if (phase === "playing" || phase === "finished") {
    if (mode === "dice") {
      content = <DiceOnly />;
    } else if (route.name === "player") {
      content = <PlayerScreen id={route.id} nav={setRoute} />;
    } else if (route.name === "shop") {
      content = <Shop id={route.id} nav={setRoute} />;
    } else if (route.name === "dice") {
      content = <DiceOnly onBack={() => setRoute({ name: "dashboard" })} />;
    } else {
      content = <Dashboard nav={setRoute} />;
    }
  }

  return (
    <div className="app">
      <div className="screen fade-enter">{content}</div>
    </div>
  );
}
