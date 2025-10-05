export default class MathEx {
  static radians(degrees) {
    return (degrees * Math.PI) / 180;
  }

  static degrees(radians) {
    return (radians * 180) / Math.PI;
  }

  static clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  static lerp(start, end, t) {
    return start * (1 - t) + end * t;
  }
}
