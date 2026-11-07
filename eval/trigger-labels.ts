/**
 * Labelled prompts for the trigger classifier evaluation.
 *
 * The labels are the author's judgment, not a human-annotated benchmark. They
 * are reported as a sanity check on the rule set, not as a validated measure.
 * The set deliberately includes borderline cases: a comparison of two files,
 * a database schema design, and a short creative request.
 */

export interface TriggerLabel {
  text: string;
  expected: boolean;
  note?: string;
}

export const TRIGGER_LABELS: TriggerLabel[] = [
  { text: "Brainstorm 10 ideas for a subscription service for busy parents.", expected: true },
  { text: "What should we build next for our developer tool?", expected: true },
  { text: "How might we make onboarding less annoying?", expected: true },
  { text: "Research the literature on retrieval augmented generation for scientific ideation.", expected: true },
  { text: "Compare Postgres and SQLite for an offline-first app.", expected: true },
  { text: "Give me some names for a coffee shop that also repairs bikes.", expected: true },
  { text: "Design a strategy for entering the Japanese market.", expected: true },
  { text: "Write a launch post for our new API.", expected: true },
  { text: "What are some unconventional ways to reduce food waste in cities?", expected: true },
  { text: "Propose a research agenda for evaluating AI creativity.", expected: true },
  { text: "Write a poem about the sea.", expected: true },
  { text: "Ideate on a cheaper way to ship lithium batteries.", expected: true },
  { text: "Suggest three positioning angles for a water-testing kit.", expected: true },
  { text: "What are the trade-offs between a marketplace and a subscription model?", expected: true },
  { text: "Help me think through which market to enter first.", expected: true },
  { text: "Draft a content calendar for a developer newsletter.", expected: true },
  { text: "Propose a few ways to make remote retrospectives less painful.", expected: true },
  { text: "Which of these two pricing models would you pick, and why?", expected: true },
  { text: "Explore directions for a research paper on idea diversity.", expected: true },
  { text: "Invent a new onboarding flow for a note-taking app.", expected: true },
  { text: "What is a good name for a low-cost water-testing kit?", expected: true },

  { text: "Fix the failing test in auth.test.ts", expected: false },
  { text: "Rename this function to parseConfig", expected: false },
  { text: "Run npm test and tell me what failed", expected: false },
  { text: "What is the capital of France?", expected: false },
  { text: "How do I install Postgres on Ubuntu?", expected: false },
  { text: "Refactor src/lib/db.ts to use a connection pool", expected: false },
  { text: "Explain this stack trace", expected: false },
  { text: "Add a migration for the new column", expected: false },
  { text: "Update the README badge", expected: false },
  { text: "git status", expected: false },
  { text: "What does this error mean? TypeError: cannot read property 'id' of undefined", expected: false },
  { text: "Summarize this article", expected: false },
  { text: "Lint the changed files", expected: false },
  { text: "Compare these two files.", expected: false },
  { text: "Design a database schema with a users table.", expected: false },
  { text: "thanks", expected: false },
  { text: "Show me the diff for the last commit", expected: false },
  { text: "Why does this test fail on CI but pass locally?", expected: false },
  { text: "Add a loading spinner to the settings page", expected: false },
  { text: "What version of Node does this project use?", expected: false },
  { text: "Delete the old migration files", expected: false },
];
