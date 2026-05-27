const registerForm = document.getElementById("register-form");
const registerError = document.getElementById("register-error");
const registerSuccess = document.getElementById("register-success");

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("register-username").value;
  const email = document.getElementById("register-email").value;
  const password = document.getElementById("register-password").value;
  const confirm = document.getElementById("register-confirm").value;
  const btn = document.getElementById("register-btn");

  // Validate fields are not empty
  if (!username || !email || !password || !confirm) {
    registerError.textContent = "All fields are required.";
    registerError.hidden = false;
    return;
  }

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

    // Server URL is configured at build/deployment time
    await window.api.register(username, email, password, confirm);

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
