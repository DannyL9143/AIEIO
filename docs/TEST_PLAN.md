# Test Plan

## Goal

Validate that AIEIO reliably demonstrates measurable messaging improvement and explainable risk feedback in a live hackathon demo.

## Test Environments

- Local development runtime
- Containerized runtime (if available)
- External hosted runtime (reverse-proxy + TLS)
- Live model mode and mock fallback mode

## External Deployment Smoke Test

Use this sequence immediately after external deployment:

1. `GET /api/v1/health`
   - Expect `status: ok`
   - Confirm `llmProvider` is present (`mock` or `available`)
2. `GET /api/v1/scenarios?limit=2`
   - Must return scenario list (if this fails with file-not-found, dataset files are not mounted/copied to `/app/data`)
3. `POST /api/v1/scenarios/generate` with `mode=instructor_custom`
   - Must return one scenario with `scenarioSourceType: instructor_custom`
4. `POST /api/v1/scenarios/generate` with `mode=dataset_generated`
   - Must return dataset-generated scenarios and `sourceMetadata.sourceSpecific`
5. `POST /api/v1/evaluate`
   - Must return schema-valid score output and persist record to `data/evaluations/records.json`

## Automated Smoke Script

Run from `backend/`:

```bash
npm run test:smoke
```

This runs local smoke checks against `http://localhost:3000` by default.

For remote:

```bash
BASE_URL=https://aieio.forceclone.com npm run test:smoke:remote
```

Optional auth checks can be enabled:

```bash
BASE_URL=https://aieio.forceclone.com TEST_USERNAME=<username> TEST_PASSWORD=<password> npm run test:smoke:remote
```

Script validates:
- health response and provider field
- scenario list (`/scenarios`)
- scenario generation (`dataset_generated` and `instructor_custom`)
- evaluation contract (`/evaluate`)
- auth flow (`/auth/login` and `/auth/me`) when credentials are supplied

## Critical Path Tests (Must Pass)

1. Scenario Load
   - Select dataset-generated piracy scenario from authoritative source list
   - Verify objectives/risks/stakeholders and source metadata render
   - Create/select instructor custom scenario and verify custom path works

2. Message Evaluation
   - Submit draft message
   - Verify response includes persona reactions, risk findings, and scorecard

3. Rewrite Loop
   - Apply suggested rewrite
   - Re-run evaluation
   - Verify at least one meaningful metric improves or high-severity risk decreases

4. Role Behavior
   - Trainee run flagged as scored
   - Instructor test flagged as non-scored

5. Fallback Reliability
   - Disable live provider
   - Verify mock mode returns deterministic valid output

## Test Scenarios

- Dataset-generated piracy scenario from `CORSAIR`
- Dataset-generated piracy scenario from `GlobalMaritime`
- Instructor custom scenario (no dataset dependency)

## Validation Checklist

- [ ] All required JSON fields present and schema-valid
- [ ] Dataset-generated scenarios include provenance fields and metadata descriptions
- [ ] Risk findings include evidence and recommendation
- [ ] Explainability rationale is concise and understandable
- [ ] UI shows all core metrics without layout break
- [ ] End-to-end run completes within acceptable demo timing
- [ ] Both scenario paths (dataset-generated and custom) pass end-to-end evaluation loop

## Demo Prep Validation (Current UI)

Run this checklist after redeploying to hosted server and before rehearsal:

### Instructor Mode

- [ ] Source type includes both `Instructor Custom` and `Dataset Generated (Unified Model)`
- [ ] Dataset checklist is visible and can toggle `GlobalMaritime` / `CORSAIR` / `Instructor Uploads`
- [ ] Dataset summary text updates when checklist options change
- [ ] `AI Generate Dataset` button shows generated dataset draft card and updates source type/context
- [ ] Preview card shows `Datasets Used` for the current scenario
- [ ] Workflow cards on left update color as actions progress (`Build` -> `Publish` -> `Review` -> `Final`)
- [ ] `System States and Recovery` panel renders sample states and recovery actions

### Trainee Mode

- [ ] Header/role text uses `Trainee` terminology (not `Student`) in visible UI copy
- [ ] Flow navigation cards on left update color as trainee progresses through steps
- [ ] Drafting/assessment button labels match demo script wording (`Run AI Assessment`, `Compare Rewrite`, submit/refresh review actions)
- [ ] Assessment flow still works end-to-end: evaluate -> compare rewrite -> submit -> refresh status
- [ ] Trainee toasts and inline notes use updated trainee-focused wording

### Demo Readiness Gate

- [ ] Complete one full instructor-custom path and one unified dataset path without errors
- [ ] Confirm visible workflow progression in both instructor and trainee views during live narration
- [ ] Capture any copy/UX mismatch as P2 unless it blocks presenter clarity

## Defect Priority Rules

- P0: Blocks end-to-end demo flow
- P1: Incorrect scoring/risk semantics in output
- P2: UI/polish issues not blocking demonstration

Fix order: P0 -> P1 -> P2.
