const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const serverUrl = document.getElementById("login-server").value;
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;
  const btn = document.getElementById("login-btn");

  try {
    loginError.hidden = true;
    btn.disabled = true;
    btn.textContent = "Signing in...";

    window.api.setServerUrl(serverUrl);
    const data = await window.api.login(username, password);
    
    window.api.setToken(data.token);
    document.getElementById("user-display").textContent = username;
    
    window.app.showScreen("dashboard-screen");
    if (window.dashboard) window.dashboard.init();
    
    loginForm.reset();
  } catch (error) {
    loginError.textContent = error.message;
    loginError.hidden = false;
  } finally {
    btn.disabled = false;
    btn.textContent = "Sign In";
  }
});
