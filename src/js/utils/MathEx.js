export const MathEx = {
  radians: (degrees) => degrees * Math.PI / 180,
  degrees: (radians) => radians * 180 / Math.PI,
  clamp: (value, min, max) => Math.min(Math.max(value, min), max),
  lerp: (a, b, t) => a + (b - a) * t,
  map: (value, start1, stop1, start2, stop2) => {
    return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
  }
};
