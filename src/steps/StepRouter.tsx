import type { StepId } from "../quiz/types";
import { DOME_STEPS } from "../quiz/flow";
import { useQuiz } from "../quiz/QuizProvider";
import { ProgressDome } from "../components/ProgressDome";
import { GenderStep } from "./GenderStep";
import {
  Q3Step,
  Q4Step,
  Q5Step,
  Q6Step,
  Q7Step,
  Q8Step,
  Q9Step,
  Q10Step,
  Q11Step,
  Q12Step,
  Q13Step,
  Q14Step,
} from "./QuestionSteps";
import { Q15Step, Q16Step, Q17Step, Q18Step, Q18aStep, Q19Step } from "./BirthSteps";
import {
  Q21Step,
  Q23Step,
  Q24Step,
  Q24aStep,
  Q24bStep,
  Q24cStep,
  Q25Step,
  Q26Step,
  Q27Step,
  DoneStep,
} from "./FinaleSteps";

function renderStep(step: StepId) {
  switch (step) {
    case "gender":
      return <GenderStep />;
    case "q3":
      return <Q3Step />;
    case "q4":
      return <Q4Step />;
    case "q5":
      return <Q5Step />;
    case "q6":
      return <Q6Step />;
    case "q7":
      return <Q7Step />;
    case "q8":
      return <Q8Step />;
    case "q9":
      return <Q9Step />;
    case "q10":
      return <Q10Step />;
    case "q11":
      return <Q11Step />;
    case "q12":
      return <Q12Step />;
    case "q13":
      return <Q13Step />;
    case "q14":
      return <Q14Step />;
    case "q15":
      return <Q15Step />;
    case "q16":
      return <Q16Step />;
    case "q17":
      return <Q17Step />;
    case "q18":
      return <Q18Step />;
    case "q18a":
      return <Q18aStep />;
    case "q19":
      return <Q19Step />;
    case "q21":
      return <Q21Step />;
    case "q23":
      return <Q23Step />;
    case "q24":
      return <Q24Step />;
    case "q24a":
      return <Q24aStep />;
    case "q24b":
      return <Q24bStep />;
    case "q24c":
      return <Q24cStep />;
    case "q25":
      return <Q25Step />;
    case "q26":
      return <Q26Step />;
    case "q27":
      return <Q27Step />;
    case "done":
      return <DoneStep />;
    default:
      return <GenderStep />;
  }
}

export function StepRouter() {
  const { step } = useQuiz();
  const showDome = DOME_STEPS.has(step);
  return (
    <div className={`step-stage${showDome ? " with-dome" : ""}`}>
      {renderStep(step)}
      {showDome ? (
        <div className="progress-dome-dock">
          <ProgressDome />
        </div>
      ) : null}
    </div>
  );
}
