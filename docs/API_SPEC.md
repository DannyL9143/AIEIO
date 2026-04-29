# API Spec (Draft)

Base path: `/api/v1`

## GET /scenarios

Returns list of available scenarios, including source metadata for dataset-generated entries.

### Response 200

```json
{
  "scenarios": [
    {
      "id": "scenario_pacific_hadr_01",
      "title": "Humanitarian Aid Mission in Pacific",
      "scenarioSourceType": "dataset_generated",
      "sourceDataset": "GlobalMaritime",
      "sourceRecordIds": ["gm_2024_00412"],
      "objectives": ["Build public trust"],
      "risks": ["Perceived militarization"]
    }
  ]
}
```

## POST /scenarios/generate

Generates scenario candidates from authoritative piracy datasets or custom constraints.

### Request

```json
{
  "mode": "dataset_generated|instructor_custom",
  "datasetOptions": {
    "datasets": ["CORSAIR", "GlobalMaritime"],
    "region": "Gulf of Aden",
    "dateRange": {
      "start": "2023-01-01",
      "end": "2025-12-31"
    },
    "incidentTypes": ["boarding", "attempted_hijack"]
  },
  "customScenario": {
    "title": "string",
    "description": "string",
    "objectives": ["string"],
    "risks": ["string"],
    "stakeholders": ["string"]
  }
}
```

### Response 200

```json
{
  "scenarios": [
    {
      "id": "scenario_piracy_001",
      "title": "Piracy Boarding Attempt Near Chokepoint",
      "scenarioSourceType": "dataset_generated",
      "sourceDataset": "CORSAIR",
      "sourceRecordIds": ["corsair_12991"],
      "sourceMetadata": {
        "incidentDate": "2024-08-14",
        "incidentRegion": "Horn of Africa",
        "incidentType": "boarding_attempt",
        "vesselType": "commercial_cargo"
      }
    }
  ]
}
```

## POST /personas/generate

Generates personas for a scenario.

### Request

```json
{
  "scenarioId": "scenario_pacific_hadr_01",
  "audienceGroups": [
    "us_public",
    "local_civilians",
    "allied_governments",
    "host_nation_media",
    "adversary_outlets",
    "internal_military"
  ]
}
```

### Response 200

```json
{
  "personas": []
}
```

## POST /evaluate

Runs complete simulation and scoring for submitted message.

### Request

```json
{
  "role": "student",
  "scenarioId": "scenario_pacific_hadr_01",
  "messageType": "press_statement",
  "messageText": "Marine forces are on site to coordinate aid and ensure safe distribution.",
  "metadata": {
    "exerciseId": "exercise_001",
    "authorId": "student_007"
  }
}
```

### Response 200

```json
{
  "evaluationId": "eval_123",
  "overall": {
    "trustScore": 68,
    "escalationRisk": 22,
    "misinterpretationRisk": 36,
    "misinformationPotential": 48,
    "opsecConcernScore": 15
  },
  "personaReactions": [],
  "riskFindings": [],
  "rewrite": {
    "suggestedMessage": "Our priority is rapid humanitarian support in coordination with local authorities.",
    "whyItImproves": [
      "Reduces militarized framing",
      "Improves local legitimacy emphasis"
    ]
  }
}
```

## POST /evaluate/rewrite

Re-evaluates suggested or edited rewrite.

### Request

```json
{
  "evaluationId": "eval_123",
  "updatedMessageText": "Our priority is rapid humanitarian support in coordination with local authorities."
}
```

### Response 200

```json
{
  "evaluationId": "eval_124",
  "delta": {
    "trustScore": 11,
    "misinterpretationRisk": -9
  }
}
```

## GET /health

Returns service and provider status for demo readiness.

### Response 200

```json
{
  "status": "ok",
  "llmProvider": "available"
}
```

## Error Format

```json
{
  "error": {
    "code": "SCHEMA_VALIDATION_FAILED",
    "message": "Output did not match EvaluationResult schema."
  }
}
```

## Notes

- In `dataset_generated` mode, response should include full available source metadata from records.
- In `instructor_custom` mode, scenario is created from request payload without dataset dependency.
