class AdminDashboard {
  constructor() {
    document.getElementById("admin-logout-btn").addEventListener("click", () => this.logout());

    // Tab switching
    document.querySelectorAll(".admin-tab-btn").forEach(btn => {
      btn.addEventListener("click", (e) => this.switchTab(e.target.dataset.tab));
    });
  }

  async init() {
    console.log('Initializing admin dashboard');
    await this.loadStats();
  }

  switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll(".admin-tab-content").forEach(el => {
      el.hidden = true;
    });

    // Remove active class from all buttons
    document.querySelectorAll(".admin-tab-btn").forEach(btn => {
      btn.classList.remove("active");
    });

    // Show selected tab
    const tabEl = document.getElementById(tabName);
    if (tabEl) {
      tabEl.hidden = false;
    }

    // Add active class to clicked button
    event.target.classList.add("active");

    // Load data for selected tab
    if (tabName === "admin-users") {
      this.loadUsers();
    } else if (tabName === "admin-logs") {
      this.loadLogs();
    } else if (tabName === "admin-storage") {
      this.loadStorageManagement();
    } else if (tabName === "admin-health") {
      this.loadSystemHealth();
    }
  }

  async loadStats() {
    try {
      console.log('Loading admin stats');
      const response = await window.api.get('/admin/system-stats');
      console.log('Stats response:', response);

      const stats = response.stats || response;

      document.getElementById("stat-total-users").textContent = stats.totalUsers || 0;
      document.getElementById("stat-active-users").textContent = stats.activeUsers || 0;
      document.getElementById("stat-total-files").textContent = stats.totalFiles || 0;
      document.getElementById("stat-activity-today").textContent = stats.logsToday || 0;
    } catch (error) {
      console.error('Failed to load stats:', error);
      alert('Failed to load statistics: ' + error.message);
    }
  }

  async loadUsers() {
    try {
      console.log('Loading users');
      const response = await window.api.get('/admin/users');
      console.log('Users response:', response);

      const users = response.users || response || [];
      const tbody = document.getElementById("users-table-body");

      if (!Array.isArray(users) || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">No users found</td></tr>';
        return;
      }

      tbody.innerHTML = users.map(user => `
        <tr>
          <td>${user.username}</td>
          <td>${user.email}</td>
          <td>
            <span class="${user.isActive ? 'status-active' : 'status-inactive'}">
              ${user.isActive ? '✓ Active' : '✗ Suspended'}
            </span>
          </td>
          <td>${Math.round((user.storageUsed || 0) / 1024 / 1024)} MB</td>
          <td>
            <button class="btn btn-sm ${user.isActive ? 'btn-danger' : 'btn-success'}" 
                    onclick="window.adminDashboard.${user.isActive ? 'suspendUser' : 'reactivateUser'}('${user._id}')">
              ${user.isActive ? 'Suspend' : 'Activate'}
            </button>
          </td>
        </tr>
      `).join('');
    } catch (error) {
      console.error('Failed to load users:', error);
      document.getElementById("users-table-body").innerHTML =
        `<tr><td colspan="5" style="text-align: center; color: red; padding: 20px;">Error loading users: ${error.message}</td></tr>`;
    }
  }

  async loadLogs() {
    try {
      console.log('Loading activity logs');
      const response = await window.api.get('/admin/activity-logs');
      console.log('Logs response:', response);

      const logs = response.logs || response || [];
      const container = document.getElementById("logs-container");

      if (!Array.isArray(logs) || logs.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 20px;">No activity logs found</p>';
        return;
      }

      container.innerHTML = logs.map(log => `
        <div class="log-entry">
          <span class="log-action">${log.action}</span>
          <span class="log-user">${log.userId?.username || 'Unknown'}</span>
          <span class="log-desc">${log.description}</span>
          <span class="log-date">${new Date(log.createdAt).toLocaleString()}</span>
        </div>
      `).join('');
    } catch (error) {
      console.error('Failed to load logs:', error);
      document.getElementById("logs-container").innerHTML =
        `<p style="text-align: center; color: red; padding: 20px;">Error loading logs: ${error.message}</p>`;
    }
  }

  async suspendUser(userId) {
    if (!confirm('Are you sure you want to suspend this user?')) return;

    try {
      await window.api.put(`/admin/users/${userId}/suspend`, {});
      alert('User suspended successfully');
      this.loadUsers();
    } catch (error) {
      alert('Failed to suspend user: ' + error.message);
    }
  }

  async reactivateUser(userId) {
    if (!confirm('Are you sure you want to activate this user?')) return;

    try {
      await window.api.put(`/admin/users/${userId}/reactivate`, {});
      alert('User reactivated successfully');
      this.loadUsers();
    } catch (error) {
      alert('Failed to reactivate user: ' + error.message);
    }
  }

  async loadStorageManagement() {
    try {
      console.log('Loading storage management');
      const response = await window.api.get('/admin/storage-stats');
      const stats = response.stats || response;

      document.getElementById("total-storage-used").textContent =
        ((stats.totalStorageUsed || 0) / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
      document.getElementById("total-quota").textContent =
        ((stats.totalStorageQuota || 0) / (1024 * 1024 * 1024)).toFixed(2) + ' GB';

      const users = stats.topStorageUsers || [];
      const container = document.getElementById("storage-users-container");

      if (!users.length) {
        container.innerHTML = '<p style="text-align: center; padding: 20px;">No users found</p>';
        return;
      }

      container.innerHTML = users.map(user => {
        const quotaMB = (user.storageQuota / (1024 * 1024)).toFixed(0);
        const usedMB = (user.storageUsed / (1024 * 1024)).toFixed(2);
        const percent = ((user.storageUsed / user.storageQuota) * 100).toFixed(1);
        return `
          <div style="padding: 1rem; border: 1px solid var(--border-color); border-radius: 4px; margin-bottom: 0.5rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span><strong>${user.username}</strong></span>
              <span>${usedMB} MB / ${quotaMB} MB (${percent}%)</span>
            </div>
            <div style="background-color: var(--bg-color); border-radius: 4px; overflow: hidden; height: 8px;">
              <div style="background-color: var(--primary-color); height: 100%; width: ${percent}%;"></div>
            </div>
          </div>
        `;
      }).join('');
    } catch (error) {
      console.error('Failed to load storage:', error);
      document.getElementById("storage-content").innerHTML =
        `<p style="color: red;">Error loading storage: ${error.message}</p>`;
    }
  }

  async loadSystemHealth() {
    try {
      console.log('Loading system health');
      const response = await window.api.get('/admin/system-health');
      const health = response.health || response;

      document.getElementById("health-active").textContent = health.users?.active || 0;
      document.getElementById("health-suspended").textContent = health.users?.suspended || 0;
      document.getElementById("health-files").textContent = health.files?.active || 0;
      document.getElementById("health-storage").textContent =
        ((health.storage?.usagePercentage || 0).toString());

      const status = `
        <strong>Total Users:</strong> ${health.users?.total || 0} | 
        <strong>Active:</strong> ${health.users?.active || 0} | 
        <strong>Files:</strong> ${health.files?.total || 0} | 
        <strong>Storage:</strong> ${health.storage?.usedGB || 0} GB / ${health.storage?.totalQuotaGB || 0} GB
      `;
      document.getElementById("system-status").innerHTML = status;
    } catch (error) {
      console.error('Failed to load system health:', error);
      document.getElementById("health-content").innerHTML =
        `<p style="color: red;">Error loading system health: ${error.message}</p>`;
    }
  }

  logout() {
    window.api.setToken(null);
    localStorage.removeItem("user");
    window.app.showScreen("login-screen");
  }
}

// Initialize
window.adminDashboard = new AdminDashboard();
