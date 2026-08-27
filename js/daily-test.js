/**
 * daily-test.js
 * A fixed daily mix — 2 questions from each topic, medium difficulty.
 * Completing it is what advances the user's streak.
 */

import { generateQuestion } from "./generators.js";
import { updateProgress, updateStreak, saveSession, addMistake } from "./storage.js";
import { renderQuestionScreen, showFeedback, renderSummary } from "./ui.js";
import { createStopwatch, shuffle } from "./state.js";

const DAILY_TOPICS = ["tables", "tables", "squares", "squares", "cubes", "cubes", "powers", "powers", "arithmetic", "arithmetic"];

const dailyState = {
  questions: [],
  currentIndex: 0,
  score: 0,
  stopwatch: createStopwatch(),
};

export function startDailyTest() {
  dailyState.questions = shuffle(DAILY_TOPICS).map((topic) => generateQuestion(topic, "medium"));
  dailyState.currentIndex = 0;
  dailyState.score = 0;
  dailyState.stopwatch.reset();
  dailyState.stopwatch.start();

  loadDailyQuestion();
}

function loadDailyQuestion() {
  const question = dailyState.questions[dailyState.currentIndex];

  renderQuestionScreen({
    kind: "daily-test",
    topic: question.topic,
    difficulty: "medium",
    index: dailyState.currentIndex,
    total: dailyState.questions.length,
    questionText: question.questionText,
  });

  document.getElementById("daily-test-submit").addEventListener("click", submitDailyAnswer);

  const input = document.getElementById("daily-test-answer");
  input.addEventListener("input", () => {
    const value = input.value.trim();
    if (value !== "" && Number(value) === question.answer) {
      submitDailyAnswer();
    }
  });
}

function submitDailyAnswer() {
  const question = dailyState.questions[dailyState.currentIndex];
  const input = document.getElementById("daily-test-answer");
  const submitBtn = document.getElementById("daily-test-submit");
  if (submitBtn.disabled) return;

  const rawValue = input.value.trim();
  const answer = Number(rawValue);
  const isCorrect = rawValue !== "" && answer === question.answer;

  updateProgress(question.topic, isCorrect);

  if (isCorrect) {
    dailyState.score += 1;
  } else {
    addMistake({
      id: crypto.randomUUID(),
      topic: question.topic,
      difficulty: "medium",
      questionText: question.questionText,
      answer: question.answer,
      missedAt: new Date().toISOString(),
    });
  }

  showFeedback("daily-test", isCorrect, question.answer);
  input.disabled = true;
  submitBtn.disabled = true;

  setTimeout(() => {
    dailyState.currentIndex += 1;
    if (dailyState.currentIndex >= dailyState.questions.length) {
      finishDailyTest();
      return;
    }
    loadDailyQuestion();
  }, 700);
}

function finishDailyTest() {
  const total = dailyState.questions.length;
  const accuracy = Math.round((dailyState.score / total) * 100);
  const streaks = updateStreak();

  saveSession({
    id: crypto.randomUUID(),
    type: "daily-test",
    topic: "Daily Test",
    score: dailyState.score,
    total,
    accuracy,
    duration: dailyState.stopwatch.elapsedSeconds(),
    completedAt: new Date().toISOString(),
  });

  renderSummary({
    topic: "Daily Test",
    score: dailyState.score,
    total,
    accuracy,
    duration: dailyState.stopwatch.elapsedSeconds(),
    nextAction: `<p>🔥 ${streaks.current} day streak — best is ${streaks.best}.</p>`,
  });
}
