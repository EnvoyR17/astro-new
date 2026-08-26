import { STARS } from "../quiz/flow";

export function Stars() {
  return (
    <div className="qiStars">
      {STARS.map((e, i) => (
        <span
          key={i}
          className="qiStar"
          style={{
            top: `${e.top}%`,
            left: `${e.left}%`,
            width: e.size,
            height: e.size,
            ["--b" as string]: e.b,
            animationDelay: `${e.delay}s`,
            animationDuration: `${e.dur}s`,
            background: e.shine ? "#f1cf7c" : "#fffdf7",
            boxShadow: e.shine ? "0 0 4px rgba(241,207,124,.4)" : undefined,
          }}
        />
      ))}
    </div>
  );
}
