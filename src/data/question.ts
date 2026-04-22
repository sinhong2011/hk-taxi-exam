import type { Topic } from "./topics";

// Shared question shape for mock-mode banks (partABank, roadCodeBank, sampleBank).
// Mirrors StaticQuestion in quizBank.ts but lives in its own module so Mock.tsx
// and the banks can import it without pulling in the entire static bank file.
export type MockQuestion = {
  id: string;
  kind: string;
  question: string;
  options: string[];
  correct: number; // index into options
  explain?: string;
  topic: Topic;
  // Optional image rendered above the question text. Path is relative to the
  // site root (served from public/), e.g. "/signs/109a5.gif". Only a handful of
  // Part B roadcode questions use this; most questions are text-only.
  imageSrc?: string;
  // 繁體 alt text for the image — also the fallback shown if the image fails
  // to load. Required when imageSrc is set so screen readers / broken-image
  // scenarios still convey the sign meaning.
  imageAlt?: string;
};
