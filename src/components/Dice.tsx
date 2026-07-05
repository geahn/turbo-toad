import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DiceKind, POWER_FACES, NEUTRAL_FACES, DiceFace } from "../data/items";

const PIP_LAYOUT: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

function Pips({ value }: { value: number }) {
  const cells = Array.from({ length: 9 }, (_, idx) => {
    const r = Math.floor(idx / 3);
    const c = idx % 3;
    const on = (PIP_LAYOUT[value] ?? []).some(([pr, pc]) => pr === r && pc === c);
    return <span key={idx} className="pip" style={{ opacity: on ? 1 : 0 }} />;
  });
  return <div className="dice-pips">{cells}</div>;
}

function faceContent(kind: DiceKind, value: number) {
  if (kind === "number") return <Pips value={value} />;
  const face: DiceFace | undefined =
    kind === "power"
      ? POWER_FACES.find((f) => f.face === value)
      : NEUTRAL_FACES.find((f) => f.face === value);
  return <span className="dice-icon">{face?.glyph ?? "❓"}</span>;
}

export function Dice({
  kind,
  onResult,
  disabled,
  label,
}: {
  kind: DiceKind;
  onResult?: (value: number) => void;
  disabled?: boolean;
  label?: string;
}) {
  const [value, setValue] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const timer = useRef<number | null>(null);

  const faceClass =
    kind === "power" ? "dice-face dice-face--power" : kind === "neutral" ? "dice-face dice-face--neut" : "dice-face";

  const roll = () => {
    if (rolling || disabled) return;
    setRolling(true);
    if (navigator.vibrate) navigator.vibrate(30);
    let ticks = 0;
    const shuffle = () => {
      setValue(1 + Math.floor(Math.random() * 6));
      ticks += 1;
      if (ticks < 12) {
        timer.current = window.setTimeout(shuffle, 60 + ticks * 8);
      } else {
        const final = 1 + Math.floor(Math.random() * 6);
        setValue(final);
        setRolling(false);
        if (navigator.vibrate) navigator.vibrate([0, 40, 30, 60]);
        onResult?.(final);
      }
    };
    shuffle();
  };

  const currentFace: DiceFace | undefined =
    value == null
      ? undefined
      : kind === "power"
        ? POWER_FACES.find((f) => f.face === value)
        : kind === "neutral"
          ? NEUTRAL_FACES.find((f) => f.face === value)
          : undefined;

  return (
    <div className="col" style={{ alignItems: "center", gap: 14 }}>
      {label && (
        <div className="label" style={{ color: "var(--ink)", textShadow: "none", opacity: 0.75 }}>
          {label}
        </div>
      )}
      <motion.button
        className={faceClass}
        onClick={roll}
        disabled={disabled}
        aria-label="Lançar dado"
        animate={rolling ? { rotate: [0, -8, 8, -6, 6, 0], scale: [1, 1.06, 1] } : { rotate: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        whileTap={{ scale: 0.94 }}
      >
        <AnimatePresence mode="popLayout">
          <motion.div
            key={value ?? "empty"}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.12 }}
          >
            {value == null ? <span className="dice-icon">🎲</span> : faceContent(kind, value)}
          </motion.div>
        </AnimatePresence>
      </motion.button>

      {currentFace && !rolling && (
        <motion.div
          className="panel"
          style={{ padding: 12, textAlign: "center", background: "#fff" }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div style={{ fontFamily: "var(--display)", fontSize: "1.2rem" }}>
            {currentFace.glyph} {currentFace.name}
          </div>
          <div className="tiny muted">{currentFace.desc}</div>
        </motion.div>
      )}

      <button className="btn btn--gold btn--sm" onClick={roll} disabled={disabled || rolling}>
        {rolling ? "Rolando…" : value == null ? "🎲 Lançar" : "🔄 De novo"}
      </button>
    </div>
  );
}
