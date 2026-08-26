import { BackArrow, Logo } from "./Icons";
import { useQuiz } from "../quiz/QuizProvider";

export function Nav({ showBack = true }: { showBack?: boolean }) {
  const { history, back } = useQuiz();
  const canBack = showBack && history.length > 1;
  return (
    <nav className="nav">
      {canBack ? (
        <button type="button" className="nav-btn tap" aria-label="Назад" onClick={back}>
          <BackArrow />
        </button>
      ) : (
        <span style={{ width: 44 }} />
      )}
      <Logo />
      <span style={{ width: 44 }} />
    </nav>
  );
}
