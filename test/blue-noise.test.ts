import assert from "node:assert/strict";
import test from "node:test";
import { BLUE_NOISE_64, BLUE_NOISE_SIZE } from "../lib/blue-noise.ts";

test("blue-noise threshold map is deterministic, balanced and high-pass", () => {
  assert.equal(BLUE_NOISE_64.length, BLUE_NOISE_SIZE ** 2);
  const counts = new Uint16Array(256);
  for (const value of BLUE_NOISE_64) counts[value]++;
  assert.deepEqual([...counts], Array(256).fill(16));

  const mean = 127.5;
  let adjacent = 0;
  let variance = 0;
  for (let y = 0; y < BLUE_NOISE_SIZE; y++) {
    for (let x = 0; x < BLUE_NOISE_SIZE; x++) {
      const centered = BLUE_NOISE_64[y * BLUE_NOISE_SIZE + x]! - mean;
      const neighbor = BLUE_NOISE_64[y * BLUE_NOISE_SIZE + (x + 1) % BLUE_NOISE_SIZE]! - mean;
      adjacent += centered * neighbor;
      variance += centered * centered;
    }
  }
  assert.ok(adjacent / variance < -0.1);
});
