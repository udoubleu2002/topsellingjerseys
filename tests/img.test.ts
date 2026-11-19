import { describe, expect, it } from "vitest";
import { bucketWidth, IMAGE_WIDTHS } from "../src/lib/img";

describe("jersey image widths", () => {
  it("rounds every size up to a shared CDN width", () => {
    expect(bucketWidth(30)).toBe(64);
    expect(bucketWidth(64)).toBe(64);
    expect(bucketWidth(68)).toBe(96);
    expect(bucketWidth(200)).toBe(256);
    expect(bucketWidth(560)).toBe(640);
    expect(bucketWidth(1120)).toBe(1120);
  });
  it("never asks for more than the largest width", () => {
    expect(bucketWidth(4000)).toBe(IMAGE_WIDTHS[IMAGE_WIDTHS.length - 1]);
  });
});
