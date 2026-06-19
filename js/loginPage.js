// Single configurable API base URL (defaults to same origin as this page).
const API_BASE = window.API_BASE || "";

async function getCsrfToken() {
  const res = await fetch(`${API_BASE}/api/csrf-token`, { credentials: "include" });
  const data = await res.json();
  return data.csrfToken;
}

document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorMessage = document.getElementById("errorMessage");
  errorMessage.style.display = "none";

  try {
    const csrfToken = await getCsrfToken();
    const res = await fetch(`${API_BASE}/api/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "CSRF-Token": csrfToken },
      credentials: "include",
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (res.ok && data.message === "Login successful") {
      window.location.href = "deshboard.html";
    } else {
      errorMessage.textContent = data.error || "Invalid credentials";
      errorMessage.style.display = "block";
    }
  } catch (err) {
    errorMessage.textContent = "Unable to reach the server. Please try again.";
    errorMessage.style.display = "block";
  }
});
