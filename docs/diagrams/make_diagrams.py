#!/usr/bin/env python3
"""Draw the one data chart: measured means from the 2026 evaluation."""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from pathlib import Path

OUT = Path(__file__).parent / "eval-means.png"
INK, MUTED, LINE = "#0d1210", "#5c6661", "#c9d1cc"
TEAL, ORANGE, PAPER = "#0f766e", "#c2410c", "#eef1ef"

conditions = ["plain", "research", "consensus", "full"]
diversity = [0.634, 0.730, 0.672, 0.692]
novelty = [0.057, 0.553, 0.521, 0.596]
labels = ["Plain prompt", "Research only", "Consensus exclusion", "Full pipeline"]

plt.rcParams.update({
    "font.family": "DejaVu Sans", "font.size": 11,
    "axes.edgecolor": LINE, "axes.labelcolor": MUTED,
    "xtick.color": MUTED, "ytick.color": MUTED,
})
fig, axes = plt.subplots(1, 2, figsize=(11, 4.6), dpi=220, facecolor=PAPER)
fig.subplots_adjust(left=0.10, right=0.98, top=0.80, bottom=0.16, wspace=0.30)

for ax, values, title, note in [
    (axes[0], diversity, "Within-run diversity", "Higher means a wider pool"),
    (axes[1], novelty, "Cross-run novelty", "Higher means a different pool next time"),
]:
    ax.set_facecolor(PAPER)
    colors = [MUTED, TEAL, TEAL, ORANGE]
    bars = ax.barh(labels, values, color=colors, height=0.58)
    ax.invert_yaxis()
    ax.set_xlim(0, 0.85 if title.startswith("Within") else 0.70)
    ax.set_title(title, loc="left", fontsize=13, color=INK, pad=10)
    ax.text(0, 1.06, note, transform=ax.transAxes, fontsize=9.5, color=MUTED)
    ax.spines[["top", "right", "left"]].set_visible(False)
    ax.tick_params(axis="y", length=0, labelsize=10)
    ax.xaxis.grid(True, color=LINE, linewidth=0.6, alpha=0.7)
    ax.set_axisbelow(True)
    ax.set_xticks([0, 0.2, 0.4, 0.6, 0.8] if title.startswith("Within") else [0, 0.2, 0.4, 0.6])
    for bar, value in zip(bars, values):
        ax.text(value + 0.012, bar.get_y() + bar.get_height() / 2,
                f"{value:.3f}", va="center", fontsize=10, color=INK)

fig.text(0.10, 0.92, "Measured means, same six tasks", fontsize=17, color=INK, weight="bold")
fig.text(0.10, 0.875, "6 tasks, 3 repetitions, one cloud model. Usefulness stays flat at 3.25 against 3.38.",
         fontsize=10, color=MUTED)
fig.savefig(OUT, facecolor=PAPER)
print("wrote", OUT.name)
