import { readFileSync } from 'node:fs';
import {
  ANALYSIS_OPERATIONS,
  COMPARISON_METHODS,
  EVIDENCE_COMPONENTS,
  EXAMPLE_COMPONENT_VALUES,
  EXAMPLE_OVERALL_SCORE,
  NAV_ITEMS,
  PRODUCT,
  PROJECT_CATEGORIES,
  PROJECT_TEXT_CONSTRAINTS,
  SIMILARITY_LEVELS,
  UPLOAD_CONSTRAINTS,
  WORKFLOW_STEPS,
} from '../src/content/systemContent.js';

const expectedKeys = ['title', 'abstract', 'report', 'keywords', 'minhash', 'code'];
const expectedOptionalKeys = ['report', 'code'];

function assert(condition, message) {
  if (!condition) throw new Error(`Content validation failed: ${message}`);
}

function sameItems(actual, expected) {
  return actual.length === expected.length && actual.every((item, index) => item === expected[index]);
}

assert(EVIDENCE_COMPONENTS.length === 6, 'the interface must expose exactly six evidence components');
assert(NAV_ITEMS.length === 3, 'main navigation must contain the three core application destinations');
assert(new Set(NAV_ITEMS.map(item => item.path)).size === NAV_ITEMS.length, 'navigation paths must be unique');
assert(new Set(PROJECT_CATEGORIES.map(item => item.label)).size === PROJECT_CATEGORIES.length, 'project categories must be unique');
assert(PROJECT_CATEGORIES.at(-1)?.label === 'Other', 'the fallback project category must remain last');
assert(sameItems(EVIDENCE_COMPONENTS.map(item => item.key), expectedKeys), 'component keys or order do not match the backend');
assert(new Set(EVIDENCE_COMPONENTS.map(item => item.key)).size === EVIDENCE_COMPONENTS.length, 'component keys must be unique');
assert(EVIDENCE_COMPONENTS.reduce((sum, item) => sum + item.weight, 0) === 100, 'base component weights must total 100%');
assert(EVIDENCE_COMPONENTS.every(item => item.weight > 0), 'every evidence component needs a positive base weight');
assert(
  sameItems(EVIDENCE_COMPONENTS.filter(item => item.optional).map(item => item.key), expectedOptionalKeys),
  'only report and code may be optional weighted components',
);
assert(COMPARISON_METHODS.length === 4, 'the interface must describe four comparison methods');
assert(ANALYSIS_OPERATIONS.length === 6, 'the operation orbit must contain six distinct operations');
assert(WORKFLOW_STEPS.length === 5, 'every page must describe one five-stage workflow');
assert(SIMILARITY_LEVELS.length === 5, 'the interface must explain all five backend classification levels');
assert(
  WORKFLOW_STEPS.every((step, index) => step.number === String(index + 1).padStart(2, '0')),
  'workflow numbers must be sequential from 01 to 05',
);
assert(
  EVIDENCE_COMPONENTS.every(item => item.label && item.description && item.method),
  'every evidence component needs a label, description and method',
);
assert(
  EVIDENCE_COMPONENTS.every(item => Number.isInteger(EXAMPLE_COMPONENT_VALUES[item.key])),
  'each evidence component needs one illustrative integer value',
);
assert(
  Object.values(EXAMPLE_COMPONENT_VALUES).every(value => value >= 0 && value <= 100),
  'illustrative component values must remain between 0 and 100',
);
const expectedExampleScore = Math.round(
  EVIDENCE_COMPONENTS.reduce(
    (total, component) => total + EXAMPLE_COMPONENT_VALUES[component.key] * component.weight,
    0,
  ) / 100,
);
assert(EXAMPLE_OVERALL_SCORE === expectedExampleScore, 'the illustrative overall score must equal its weighted component values');
assert(PRODUCT.reviewPrinciple.toLowerCase().includes('not a verdict'), 'the review principle must avoid automated conclusions');
assert(PRODUCT.safetyStatement.toLowerCase().includes('never executed'), 'the safety statement must explain that code is not executed');

const enginePath = new URL('../../backend/app/similarity/engine.py', import.meta.url);
const engineSource = readFileSync(enginePath, 'utf8');
const weightBlock = engineSource.match(/weights\s*=\s*\{([\s\S]*?)\}/)?.[1];
assert(weightBlock, 'backend component weights could not be located');

