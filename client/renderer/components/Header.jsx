import React, { useState } from 'react';

export default function Header({ user, storageInfo, onLogout }) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getStoragePercentage = () => {
    if (!storageInfo) return 0;
    return Math.min(100, (storageInfo.used / storageInfo.quota) * 100);
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <header className="header">
      <div className="header-left">
        <h1>🗂️ FileServer</h1>
      </div>

      <div className="header-center">
        {storageInfo && (
          <div className="storage-info">
            <div className="storage-bar">
              <div
                className="storage-used"
                style={{ width: getStoragePercentage() + '%' }}
              ></div>
            </div>
            <span className="storage-text">
              {formatBytes(storageInfo.used)} / {formatBytes(storageInfo.quota)}
            </span>
          </div>
        )}
      </div>

      <div className="header-right">
        <div className="user-menu">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="user-button"
          >
            👤 {user.username}
          </button>

          {showUserMenu && (
            <div className="user-dropdown">
              <div className="user-info">
                <strong>{user.email}</strong>
              </div>
              <hr />
              {user.isAdmin && (
                <>
                  <a href="#admin">⚙️ Admin Panel</a>
                  <hr />
                </>
              )}
              <button onClick={onLogout} className="btn-logout">
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
