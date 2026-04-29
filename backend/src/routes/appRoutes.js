import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { randomUUID } from "node:crypto";
import { getScenarioById, listScenarios } from "../services/datasetStore.js";
import { appendEvaluationRecord } from "../services/evaluationRecordStore.js";
import {
  getEvaluationProviderStatus,
  runEvaluation
} from "../services/evaluationProvider.js";
import {
  normalizeEvaluationOutput,
  normalizeScenarioOutput,
  validateEvaluationOutput,
  validateMessageSubmission,
  validateScenarioOutput
} from "../services/schemaContracts.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "aieio-backend",
    llmProvider: getEvaluationProviderStatus()
  });
});

router.get("/scenarios", async (req, res) => {
  try {
    const rawScenarios = await listScenarios({
      dataset: req.query.dataset,
      region: req.query.region,
      incidentType: req.query.incidentType,
      limit: req.query.limit
    });

    const scenarios = rawScenarios.map((scenario) => {
      const normalizedScenario = normalizeScenarioOutput(scenario);
      const scenarioError = validateScenarioOutput(normalizedScenario);
      if (scenarioError) {
        throw new Error(scenarioError);
      }
      return normalizedScenario;
    });

    res.json({ scenarios });
  } catch (error) {
    res.status(500).json({
      error: {
        code: "SCHEMA_VALIDATION_FAILED",
        message: error.message || "Failed to normalize scenarios response."
      }
    });
  }
});

router.post("/scenarios/generate", async (req, res) => {
  const mode = String(req.body?.mode || "");

  if (!["dataset_generated", "instructor_custom"].includes(mode)) {
    return res.status(400).json({
      error: {
        code: "SCHEMA_VALIDATION_FAILED",
        message: "mode must be dataset_generated or instructor_custom."
      }
    });
  }

  if (mode === "dataset_generated") {
    const datasetOptions = req.body?.datasetOptions || {};
    const datasets = Array.isArray(datasetOptions.datasets) ? datasetOptions.datasets : [];
    const scenarios = [];

    const selectedDatasets = datasets.length > 0 ? datasets : ["CORSAIR", "GlobalMaritime"];
    for (const dataset of selectedDatasets) {
      // Keep dataset-generated response deterministic and small for MVP.
      const batch = await listScenarios({
        dataset,
        region: datasetOptions.region,
        incidentType: Array.isArray(datasetOptions.incidentTypes)
          ? datasetOptions.incidentTypes[0]
          : undefined,
        limit: 5
      });
      scenarios.push(...batch);
    }

    const normalized = scenarios.map((scenario) => normalizeScenarioOutput(scenario));
    return res.json({ scenarios: normalized });
  }

  const custom = req.body?.customScenario || {};
  const title = String(custom.title || "").trim();
  const description = String(custom.description || "").trim();
  if (!title || !description) {
    return res.status(400).json({
      error: {
        code: "SCHEMA_VALIDATION_FAILED",
        message: "customScenario title and description are required."
      }
    });
  }

  const customScenario = normalizeScenarioOutput({
    id: `scenario_custom_${randomUUID()}`,
    title,
    description,
    scenarioSourceType: "instructor_custom",
    sourceDataset: null,
    sourceRecordIds: [],
    sourceMetadata: {
      incidentDate: "N/A",
      incidentRegion: String(custom.region || "Instructor-defined"),
      incidentType: "custom",
      vesselType: "N/A",
      confidenceNote: "Instructor-authored scenario.",
      sourceSpecific: {}
    },
    region: String(custom.region || "Instructor-defined"),
    objectives: Array.isArray(custom.objectives) ? custom.objectives : [],
    risks: Array.isArray(custom.risks) ? custom.risks : [],
    stakeholders: Array.isArray(custom.stakeholders) ? custom.stakeholders : [],
    tags: ["custom", "instructor"],
    difficulty: "medium"
  });

  return res.json({ scenarios: [customScenario] });
});

router.post("/evaluate", async (req, res) => {
  const submission = validateMessageSubmission(req.body);
  if (!submission.valid) {
    return res.status(400).json({
      error: {
        code: "SCHEMA_VALIDATION_FAILED",
        message: submission.error
      }
    });
  }

  const { scenarioId, messageText } = submission.value;
  const scenario = await getScenarioById(scenarioId);
  if (!scenario) {
    return res.status(404).json({
      error: {
        code: "SCENARIO_NOT_FOUND",
        message: "No scenario found for provided scenarioId."
      }
    });
  }

  const rawEvaluation = runEvaluation({ scenarioId, messageText });
  const evaluation = normalizeEvaluationOutput(rawEvaluation);
  const evaluationError = validateEvaluationOutput(evaluation);
  if (evaluationError) {
    return res.status(500).json({
      error: {
        code: "SCHEMA_VALIDATION_FAILED",
        message: evaluationError
      }
    });
  }

  await appendEvaluationRecord({
    ...evaluation,
    metadata: submission.value.metadata,
    savedAt: new Date().toISOString(),
    providerMode: getEvaluationProviderStatus()
  });

  return res.json(evaluation);
});

router.get("/trainee/dashboard", requireAuth, requireRole("student"), (req, res) => {
  res.json({
    page: "trainee",
    message: "Trainee dashboard placeholder",
    user: {
      username: req.auth.user.username,
      role: req.auth.user.role
    }
  });
});

router.get(
  "/instructor/dashboard",
  requireAuth,
  requireRole("instructor"),
  (req, res) => {
    res.json({
      page: "instructor",
      message: "Instructor dashboard placeholder",
      user: {
        username: req.auth.user.username,
        role: req.auth.user.role
      }
    });
  }
);

export default router;
