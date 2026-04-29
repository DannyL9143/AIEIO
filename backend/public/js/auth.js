const tokenKey = "aieio_token";
const loadingClass = "hidden";
const appState = {
  selectedScenario: null,
  lastEvaluation: null,
  instructorReviewStatus: "not_submitted"
};
const scenarioCacheKey = "aieio_student_scenarios_cache_v1";
const scenarioCacheTtlMs = 60 * 1000;

async function login(username, password) {
  const response = await fetch("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Login failed.");
  }
  localStorage.setItem(tokenKey, payload.token);
  return payload.user;
}

async function me() {
  const token = localStorage.getItem(tokenKey);
  if (!token) {
    return null;
  }
  const response = await fetch("/api/v1/auth/me", {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) {
    localStorage.removeItem(tokenKey);
    return null;
  }
  const payload = await response.json();
  return payload.user;
}

function token() {
  return localStorage.getItem(tokenKey);
}

function dashboardPathForRole(role) {
  return role === "instructor" ? "/instructor.html" : "/trainee.html";
}

async function apiJson(url, options = {}) {
  const authToken = token();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  const response = await fetch(url, {
    ...options,
    headers
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      payload?.error?.message || payload?.error || "Request failed.";
    throw new Error(message);
  }
  return payload;
}

function showToast(message, variant = "success") {
  const zone = document.getElementById("toast-zone");
  if (!zone) {
    return;
  }
  const toast = document.createElement("div");
  toast.className = `toast ${variant}`;
  toast.textContent = message;
  zone.appendChild(toast);
  window.setTimeout(() => {
    toast.remove();
  }, 2500);
}

function titleCase(text) {
  return String(text || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function scoreChipClass(label, value) {
  const numeric = Number(value || 0);
  const isRiskMetric = /risk|misinformation|opsec/i.test(label);
  if (isRiskMetric) {
    return numeric <= 30 ? "good" : numeric <= 60 ? "warn" : "risk";
  }
  return numeric >= 70 ? "good" : numeric >= 45 ? "warn" : "risk";
}

function gradePillClass(grade) {
  const value = String(grade || "").toLowerCase();
  if (["trained", "proficient", "untrained"].includes(value)) {
    return value;
  }
  return "pending";
}

function bindToastButtons() {
  const toastButtons = document.querySelectorAll("[data-toast-message]");
  toastButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const message = String(button.getAttribute("data-toast-message") || "Done.");
      const variant = String(button.getAttribute("data-toast-variant") || "success");
      showToast(message, variant);
    });
  });
}

function renderScoreRows(overall) {
  return Object.entries(overall)
    .map(
      ([label, value]) =>
        `<div class="kv-row"><span>${titleCase(label)}</span><strong class="score-chip ${scoreChipClass(label, value)}">${value}</strong></div>`
    )
    .join("");
}

function renderRiskRows(riskFindings) {
  if (!Array.isArray(riskFindings) || riskFindings.length === 0) {
    return "<p class='inline-note'>No critical risks detected.</p>";
  }
  return riskFindings
    .slice(0, 5)
    .map((risk) => {
      const severity = String(risk.severity || "medium").toLowerCase();
      return `<div class="kv-row"><span>${titleCase(risk.type || "risk")}</span><strong class="severity-pill ${severity}">${titleCase(severity)}</strong></div>`;
    })
    .join("");
}

function renderPersonaRows(personas) {
  if (!Array.isArray(personas) || personas.length === 0) {
    return "<p class='inline-note'>No persona reactions available.</p>";
  }
  return personas
    .slice(0, 5)
    .map(
      (persona) =>
        `<div class="kv-row"><span>${titleCase(persona.personaId || "persona")}</span><strong>${titleCase(persona.sentiment || "neutral")}</strong></div>`
    )
    .join("");
}

function renderStudentInstructorStatus() {
  const statusNode = document.getElementById("student-instructor-status");
  if (!statusNode) {
    return;
  }
  if (!appState.lastEvaluation) {
    statusNode.className = "state-card";
    statusNode.innerHTML =
      "<h4>Instructor Assessment: Not Submitted</h4><p>Submit your response to place it in the instructor review queue.</p>";
    return;
  }
  if (appState.instructorReviewStatus === "pending_instructor") {
    statusNode.className = "state-card";
    statusNode.innerHTML =
      "<h4>Instructor Assessment: Pending</h4><p>Your response is waiting in the instructor queue. Automated assessment is visible above.</p>";
    return;
  }
  const finalOutcome = appState.lastEvaluation?.instructorAssessment?.grade;
  const finalNotes = appState.lastEvaluation?.instructorAssessment?.notes;
  statusNode.className = "state-card final-lock";
  statusNode.innerHTML = `
    <h4>Instructor Assessment: Final <span class="grade-pill ${gradePillClass(finalOutcome)}">${titleCase(finalOutcome || "proficient")}</span></h4>
    <p>${finalNotes || "Instructor assessment finalized."}</p>
  `;
}

