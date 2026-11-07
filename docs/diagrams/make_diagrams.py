"""Render the evaluation chart.

Run from the repository root: python3 docs/diagrams/make_diagrams.py
Values are the 2026 evaluation means copied from docs/results.md.
"""

from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib.patches import Patch

OUT = Path(__file__).parent
PAPER = "#f2f3ef"
INK = "#171a1c"
MUTED = "#6f7872"
TEAL = "#2c6e68"
RUST = "#b45309"
RULE = "#d5d8d1"

CONDITIONS = ["Plain prompt", "Research only", "Consensus exclusion", "Full pipeline"]
DIVERSITY = [0.634, 0.730, 0.672, 0.692]
NOVELTY = [0.057, 0.553, 0.521, 0.596]

plt.rcParams.update({
    "font.family": "Liberation Sans",
    "axes.edgecolor": RULE,
    "axes.labelcolor": INK,
    "text.color": INK,
    "xtick.color": MUTED,
    "ytick.color": MUTED,
    "figure.facecolor": PAPER,
    "axes.facecolor": PAPER,
})


def main():
    fig, ax = plt.subplots(figsize=(10, 5.6), facecolor=PAPER)
    fig.subplots_adjust(left=0.20, right=0.965, top=0.80, bottom=0.24)

    fig.text(0.055, 0.825,
             "Plain is the comparison point, so its distance is near zero by construction.",
             fontsize=9.5, color=MUTED)

    x = range(len(CONDITIONS))
    width = 0.34
    bars_a = ax.bar([i - width / 2 for i in x], DIVERSITY, width,
                    color=TEAL, edgecolor="none", label="Diversity inside a run")
    bars_b = ax.bar([i + width / 2 for i in x], NOVELTY, width,
                    color=RUST, edgecolor="none", label="Distance from the plain pool")

    for bars in (bars_a, bars_b):
        for bar in bars:
            value = bar.get_height()
            ax.text(bar.get_x() + bar.get_width() / 2, value + 0.018,
                    f"{value:.3f}", ha="center", va="bottom",
                    fontsize=10, color=INK)

    ax.set_xticks(list(x))
    ax.set_xticklabels(CONDITIONS, fontsize=11.5, color=INK)
    ax.set_ylim(0, 0.82)
    ax.set_yticks([0, 0.2, 0.4, 0.6, 0.8])
    ax.set_ylabel("Mean cosine distance", fontsize=10.5, color=MUTED, labelpad=10)
    ax.tick_params(axis="x", length=0, pad=10)
    ax.tick_params(axis="y", length=3, color=RULE)
    ax.grid(axis="y", color=RULE, linewidth=0.8, alpha=0.9)
    ax.set_axisbelow(True)
    for spine in ("top", "right", "left"):
        ax.spines[spine].set_visible(False)
    ax.spines["bottom"].set_color(RULE)

    fig.text(0.055, 0.93, "What the pipeline changed",
             fontsize=20, fontweight="bold", color=INK)
    fig.text(0.055, 0.865,
             "Same six tasks, three repetitions, one cloud model. Usefulness stayed flat at 3.25 against 3.38.",
             fontsize=10.5, color=MUTED)

    legend = fig.legend(handles=[
        Patch(facecolor=TEAL, label="Diversity inside a run"),
        Patch(facecolor=RUST, label="Distance from the plain pool"),
    ], loc="lower center", bbox_to_anchor=(0.55, 0.025), ncol=2, frameon=False,
        fontsize=10.5)
    for text in legend.get_texts():
        text.set_color(INK)

    fig.savefig(OUT / "eval-means.png", dpi=180, facecolor=PAPER,
                bbox_inches="tight", pad_inches=0.25)
    plt.close(fig)


if __name__ == "__main__":
    main()
    print("wrote eval-means.png")
