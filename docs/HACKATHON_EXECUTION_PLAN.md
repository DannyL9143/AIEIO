# Hackathon Execution Plan (48 Hours)

## Team Lanes

- Lane A: Backend/API and schema enforcement
- Lane B: Frontend flow and dashboard UX
- Lane C: Prompt engineering, risk logic, and demo prep

## Day 1 (Build the Spine)

### Hour 0-2

- Finalize `DATA_SCHEMAS.md` and `API_SPEC.md`
- Normalize authoritative datasets from `data/CORSAIR` and `data/GlobalMaritime`
- Generate metadata-rich scenario list and keep custom scenario mode available
- Define scoring rubric and risk taxonomy

### Hour 2-6

- Implement backend endpoints for scenario load and message evaluation
- Integrate LLM call abstraction with mock mode
- Implement JSON schema validation for model outputs
- Ensure dual-mode scenario selection flow (dataset-generated vs custom)

### Hour 6-10

- Build minimal frontend (scenario select, message form, evaluate button)
- Render audience reactions and scorecard
- Add rewrite recommendation step and re-evaluate button

### Hour 10-14

- Connect UI to backend end-to-end
- Add instructor/student mode toggle
- Capture outputs as local JSON artifacts

### Hour 14-16

- Stabilization pass and basic styling
- Validate with 2 dataset-generated piracy scenarios and 1 instructor custom scenario
- Record known issues and fallback plan

## Day 2 (Reliability + Story)

### Hour 16-22

- Improve explainability text clarity
- Tune prompt templates for consistency
- Add confidence notes and concise rationale snippets

### Hour 22-28

- Add final dashboard polish and visual risk indicators
- Optional stretch: simple misinformation propagation graphic

### Hour 28-34

- Execute formal test plan and fix demo blockers
- Prepare backup offline/demo-safe outputs

### Hour 34-40

- Rehearse demo script multiple times
- Time-box to 3-5 minutes
- Verify score improvement before/after rewrite
- Rehearse both scenario paths: dataset-generated and custom

### Hour 40-48

- Final packaging, README verification, and handoff
- Prepare judge Q&A talking points
- Freeze code and reduce change risk

## Priority Matrix

- MUST: End-to-end scenario -> draft -> simulation -> score -> rewrite -> improved score
- SHOULD: Role-aware student/instructor behavior and local result persistence
- STRETCH: Misinformation spread visual and class metrics panel

## Fallback Strategy

If LLM service degrades:

- Switch to deterministic mock response mode
- Use precomputed audience reaction JSON
- Continue live UI walkthrough and scoring/risk explanation
