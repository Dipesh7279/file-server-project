class App {
  constructor() {
    this.screens = {
      login: document.getElementById("login-screen"),
      "admin-login": document.getElementById("admin-login-screen"),
      register: document.getElementById("register-screen"),
      dashboard: document.getElementById("dashboard-screen")
    };
    this.state = {
      currentFolderId: "root",
      files: [],
      folders: [],
      folderTree: []
    };
    this.init();
  }

  init() {
    // Check auth
    if (window.api.token) {
      this.showScreen("dashboard-screen");
      if (window.dashboard) window.dashboard.init();
    } else {
      this.showScreen("login-screen");
    }

    // Navigation links
    document.getElementById("goto-register").addEventListener("click", (e) => {
      e.preventDefault();
      this.showScreen("register-screen");
    });

    document.getElementById("goto-login").addEventListener("click", (e) => {
      e.preventDefault();
      this.showScreen("login-screen");
    });

    // Admin login navigation
    const gotoAdminLink = document.getElementById("goto-admin-login");
    if (gotoAdminLink) {
      gotoAdminLink.addEventListener("click", (e) => {
        e.preventDefault();
        this.showScreen("admin-login-screen");
      });
    }

    const gotoLoginFromAdminLink = document.getElementById("goto-login-from-admin");
    if (gotoLoginFromAdminLink) {
      gotoLoginFromAdminLink.addEventListener("click", (e) => {
        e.preventDefault();
        this.showScreen("login-screen");
      });
    }
  }

  showScreen(screenId) {
    Object.values(this.screens).forEach(screen => {
      if (screen) screen.classList.remove("active");
    });
    const target = document.getElementById(screenId);
    if (target) target.classList.add("active");
  }

  formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(dateStr) {
    return new Date(dateStr).toLocaleString();
  }
}

window.app = new App();
