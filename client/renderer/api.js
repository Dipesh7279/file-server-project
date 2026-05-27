class API {
  constructor() {
    this.serverUrl = localStorage.getItem("serverUrl") || "http://localhost:5000";
    this.token = localStorage.getItem("token") || null;
  }

  setServerUrl(url) {
    this.serverUrl = url.replace(/\/$/, ""); // Remove trailing slash
    localStorage.setItem("serverUrl", this.serverUrl);
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }

  async request(method, endpoint, body = null) {
    const response = await window.fileServer.apiRequest(
      this.serverUrl,
      this.token,
      method,
      endpoint,
      body
    );

    if (response.status === 401 && endpoint !== "/api/auth/login") {
      this.setToken(null);
      if (window.app && window.app.showScreen) {
        window.app.showScreen("login-screen");
      }
      throw new Error("Session expired. Please log in again.");
    }

    if (response.status === 0) {
      throw new Error(response.data.message || "Connection to server failed. Check the server URL and ensure the server is running.");
    }

    if (response.status >= 400) {
      throw new Error(response.data.message || "An error occurred");
    }

    return response.data;
  }

  // Auth
  login(username, password) {
    return this.request("POST", "/api/auth/login", { username, password });
  }

  register(username, email, password, confirmPassword) {
    return this.request("POST", "/api/auth/register", { username, email, password, confirmPassword });
  }

  // Files
  getFiles() {
    return this.request("GET", "/api/files");
  }

  deleteFile(id) {
    return this.request("DELETE", `/api/files/${id}`);
  }

  renameFile(id, newName) {
    return this.request("PUT", `/api/files/rename/${id}`, { newName });
  }

  moveFile(id, folderId) {
    return this.request("PUT", `/api/files/move/${id}`, { folderId });
  }

  searchFiles(name, page = 1, limit = 50) {
    return this.request("GET", `/api/files/search?name=${encodeURIComponent(name)}&page=${page}&limit=${limit}`);
  }

  // Folders
  getFolders() {
    return this.request("GET", "/api/folders");
  }

  getFolderTree() {
    return this.request("GET", "/api/folders/tree");
  }

  createFolder(name, parentID = null) {
    return this.request("POST", "/api/folders", { name, parentID });
  }

  deleteFolder(id) {
    return this.request("DELETE", `/api/folders/${id}`);
  }

  // User/Profile
  getProfile() {
    return this.request("GET", "/api/auth/profile");
  }

  // Generic HTTP methods
  get(endpoint, options = {}) {
    return this.request("GET", endpoint);
  }

  post(endpoint, body) {
    return this.request("POST", endpoint, body);
  }

  put(endpoint, body) {
    return this.request("PUT", endpoint, body);
  }

  delete(endpoint) {
    return this.request("DELETE", endpoint);
  }
}

window.api = new API();
