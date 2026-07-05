import { characterById } from "../data/characters";

export function Avatar({
  characterId,
  size = "md",
}: {
  characterId: string;
  size?: "sm" | "md" | "lg";
}) {
  const c = characterById(characterId);
  const cls = size === "lg" ? "avatar avatar--lg" : size === "sm" ? "avatar avatar--sm" : "avatar";
  return (
    <div
      className={cls}
      style={{ background: `radial-gradient(circle at 35% 25%, ${c.color2}, ${c.color})` }}
      aria-label={c.name}
    >
      <span className="avatar__emoji">{c.emoji}</span>
    </div>
  );
}
