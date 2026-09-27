export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export function angleDistance(angle) {
  return Math.abs(((angle + 180) % 360 + 360) % 360 - 180);
}

export function mapScrollToStops(progress, count, lead = 0.08, tail = 0.08) {
  if (!Number.isInteger(count) || count < 2) {
    throw new Error('Scroll-stop count must be an integer of at least two.');
  }
  const normalized = clamp((progress - lead) / Math.max(0.01, 1 - lead - tail));
  const position = normalized * (count - 1);
  return {
    normalized,
    position,
    activeIndex: Math.min(count - 1, Math.max(0, Math.round(position))),
  };
}
