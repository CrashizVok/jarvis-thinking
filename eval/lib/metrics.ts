/**
 * Metrics for the evaluation harness.
 *
 * All distances are cosine distances on embedding vectors: 1 - cosine.
 * Diversity is the mean pairwise distance within a run.
 * Novelty is the distance from an idea to the nearest idea in the consensus
 * pool. Duplicate rate is the fraction of ideas the plugin's own dedup would
 * drop against the earlier ideas in the same run.
 */

import { deduplicate, type IdeaCandidate } from "../../src/ideas/dedup.ts";
import { numericCosine } from "../../src/similarity/text.ts";

export interface Valued {
  task: string;
  value: number;
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function sd(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = values.reduce((sum, value) => sum + (value - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function pairwiseDistances(vectors: number[][]): number[] {
  const distances: number[] = [];
  for (let i = 0; i < vectors.length; i++) {
    for (let j = i + 1; j < vectors.length; j++) {
      distances.push(1 - numericCosine(vectors[i]!, vectors[j]!));
    }
  }
  return distances;
}

export function diversity(vectors: number[][]): number {
  const distances = pairwiseDistances(vectors);
  return distances.length ? mean(distances) : 0;
}

/**
 * Eigenvalues of a symmetric matrix by cyclic Jacobi rotations.
 * The matrices here are at most a few dozen rows, so the O(n^3) cost is fine.
 */
function symmetricEigenvalues(matrix: number[][]): number[] {
  const n = matrix.length;
  const a = matrix.map((row) => [...row]);
  for (let sweep = 0; sweep < 50; sweep++) {
    let offDiagonal = 0;
    for (let p = 0; p < n; p++) {
      for (let q = p + 1; q < n; q++) offDiagonal += a[p]![q]! ** 2;
    }
    if (offDiagonal < 1e-12) break;
    for (let p = 0; p < n; p++) {
      for (let q = p + 1; q < n; q++) {
        const apq = a[p]![q]!;
        if (Math.abs(apq) < 1e-15) continue;
        const theta = (a[q]![q]! - a[p]![p]!) / (2 * apq);
        const t =
          (theta >= 0 ? 1 : -1) /
          (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const c = 1 / Math.sqrt(t * t + 1);
        const s = t * c;
        for (let k = 0; k < n; k++) {
          const akp = a[k]![p]!;
          const akq = a[k]![q]!;
          a[k]![p] = c * akp - s * akq;
          a[k]![q] = s * akp + c * akq;
        }
        for (let k = 0; k < n; k++) {
          const apk = a[p]![k]!;
          const aqk = a[q]![k]!;
          a[p]![k] = c * apk - s * aqk;
          a[q]![k] = s * apk + c * aqk;
        }
      }
    }
  }
  return a.map((row, i) => row[i]!);
}

/**
 * Vendi Score: the exponential of the Shannon entropy of the normalized
 * eigenvalues of the cosine similarity matrix. 1 means all items are
 * identical; N means all items are dissimilar.
 */
export function vendiScore(vectors: number[][]): number {
  const n = vectors.length;
  if (n === 0) return 0;
  if (n === 1) return 1;
  const matrix: number[][] = [];
  for (let i = 0; i < n; i++) {
    matrix.push([]);
    for (let j = 0; j < n; j++) {
      matrix[i]!.push(numericCosine(vectors[i]!, vectors[j]!));
    }
  }
  const raw = symmetricEigenvalues(matrix).map((value) => Math.max(0, value));
  const total = raw.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return 1;
  let entropy = 0;
  for (const value of raw) {
    const p = value / total;
    if (p > 0) entropy -= p * Math.log(p);
  }
  return Math.exp(entropy);
}

export function novelty(idea: number[], consensus: number[][]): number {
  if (consensus.length === 0) return 1;
  let best = 0;
  for (const other of consensus) {
    const similarity = numericCosine(idea, other);
    if (similarity > best) best = similarity;
  }
  return 1 - best;
}

export async function duplicateRate(
  ideas: IdeaCandidate[],
  threshold: number,
): Promise<{ rate: number; kept: number; dropped: number }> {
  if (ideas.length === 0) return { rate: 0, kept: 0, dropped: 0 };
  const result = await deduplicate(ideas, { threshold });
  return {
    rate: result.dropped.length / ideas.length,
    kept: result.kept.length,
    dropped: result.dropped.length,
  };
}

export function bootstrapCI(values: number[], iterations = 10_000): [number, number] {
  if (values.length === 0) return [0, 0];
  const estimates: number[] = [];
  for (let i = 0; i < iterations; i++) {
    let sum = 0;
    for (let j = 0; j < values.length; j++) sum += values[Math.floor(Math.random() * values.length)]!;
    estimates.push(sum / values.length);
  }
  estimates.sort((a, b) => a - b);
  const low = estimates[Math.floor(0.025 * iterations)]!;
  const high = estimates[Math.floor(0.975 * iterations)]!;
  return [low, high];
}

export function cohensD(a: number[], b: number[]): number {
  if (a.length < 2 || b.length < 2) return 0;
  const pooled = Math.sqrt((sd(a) ** 2 + sd(b) ** 2) / 2);
  if (pooled === 0) return 0;
  return (mean(a) - mean(b)) / pooled;
}

/**
 * Two-sided permutation test for a difference in means, stratified by task.
 * Labels are shuffled within each task, so the task mix cannot explain the
 * difference.
 */
export function stratifiedPermutation(a: Valued[], b: Valued[], iterations = 10_000): number {
  const tasks = [...new Set([...a, ...b].map((item) => item.task))];
  const observed = mean(a.map((item) => item.value)) - mean(b.map((item) => item.value));
  let extreme = 0;
  for (let i = 0; i < iterations; i++) {
    let sumA = 0;
    let countA = 0;
    let sumB = 0;
    let countB = 0;
    for (const task of tasks) {
      const aValues = a.filter((item) => item.task === task).map((item) => item.value);
      const bValues = b.filter((item) => item.task === task).map((item) => item.value);
      const values = [...aValues, ...bValues];
      for (let j = values.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [values[j], values[k]] = [values[k]!, values[j]!];
      }
      for (let j = 0; j < values.length; j++) {
        if (j < aValues.length) {
          sumA += values[j]!;
          countA++;
        } else {
          sumB += values[j]!;
          countB++;
        }
      }
    }
    const diff = (countA ? sumA / countA : 0) - (countB ? sumB / countB : 0);
    if (Math.abs(diff) >= Math.abs(observed)) extreme++;
  }
  return (extreme + 1) / (iterations + 1);
}

export function pearson(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  const ma = mean(a.slice(0, n));
  const mb = mean(b.slice(0, n));
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i++) {
    num += (a[i]! - ma) * (b[i]! - mb);
    da += (a[i]! - ma) ** 2;
    db += (b[i]! - mb) ** 2;
  }
  if (da === 0 || db === 0) return 0;
  return num / Math.sqrt(da * db);
}
