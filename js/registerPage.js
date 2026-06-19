// Single configurable API base URL (defaults to same origin as this page).
const API_BASE = window.API_BASE || "";

async function getCsrfToken() {
  const res = await fetch(`${API_BASE}/api/csrf-token`, { credentials: "include" });
  const data = await res.json();
  return data.csrfToken;
}

document.getElementById("registerForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorEl = document.getElementById("error");
  errorEl.textContent = "";

  try {
    const csrfToken = await getCsrfToken();
    const res = await fetch(`${API_BASE}/api/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "CSRF-Token": csrfToken },
      credentials: "include",
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();

    if (res.ok && data.message === "User registered") {
      alert("Registration successful! You can now log in.");
      window.location.href = "login.html";
    } else {
      errorEl.textContent = data.error || "Registration failed. Please try again.";
    }
  } catch (err) {
    errorEl.textContent = "Unable to reach the server. Please try again.";
  }
});
