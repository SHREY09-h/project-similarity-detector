export const PRODUCT = {
  name: 'Project Similarity',
  fullName: 'Project Similarity Detection System',
  reviewPrinciple: 'Similarity is a review signal, not a verdict.',
  reviewExplanation: 'The system ranks related work and explains the evidence. A reviewer interprets the result and makes the final decision.',
  safetyStatement: 'Uploaded source code is read as text and is never executed.',
};

export const NAV_ITEMS = [
  { label: 'Analyze', mobileLabel: 'Analyze a project', path: '/analyze' },
  { label: 'Repository', mobileLabel: 'Browse repository', path: '/projects' },
  { label: 'How it works', mobileLabel: 'Review the method', path: '/how-it-works' },
];

export const UPLOAD_CONSTRAINTS = {
  report: {
    extensions: ['.pdf', '.txt'],
    maxBytes: 10 * 1024 * 1024,
    maxLabel: '10 MB',
  },
  source: {
    extensions: ['.zip', '.py', '.js', '.jsx', '.ts', '.tsx', '.java', '.cpp', '.c', '.h', '.cs'],
    maxBytes: 5 * 1024 * 1024,
    maxLabel: '5 MB',
  },
};

export const PROJECT_TEXT_CONSTRAINTS = {
  title: { minLength: 3, maxLength: 240 },
  abstract: { minLength: 20, maxLength: 2000 },
};

export const PROJECT_CATEGORIES = [
  { icon: '⌁', label: 'Natural Language Processing' },
  { icon: '◇', label: 'Machine Learning' },
  { icon: '◉', label: 'Computer Vision' },
  { icon: '▦', label: 'Data Science' },
  { icon: '⌘', label: 'Software Engineering' },
  { icon: '◎', label: 'Web Development' },
  { icon: '▯', label: 'Mobile Computing' },
  { icon: '＋', label: 'Other' },
];

export const EVIDENCE_COMPONENTS = [
  {
    key: 'title',
    label: 'Title language',
    shortLabel: 'Title',
    icon: 'Tt',
    weight: 10,
    optional: false,
    method: 'TF-IDF + cosine',
    description: 'Compare the vocabulary used in project titles.',
  },
  {
    key: 'abstract',
    label: 'Abstract and description',
    shortLabel: 'Summary',
    icon: 'Aa',
    weight: 25,
    optional: false,
    method: 'TF-IDF + cosine',
    description: 'Measure semantic similarity across the project summary and implementation description.',
  },
  {
    key: 'report',
    label: 'Project report',
    shortLabel: 'Report',
    icon: '≋',
    weight: 20,
    optional: true,
    method: 'TF-IDF + cosine',
    description: 'Compare uploaded report text when both projects provide it.',
  },
  {
    key: 'keywords',
    label: 'Declared keywords',
    shortLabel: 'Keywords',
    icon: '#',
    weight: 15,
    optional: false,
    method: 'Jaccard overlap',
    description: 'Measure direct overlap between submitted project topics.',
  },
  {
    key: 'minhash',
    label: 'Text shingles',
    shortLabel: 'Shingles',
    icon: 'MH',
    weight: 10,
    optional: false,
    method: 'MinHash signatures',
    description: 'Estimate overlap between three-word sequences in the combined project text.',
  },
  {
    key: 'code',
    label: 'Source-code structure',
    shortLabel: 'Code',
    icon: '</>',
    weight: 20,
    optional: true,
    method: 'Code normalization + cosine and Jaccard',
    description: 'Compare normalized code tokens without executing submitted files.',
  },
];

