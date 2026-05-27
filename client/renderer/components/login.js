const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;
  const btn = document.getElementById("login-btn");

  try {
    loginError.hidden = true;
    btn.disabled = true;
    btn.textContent = "Signing in...";

    // Server URL is configured at build/deployment time
    const data = await window.api.login(username, password);

    // Support backend returning accessToken or token
    const token = data.accessToken || data.token || null;
    window.api.setToken(token);

    // Store user data for later use
    const userData = data.user || {};
    const isAdmin = userData.isAdmin === true;
    
    console.log('Login successful - User:', userData);
    console.log('isAdmin:', isAdmin);

    // Use returned user display name if available
    const displayName = userData.username ? userData.username : username;
    
    if (isAdmin) {
      // Show admin dashboard
      console.log('Showing admin dashboard');
      document.getElementById("admin-user-display").textContent = displayName;
      window.app.showScreen("admin-dashboard-screen");
      if (window.adminDashboard) {
        window.adminDashboard.init();
      }
    } else {
      // Show regular dashboard
      console.log('Showing user dashboard');
      document.getElementById("user-display").textContent = displayName;
      window.app.showScreen("dashboard-screen");
      if (window.dashboard) window.dashboard.init();
    }

    loginForm.reset();
  } catch (error) {
    loginError.textContent = error.message;
    loginError.hidden = false;
  } finally {
    btn.disabled = false;
    btn.textContent = "Sign In";
  }
});
