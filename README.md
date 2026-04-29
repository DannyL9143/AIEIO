# AIEIO

Artificial Intelligence Educator for Information Operations (AIEIO)

AIEIO is a lightweight AI Red Team for Public Affairs messaging. It helps Marines draft mission communications, simulate how different audiences react, and receive explainable risk and effectiveness feedback in minutes.

## Hackathon Scope (48 Hours)

This project is intentionally scoped for a 2-day build:

- Dual-mode scenario creation:
  - Dataset-generated piracy scenarios from authoritative data in `data/CORSAIR` and `data/GlobalMaritime`
  - Instructor-authored custom scenarios
- Scenario list includes rich metadata context from source records (for dataset-generated mode)
- Synthetic audience simulation across 4-6 audience groups
- Risk scanner for OPSEC, escalation, misinterpretation, and misinformation potential
- Explainable scorecard with message rewrite recommendations

Out of scope for hackathon MVP:

- Full training platform replacement
- Complex model training pipelines
- Real-time voice/avatar simulation
- Deep military system integrations

## Quick Start (Documentation-First)

1. Read the project direction in `docs/PROJECT_PLAN.md`
2. Confirm MVP requirements in `docs/PRODUCT_REQUIREMENTS.md`
3. Lock contracts in `docs/DATA_SCHEMAS.md` and `docs/API_SPEC.md`
4. Execute task list in `docs/TODO.md`
5. Validate with `docs/TEST_PLAN.md`
6. Rehearse final presentation with `docs/DEMO_SCRIPT.md`

## Kickoff Deployment Runbook

### 1) Backend setup

```bash
cd backend
npm install
```

### 2) Seed login users

```bash
cd backend
npm run seed:users
```

The seed script provisions these users with generated passwords:

- `danny` (`student`)
- `danny.instructor` (`instructor`)
- `judge` (`student`)
- `judge.instructor` (`instructor`)

Passwords are printed once at seed time and only hashes are stored in `data/users/credentials.json`.

### 3) Local run

```bash
cd backend
npm start
```

Open `http://localhost:3000` and log in. Role-based routing is automatic based on the user JSON record.

### 4) Container run

Create `.env` from `.env.example`, then run:

```bash
docker compose up --build
```

### 5) Deploy image to Linux server (before commit if needed)

Build and export image from your local machine:

```bash
docker build -t aieio-web:0.1.0 .
docker save -o aieio-web_0.1.0.tar aieio-web:0.1.0
```

Copy image tar to Linux server:

```bash
scp aieio-web_0.1.0.tar <user>@<server-ip>:/tmp/
```

On Linux server, load and run:

```bash
docker load -i /tmp/aieio-web_0.1.0.tar
mkdir -p /opt/aieio/data
cat > /opt/aieio/.env <<'EOF'
PORT=3000
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=8h
EVALUATION_PROVIDER_MODE=mock
EOF
docker run -d \
  --name aieio-web \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file /opt/aieio/.env \
  -v /opt/aieio/data:/app/data \
  aieio-web:0.1.0
```

Copy required dataset folders into the mounted data path (required for dataset-generated APIs):

```bash
mkdir -p /opt/aieio/data/CORSAIR /opt/aieio/data/GlobalMaritime /opt/aieio/data/users
```

From your source checkout (or extracted artifacts), copy:
- `data/CORSAIR/corsair_pirate_attacks.csv` -> `/opt/aieio/data/CORSAIR/`
- `data/GlobalMaritime/global_maritime_pirate_attacks.csv` -> `/opt/aieio/data/GlobalMaritime/`
- `data/users/users.json` -> `/opt/aieio/data/users/`

Seed users on Linux server:

```bash
docker exec -it aieio-web node scripts/seed-users.js
```

### 6) Key API checks

- `GET /api/v1/health`
- `GET /api/v1/scenarios?limit=2` (dataset files must be present)
- `POST /api/v1/scenarios/generate` with `mode=instructor_custom`
- `POST /api/v1/scenarios/generate` with `mode=dataset_generated`
- `POST /api/v1/evaluate`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET /api/v1/trainee/dashboard` (student-only)
- `GET /api/v1/instructor/dashboard` (instructor-only)

### 7) Automated smoke test (local + remote)

From `backend/`:

```bash
npm run test:smoke
```

Remote target:

```bash
BASE_URL=https://aieio.forceclone.com npm run test:smoke:remote
```

Optional auth verification:

```bash
BASE_URL=https://aieio.forceclone.com TEST_USERNAME=<username> TEST_PASSWORD=<password> npm run test:smoke:remote
```

### Kickoff Security Notes

- JWT secret must be set through environment variables in hosted deployment.
- Passwords are bcrypt-hashed; plaintext passwords are never stored.
- JWT is bearer-token based for kickoff speed and should be migrated to hardened session/cookie handling after hackathon.

## Documentation Index

- `docs/PROJECT_PLAN.md` - Mission, value proposition, success criteria, non-goals
- `docs/HACKATHON_EXECUTION_PLAN.md` - Day 1/Day 2 schedule and risk fallback
- `docs/PRODUCT_REQUIREMENTS.md` - MVP requirements and acceptance criteria
- `docs/USER_FLOWS.md` - Student/instructor flow definitions
- `docs/ARCHITECTURE.md` - Node backend and web UI architecture
- `docs/DATA_SCHEMAS.md` - JSON contracts for scenario/persona/evaluation
- `docs/API_SPEC.md` - API endpoint contract draft
- `docs/PROMPT_LIBRARY.md` - Prompt templates and guardrails
- `docs/TODO.md` - Actionable, time-boxed build checklist
- `docs/TEST_PLAN.md` - Fast validation and regression checklist
- `docs/DEMO_SCRIPT.md` - 3-5 minute judge-ready walkthrough

## Team Working Rules

- Keep all features tied to visible demo value.
- Prefer deterministic output JSON from model calls.
- Use mock/fallback responses if API reliability is unstable.
- Ship end-to-end flow first, polish second.
