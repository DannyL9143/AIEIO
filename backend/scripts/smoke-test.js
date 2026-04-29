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

async function testHealth() {
  const body = await request("/api/v1/health");
  assert(body.status === "ok", "Health check missing status=ok");
  assert(typeof body.llmProvider === "string", "Health check missing llmProvider");
  console.log("PASS health");
}

async function testScenarioList() {
  const body = await request("/api/v1/scenarios?limit=2");
  assert(Array.isArray(body.scenarios), "Scenarios list missing scenarios array");
  assert(body.scenarios.length > 0, "Scenarios list returned empty array");
  assert(
    body.scenarios[0]?.sourceMetadata?.sourceSpecific !== undefined,
    "Scenario missing sourceMetadata.sourceSpecific"
  );
  console.log("PASS scenarios list");
  return body.scenarios[0].id;
}

async function testGenerateCustom() {
  const payload = {
    mode: "instructor_custom",
    customScenario: {
      title: "Smoke test custom scenario",
      description: "Testing custom generation path",
      region: "Strait of Malacca",
      objectives: ["Build trust"],
      risks: ["Misinformation spread"],
      stakeholders: ["Host nation media"]
    }
  };

  const body = await request("/api/v1/scenarios/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  assert(Array.isArray(body.scenarios), "Custom generate missing scenarios array");
  assert(
    body.scenarios[0]?.scenarioSourceType === "instructor_custom",
    "Custom generate did not return instructor_custom scenario"
  );
  console.log("PASS scenarios generate custom");
}

async function testGenerateDataset() {
  const payload = {
    mode: "dataset_generated",
    datasetOptions: {
      datasets: ["CORSAIR"],
      region: "Gulf of Guinea",
      incidentTypes: ["Boarded"]
    }
  };

  const body = await request("/api/v1/scenarios/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  assert(Array.isArray(body.scenarios), "Dataset generate missing scenarios array");
  assert(body.scenarios.length > 0, "Dataset generate returned no scenarios");
  assert(
    body.scenarios[0]?.scenarioSourceType === "dataset_generated",
    "Dataset generate did not return dataset_generated scenario"
  );
  console.log("PASS scenarios generate dataset");
}

async function testEvaluate(scenarioId) {
  const payload = {
    role: "student",
    scenarioId,
    messageType: "press_statement",
    messageText:
      "We are coordinating with local authorities to maintain safety and reduce misinformation.",
    tone: "calm_factual",
    metadata: {
      exerciseId: "smoke_test",
      authorId: "smoke_runner"
    }
  };

  const body = await request("/api/v1/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  assert(typeof body.evaluationId === "string", "Evaluate response missing evaluationId");
  assert(typeof body.overall?.trustScore === "number", "Evaluate response missing scores");
  assert(Array.isArray(body.personaReactions), "Evaluate response missing personaReactions");
  assert(Array.isArray(body.riskFindings), "Evaluate response missing riskFindings");
  assert(typeof body.rewrite?.suggestedMessage === "string", "Evaluate response missing rewrite");
  console.log("PASS evaluate");
}

async function testAuthIfConfigured() {
  if (!username || !password) {
    console.log("SKIP auth (set TEST_USERNAME and TEST_PASSWORD to enable)");
    return;
  }

  const login = await request("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  assert(typeof login.token === "string", "Auth login did not return token");
  const me = await request("/api/v1/auth/me", {
    headers: { Authorization: `Bearer ${login.token}` }
  });
  assert(typeof me.user?.username === "string", "Auth /me missing user payload");
  console.log("PASS auth");
}

async function main() {
  console.log(`Running smoke tests against ${baseUrl}`);
  await testHealth();
  const scenarioId = await testScenarioList();
  await testGenerateCustom();
  await testGenerateDataset();
  await testEvaluate(scenarioId);
  await testAuthIfConfigured();
  console.log("Smoke tests completed successfully.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

