/**
 * First-run footprint estimator. Rather than forcing a brand-new user to log
 * activities before they can *understand* anything, we ask a handful of
 * lifestyle questions and produce a directional annual estimate up front — the
 * onboarding pattern credible carbon apps (Joro, Commons) use.
 *
 * Each answer maps to a documented annual kg CO2e contribution drawn from
 * published per-capita lifestyle averages, deliberately simplified for a
 * five-question onboarding estimate (not an audited inventory — see the
 * Methodology note in the app). The maths is deterministic and unit-tested,
 * mirroring the main emissions engine.
 */

export type BaselineQuestionId =
  | "transport"
  | "diet"
  | "home"
  | "flights"
  | "shopping";

export interface BaselineOption {
  value: string;
  label: string;
  /** Estimated annual contribution of this choice, in kg CO2e. */
  annualKg: number;
}

export interface BaselineQuestion {
  id: BaselineQuestionId;
  prompt: string;
  options: BaselineOption[];
}

export const BASELINE_QUESTIONS: BaselineQuestion[] = [
  {
    id: "transport",
    prompt: "How do you usually get around?",
    options: [
      { value: "car", label: "Mostly by car", annualKg: 2500 },
      { value: "mixed", label: "Mix of car & transit", annualKg: 1500 },
      { value: "transit", label: "Mostly public transit", annualKg: 800 },
      { value: "active", label: "Walk, cycle, or WFH", annualKg: 200 },
    ],
  },
  {
    id: "diet",
    prompt: "Which best describes your diet?",
    options: [
      { value: "high_meat", label: "Meat with most meals", annualKg: 3300 },
      { value: "average", label: "Some meat", annualKg: 2500 },
      { value: "vegetarian", label: "Vegetarian", annualKg: 1700 },
      { value: "vegan", label: "Vegan", annualKg: 1500 },
    ],
  },
  {
    id: "home",
    prompt: "What's your home like?",
    options: [
      { value: "large", label: "Large house", annualKg: 3000 },
      { value: "average", label: "Average home / flat", annualKg: 1800 },
      { value: "small", label: "Small or efficient", annualKg: 1000 },
    ],
  },
  {
    id: "flights",
    prompt: "How often do you fly?",
    options: [
      { value: "none", label: "Rarely or never", annualKg: 0 },
      { value: "some", label: "1–2 short trips a year", annualKg: 500 },
      { value: "frequent", label: "Several flights a year", annualKg: 2500 },
    ],
  },
  {
    id: "shopping",
    prompt: "How much do you buy (clothes, gadgets…)?",
    options: [
      { value: "high", label: "Lots of new things", annualKg: 1500 },
      { value: "average", label: "About average", annualKg: 900 },
      { value: "low", label: "Little / second-hand", annualKg: 400 },
    ],
  },
];

export type BaselineAnswers = Partial<Record<BaselineQuestionId, string>>;

/**
 * Sums the selected options' annual contributions into an estimated annual
 * footprint in kg CO2e. Unanswered questions contribute 0.
 */
export function estimateAnnualKg(answers: BaselineAnswers): number {
  let total = 0;
  for (const question of BASELINE_QUESTIONS) {
    const chosen = answers[question.id];
    const option = question.options.find((o) => o.value === chosen);
    if (option) total += option.annualKg;
  }
  return total;
}

/** Estimated annual footprint in tonnes CO2e, rounded to one decimal. */
export function estimateAnnualTonnes(answers: BaselineAnswers): number {
  return Math.round((estimateAnnualKg(answers) / 1000) * 10) / 10;
}

/** True once every question has a selected answer. */
export function isComplete(answers: BaselineAnswers): boolean {
  return BASELINE_QUESTIONS.every((q) => Boolean(answers[q.id]));
}
