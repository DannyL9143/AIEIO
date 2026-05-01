# TODO (48-Hour Execution Checklist)

Labels:
- `MUST` = required for demo win condition
- `SHOULD` = valuable if core flow stable
- `STRETCH` = only if time remains

## Kickoff Deployment

- [x] `MUST` (Owner: LaneA, Target: H+1) Stand up containerized Node.js app with static frontend served by backend.
- [x] `MUST` (Owner: LaneA, Target: H+2) Implement JWT login with JSON-backed credentials and role lookup from `data/users/users.json`.
- [x] `MUST` (Owner: LaneA+LaneB, Target: H+3) Add role-based redirects after login without UI role selector.
- [x] `MUST` (Owner: LaneA, Target: H+3) Seed kickoff users (`danny`, `danny.instructor`, `judge`, `judge.instructor`) and capture generated passwords.
- [x] `MUST` (Owner: LaneA, Target: H+4) Verify health endpoint and role-protected routes in both local and container runtime.

## Backend

- [x] `MUST` (Owner: LaneA, Target: H+2) Implement dataset ingestion/normalization for `CORSAIR` and `GlobalMaritime`.
- [x] `MUST` (Owner: LaneA, Target: H+3) Implement `/api/v1/scenarios` endpoint with metadata-rich dataset-generated scenario listing.
- [x] `MUST` (Owner: LaneA, Target: H+4) Implement `/api/v1/evaluate` endpoint returning schema-valid output.
- [x] `MUST` (Owner: LaneA, Target: H+6) Add schema validation and output normalization.
- [x] `MUST` (Owner: LaneA, Target: H+8) Add provider abstraction with live and mock modes.
- [x] `MUST` (Owner: LaneA, Target: H+9) Add dual-mode scenario generation API path (`dataset_generated` and `instructor_custom`).
- [x] `MUST` (Owner: LaneA, Target: H+11) Implement `/api/v1/evaluate/rewrite` endpoint with trust/misinterpretation delta output.
- [x] `SHOULD` (Owner: LaneA, Target: H+12) Add lightweight instructor review feed endpoint backed by saved evaluation records.
- [x] `SHOULD` (Owner: LaneA, Target: H+12) Persist evaluations as local JSON records.

## Frontend

- [x] `MUST` (Owner: LaneB, Target: H+15) Add explicit "selected scenario loaded" visual treatment with tinted detail panel and selected-card highlight.
- [x] `MUST` (Owner: LaneB, Target: H+15) Replace role-switch debug control with role-true workflow based on login only.
- [x] `MUST` (Owner: LaneB, Target: H+16) Expand tone selection options and clarify how tone affects trainee drafting and assessment.
- [x] `MUST` (Owner: LaneB, Target: H+16) Professionalize scorecard labels/capitalization and apply color-coded numeric and severity styling.
- [x] `MUST` (Owner: LaneA+LaneB, Target: H+17) Implement trainee submit-to-instructor step with clear pending/final instructor assessment status.
- [x] `MUST` (Owner: LaneA+LaneB, Target: H+17) Display automated assessment and final instructor assessment side-by-side in review experience.
- [x] `SHOULD` (Owner: LaneB, Target: H+18) Convert "Fallback States" into production "System States and Recovery" guidance with real hooks.
- [x] `SHOULD` (Owner: LaneB, Target: H+18) Replace placeholder flow navigation panel with actionable workflow progress guidance.
- [x] `MUST` (Owner: LaneB, Target: H+5) Build scenario selection screen.
- [x] `MUST` (Owner: LaneB, Target: H+6) Add explicit mode selection for dataset-generated vs custom scenario.
- [x] `MUST` (Owner: LaneB, Target: H+7) Build message drafting form with message type selector.
- [x] `MUST` (Owner: LaneB, Target: H+9) Render audience reactions and risk list.
- [x] `MUST` (Owner: LaneB, Target: H+10) Render scorecard with trust and risk metrics.
- [x] `MUST` (Owner: LaneB, Target: H+11) Display source metadata for dataset-generated scenarios.
- [x] `MUST` (Owner: LaneB, Target: H+5) Define trainee UX flow map (login -> scenario browse -> draft -> evaluate -> score -> rewrite -> compare).
- [x] `MUST` (Owner: LaneB, Target: H+5) Define instructor UX flow map (login -> class view -> custom scenario setup -> preview -> student response review).
- [x] `MUST` (Owner: LaneB, Target: H+6) Build app shell skeleton (top nav, page frame, role-aware side panel placeholders).
- [x] `MUST` (Owner: LaneB, Target: H+6) Add authentication/loading skeletons (login submit state, session restore, role redirect transition).
- [x] `MUST` (Owner: LaneB, Target: H+7) Add scenario gallery/card-list skeletons with filter/search placeholder states.
- [x] `MUST` (Owner: LaneB, Target: H+7) Add scenario detail skeletons (context, stakes, audience personas, source metadata).
- [x] `MUST` (Owner: LaneB, Target: H+8) Add message editor skeletons (prompt brief, draft textarea, message type controls, action bar).
- [x] `MUST` (Owner: LaneB, Target: H+9) Add evaluation-result skeletons (reaction panels, risk findings, severity chips).
- [x] `MUST` (Owner: LaneB, Target: H+10) Add scorecard/rewrite comparison skeletons (before vs after cards and delta indicators).
- [x] `MUST` (Owner: LaneB, Target: H+10) Add instructor workspace skeletons (scenario builder form, assignment panel, review queue list, learner detail panel).
- [x] `SHOULD` (Owner: LaneB, Target: H+12) Add empty-state designs for no scenarios, no submissions, and no evaluation history.
- [x] `SHOULD` (Owner: LaneB, Target: H+13) Add error-state designs with recovery actions (retry, go back, switch mode).
- [x] `SHOULD` (Owner: LaneB, Target: H+14) Add interaction polish states (button pending, optimistic transitions, toast/inline feedback).
- [x] `SHOULD` (Owner: LaneB, Target: H+14) Add trainee/instructor role toggle behavior.
- [x] `STRETCH` (Owner: LaneB, Target: H+24) Add misinformation spread mini-visual.

## AI / Prompting

- [ ] `MUST` (Owner: LaneC, Target: H+3) Finalize prompt templates in `PROMPT_LIBRARY.md`.
- [ ] `MUST` (Owner: LaneC, Target: H+6) Calibrate persona output consistency across 4-6 groups.
- [ ] `MUST` (Owner: LaneC, Target: H+8) Calibrate risk scanner severity mapping.
- [ ] `MUST` (Owner: LaneC, Target: H+11) Implement rewrite recommendation prompt and response parser.
- [ ] `SHOULD` (Owner: LaneC, Target: H+20) Add confidence notes and uncertainty handling.

## Integration

- [x] `MUST` (Owner: LaneA+LaneB, Target: H+11) Wire frontend evaluate action to backend.
- [ ] `MUST` (Owner: LaneA+LaneC, Target: H+12) Confirm end-to-end JSON schema compatibility.
- [x] `MUST` (Owner: All, Target: H+14) Validate dual-path loop: dataset-generated scenario and custom scenario -> draft -> simulate -> score -> rewrite -> re-score.
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
