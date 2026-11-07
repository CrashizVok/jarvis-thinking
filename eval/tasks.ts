/**
 * Fixed evaluation tasks.
 *
 * Six domains, each open-ended, each with enough room for several defensible
 * answers. The set is small on purpose: every condition runs on every task, and
 * the report uses task-stratified statistics.
 */

export interface EvalTask {
  id: string;
  domain: "product" | "research" | "marketing" | "organizational" | "naming";
  prompt: string;
  /** A surprising and a negative keyword for the stimulus condition. */
  keywords: { surprising: string; negative: string };
  /** One extreme constraint for the stimulus condition. */
  extreme: string;
}

export const TASKS: EvalTask[] = [
  {
    id: "food-waste",
    domain: "product",
    prompt: "Propose product ideas that help urban households reduce food waste.",
    keywords: { surprising: "edible", negative: "wasteful" },
    extreme: "zero budget for the household",
  },
  {
    id: "ideation-research",
    domain: "research",
    prompt: "Propose research directions for making LLM ideation less homogeneous.",
    keywords: { surprising: "subterranean", negative: "outdated" },
    extreme: "one week of compute",
  },
  {
    id: "bike-share",
    domain: "marketing",
    prompt: "Propose campaign concepts for a city bike-share program that increase weekday commuting.",
    keywords: { surprising: "inflatable", negative: "crowded" },
    extreme: "no paid media",
  },
  {
    id: "notes-app",
    domain: "product",
    prompt: "Propose feature ideas for a note-taking app used by researchers.",
    keywords: { surprising: "analog", negative: "lonely" },
    extreme: "offline only",
  },
  {
    id: "remote-decisions",
    domain: "organizational",
    prompt: "Propose interventions that help remote teams make better decisions without more meetings.",
    keywords: { surprising: "reversible", negative: "slow" },
    extreme: "a ten-person team with no manager",
  },
  {
    id: "water-kit",
    domain: "naming",
    prompt: "Propose names and positioning angles for a low-cost water-testing kit for rural clinics.",
    keywords: { surprising: "nocturnal", negative: "fragile" },
    extreme: "one dollar per test",
  },
];

export function taskById(id: string): EvalTask | undefined {
  return TASKS.find((task) => task.id === id);
}
