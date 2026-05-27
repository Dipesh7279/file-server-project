const adminLoginForm = document.getElementById("admin-login-form");
const adminLoginError = document.getElementById("admin-login-error");

if (adminLoginForm) {
  adminLoginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("admin-username").value;
    const password = document.getElementById("admin-password").value;
    const btn = document.getElementById("admin-login-btn");

    try {
      adminLoginError.hidden = true;
      btn.disabled = true;
      btn.textContent = "Signing in...";

      // Server URL is configured at build/deployment time
      const data = await window.api.login(username, password);

      // Check if user is admin
      if (!data.user || !data.user.isAdmin) {
        throw new Error("This account does not have admin privileges. Please use regular login.");
      }

      // Support backend returning accessToken or token
      const token = data.accessToken || data.token || null;
      window.api.setToken(token);

      // Use returned user display name if available
      const displayName = (data.user && data.user.username) ? data.user.username : username;
      document.getElementById("user-display").textContent = displayName;

      window.app.showScreen("dashboard-screen");
      if (window.dashboard) window.dashboard.init();

      adminLoginForm.reset();
    } catch (error) {
      adminLoginError.textContent = error.message;
      adminLoginError.hidden = false;
    } finally {
      btn.disabled = false;
      btn.textContent = "Login as Admin";
    }
  });
}
