// Part B generator for mock mode.
// Seeded from the 20 existing `rc:*` entries in quizBank.ts. Hand-author
// more into quizBank.ts (as roadcode-tagged StaticQuestion entries) to grow
// this bank. If the bank is smaller than the requested size, buildPartBMock
// returns everything available with capped=true so the StartScreen / runner
// can surface a warning.

import type { MockQuestion } from "./question";
import { regChoices } from "./quizBank";
import { shuffle } from "../lib/quiz-helpers";

// All roadcode-tagged static entries, cloned so downstream mutation doesn't
// bleed into the source bank.
export function getRoadCodeBank(): MockQuestion[] {
  return regChoices
    .filter((q) => q.topic === "roadcode")
    .map((q) => ({ ...q }));
}

export type PartBDraw = {
  questions: MockQuestion[];
  capped: boolean;
};

// Build one Part B draw. Default target is 35 per exam spec. If the bank
// is smaller, returns everything available with capped=true.
export function buildPartBMock(size = 35): PartBDraw {
  const bank = shuffle(getRoadCodeBank());
  const capped = bank.length < size;
  const take = Math.min(bank.length, size);
  return {
    questions: bank.slice(0, take),
    capped,
  };
}

// For StartScreen's "is the bank big enough?" check.
export function getRoadCodeBankSize(): number {
  return regChoices.filter((q) => q.topic === "roadcode").length;
}
