export function getFoodScoreLabel(score: number) {
  if (!Number.isFinite(score)) return "Not scored";

  if (score >= 85) return "Excellent match";
  if (score >= 70) return "Very good match";
  if (score >= 55) return "Good match";
  if (score >= 40) return "Moderate match";
  return "Low match";
}

export function buildFoodScoreExplanation(score: number) {
  if (!Number.isFinite(score)) {
    return "There is not enough reliable nutrition data to explain this food score yet.";
  }

  if (score >= 85) {
    return "This food looks like a strong match based on the pet profile and available food data.";
  }

  if (score >= 70) {
    return "This food looks like a good fit, with a few details worth monitoring.";
  }

  if (score >= 55) {
    return "This food may be acceptable, but there may be better-matched alternatives.";
  }

  if (score >= 40) {
    return "This food looks like a moderate match for this specific profile.";
  }

  return "This food may not be the best fit for the pet's current needs.";
}