const backendWeights = Object.fromEntries(
  [...weightBlock.matchAll(/["']([a-z]+)["']\s*:\s*([0-9.]+)/g)].map(match => [match[1], Math.round(Number(match[2]) * 100)]),
);
assert(sameItems(Object.keys(backendWeights), expectedKeys), 'backend component keys differ from the shared interface model');
for (const component of EVIDENCE_COMPONENTS) {
  assert(
    backendWeights[component.key] === component.weight,
    `${component.label} shows ${component.weight}% but the backend uses ${backendWeights[component.key]}%`,
  );
}

const mainPath = new URL('../../backend/app/main.py', import.meta.url);
const mainSource = readFileSync(mainPath, 'utf8');
const formTextLimits = mainSource.match(/async def analyze\(title:Annotated\[str,Form\(min_length=(\d+),max_length=(\d+)\)\],abstract:Annotated\[str,Form\(min_length=(\d+),max_length=(\d+)\)\]/);
assert(formTextLimits, 'backend analysis text limits could not be located');
assert(PROJECT_TEXT_CONSTRAINTS.title.minLength === Number(formTextLimits[1]), 'title minimum length differs from the backend');
assert(PROJECT_TEXT_CONSTRAINTS.title.maxLength === Number(formTextLimits[2]), 'title maximum length differs from the backend');
assert(PROJECT_TEXT_CONSTRAINTS.abstract.minLength === Number(formTextLimits[3]), 'abstract minimum length differs from the backend');
assert(PROJECT_TEXT_CONSTRAINTS.abstract.maxLength === Number(formTextLimits[4]), 'abstract maximum length differs from the backend');
const uploadLimits = mainSource.match(/MAX_REPORT\s*=\s*(\d+)\*1024\*1024;\s*MAX_SOURCE\s*=\s*(\d+)\*1024\*1024/);
assert(uploadLimits, 'backend upload limits could not be located');
assert(UPLOAD_CONSTRAINTS.report.maxBytes === Number(uploadLimits[1]) * 1024 * 1024, 'report-size limit differs from the backend');
assert(UPLOAD_CONSTRAINTS.source.maxBytes === Number(uploadLimits[2]) * 1024 * 1024, 'source-size limit differs from the backend');
const codeExtensionBlock = mainSource.match(/CODE_EXT\s*=\s*\{([^}]+)\}/)?.[1];
assert(codeExtensionBlock, 'backend source extensions could not be located');
const backendSourceExtensions = [...codeExtensionBlock.matchAll(/["'](\.[a-z]+)["']/g)].map(match => match[1]).sort();
const interfaceSourceExtensions = UPLOAD_CONSTRAINTS.source.extensions.filter(extension => extension !== '.zip').sort();
assert(sameItems(interfaceSourceExtensions, backendSourceExtensions), 'accepted source-file extensions differ from the backend');
assert(sameItems(UPLOAD_CONSTRAINTS.report.extensions, ['.pdf', '.txt']), 'report extensions must remain PDF and TXT');

const seedPath = new URL('../../backend/app/seed.py', import.meta.url);
const seedSource = readFileSync(seedPath, 'utf8');
const seededCategories = new Set(
  [...seedSource.matchAll(/\["[^\]]+"\],\s*"([^"]+)",\s*"\d{4}-\d{2}"\)/g)].map(match => match[1]),
);
assert(seededCategories.size > 0, 'seed project categories could not be located');
const interfaceCategories = new Set(PROJECT_CATEGORIES.map(item => item.label));
for (const category of seededCategories) {
  assert(interfaceCategories.has(category), `seeded category "${category}" is missing from the interface`);
}
const backendThresholds = [...engineSource.matchAll(/score>=\.([0-9]+)/g)].map(match => Number(`0.${match[1]}`) * 100);
assert(
  sameItems(SIMILARITY_LEVELS.slice(0, -1).map(level => level.minimum), backendThresholds),
  'similarity classification thresholds differ from the backend',
);
for (const level of SIMILARITY_LEVELS) {
  assert(engineSource.includes(`"${level.label}"`), `${level.label} differs from the backend classification text`);
}

console.log(
  `Content model valid: ${EVIDENCE_COMPONENTS.length} components, ${COMPARISON_METHODS.length} methods, ` +
  `${ANALYSIS_OPERATIONS.length} operations, ${WORKFLOW_STEPS.length} workflow stages, 100% verified base weight.`,
);
