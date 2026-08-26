import { Nav } from "../components/Nav";
import { Chev } from "../components/Icons";
import { useQuiz } from "../quiz/QuizProvider";

type Entry = [string, string];

export function TextSelectStep({
  question,
  subtitle,
  entries,
  icons,
  onPick,
}: {
  question: string;
  subtitle?: string;
  entries: Entry[];
  icons: Record<string, string>;
  onPick: (key: string) => void;
}) {
  const { sel, pick } = useQuiz();

  return (
    <section className="page lilac">
      <div className="quiz-col">
        <Nav />
        <div className="mid">
          <div className="q-head">
            <h2 className="q">{question}</h2>
            {subtitle ? <p className="sub">{subtitle}</p> : null}
          </div>
          <div className="row-list">
            {entries.map(([k, label]) => {
              const on = sel === k;
              return (
                <button
                  key={k}
                  type="button"
                  className={`row tap ${on ? "on" : ""}`}
                  onClick={() => pick(k, () => onPick(k))}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                    {icons[k] ? <span className="ico">{icons[k]}</span> : null}
                    <span className="lbl">{label}</span>
                  </span>
                  <Chev color={on ? "#ffffff" : "#7f4cf2"} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export function PicSelectStep({
  question,
  options,
  imagePrefix,
  onPick,
}: {
  question: string;
  options: Record<string, { label: string }>;
  imagePrefix: string;
  onPick: (key: string) => void;
}) {
  const { sel, pick } = useQuiz();
  const keys = Object.keys(options);

  return (
    <section className="page lilac">
      <div className="quiz-col">
        <Nav />
        <div className="mid">
          <div className="q-head">
            <h2 className="q q-pic">{question}</h2>
          </div>
          <div className="pic-grid">
            {keys.map((k, i) => (
              <button
                key={k}
                type="button"
                className={`pic-card tap ${sel === k ? "on" : ""}`}
                onClick={() => pick(k, () => onPick(k))}
              >
                <img src={`/images/quiz/${imagePrefix}-${i + 1}.webp`} alt="" />
                <div className="g" />
                <span>{options[k].label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