async function refreshStudentInstructorStatus() {
  if (!appState.lastEvaluation?.evaluationId) {
    return;
  }
  const payload = await apiJson(
    `/api/v1/student/submissions/${appState.lastEvaluation.evaluationId}/status`
  );
  appState.instructorReviewStatus = payload.reviewStatus || "not_submitted";
  appState.lastEvaluation = {
    ...appState.lastEvaluation,
    instructorAssessment: payload.instructorAssessment || null
  };
  renderStudentInstructorStatus();
}

function renderSelectedScenario() {
  const detail = document.getElementById("student-scenario-detail");
  const scenario = appState.selectedScenario;
  if (!detail) {
    return;
  }
  if (!scenario) {
    detail.className = "state-card empty";
    detail.innerHTML =
      "<h4>Select a scenario</h4><p>Scenario context and source metadata will appear here.</p>";
    return;
  }
  detail.className = "state-card loaded-scenario";
  detail.innerHTML = `
    <h4>${scenario.title}</h4>
    <p>${scenario.description || "No description provided."}</p>
    <div class="kv-list">
      <div class="kv-row"><span>Source</span><strong>${scenario.scenarioSourceType}</strong></div>
      <div class="kv-row"><span>Dataset</span><strong>${scenario.sourceDataset || "Instructor Custom"}</strong></div>
      <div class="kv-row"><span>Region</span><strong>${scenario.region || "Unknown"}</strong></div>
      <div class="kv-row"><span>Incident Type</span><strong>${scenario.sourceMetadata?.incidentType || "N/A"}</strong></div>
    </div>
  `;
}

function renderScenarioList(scenarios) {
  const list = document.getElementById("student-scenario-list");
  const state = document.getElementById("student-scenarios-state");
  if (!list || !state) {
    return;
  }
  list.innerHTML = "";
  if (!scenarios.length) {
    state.classList.remove("hidden");
    return;
  }
  state.classList.add("hidden");
  scenarios.forEach((scenario) => {
    const card = document.createElement("div");
    card.className = "scenario-card";
    card.innerHTML = `
      <div class="meta-pill">${scenario.scenarioSourceType}</div>
      <h4>${scenario.title}</h4>
      <p>${scenario.description || "No description provided."}</p>
      <button class="btn">Open Scenario</button>
    `;
    const openBtn = card.querySelector("button");
    openBtn.addEventListener("click", () => {
      appState.selectedScenario = scenario;
      list.querySelectorAll(".scenario-card").forEach((node) => {
        node.classList.remove("selected");
      });
      card.classList.add("selected");
      renderSelectedScenario();
      showToast(`Loaded scenario: ${scenario.title}`, "success");
    });
    list.appendChild(card);
  });
}

async function loadStudentScenarios() {
  const cachedRaw = window.sessionStorage.getItem(scenarioCacheKey);
  if (cachedRaw) {
    try {
      const cached = JSON.parse(cachedRaw);
      const isFresh =
        Number(cached.savedAt || 0) + scenarioCacheTtlMs > Date.now();
      if (isFresh && Array.isArray(cached.scenarios)) {
        renderScenarioList(cached.scenarios);
        return;
      }
    } catch (_error) {
      window.sessionStorage.removeItem(scenarioCacheKey);
    }
  }

  try {
    const payload = await apiJson("/api/v1/scenarios?limit=8");
    const scenarios = Array.isArray(payload.scenarios) ? payload.scenarios : [];
    renderScenarioList(scenarios);
    window.sessionStorage.setItem(
      scenarioCacheKey,
      JSON.stringify({ savedAt: Date.now(), scenarios })
    );
  } catch (error) {
    const state = document.getElementById("student-scenarios-state");
    if (state) {
      state.className = "state-card error";
      state.innerHTML = `
        <h4>Could not load scenarios</h4>
        <p>${error.message}</p>
      `;
    }
  }
}

