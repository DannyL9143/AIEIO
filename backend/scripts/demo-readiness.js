/* eslint-disable no-console */
import { spawn } from "node:child_process";

const baseUrl = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");

const checks = [
  {
    label: "Smoke",
    script: "scripts/smoke-test.js"
  },
  {
    label: "E2E Loop",
    script: "scripts/e2e-loop-test.js"
  }
];

function runNodeScript(scriptPath) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [scriptPath], {
      env: process.env,
      stdio: "pipe"
    });

    let output = "";
    child.stdout.on("data", (chunk) => {
      output += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      output += String(chunk);
    });

    child.on("close", (code) => {
      resolve({
        ok: code === 0,
        code,
        output
      });
    });
  });
}

async function main() {
  console.log(`Running demo readiness checks against ${baseUrl}`);
  const results = [];

  for (const check of checks) {
    // Run checks in sequence so output stays readable.
    const result = await runNodeScript(check.script);
    results.push({ ...check, ...result });
    const status = result.ok ? "PASS" : "FAIL";
    console.log(`${status} ${check.label}`);
  }

  console.log("\nDemo Readiness Summary");
  for (const result of results) {
    const status = result.ok ? "[PASS]" : "[FAIL]";
    console.log(`${status} ${result.label}`);
  }

  const failed = results.filter((result) => !result.ok);
  if (failed.length > 0) {
    console.log("\nFailure details:");
    for (const result of failed) {
      console.log(`--- ${result.label} output ---`);
      console.log(result.output.trim() || "(no output)");
    }
    process.exit(1);
  }

  console.log("\nAll demo readiness checks passed.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
