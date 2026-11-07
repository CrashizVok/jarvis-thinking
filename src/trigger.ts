/**
 * Explicit, testable trigger classifier.
 *
 * The classifier is a weighted rule list, not a model call. It is deliberately
 * inspectable: every decision carries the rule IDs that moved the score, so a
 * user can see why the pipeline ran or did not run. The rule set is tuned for
 * the distinction the plugin cares about: open-ended work where many valid
 * answers exist, versus mechanical work with one checkable answer.
 */

import type { JarvisConfig } from "./config.ts";

export type TriggerMode = "auto" | "force" | "off";

export interface TriggerRule {
  id: string;
  /** Positive weights trigger, negative weights suppress. */
  weight: number;
  pattern: RegExp;
  /** Human-readable description used by the status command and docs. */
  note: string;
}

export interface TriggerDecision {
  trigger: boolean;
  score: number;
  threshold: number;
  mode: TriggerMode;
  reason: string;
  matched: Array<{ id: string; weight: number }>;
}

const RULES: TriggerRule[] = [
  // Divergent work.
  { id: "ideation-verb", weight: 3, pattern: /\b(brainstorm|brainstorming|ideate|ideation|invent|conceive|devise)\b/i, note: "explicit ideation verb" },
  { id: "idea-request", weight: 2.5, pattern: /\b(give me|come up with|suggest|propose|generate|list|need|want)\b[^.!?\n]{0,50}\b(ideas?|concepts?|names?|options?|directions?|angles?|approaches?|alternatives?)\b/i, note: "asks for a list of candidates" },
  { id: "what-are-some", weight: 2.5, pattern: /\bwhat are some\b/i, note: "asks for a set of examples" },
  { id: "what-should", weight: 3, pattern: /\bwhat should (i|we|you) (build|make|do|create|write|design|pursue|try|focus)\b/i, note: "asks for a direction" },
  { id: "how-might", weight: 2.5, pattern: /\bhow (might|could|can) (we|i|you)\b/i, note: "opens a solution space" },
  { id: "design", weight: 2.5, pattern: /\b(design|architect|plan|strategy|strategies|roadmap|vision|positioning|go-to-market)\b/i, note: "design or strategy work" },
  { id: "content-creation", weight: 3, pattern: /\b(write|draft|compose|outline)\b[^.!?\n]{0,40}\b(post|article|essay|speech|story|poem|song|lyrics|copy|script|newsletter|launch)\b/i, note: "open-ended content" },
  { id: "future", weight: 1.5, pattern: /\b(future of|new product|startup|business idea|feature idea|campaign|content idea|brand)\b/i, note: "forward-looking product or market language" },
  { id: "novelty-cue", weight: 1.5, pattern: /\b(novel|original|creative|unconventional|surprising|different|outside the box|blue ocean|non-obvious|contrarian)\b/i, note: "asks for novelty" },

  // Research work.
  { id: "research", weight: 3, pattern: /\b(research|investigate|literature review|state of the art|sota|survey|deep dive|find (papers|sources|evidence)|what do we know|evidence base)\b/i, note: "asks for research" },
  { id: "compare", weight: 2.5, pattern: /\b(compare|comparison|versus|vs\.?|trade-?offs?|alternatives)\b/i, note: "asks for a comparison" },
  { id: "open-question", weight: 1, pattern: /^(what|how|why|which|should|where|when)\b[\s\S]*\?$/i, note: "open-ended question form" },
  { id: "long-prompt", weight: 0.5, pattern: /^[\s\S]{200,}$/, note: "long prompt with room for context" },

  // Mechanical work.
  { id: "mechanical-verb", weight: -2, pattern: /\b(fix|debug|rename|refactor|revert|rebase|commit|push|pull|install|uninstall|lint|format|compile|deploy|upgrade|downgrade|delete|remove|move|copy|patch)\b/i, note: "mechanical edit" },
  { id: "error-context", weight: -3, pattern: /\b(error|exception|stack trace|traceback|failing test|test failure|type error|undefined is not|segfault|panic:|exit code|crash)\b/i, note: "debugging context" },
  { id: "code-context", weight: -2, pattern: /```|\b\w+\.(ts|tsx|js|jsx|py|cs|go|rs|java|kt|rb|php|json|ya?ml|toml|sql|sh|css|html)\b/i, note: "contains code or a file name" },
  { id: "file-path", weight: -1.5, pattern: /(?:^|\s)(?:\.\/|\/)?[\w.-]+\/[\w./-]+/, note: "points at a path" },
  { id: "command-context", weight: -3, pattern: /^\s*(git|npm|pnpm|yarn|dotnet|docker|kubectl|curl|bash|sh|cd|ls|grep|rg|find|sed|awk|python|node|make)\b/i, note: "starts with a shell command" },
  { id: "this-artifact", weight: -1.5, pattern: /\b(this|the|these) (file|function|test|class|line|error|stack|repo|codebase|diff|commit|migration|article|document|snippet)\b/i, note: "refers to a concrete artifact" },
  { id: "compare-artifact", weight: -3, pattern: /\b(compare|diff)\s+(these|the following|both)\b[^.!?\n]{0,30}\b(files?|functions?|snippets?|versions?|branches?)\b/i, note: "compare two concrete artifacts" },
  { id: "quick", weight: -1, pattern: /\b(quick|just|simply|one-line|typo|small change)\b/i, note: "asks for a small change" },
  { id: "how-do-i", weight: -2, pattern: /\bhow do i (install|run|fix|configure|set up|use)\b/i, note: "procedural how-to" },
  { id: "schema", weight: -1.5, pattern: /\b(schema|migration|endpoint|api contract|unit test|integration test)\b/i, note: "implementation detail" },
];

function compileExtra(patterns: string[], weight: number, idPrefix: string): TriggerRule[] {
  const rules: TriggerRule[] = [];
  for (let i = 0; i < patterns.length; i++) {
    try {
      rules.push({
        id: `${idPrefix}-${i + 1}`,
        weight,
        pattern: new RegExp(patterns[i]!, "i"),
        note: `user pattern ${i + 1}`,
      });
    } catch {
      // An invalid user regex must not break prompt admission.
    }
  }
  return rules;
}

export function rulesFor(config: JarvisConfig): TriggerRule[] {
  return [
    ...RULES,
    ...compileExtra(config.extraTriggerPatterns, 3, "extra-trigger"),
    ...compileExtra(config.extraNegativePatterns, -3, "extra-negative"),
  ];
}

/**
 * Classify a prompt.
 *
 * force and off short-circuit the rules. Everything else is the weighted sum.
 * A prompt with no positive signal never triggers, even if every negative rule
 * misses, because the threshold is above zero.
 */
export function classifyPrompt(
  text: string,
  config: JarvisConfig,
  mode: TriggerMode = "auto",
): TriggerDecision {
  const clean = String(text ?? "").replace(/\r\n/g, "\n");
  if (mode === "force") {
    return {
      trigger: true,
      score: Number.POSITIVE_INFINITY,
      threshold: config.triggerThreshold,
      mode,
      reason: "forced by command or session mode",
      matched: [],
    };
  }
  if (mode === "off") {
    return {
      trigger: false,
      score: 0,
      threshold: config.triggerThreshold,
      mode,
      reason: "disabled for this session or by configuration",
      matched: [],
    };
  }
  if (!config.enabled || !config.autoTrigger) {
    return {
      trigger: false,
      score: 0,
      threshold: config.triggerThreshold,
      mode,
      reason: config.enabled ? "auto-trigger disabled" : "plugin disabled",
      matched: [],
    };
  }

  let score = 0;
  const matched: Array<{ id: string; weight: number }> = [];
  for (const rule of rulesFor(config)) {
    if (rule.pattern.test(clean)) {
      score += rule.weight;
      matched.push({ id: rule.id, weight: rule.weight });
    }
  }

  const trigger = score >= config.triggerThreshold;
  const positive = matched.filter((m) => m.weight > 0).map((m) => m.id);
  const negative = matched.filter((m) => m.weight < 0).map((m) => m.id);
  const reason = trigger
    ? `open-ended signals: ${positive.join(", ") || "none"}`
    : positive.length
      ? `below threshold (${score.toFixed(1)} < ${config.triggerThreshold}); suppressed by: ${negative.join(", ") || "nothing"}`
      : "no open-ended signal";

  return {
    trigger,
    score,
    threshold: config.triggerThreshold,
    mode,
    reason,
    matched,
  };
}

/** Exposed for docs and tests. */
export const TRIGGER_RULES = RULES;
