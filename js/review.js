/**
 * review.js
 * Practice Wrong Answers → Master Them → Remove After 2 Correct Attempts.
 * Pulls from the mistakes list in storage.js and hands each one back
 * for another attempt until it's answered correctly twice in a row.
 */

import { getMistakes, markMistakeCorrect, markMistakeIncorrect } from "./storage.js";
import { renderQuestionScreen, showFeedback, renderSummary, renderEmptyState } from "./ui.js";
import { createStopwatch } from "./state.js";

const reviewState = {
  queue: [],
  currentIndex: 0,
  corrected: 0,
  attempted: 0,
  stopwatch: createStopwatch(),
};

export function startReview() {
  const mistakes = getMistakes();

  if (mistakes.length === 0) {
    renderEmptyState("No mistakes queued — clean slate 🎉", "✓");
    return;
  }

  reviewState.queue = [...mistakes];
  reviewState.currentIndex = 0;
  reviewState.corrected = 0;
  reviewState.attempted = 0;
  reviewState.stopwatch.reset();
  reviewState.stopwatch.start();

  loadReviewQuestion();
}

function loadReviewQuestion() {
  const question = reviewState.queue[reviewState.currentIndex];

  renderQuestionScreen({
    kind: "review",
    topic: question.topic,
    difficulty: question.difficulty,
    index: reviewState.currentIndex,
    total: reviewState.queue.length,
    questionText: question.questionText,
  });

  document.getElementById("review-submit").addEventListener("click", submitReviewAnswer);
}

function submitReviewAnswer() {
  const question = reviewState.queue[reviewState.currentIndex];
  const input = document.getElementById("review-answer");
  const submitBtn = document.getElementById("review-submit");
  if (submitBtn.disabled) return;

  const rawValue = input.value.trim();
  const answer = Number(rawValue);
  const isCorrect = rawValue !== "" && answer === question.answer;

  reviewState.attempted += 1;

  if (isCorrect) {
    reviewState.corrected += 1;
    markMistakeCorrect(question.id);
  } else {
    markMistakeIncorrect(question.id);
  }

  showFeedback("review", isCorrect, question.answer);
  input.disabled = true;
  submitBtn.disabled = true;

  setTimeout(() => {
    reviewState.currentIndex += 1;
    if (reviewState.currentIndex >= reviewState.queue.length) {
      finishReview();
      return;
    }
    loadReviewQuestion();
  }, 700);
}

function finishReview() {
  const total = reviewState.queue.length;
  const accuracy =
    reviewState.attempted === 0 ? 0 : Math.round((reviewState.corrected / reviewState.attempted) * 100);
  const remaining = getMistakes().length;

  renderSummary({
    topic: "Review",
    score: reviewState.corrected,
    total,
    accuracy,
    duration: reviewState.stopwatch.elapsedSeconds(),
    nextAction:
      remaining > 0
        ? `<button class="block" data-action="review">Keep Reviewing (${remaining} left)</button>`
        : `<p>Every mistake has been mastered 🎉</p>`,
  });
}