function renderEvaluation(evaluation) {
  const state = document.getElementById("student-evaluation-state");
  const results = document.getElementById("student-evaluation-results");
  const overall = document.getElementById("student-overall-scores");
  const risks = document.getElementById("student-risk-findings");
  const personas = document.getElementById("student-persona-reactions");
  const rewriteText = document.getElementById("student-rewrite-text");
  const miniVisual = document.getElementById("student-mini-visual");
  if (!state || !results || !overall || !risks || !personas) {
    return;
  }
  state.classList.add("hidden");
  results.classList.remove("hidden");
  overall.className = "kv-list";
  risks.className = "kv-list";
  personas.className = "kv-list";
  overall.innerHTML = renderScoreRows(evaluation.overall || {});
  risks.innerHTML = renderRiskRows(evaluation.riskFindings || []);
  personas.innerHTML = renderPersonaRows(evaluation.personaReactions || []);
  if (miniVisual) {
    const metrics = [
      {
        label: "Misinformation Potential",
        value: Number(evaluation?.overall?.misinformationPotential || 0)
      },
      {
        label: "Misinterpretation Risk",
        value: Number(evaluation?.overall?.misinterpretationRisk || 0)
      },
      {
        label: "Escalation Risk",
        value: Number(evaluation?.overall?.escalationRisk || 0)
      }
    ];
    miniVisual.innerHTML = metrics
      .map(
        (item) => `
          <div class="mini-bar-row">
            <div class="kv-row"><span>${item.label}</span><strong>${item.value}</strong></div>
            <div class="mini-bar-track"><div class="mini-bar-fill" style="width: ${Math.max(0, Math.min(item.value, 100))}%"></div></div>
          </div>
        `
      )
      .join("");
  }
  if (rewriteText) {
    rewriteText.value = evaluation.rewrite?.suggestedMessage || "";
  }
}