export const COMPARISON_METHODS = [
  {
    key: 'tfidf-cosine',
    label: 'TF-IDF + cosine',
    short: 'TF',
    purpose: 'Weight informative terms and measure the angle between language vectors.',
  },
  {
    key: 'jaccard',
    label: 'Jaccard overlap',
    short: 'JC',
    purpose: 'Measure the proportion of shared keywords or normalized code tokens.',
  },
  {
    key: 'minhash',
    label: 'MinHash signatures',
    short: 'MH',
    purpose: 'Estimate overlap between three-word text shingles efficiently.',
  },
  {
    key: 'code-normalization',
    label: 'Code normalization',
    short: 'ID',
    purpose: 'Remove comments and standardize identifiers before code comparison.',
  },
];

export const ANALYSIS_OPERATIONS = [
  { key: 'clean-text', short: 'TXT', label: 'Clean the text', detail: 'Normalize words and remove common noise.' },
  { key: 'weight-terms', short: 'TF', label: 'Weight key terms', detail: 'Give informative project language more influence.' },
  { key: 'compare-vectors', short: 'CS', label: 'Compare language vectors', detail: 'Measure semantic closeness with cosine similarity.' },
  { key: 'measure-overlap', short: 'JC', label: 'Measure direct overlap', detail: 'Find shared keywords and normalized tokens.' },
  { key: 'estimate-shingles', short: 'MH', label: 'Estimate text overlap', detail: 'Compare three-word sequences with MinHash.' },
  { key: 'normalize-code', short: 'ID', label: 'Normalize source code', detail: 'Standardize identifiers before structural comparison.' },
];

export const WORKFLOW_STEPS = [
  {
    number: '01',
    title: 'Validate the submission',
    progressLabel: 'Validating the submission',
    description: 'Check required metadata, accepted report formats and source-file limits before processing.',
  },
  {
    number: '02',
    title: 'Prepare comparable evidence',
    progressLabel: 'Preparing text and code',
    description: 'Clean project text, remove common words and normalize source-code identifiers.',
  },
  {
    number: '03',
    title: 'Calculate six component scores',
    progressLabel: 'Calculating component scores',
    description: 'Use TF-IDF and cosine, Jaccard, MinHash and normalized code tokens to score each evidence component.',
  },
  {
    number: '04',
    title: 'Weight and rank the evidence',
    progressLabel: 'Ranking repository matches',
    description: 'Combine available scores, redistribute unavailable report or code weight and rank repository projects.',
  },
  {
    number: '05',
    title: 'Explain every match',
    progressLabel: 'Building the evidence report',
    description: 'Show component scores, shared topics and supporting reasons for each returned match.',
  },
];

export const SIMILARITY_LEVELS = [
  {
    key: 'very-high',
    label: 'Very High Similarity',
    range: '85–100%',
    minimum: 85,
    guidance: 'Many available evidence components are closely aligned. Prioritize a detailed manual review.',
  },
  {
    key: 'high',
    label: 'High Similarity',
    range: '70–84%',
    minimum: 70,
    guidance: 'Several evidence components are closely aligned. Review the project context and component evidence.',
  },
  {
    key: 'significant',
    label: 'Significant Similarity',
    range: '50–69%',
    minimum: 50,
    guidance: 'A clear relationship appears in some evidence. Inspect where the alignment occurs.',
  },
  {
    key: 'moderate',
    label: 'Moderate Similarity',
    range: '25–49%',
    minimum: 25,
    guidance: 'Some shared language or structure is present. Project context may explain the overlap.',
  },
  {
    key: 'low',
    label: 'Low Similarity',
    range: '0–24%',
    minimum: 0,
    guidance: 'Limited alignment was found in the available evidence. This does not prove originality.',
  },
];

export const EXAMPLE_COMPONENT_VALUES = {
  title: 68,
  abstract: 84,
  report: 76,
  keywords: 71,
  minhash: 74,
  code: 81,
};

export const EXAMPLE_OVERALL_SCORE = Math.round(
  EVIDENCE_COMPONENTS.reduce(
    (total, component) => total + EXAMPLE_COMPONENT_VALUES[component.key] * component.weight,
    0,
  ) / 100,
);

export const EXAMPLE_CLASSIFICATION = 'High Similarity';
