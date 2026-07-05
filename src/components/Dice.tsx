import { useRef, useState } from "react";
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

/** conteúdo de cada face do cubo (1..6) conforme o tipo de dado */
function FaceContent({ kind, face }: { kind: DiceKind; face: number }) {
  if (kind === "number") return <Pips value={face} />;
  const f: DiceFace | undefined =
    kind === "power" ? POWER_FACES.find((x) => x.face === face) : NEUTRAL_FACES.find((x) => x.face === face);
  return <span className="cube__glyph">{f?.glyph ?? "❓"}</span>;
}

// rotação (graus) que traz cada valor pra frente do cubo
const FACE_ROT: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  2: { x: -90, y: 0 },
  3: { x: 0, y: -90 },
  4: { x: 0, y: 90 },
  5: { x: 90, y: 0 },
  6: { x: 0, y: 180 },
};
const TILT = { x: -18, y: 16 }; // leve inclinação em repouso pra dar profundidade 3D

/** menor ângulo à frente de `current` que fica ≡ base (mod 360), + voltas extras */
function nextAngle(current: number, base: number, spins: number) {
  const delta = (((base - current) % 360) + 360) % 360;
  return current + delta + spins * 360;
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
  // orientação inicial "de canto" (mostra 3 faces) = ainda não rolado
  const rot = useRef({ x: -28, y: -32 });
  const [transform, setTransform] = useState(
    `translateZ(calc(var(--sz) / -2)) rotateX(-28deg) rotateY(-32deg)`
  );
  const timer = useRef<number | null>(null);

  const cubeClass =
    "cube" + (kind === "power" ? " cube--power" : kind === "neutral" ? " cube--neut" : "");

  const roll = () => {
    if (rolling || disabled) return;
    if (timer.current) window.clearTimeout(timer.current);
    const final = 1 + Math.floor(Math.random() * 6);
    const tx = nextAngle(rot.current.x, FACE_ROT[final].x + TILT.x, 3);
    const ty = nextAngle(rot.current.y, FACE_ROT[final].y + TILT.y, 4);
    rot.current = { x: tx, y: ty };
    setRolling(true);
    setValue(null);
    setTransform(`translateZ(calc(var(--sz) / -2)) rotateX(${tx}deg) rotateY(${ty}deg)`);
    if (navigator.vibrate) navigator.vibrate(35);
    timer.current = window.setTimeout(() => {
      setRolling(false);
      setValue(final);
      if (navigator.vibrate) navigator.vibrate([0, 45, 35, 60]);
      onResult?.(final);
    }, 1150);
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

      <button
        className={"dice-scene" + (rolling ? " is-rolling" : "")}
        onClick={roll}
        disabled={disabled}
        aria-label="Lançar dado 3D"
      >
        <div className={cubeClass} style={{ transform }}>
          {[1, 2, 3, 4, 5, 6].map((f) => (
            <div key={f} className={`cube__face f${f}`}>
              <FaceContent kind={kind} face={f} />
            </div>
          ))}
        </div>
      </button>

      {currentFace && !rolling && (
        <div className="panel fade-enter" style={{ padding: 12, textAlign: "center", background: "#fff" }}>
          <div style={{ fontFamily: "var(--display)", fontSize: "1.2rem" }}>
            {currentFace.glyph} {currentFace.name}
          </div>
          <div className="tiny muted">{currentFace.desc}</div>
        </div>
      )}

      <button className="btn btn--gold btn--sm" onClick={roll} disabled={disabled || rolling}>
        {rolling ? "Rolando…" : value == null ? "🎲 Lançar" : "🔄 De novo"}
      </button>
    </div>
  );
}
