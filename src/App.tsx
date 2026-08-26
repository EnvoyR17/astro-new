import { QuizProvider } from "./quiz/QuizProvider";
import { StepRouter } from "./steps/StepRouter";

export default function App() {
  return (
    <QuizProvider>
      <div className="app-shell">
        <StepRouter />
      </div>
    </QuizProvider>
  );
}