async function bindStudentInteractions(currentUser) {
  const evaluateBtn = document.getElementById("student-evaluate-btn");
  const compareBtn = document.getElementById("student-compare-btn");
  const note = document.getElementById("student-action-note");
  const draftBody = document.getElementById("draft-body");
  const draftMode = document.getElementById("draft-mode");
  const rewriteText = document.getElementById("student-rewrite-text");
  const submitBtn = document.getElementById("student-submit-btn");
  const refreshStatusBtn = document.getElementById("student-refresh-status-btn");
  const auditLogBtn = document.getElementById("student-audit-log-btn");
  if (note) {
    note.textContent = "Loading scenarios...";
  }

  await loadStudentScenarios();
  renderSelectedScenario();
  renderStudentInstructorStatus();
  if (note) {
    note.textContent =
      "Scenarios loaded. Select one, draft your message, then run evaluation.";
  }

  if (evaluateBtn) {
    evaluateBtn.addEventListener("click", async () => {
      const selected = appState.selectedScenario;
      const messageText = String(draftBody?.value || "").trim();
      const messageType = String(draftMode?.value || "press_statement");
      const tone = String(document.getElementById("draft-tone")?.value || "calm_factual");
      if (!selected) {
        showToast("Select a scenario first.", "error");
        return;
      }
      if (!messageText) {
        showToast("Add a draft message before evaluation.", "error");
        return;
      }
      const idleText = evaluateBtn.textContent;
      evaluateBtn.textContent = "Evaluating...";
      evaluateBtn.disabled = true;
      if (compareBtn) {
        compareBtn.disabled = true;
      }
      try {
        const evaluation = await apiJson("/api/v1/evaluate", {
          method: "POST",
          body: JSON.stringify({
            role: "student",
            scenarioId: selected.id,
            messageType,
            messageText,
            tone,
            metadata: {
              exerciseId: "exercise_live",
              authorId: currentUser.id || currentUser.username
            }
          })
        });
        appState.lastEvaluation = evaluation;
        appState.instructorReviewStatus = "not_submitted";
        renderEvaluation(evaluation);
        renderStudentInstructorStatus();
        if (note) {
          note.textContent = "Live evaluation complete. You can revise and run final re-evaluation.";
        }
        showToast("Evaluation complete.", "success");
      } catch (error) {
        const state = document.getElementById("student-evaluation-state");
        const results = document.getElementById("student-evaluation-results");
        if (results) {
          results.classList.add("hidden");
        }
        if (state) {
          state.className = "state-card error";
          state.innerHTML = `<h4>Evaluation failed</h4><p>${error.message}</p>`;
        }
        showToast("Evaluation failed.", "error");
      } finally {
        evaluateBtn.textContent = idleText;
        evaluateBtn.disabled = false;
        if (compareBtn) {
          compareBtn.disabled = false;
        }
      }
    });
  }

  if (compareBtn) {
    compareBtn.addEventListener("click", async () => {
      const selected = appState.selectedScenario;
      const updatedText = String(rewriteText?.value || "").trim();
      if (!appState.lastEvaluation || !selected) {
        showToast("Run initial evaluation first.", "error");
        return;
      }
      if (!updatedText) {
        showToast("Edit or accept a rewrite first.", "error");
        return;
      }
      const idleText = compareBtn.textContent;
      compareBtn.textContent = "Comparing...";
      compareBtn.disabled = true;
      try {
        const rewritePayload = await apiJson("/api/v1/evaluate/rewrite", {
          method: "POST",
          body: JSON.stringify({
            evaluationId: appState.lastEvaluation.evaluationId,
            updatedMessageText: updatedText
          })
        });
        const reEval = rewritePayload.evaluation;
        if (!reEval) {
          throw new Error("Rewrite evaluation payload missing.");
        }
        appState.lastEvaluation = reEval;
        appState.instructorReviewStatus = "not_submitted";
        renderEvaluation(reEval);
        renderStudentInstructorStatus();
        const trustDelta = Number(rewritePayload?.delta?.trustScore || 0);
        if (note) {
          note.textContent = `Rewrite re-evaluated. Trust score delta: ${trustDelta}.`;
        }
        showToast("Rewrite comparison complete.", "success");
      } catch (error) {
        showToast(error.message, "error");
      } finally {
        compareBtn.textContent = idleText;
        compareBtn.disabled = false;
      }
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener("click", async () => {
      if (!appState.lastEvaluation?.evaluationId) {
        showToast("Run evaluation before submitting to instructor.", "error");
        return;
      }
      const idleText = submitBtn.textContent;
      submitBtn.textContent = "Submitting...";
      submitBtn.disabled = true;
      try {
        const payload = await apiJson("/api/v1/student/submissions", {
          method: "POST",
          body: JSON.stringify({
            evaluationId: appState.lastEvaluation.evaluationId
          })
        });
        appState.instructorReviewStatus = payload.reviewStatus || "pending_instructor";
        renderStudentInstructorStatus();
        showToast("Submitted to instructor queue.", "success");
      } catch (error) {
        showToast(error.message, "error");
      } finally {
        submitBtn.textContent = idleText;
        submitBtn.disabled = false;
      }
    });
  }

  if (refreshStatusBtn) {
    refreshStatusBtn.addEventListener("click", async () => {
      if (!appState.lastEvaluation?.evaluationId) {
        showToast("No submission to refresh yet.", "error");
        return;
      }
      try {
        await refreshStudentInstructorStatus();
        showToast("Instructor status refreshed.", "success");
      } catch (error) {
        showToast(error.message, "error");
      }
    });
  }

  if (auditLogBtn) {
    auditLogBtn.addEventListener("click", async () => {
      if (!appState.lastEvaluation?.evaluationId) {
        showToast("Run and submit an assessment first.", "error");
        return;
      }
      const logNode = document.getElementById("student-audit-log");
      if (!logNode) {
        return;
      }
      try {
        const payload = await apiJson(
          `/api/v1/student/submissions/${appState.lastEvaluation.evaluationId}/history`
        );
        const entries = Array.isArray(payload.auditLog) ? payload.auditLog : [];
        logNode.classList.remove("hidden");
        if (!entries.length) {
          logNode.className = "state-card empty";
          logNode.innerHTML =
            "<h4>Assessment Audit Log</h4><p>No audit entries recorded yet.</p>";
          return;
        }
        logNode.className = "state-card";
        logNode.innerHTML = `
          <h4>Assessment Audit Log</h4>
          <div class="kv-list">
            ${entries
              .slice()
              .reverse()
              .map(
                (entry) =>
                  `<div class="kv-row"><span>${titleCase(entry.event)}</span><strong>${new Date(entry.at).toLocaleString()}</strong></div>`
              )
              .join("")}
          </div>
        `;
      } catch (error) {
        showToast(error.message, "error");
      }
    });
  }
}

async function bindInstructorInteractions() {
  const previewBtn = document.getElementById("instructor-preview-btn");
  const publishBtn = document.getElementById("instructor-publish-btn");
  const note = document.getElementById("instructor-action-note");
  const previewResult = document.getElementById("instructor-preview-result");
  const reviewList = document.getElementById("instructor-review-list");
  const learnerDetail = document.getElementById("instructor-learner-detail");
  if (note) {
    note.textContent = "Loading instructor review queue...";
  }
  const titleInput = document.getElementById("scenario-title");
  const contextInput = document.getElementById("scenario-context");

  if (previewBtn) {
    previewBtn.addEventListener("click", async () => {
      const title = String(titleInput?.value || "").trim();
      const description = String(contextInput?.value || "").trim();
      if (!title || !description) {
        showToast("Add a title and scenario context first.", "error");
        return;
      }
      const idleText = previewBtn.textContent;
      previewBtn.textContent = "Building Preview...";
      previewBtn.disabled = true;
      try {
        const payload = await apiJson("/api/v1/scenarios/generate", {
          method: "POST",
          body: JSON.stringify({
            mode: "instructor_custom",
            customScenario: {
              title,
              description,
              region: "Instructor-defined",
              objectives: ["Build trust"],
              risks: ["Misinterpretation"],
              stakeholders: ["Students"]
            }
          })
        });
        const scenario = payload?.scenarios?.[0];
        if (previewResult && scenario) {
          previewResult.className = "state-card";
          previewResult.innerHTML = `
            <h4>${scenario.title}</h4>
            <p>${scenario.description}</p>
            <div class="kv-list">
              <div class="kv-row"><span>Source Type</span><strong>${scenario.scenarioSourceType}</strong></div>
              <div class="kv-row"><span>Region</span><strong>${scenario.region}</strong></div>
            </div>
          `;
        }
        if (note) {
          note.textContent = "Preview generated from live instructor custom endpoint.";
        }
        showToast("Preview generated.", "success");
      } catch (error) {
        showToast(error.message, "error");
      } finally {
        previewBtn.textContent = idleText;
        previewBtn.disabled = false;
      }
    });
  }

  if (publishBtn) {
    publishBtn.addEventListener("click", async () => {
      const idleText = publishBtn.textContent;
      publishBtn.textContent = "Publishing...";
      publishBtn.disabled = true;
      await new Promise((resolve) => window.setTimeout(resolve, 800));
      if (note) {
        note.textContent = "Assignment marked as published (UX flow ready; class roster API pending).";
      }
      showToast("Published to class queue preview.", "success");
      publishBtn.textContent = idleText;
      publishBtn.disabled = false;
    });
  }

  try {
    const payload = await apiJson("/api/v1/instructor/reviews");
    const reviews = Array.isArray(payload.reviews) ? payload.reviews : [];
    if (reviewList) {
      if (!reviews.length) {
        reviewList.className = "state-card empty";
        reviewList.innerHTML =
          "<h4>Submission List</h4><p>No evaluations submitted yet.</p>";
      } else {
        const top = reviews.slice(0, 6);
        reviewList.className = "state-card";
        reviewList.innerHTML = `
          <h4>Submission List</h4>
          <div class="kv-list">
            ${top
              .map(
                (review) =>
                  `<div class="kv-row"><span>${review.authorId}</span><strong class="score-chip ${scoreChipClass("trust", review.trustScore)}">${review.trustScore}</strong></div>`
              )
              .join("")}
          </div>
        `;
        if (learnerDetail) {
          const first = top[0];
          learnerDetail.className = "state-card";
          learnerDetail.innerHTML = `
            <h4>Learner Detail</h4>
            <p>Latest review snapshot for ${first.authorId}.</p>
            <div class="kv-list">
              <div class="kv-row"><span>Automated Trust Score</span><strong class="score-chip ${scoreChipClass("trust", first.trustScore)}">${first.trustScore}</strong></div>
              <div class="kv-row"><span>Automated Escalation Risk</span><strong class="score-chip ${scoreChipClass("risk", first.escalationRisk)}">${first.escalationRisk}</strong></div>
              <div class="kv-row"><span>Review Status</span><strong>${titleCase(first.reviewStatus)}</strong></div>
              <div class="kv-row"><span>Instructor Grade</span><strong class="grade-pill ${gradePillClass(first.instructorAssessment?.grade)}">${titleCase(first.instructorAssessment?.grade || "pending")}</strong></div>
            </div>
            <div class="btn-row" style="margin-top: 0.75rem">
              <button class="btn primary" id="assess-trained" ${first.reviewStatus === "finalized" ? "disabled" : ""}>Finalize: Trained</button>
              <button class="btn" id="assess-proficient" ${first.reviewStatus === "finalized" ? "disabled" : ""}>Finalize: Proficient</button>
              <button class="btn" id="assess-untrained" ${first.reviewStatus === "finalized" ? "disabled" : ""}>Finalize: Untrained</button>
            </div>
            ${first.reviewStatus === "finalized" ? '<div class="final-lock" style="margin-top:0.75rem"><h4>Instructor Final Decision Locked</h4><p>This grade is marked as final for this submission.</p></div>' : ""}
          `;
          const trainedBtn = document.getElementById("assess-trained");
          const proficientBtn = document.getElementById("assess-proficient");
          const untrainedBtn = document.getElementById("assess-untrained");
          const submitAssessment = async (grade) => {
            await apiJson(`/api/v1/instructor/reviews/${first.evaluationId}/assess`, {
              method: "POST",
              body: JSON.stringify({
                grade,
                notes: `Instructor final grade set to ${grade}.`
              })
            });
            showToast("Instructor assessment finalized.", "success");
            await bindInstructorInteractions();
          };
          if (trainedBtn) {
            trainedBtn.addEventListener("click", async () => submitAssessment("trained"));
          }
          if (proficientBtn) {
            proficientBtn.addEventListener("click", async () => submitAssessment("proficient"));
          }
          if (untrainedBtn) {
            untrainedBtn.addEventListener("click", async () => submitAssessment("untrained"));
          }
        }
      }
    }
    if (note) {
      note.textContent =
        "Review queue loaded. You can preview/publish scenarios and inspect learner summaries.";
    }
  } catch (_error) {
    if (reviewList) {
      reviewList.className = "state-card error";
      reviewList.innerHTML =
        "<h4>Submission List</h4><p>Could not load review feed.</p>";
    }
    if (note) {
      note.textContent =
        "Review queue unavailable right now. Scenario builder is still available.";
    }
  }
}

function bindLogout() {
  const logoutButton = document.getElementById("logout");
  if (!logoutButton) {
    return;
  }
  logoutButton.addEventListener("click", () => {
    localStorage.removeItem(tokenKey);
    window.location.assign("/");
  });
}

async function runLoginPage() {
  const loadingNode = document.getElementById("auth-loading");
  const form = document.getElementById("login-form");
  const submitButton = document.getElementById("login-submit");

  const currentUser = await me();
  if (currentUser) {
    if (submitButton) {
      submitButton.textContent = "Redirecting...";
      submitButton.disabled = true;
    }
    window.location.assign(dashboardPathForRole(currentUser.role));
    return;
  }

  if (loadingNode) {
    loadingNode.classList.add(loadingClass);
  }
  if (form) {
    form.classList.remove(loadingClass);
  }

  if (!form) {
    return;
  }
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submitButton) {
      submitButton.textContent = "Signing in...";
      submitButton.disabled = true;
    }
    const errorNode = document.getElementById("error");
    if (errorNode) {
      errorNode.textContent = "";
    }
    const formData = new FormData(form);
    try {
      const user = await login(
        String(formData.get("username") || ""),
        String(formData.get("password") || "")
      );
      if (submitButton) {
        submitButton.textContent = "Redirecting...";
      }
      window.location.assign(dashboardPathForRole(user.role));
    } catch (error) {
      if (errorNode) {
        errorNode.textContent = error.message;
      }
      if (submitButton) {
        submitButton.textContent = "Login";
        submitButton.disabled = false;
      }
    }
  });
}

async function runDashboardPage(expectedRole) {
  const loadingView = document.getElementById("dashboard-loading");
  const contentView = document.getElementById("dashboard-content");
  const currentUser = await me();
  if (!currentUser) {
    window.location.assign("/");
    return;
  }
  if (currentUser.role !== expectedRole) {
    window.location.assign(dashboardPathForRole(currentUser.role));
    return;
  }
  const whoami = document.getElementById("whoami");
  if (whoami) {
    whoami.textContent = `Signed in as ${currentUser.username} (${currentUser.role})`;
  }
  if (loadingView) {
    loadingView.classList.add(loadingClass);
  }
  if (contentView) {
    contentView.classList.remove(loadingClass);
  }
  bindToastButtons();
  if (expectedRole === "student") {
    await bindStudentInteractions(currentUser);
  } else if (expectedRole === "instructor") {
    await bindInstructorInteractions(currentUser);
  }
}

const path = window.location.pathname;
if (path === "/" || path.endsWith("index.html")) {
  runLoginPage();
} else if (path.endsWith("trainee.html")) {
  runDashboardPage("student");
  bindLogout();
} else if (path.endsWith("instructor.html")) {
  runDashboardPage("instructor");
  bindLogout();
}
