const tokenKey = "aieio_token";

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

function dashboardPathForRole(role) {
  return role === "instructor" ? "/instructor.html" : "/trainee.html";
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
  const currentUser = await me();
  if (currentUser) {
    window.location.assign(dashboardPathForRole(currentUser.role));
    return;
  }

  const form = document.getElementById("login-form");
  if (!form) {
    return;
  }
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
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
      window.location.assign(dashboardPathForRole(user.role));
    } catch (error) {
      if (errorNode) {
        errorNode.textContent = error.message;
      }
    }
  });
}

async function runDashboardPage(expectedRole) {
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
