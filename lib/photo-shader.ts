import { IMAGE_DITHERING_SHADER } from "./capy-shaders.ts";

// Capy's photo shader is static. Aura adds a slow spatial threshold wave so
// the photo's dither texture moves without moving the photo itself. Keep the
// attributed upstream source intact in capy-shaders.ts.
export const ANIMATED_PHOTO_SHADER = IMAGE_DITHERING_SHADER
  .replace("uniform vec2 u_resolution;", "uniform float u_time;\nuniform bool u_halfWallpaper;\nuniform vec2 u_resolution;")
  .replace(
    "float brightness = clamp(lum + dithering / colorSteps, 0.0, 1.0);",
    "float auraWave = sin(u_time * 1.4 + normalizedUV.x * 12.0 + sin(normalizedUV.y * 9.0)) * 0.07;\n  float brightness = clamp(lum + dithering / colorSteps + auraWave, 0.0, 1.0);",
  )
  .replace(
    "fragColor = vec4(color, opacity);",
    "if (u_halfWallpaper) {\n    float auraFadeField = normalizedUV.y + auraWave * 1.8;\n    float auraFade = smoothstep(-0.10, 0.22, auraFadeField);\n    float auraDissolve = smoothstep(dithering + 0.38, dithering + 0.62, auraFade);\n    color *= auraDissolve;\n    opacity *= auraDissolve;\n  }\n\n  fragColor = vec4(color, opacity);",
  );
