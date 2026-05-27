const registerForm = document.getElementById("register-form");
const registerError = document.getElementById("register-error");
const registerSuccess = document.getElementById("register-success");

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const serverUrl = document.getElementById("register-server").value;
  const username = document.getElementById("register-username").value;
  const password = document.getElementById("register-password").value;
  const confirm = document.getElementById("register-confirm").value;
  const btn = document.getElementById("register-btn");

  if (password !== confirm) {
    registerError.textContent = "Passwords do not match.";
    registerError.hidden = false;
    return;
  }

  try {
    registerError.hidden = true;
    registerSuccess.hidden = true;
    btn.disabled = true;
    btn.textContent = "Creating Account...";

    window.api.setServerUrl(serverUrl);
    await window.api.register(username, password);
    
    registerSuccess.textContent = "Account created! Please sign in.";
    registerSuccess.hidden = false;
    registerForm.reset();
  } catch (error) {
    registerError.textContent = error.message;
    registerError.hidden = false;
  } finally {
    btn.disabled = false;
    btn.textContent = "Create Account";
  }
});
