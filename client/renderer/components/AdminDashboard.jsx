import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, logsRes] = await Promise.all([
        api.get('/admin/system-stats'),
        api.get('/admin/users'),
        api.get('/admin/activity-logs'),
      ]);

      console.log('Admin stats response:', statsRes);
      console.log('Admin users response:', usersRes);
      console.log('Admin logs response:', logsRes);

      setStats(statsRes.stats || statsRes);
      setUsers(usersRes.users || usersRes);
      setLogs(logsRes.logs || logsRes);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const suspendUser = async (userId) => {
    if (!window.confirm('Suspend this user?')) return;
    try {
      await api.put(`/admin/users/${userId}/suspend`);
      loadStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to suspend user');
    }
  };

  const reactivateUser = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/reactivate`);
      loadStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reactivate user');
    }
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>⚙️ Admin Dashboard</h1>
        <div className="admin-header-right">
          <span>{user.username}</span>
          <button onClick={onLogout} className="btn btn-secondary">Logout</button>
        </div>
      </header>

      <div className="admin-tabs">
        <button
          className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 Statistics
        </button>
        <button
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Users
        </button>
        <button
          className={`tab ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          📝 Activity Logs
        </button>
      </div>

      <div className="admin-content">
        {loading ? (
          <div className="loader">Loading admin data...</div>
        ) : activeTab === 'stats' ? (
          <div className="stats-grid">
            {stats ? (
              <>
                <div className="stat-card">
                  <h3>Total Users</h3>
                  <p className="stat-value">{stats.totalUsers || 0}</p>
                </div>
                <div className="stat-card">
                  <h3>Active Users</h3>
                  <p className="stat-value">{stats.activeUsers || 0}</p>
                </div>
                <div className="stat-card">
                  <h3>Total Files</h3>
                  <p className="stat-value">{stats.totalFiles || 0}</p>
                </div>
                <div className="stat-card">
                  <h3>Activity Today</h3>
                  <p className="stat-value">{stats.logsToday || 0}</p>
                </div>
              </>
            ) : (
              <p>No statistics available</p>
            )}
          </div>
        ) : activeTab === 'users' ? (
          <div className="users-list">
            <h3>Users Management</h3>
            {users && users.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Storage Used</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id}>
                      <td>{u.username}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={u.isActive ? 'status-active' : 'status-inactive'}>
                          {u.isActive ? '✓ Active' : '✗ Suspended'}
                        </span>
                      </td>
                      <td>{Math.round(u.storageUsed / 1024 / 1024)} MB</td>
                      <td>
                        {u.isActive ? (
                          <button
                            onClick={() => suspendUser(u._id)}
                            className="btn-small btn-danger"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => reactivateUser(u._id)}
                            className="btn-small btn-success"
                          >
                            Activate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No users available</p>
            )}
          </div>
        ) : (
          <div className="logs-list">
            <h3>Activity Logs</h3>
            <div className="logs-table">
              {logs && logs.length > 0 ? (
                logs.map((log, idx) => (
                  <div key={idx} className="log-entry">
                    <span className="log-action">{log.action}</span>
                    <span className="log-user">{log.userId?.username || 'Unknown'}</span>
                    <span className="log-desc">{log.description}</span>
                    <span className="log-date">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                ))
              ) : (
                <p>No activity logs</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
