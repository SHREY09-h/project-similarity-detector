import { angleDistance, mapScrollToStops } from '../src/utils/scrollMath.js';

const componentCount = 6;
const lead = 0.08;
const tail = 0.08;
const usableRange = 1 - lead - tail;
const orbitStep = 360 / componentCount;
const wheelStep = 32;
const wheelCenterOffset = ((componentCount - 1) * wheelStep) / 2;

function assert(condition, message) {
  if (!condition) throw new Error(`Scroll validation failed: ${message}`);
}

for (let index = 0; index < componentCount; index += 1) {
  const normalizedStop = index / (componentCount - 1);
  const scrollProgress = lead + normalizedStop * usableRange;
  const mapped = mapScrollToStops(scrollProgress, componentCount, lead, tail);
  assert(mapped.activeIndex === index, `stop ${index + 1} activates component ${mapped.activeIndex + 1}`);
  assert(Math.abs(mapped.position - index) < 1e-9, `stop ${index + 1} does not land on an exact component position`);

  const orbitBaseAngle = index * orbitStep;
  const orbitRotation = -mapped.position * orbitStep;
  assert(angleDistance(orbitBaseAngle + orbitRotation) < 1e-9, `orbit item ${index + 1} misses the focus axis`);

  const wheelBaseAngle = index * wheelStep - wheelCenterOffset;
  const wheelRotation = wheelCenterOffset - mapped.position * wheelStep;
  assert(angleDistance(wheelBaseAngle + wheelRotation) < 1e-9, `wheel item ${index + 1} misses the focus axis`);
}

let previousIndex = 0;
for (let sample = 0; sample <= 1000; sample += 1) {
  const mapped = mapScrollToStops(sample / 1000, componentCount, lead, tail);
  assert(mapped.activeIndex >= previousIndex, 'active component moves backward while scrolling forward');
  previousIndex = mapped.activeIndex;
}

assert(mapScrollToStops(0, componentCount).activeIndex === 0, 'the wheel must start on the first component');
assert(mapScrollToStops(1, componentCount).activeIndex === componentCount - 1, 'the wheel must finish on the final component');

console.log('Scroll model valid: 6 ordered stops, exact orbit alignment and exact wheel alignment.');
