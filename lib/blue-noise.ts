export const BLUE_NOISE_SIZE = 64;

function createBlueNoise(): Uint8Array {
  const count = BLUE_NOISE_SIZE * BLUE_NOISE_SIZE;
  const white = new Float32Array(count);
  let state = 0x9e3779b9;
  for (let index = 0; index < count; index++) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    white[index] = (state >>> 0) / 0x100000000;
  }

  const kernel = [1, 4, 6, 4, 1];
  const ranked = Array.from({ length: count }, (_, index) => {
    const x = index % BLUE_NOISE_SIZE;
    const y = Math.floor(index / BLUE_NOISE_SIZE);
    let blurred = 0;
    let weight = 0;
    for (let offsetY = -2; offsetY <= 2; offsetY++) {
      for (let offsetX = -2; offsetX <= 2; offsetX++) {
        const sampleX = (x + offsetX + BLUE_NOISE_SIZE) % BLUE_NOISE_SIZE;
        const sampleY = (y + offsetY + BLUE_NOISE_SIZE) % BLUE_NOISE_SIZE;
        const sampleWeight = kernel[offsetX + 2]! * kernel[offsetY + 2]!;
        blurred += white[sampleY * BLUE_NOISE_SIZE + sampleX]! * sampleWeight;
        weight += sampleWeight;
      }
    }
    return { index, score: white[index]! - blurred / weight };
  });
  ranked.sort((left, right) => left.score - right.score || left.index - right.index);

  const result = new Uint8Array(count);
  ranked.forEach((entry, rank) => { result[entry.index] = Math.floor(rank * 256 / count); });
  return result;
}

export const BLUE_NOISE_64 = createBlueNoise();
