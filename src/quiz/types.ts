export type StepId =
  | "gender"
  | "q3"
  | "q4"
  | "q5"
  | "q6"
  | "q7"
  | "q8"
  | "q9"
  | "q10"
  | "q11"
  | "q12"
  | "q13"
  | "q14"
  | "q15"
  | "q16"
  | "q17"
  | "q18"
  | "q18a"
  | "q19"
  | "q21"
  | "q23"
  | "q24"
  | "q24a"
  | "q24b"
  | "q24c"
  | "q25"
  | "q26"
  | "q27"
  | "done";

export type QuizAnswers = {
  gender?: "female" | "male";
  q3?: string;
  interest?: string;
  goal?: string;
  help?: string;
  guide?: string;
  learn?: string;
  likert?: number;
  relIdx?: number;
  rel?: string;
  knowTime?: "yes" | "no";
  date?: string;
  time?: string;
  city?: string;
  name?: string;
  email?: string;
  price?: string;
  readerPatterns?: "yes" | "no";
  readerSense?: "yes" | "no";
  readerOpenUp?: "yes" | "no";
};

export type QuizState = {
  history: StepId[];
  answers: QuizAnswers;
  palmUrl: string | null;
  palmLandmarks: { x: number; y: number }[] | null;
  sel: string | number | null;
  datePick: { d: number; m: number; y: number };
  timePick: { h: number; min: number };
};
