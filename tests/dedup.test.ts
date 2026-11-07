import { describe, expect, it } from "vitest";
import { deduplicate } from "../src/ideas/dedup.ts";

describe("deduplication", () => {
  it("drops a paraphrase and keeps a distinct idea", async () => {
    const result = await deduplicate(
      [
        {
          title: "Night-shift sleep coaching",
          text: "A subscription coaching service that helps night shift nurses build sleep routines.",
          signature: "sleep coaching night nurses",
        },
        {
          title: "Nurse sleep program",
          text: "Subscription coaching for night shift nurses who need better sleep routines.",
          signature: "sleep coaching night nurses",
        },
        {
          title: "Factory sensor repair",
          text: "A sensor that predicts when a factory motor will fail and schedules its own repair.",
          signature: "predictive maintenance factory motors",
        },
      ],
      { threshold: 0.82 },
    );

    expect(result.kept).toEqual([0, 2]);
    expect(result.dropped).toEqual([1]);
    expect(result.matches[1]?.duplicate).toBe(true);
    expect(result.matches[2]?.duplicate).toBe(false);
  });

  it("compares against existing ideas", async () => {
    const result = await deduplicate(
      [
        {
          title: "Sleep coaching",
          text: "A coaching subscription for night shift nurses who struggle with sleep.",
          signature: "sleep coaching night nurses",
        },
      ],
      {
        threshold: 0.8,
        existing: [
          {
            title: "Night nurse sleep app",
            text: "A subscription that coaches night shift nurses on sleep routines.",
            signature: "sleep coaching night nurses",
          },
        ],
      },
    );
    expect(result.dropped).toEqual([0]);
    expect(result.matches[0]?.best?.source).toBe("existing");
  });

  it("handles an empty existing file", async () => {
    const result = await deduplicate([{ title: "A", text: "one idea" }], { threshold: 0.82 });
    expect(result.kept).toEqual([0]);
    expect(result.matches[0]?.best).toBeNull();
  });

  it("drops exact normalized titles even when the body differs", async () => {
    const result = await deduplicate(
      [
        { title: "Solar Kettle", text: "A kettle that heats water with a solar panel." },
        { title: "solar kettle", text: "A camping device that boils water using sunlight." },
      ],
      { threshold: 0.99 },
    );
    expect(result.dropped).toEqual([1]);
  });

  it("does not treat empty signatures as a match", async () => {
    const result = await deduplicate(
      [
        { title: "A", text: "completely different alpha", signature: "" },
        { title: "B", text: "completely different beta", signature: "" },
      ],
      { threshold: 0.99 },
    );
    expect(result.dropped).toEqual([]);
  });
});
