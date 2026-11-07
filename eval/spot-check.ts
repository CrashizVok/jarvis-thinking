/**
 * Manual spot-check analysis.
 *
 * Reads the filled spot-check CSV and reports inter-rater agreement and the
 * correlation between each rater and the LLM judges. It does not decide
 * whether the judge is valid; it prints the numbers the protocol asks for.
 *
 * Usage:
 *   node --experimental-strip-types eval/spot-check.ts eval/raw/spot-check.csv
 */

import { readFile } from "node:fs/promises";
import { mean, pearson } from "./lib/metrics.ts";

interface Row {
  sample_id: string;
  judge1: number | null;
  judge2: number | null;
  humanUse1: number | null;
  humanUse2: number | null;
  humanNov1: number | null;
  humanNov2: number | null;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i]!;
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function num(value: string | undefined): number | null {
  if (value === undefined || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function quadraticKappa(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 0;
  const min = Math.min(...a, ...b);
  const max = Math.max(...a, ...b);
  const k = max - min + 1;
  const observed: number[][] = Array.from({ length: k }, () => Array(k).fill(0));
  for (let i = 0; i < n; i++) {
    observed[a[i]! - min]![b[i]! - min]!++;
  }
  const rowSums = observed.map((row) => row.reduce((sum, value) => sum + value, 0));
  const colSums = observed[0]!.map((_, j) => observed.reduce((sum, row) => sum + row[j]!, 0));
  let agreement = 0;
  let expected = 0;
  for (let i = 0; i < k; i++) {
    for (let j = 0; j < k; j++) {
      const weight = 1 - (i - j) ** 2 / (k - 1) ** 2;
      agreement += weight * observed[i]![j]!;
      expected += weight * ((rowSums[i]! * colSums[j]!) / n);
    }
  }
  if (n === expected) return 1;
  return (agreement - expected) / (n - expected);
}

async function main(): Promise<void> {
  const path = process.argv[2] ?? "eval/raw/spot-check.csv";
  const rows = parseCsv(await readFile(path, "utf8"));
  const header = rows[0] ?? [];
  const index = (name: string) => header.indexOf(name);
  const data: Row[] = rows.slice(1).map((cells) => ({
    sample_id: cells[index("sample_id")] ?? "",
    judge1: num(cells[index("judge1_usefulness")]),
    judge2: num(cells[index("judge2_usefulness")]),
    humanUse1: num(cells[index("human_usefulness_r1")]),
    humanUse2: num(cells[index("human_usefulness_r2")]),
    humanNov1: num(cells[index("human_novelty_r1")]),
    humanNov2: num(cells[index("human_novelty_r2")]),
  }));

  const complete = data.filter(
    (row) => row.humanUse1 !== null && row.humanUse2 !== null,
  );
  if (complete.length === 0) {
    console.log("No complete human usefulness ratings. Fill human_usefulness_r1 and human_usefulness_r2 first.");
    return;
  }

  const u1 = complete.map((row) => row.humanUse1!);
  const u2 = complete.map((row) => row.humanUse2!);
  const n1 = complete.map((row) => row.humanNov1).filter((value): value is number => value !== null);
  const n2 = complete.map((row) => row.humanNov2).filter((value): value is number => value !== null);
  const judgeMean = complete.map((row) => {
    const values = [row.judge1, row.judge2].filter((value): value is number => value !== null);
    return values.length ? mean(values) : 0;
  });
  const humanMean = u1.map((value, i) => (value + u2[i]!) / 2);

  console.log(`Complete rows: ${complete.length}`);
  console.log(`Human usefulness mean: ${mean(u1).toFixed(2)} (rater 1), ${mean(u2).toFixed(2)} (rater 2)`);
  console.log(`Human usefulness Pearson: ${pearson(u1, u2).toFixed(3)}`);
  console.log(`Human usefulness quadratic-weighted kappa: ${quadraticKappa(u1, u2).toFixed(3)}`);
  console.log(`Judge mean usefulness: ${mean(judgeMean).toFixed(2)}`);
  console.log(`Judge vs human mean Pearson: ${pearson(judgeMean, humanMean).toFixed(3)}`);
  console.log(
    `Mean absolute difference (judge vs human): ${mean(judgeMean.map((value, i) => Math.abs(value - humanMean[i]!))).toFixed(2)}`,
  );
  if (n1.length && n1.length === n2.length) {
    console.log(`Human novelty Pearson: ${pearson(n1, n2).toFixed(3)}`);
    console.log(`Human novelty quadratic-weighted kappa: ${quadraticKappa(n1, n2).toFixed(3)}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
