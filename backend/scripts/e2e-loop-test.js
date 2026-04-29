/* eslint-disable no-console */
const baseUrl = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const username = process.env.TEST_USERNAME || "";
const password = process.env.TEST_PASSWORD || "";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  if (!response.ok) {
    throw new Error(
      `${options.method || "GET"} ${path} failed (${response.status}): ${JSON.stringify(body)}`
    );
  }
  return body;
}

async function runDatasetGeneratedLoop() {
  const scenarioList = await request("/api/v1/scenarios?limit=1");
  assert(Array.isArray(scenarioList.scenarios) && scenarioList.scenarios.length > 0, "No dataset scenarios found.");
  const scenario = scenarioList.scenarios[0];

  const evaluation = await request("/api/v1/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      role: "student",
      scenarioId: scenario.id,
      messageType: "press_statement",
      messageText: "We are coordinating with local authorities to protect civilians and reduce rumors.",
      tone: "transparent_briefing",
      metadata: {
        exerciseId: "e2e_dataset",
        authorId: "e2e_student"
      }
    })
  });
  assert(typeof evaluation.evaluationId === "string", "Dataset loop missing evaluationId.");

  const rewrite = await request("/api/v1/evaluate/rewrite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      evaluationId: evaluation.evaluationId,
      updatedMessageText:
        "Our priority is civilian safety, coordinated response, and transparent updates with verified facts."
    })
  });
  assert(typeof rewrite.evaluationId === "string", "Dataset rewrite missing evaluationId.");
  assert(typeof rewrite.delta?.trustScore === "number", "Dataset rewrite missing trust delta.");
  assert(typeof rewrite.evaluation?.overall?.trustScore === "number", "Dataset rewrite missing evaluation payload.");
  console.log("PASS e2e dataset loop");
}

async function runInstructorCustomLoop() {
  const generated = await request("/api/v1/scenarios/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "instructor_custom",
      customScenario: {
        title: "E2E Custom Scenario",
        description: "Instructor-authored scenario for end-to-end validation.",
        region: "Indo-Pacific",
        objectives: ["Build trust"],
        risks: ["Misinterpretation"],
        stakeholders: ["Local civilians", "Media"]
      }
    })
  });
  assert(Array.isArray(generated.scenarios) && generated.scenarios.length > 0, "Custom generation returned no scenarios.");
  const scenario = generated.scenarios[0];

  const evaluation = await request("/api/v1/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      role: "student",
      scenarioId: scenario.id,
      messageType: "talking_points",
      messageText: "We remain focused on safety, coordination, and factual updates through trusted channels.",
      tone: "calm_factual",
      metadata: {
        exerciseId: "e2e_custom",
        authorId: "e2e_student"
      }
    })
  });
  assert(typeof evaluation.evaluationId === "string", "Custom loop missing evaluationId.");

  const rewrite = await request("/api/v1/evaluate/rewrite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      evaluationId: evaluation.evaluationId,
      updatedMessageText:
        "Our teams are coordinating closely with local authorities to protect communities and share verified updates."
    })
  });
  assert(typeof rewrite.delta?.misinterpretationRisk === "number", "Custom rewrite missing misinterpretation delta.");
  console.log("PASS e2e custom loop");
}

async function testInstructorReviewsIfConfigured() {
  if (!username || !password) {
    console.log("SKIP instructor review auth check (set TEST_USERNAME and TEST_PASSWORD).");
    return;
  }
  const login = await request("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  assert(typeof login.token === "string", "Auth login missing token.");
  assert(login.user?.role === "instructor", "Provided test user must be instructor role.");

  const reviews = await request("/api/v1/instructor/reviews", {
    headers: { Authorization: `Bearer ${login.token}` }
  });
  assert(Array.isArray(reviews.reviews), "Instructor review feed missing reviews array.");
  console.log("PASS instructor review feed auth check");
}

async function main() {
  console.log(`Running e2e loop tests against ${baseUrl}`);
  await runDatasetGeneratedLoop();
  await runInstructorCustomLoop();
  await testInstructorReviewsIfConfigured();
  console.log("E2E loop tests completed successfully.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
