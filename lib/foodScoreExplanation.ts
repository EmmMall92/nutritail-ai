export function getFoodScoreLabel(score: number) {
  if (score >= 85) return "Excellent match";
  if (score >= 70) return "Very good match";
  if (score >= 55) return "Good match";
  if (score >= 40) return "Moderate match";
  return "Low match";
}

export function buildFoodScoreExplanation(score: number) {
  if (score >= 85) {
    return "Η τροφή φαίνεται πολύ καλή επιλογή με βάση τα στοιχεία του κατοικιδίου.";
  }

  if (score >= 70) {
    return "Η τροφή φαίνεται αρκετά κατάλληλη, με μερικά σημεία που αξίζει να προσέξεις.";
  }

  if (score >= 55) {
    return "Η τροφή μπορεί να είναι αποδεκτή επιλογή, αλλά ίσως υπάρχουν καλύτερες εναλλακτικές.";
  }

  if (score >= 40) {
    return "Η τροφή φαίνεται μέτρια επιλογή για το συγκεκριμένο προφίλ.";
  }

  return "Η τροφή ίσως δεν είναι η καλύτερη επιλογή για τις ανάγκες του κατοικιδίου.";
}