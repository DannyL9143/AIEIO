# TODO (48-Hour Execution Checklist)

Labels:
- `MUST` = required for demo win condition
- `SHOULD` = valuable if core flow stable
- `STRETCH` = only if time remains

## Backend

- [ ] `MUST` (Owner: LaneA, Target: H+2) Implement dataset ingestion/normalization for `CORSAIR` and `GlobalMaritime`.
- [ ] `MUST` (Owner: LaneA, Target: H+3) Implement `/api/v1/scenarios` endpoint with metadata-rich dataset-generated scenario listing.
- [ ] `MUST` (Owner: LaneA, Target: H+4) Implement `/api/v1/evaluate` endpoint returning schema-valid output.
- [ ] `MUST` (Owner: LaneA, Target: H+6) Add schema validation and output normalization.
- [ ] `MUST` (Owner: LaneA, Target: H+8) Add provider abstraction with live and mock modes.
- [ ] `MUST` (Owner: LaneA, Target: H+9) Add dual-mode scenario generation API path (`dataset_generated` and `instructor_custom`).
- [ ] `SHOULD` (Owner: LaneA, Target: H+12) Persist evaluations as local JSON records.

## Frontend

- [ ] `MUST` (Owner: LaneB, Target: H+5) Build scenario selection screen.
- [ ] `MUST` (Owner: LaneB, Target: H+6) Add explicit mode selection for dataset-generated vs custom scenario.
- [ ] `MUST` (Owner: LaneB, Target: H+7) Build message drafting form with message type selector.
- [ ] `MUST` (Owner: LaneB, Target: H+9) Render audience reactions and risk list.
- [ ] `MUST` (Owner: LaneB, Target: H+10) Render scorecard with trust and risk metrics.
- [ ] `MUST` (Owner: LaneB, Target: H+11) Display source metadata for dataset-generated scenarios.
- [ ] `SHOULD` (Owner: LaneB, Target: H+14) Add student/instructor role toggle behavior.
- [ ] `STRETCH` (Owner: LaneB, Target: H+24) Add misinformation spread mini-visual.

## AI / Prompting

- [ ] `MUST` (Owner: LaneC, Target: H+3) Finalize prompt templates in `PROMPT_LIBRARY.md`.
- [ ] `MUST` (Owner: LaneC, Target: H+6) Calibrate persona output consistency across 4-6 groups.
- [ ] `MUST` (Owner: LaneC, Target: H+8) Calibrate risk scanner severity mapping.
- [ ] `MUST` (Owner: LaneC, Target: H+11) Implement rewrite recommendation prompt and response parser.
- [ ] `SHOULD` (Owner: LaneC, Target: H+20) Add confidence notes and uncertainty handling.

## Integration

- [ ] `MUST` (Owner: LaneA+LaneB, Target: H+11) Wire frontend evaluate action to backend.
- [ ] `MUST` (Owner: LaneA+LaneC, Target: H+12) Confirm end-to-end JSON schema compatibility.
- [ ] `MUST` (Owner: All, Target: H+14) Validate dual-path loop: dataset-generated scenario and custom scenario -> draft -> simulate -> score -> rewrite -> re-score.
- [ ] `SHOULD` (Owner: All, Target: H+28) Improve response latency and UI clarity.

## Demo Preparation

- [ ] `MUST` (Owner: LaneC, Target: H+16) Prepare 2 reliable dataset-generated piracy scenarios with provenance metadata and 1 custom scenario.
- [ ] `MUST` (Owner: All, Target: H+18) Run `TEST_PLAN.md` and resolve critical blockers.
- [ ] `MUST` (Owner: Presenter, Target: H+22) Rehearse `DEMO_SCRIPT.md` to 3-5 minutes.
- [ ] `MUST` (Owner: All, Target: H+24) Create backup mock-output demo mode.
- [ ] `SHOULD` (Owner: Presenter, Target: H+30) Prepare 5 likely judge Q&A responses.

## Definition of Done

- Demo runs without failures in both live and fallback modes.
- Score change after rewrite is visible and explainable.
- Every MUST task marked complete with demo evidence.
