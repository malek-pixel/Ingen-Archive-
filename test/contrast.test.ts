import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Colour contrast is a property of the palette, so it is checked against the
 * palette rather than against a rendered screenshot. Every text token is
 * measured on every surface it can appear on.
 *
 * This exists because four tokens shipped below AA and nobody noticed: the
 * design was frozen, the check was on the plan, and it was never run.
 */

const srgb = (c: number) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};

const luminance = (hex: string) => {
  const n = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
  return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
};

export const contrast = (a: string, b: string) => {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

/** Every dark surface a text token can sit on. */
const SURFACES = {
  "page #0B0F14": "#0B0F14",
  "input #0E131A": "#0E131A",
  "raised #10161D": "#10161D",
};

/** Tokens used for body-sized text — WCAG AA requires 4.5:1. */
const BODY_TEXT = [
  "--ig-text",
  "--ig-text-2",
  "--ig-text-3",
  "--ig-text-4",
  "--ig-text-5",
  "--ig-text-6",
  "--ig-text-7",
  "--ig-text-8",
  "--ig-text-9",
  "--ig-link",
];

/** Status inks: carry meaning, so they must clear the 3:1 non-text floor at minimum. */
const SEMANTIC = ["--ig-green", "--ig-red", "--ig-amber", "--ig-blue-l5", "--ig-archival"];

function readTokens(): Record<string, string> {
  // Resolved from cwd: under the jsdom transform import.meta.url is an http URL.
  const css = readFileSync(resolve(process.cwd(), "src/styles/tokens.css"), "utf8");
  const out: Record<string, string> = {};
  for (const [, name, value] of css.matchAll(/(--ig-[\w-]+):\s*(#[0-9A-Fa-f]{6})\s*;/g)) {
    out[name] = value;
  }
  return out;
}

const tokens = readTokens();

describe("palette contrast (WCAG 2.1 AA)", () => {
  it("parses the token file", () => {
    expect(Object.keys(tokens).length).toBeGreaterThan(20);
  });

  for (const token of BODY_TEXT) {
    for (const [label, bg] of Object.entries(SURFACES)) {
      it(`${token} on ${label} clears 4.5:1 for normal text`, () => {
        const value = tokens[token];
        expect(value, `${token} missing from tokens.css`).toBeTruthy();
        const ratio = contrast(value, bg);
        expect(
          Number(ratio.toFixed(2)),
          `${token} (${value}) on ${bg} is ${ratio.toFixed(2)}:1`
        ).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  for (const token of SEMANTIC) {
    it(`${token} clears the 3:1 non-text floor on every surface`, () => {
      for (const bg of Object.values(SURFACES)) {
        const ratio = contrast(tokens[token], bg);
        expect(Number(ratio.toFixed(2)), `${token} on ${bg}`).toBeGreaterThanOrEqual(3);
      }
    });
  }

  it("keeps the quiet-to-loud ordering of the muted greys", () => {
    const ramp = ["--ig-text-9", "--ig-text-8", "--ig-text-7", "--ig-text-6", "--ig-text-5"];
    const ratios = ramp.map((t) => contrast(tokens[t], "#0B0F14"));
    for (let i = 1; i < ratios.length; i++) {
      expect(ratios[i], `${ramp[i]} should read louder than ${ramp[i - 1]}`).toBeGreaterThan(ratios[i - 1]);
    }
  });
});
