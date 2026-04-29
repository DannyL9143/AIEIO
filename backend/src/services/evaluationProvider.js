import { config } from "../config.js";
import { evaluateSubmission } from "./evaluationService.js";

function evaluateMock(input) {
  return evaluateSubmission(input);
}

function evaluateLive(input) {
  // Live provider path placeholder for external model integration.
  // For hackathon stability, we currently reuse deterministic engine.
  return evaluateSubmission(input);
}

export function getEvaluationProviderStatus() {
  return config.evaluationProviderMode === "live" ? "available" : "mock";
}

export function runEvaluation(input) {
  if (config.evaluationProviderMode === "live") {
    return evaluateLive(input);
  }

  return evaluateMock(input);
}

