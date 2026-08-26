import { QUIZ_COPY } from "../quiz/copy";
import { useQuiz } from "../quiz/QuizProvider";
import { AccuracySealIcon, BackArrow, Chev, ClockIcon, Logo, MoonIcon, StarIntro } from "../components/Icons";
import { Constel } from "../components/Constel";
import { Stars } from "../components/Stars";

export function GenderStep() {
  const { sel, pick, setAnswer, go } = useQuiz();
  const s = QUIZ_COPY.step1;

  const choose = (k: "female" | "male") => {
    pick(k, () => {
      setAnswer("gender", k);
      go("q3");
    });
  };

  return (
    <section className="page intro">
      <Stars />
      <div className="qiCol">
        <nav className="nav qiIntroNav">
          <button type="button" className="nav-btn tap" aria-label="Назад" onClick={() => {}}>
            <BackArrow color="#c9b1ff" />
          </button>
          <Logo />
          <span style={{ width: 35, height: 35 }} aria-hidden />
        </nav>
        <div className="qiIntroTrust">
          <div className="qiIntroTrustInner">
            <div className="rating-pill">
              <span className="star-g">
                {[0, 1, 2, 3, 4].map((i) => (
                  <StarIntro key={i} />
                ))}
              </span>
              <span style={{ fontSize: 12, fontWeight: 400, lineHeight: "16px" }}>{s.rating}</span>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(245,242,255,.5)", display: "inline-block" }} />
              <span className="muted">{s.ratingBadge}</span>
            </div>
            <div className="qiIntroRated">
              <span className="muted">{s.ratedBy}</span>
              <span className="qiIntroAcc">
                <AccuracySealIcon />
                <span className="acc">{s.accuracy}</span>
              </span>
            </div>
          </div>
        </div>
        <div className="qiBand">
          <Constel />
        </div>
        <div className="qiIntroBottom">
          <div className="gender-prompt">
            {s.genderPrompt}
            <span style={{ display: "flex", flex: "0 0 auto" }}>
              <Chev color="#c9b1ff" className="" style={{ transform: "rotate(-90deg)" }} />
            </span>
          </div>
          <div className="gender-row" role="radiogroup" aria-label={s.genderPrompt}>
            {(["female", "male"] as const).map((k) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={sel === k}
                className={`qiGenderCard tap ${sel === k ? "on" : ""}`}
                onClick={() => choose(k)}
              >
                <span className="frame">
                  <img src={`/images/quiz/gender-${k}.webp`} alt="" />
                  <span className="shade" />
                  <span className="glabel">{s.options[k].label}</span>
                </span>
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <ClockIcon />
            <span className="muted">{s.quizTime}</span>
          </div>
        </div>
      </div>
      <div className="intro-foot">
        <span className="intro-foot-moon">
          <MoonIcon />
        </span>
        <span style={{ fontSize: 12, color: "#f5f2ff", lineHeight: "16px" }}>
          <b style={{ fontWeight: 600 }}>{s.testsCount}</b>{" "}
          <span className="muted">{s.testsLabel}</span>
        </span>
      </div>
    </section>
  );
}
