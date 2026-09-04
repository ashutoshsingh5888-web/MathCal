/**
 * practice.js
 * Runs a single practice session for a chosen topic + difficulty.
 * Talks to generators.js for questions, storage.js for persistence,
 * and ui.js for rendering. Holds its own private session state.
 */

import { generateQuestionSet, topicLabel } from "./generators.js";
import { updateProgress, addMistake, saveSession, getSettings } from "./storage.js";
import { renderQuestionScreen, showFeedback, renderSummary } from "./ui.js";
import { createStopwatch, trackEvent } from "./state.js";

const practiceState = {
  topic: null,
  difficulty: null,
  questions: [],
  currentIndex: 0,
  score: 0,
  stopwatch: createStopwatch(),
};

export function startPractice(topic, difficulty) {
  const settings = getSettings();

  practiceState.topic = topic;
  practiceState.difficulty = difficulty;
  practiceState.questions = generateQuestionSet(topic, difficulty, settings.questionsPerSession);
  practiceState.currentIndex = 0;
  practiceState.score = 0;
  practiceState.stopwatch.reset();
  practiceState.stopwatch.start();

  loadPracticeQuestion();
}

function loadPracticeQuestion() {
  const question = practiceState.questions[practiceState.currentIndex];

  renderQuestionScreen({
    kind: "practice",
    topic: practiceState.topic,
    difficulty: practiceState.difficulty,
    index: practiceState.currentIndex,
    total: practiceState.questions.length,
    questionText: question.questionText,
  });

  document.getElementById("practice-submit").addEventListener("click", submitPracticeAnswer);

  const input = document.getElementById("practice-answer");
  input.addEventListener("input", () => {
    const value = input.value.trim();
    if (value !== "" && Number(value) === question.answer) {
      submitPracticeAnswer();
    }
  });
}

function submitPracticeAnswer() {
  const question = practiceState.questions[practiceState.currentIndex];
  const input = document.getElementById("practice-answer");
  const submitBtn = document.getElementById("practice-submit");
  if (submitBtn.disabled) return; // guard against double submit

  const rawValue = input.value.trim();
  const answer = Number(rawValue);
  const isCorrect = rawValue !== "" && answer === question.answer;

  updateProgress(question.topic, isCorrect);

  if (isCorrect) {
    practiceState.score += 1;
  } else {
    addMistake({
      id: crypto.randomUUID(),
      topic: question.topic,
      difficulty: question.difficulty,
      questionText: question.questionText,
      answer: question.answer,
      missedAt: new Date().toISOString(),
    });
  }

  showFeedback("practice", isCorrect, question.answer);
  input.disabled = true;
  submitBtn.disabled = true;

  setTimeout(() => {
    practiceState.currentIndex += 1;
    if (practiceState.currentIndex >= practiceState.questions.length) {
      finishPractice();
      return;
    }
    loadPracticeQuestion();
  }, 700);
}

function finishPractice() {
  const total = practiceState.questions.length;
  const accuracy = total === 0 ? 0 : Math.round((practiceState.score / total) * 100);

  saveSession({
    id: crypto.randomUUID(),
    type: "practice",
    topic: topicLabel(practiceState.topic),
    score: practiceState.score,
    total,
    accuracy,
    duration: practiceState.stopwatch.elapsedSeconds(),
    completedAt: new Date().toISOString(),
  });

  trackEvent({
    event: "practice_complete",
    topic: practiceState.topic,
    difficulty: practiceState.difficulty,
    score: practiceState.score,
    total,
    accuracy,
  });

  renderSummary({
    topic: topicLabel(practiceState.topic),
    score: practiceState.score,
    total,
    accuracy,
    duration: practiceState.stopwatch.elapsedSeconds(),
    nextAction: `<button class="block" data-action="practice">Practice Again</button>`,
  });
}
