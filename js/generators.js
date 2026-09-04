/**
 * generators.js
 * Pure question generation. No storage, no DOM. Every function here
 * returns a plain question object: { id, topic, difficulty, questionText, answer }
 */

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeQuestion(topic, difficulty, questionText, answer) {
  return {
    id: crypto.randomUUID(),
    topic,
    difficulty,
    questionText,
    answer,
  };
}

const RANGES = {
  tables: {
    easy: { a: [2, 10], b: [2, 10] },
    medium: { a: [2, 12], b: [2, 15] },
    hard: { a: [6, 20], b: [6, 20] },
  },
  squares: {
    easy: { n: [2, 15] },
    medium: { n: [10, 25] },
    hard: { n: [20, 40] },
  },
  cubes: {
    easy: { n: [2, 8] },
    medium: { n: [4, 12] },
    hard: { n: [8, 20] },
  },
  powers: {
    easy: { base: [2, 5], exp: [2, 3] },
    medium: { base: [2, 6], exp: [2, 4] },
    hard: { base: [2, 9], exp: [3, 4] },
  },
  arithmetic: {
    easy: { range: [2, 25] },
    medium: { range: [10, 100] },
    hard: { range: [50, 500] },
  },
};

function genTables(difficulty) {
  const { a, b } = RANGES.tables[difficulty] || RANGES.tables.medium;
  const x = randInt(a[0], a[1]);
  const y = randInt(b[0], b[1]);
  return makeQuestion("tables", difficulty, `${x} × ${y}`, x * y);
}

function genSquares(difficulty) {
  const { n } = RANGES.squares[difficulty] || RANGES.squares.medium;
  const x = randInt(n[0], n[1]);
  return makeQuestion("squares", difficulty, `${x}²`, x * x);
}

function genCubes(difficulty) {
  const { n } = RANGES.cubes[difficulty] || RANGES.cubes.medium;
  const x = randInt(n[0], n[1]);
  return makeQuestion("cubes", difficulty, `${x}³`, x * x * x);
}

function genPowers(difficulty) {
  const { base, exp } = RANGES.powers[difficulty] || RANGES.powers.medium;
  const b = randInt(base[0], base[1]);
  const e = randInt(exp[0], exp[1]);
  return makeQuestion("powers", difficulty, `${b}^${e}`, Math.pow(b, e));
}

function genArithmetic(difficulty) {
  const { range } = RANGES.arithmetic[difficulty] || RANGES.arithmetic.medium;
  const ops = ["+", "-", "×"];
  const op = ops[randInt(0, ops.length - 1)];
  let x = randInt(range[0], range[1]);
  let y = randInt(range[0], range[1]);

  if (op === "-" && y > x) [x, y] = [y, x]; // keep results non-negative
  if (op === "×") {
    // multiplication with huge ranges gets unreasonable — scale down
    x = randInt(2, Math.max(3, Math.round(range[1] / 8)));
    y = randInt(2, Math.max(3, Math.round(range[1] / 8)));
  }

  let answer;
  if (op === "+") answer = x + y;
  else if (op === "-") answer = x - y;
  else answer = x * y;

  return makeQuestion("arithmetic", difficulty, `${x} ${op} ${y}`, answer);
}

const GENERATORS = {
  tables: genTables,
  squares: genSquares,
  cubes: genCubes,
  powers: genPowers,
  arithmetic: genArithmetic,
};

export function generateQuestion(topic, difficulty = "medium") {
  const generator = GENERATORS[topic] || genArithmetic;
  return generator(difficulty);
}

export function generateQuestionSet(topic, difficulty, count) {
  return Array.from({ length: count }, () => generateQuestion(topic, difficulty));
}

export function topicLabel(topic) {
  const labels = {
    tables: "Tables",
    squares: "Squares",
    cubes: "Cubes",
    powers: "Powers",
    arithmetic: "Arithmetic",
  };
  return labels[topic] || topic;
}
