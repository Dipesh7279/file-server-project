import React, { useState } from 'react';
import { shareAPI } from '../api';

export default function ShareModal({ file, onClose, onShareCreated }) {
  const [accessType, setAccessType] = useState('public'); // public, private, protected
  const [shareType, setShareType] = useState('view'); // view, download
  const [password, setPassword] = useState('');
  const [expiresIn, setExpiresIn] = useState(''); // empty = no expiry
  const [loading, setLoading] = useState(false);

  const handleCreateShare = async () => {
    if (accessType === 'protected' && !password) {
      alert('Password is required for protected shares');
      return;
    }

    try {
      setLoading(true);
      const response = await shareAPI.create({
        fileId: file._id,
        accessType,
        shareType,
        password: accessType === 'protected' ? password : undefined,
        expiresIn: expiresIn ? parseInt(expiresIn) : undefined,
      });

      const shareLink = `${window.location.origin}/share/${response.data.shareLink.token}`;

      // Copy to clipboard
      navigator.clipboard.writeText(shareLink);
      alert('Share link copied to clipboard!');

      onShareCreated?.();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create share link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>📤 Share "{file.name}"</h3>

        <div className="modal-section">
          <label>Access Type</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                value="public"
                checked={accessType === 'public'}
                onChange={(e) => setAccessType(e.target.value)}
              />
              🌍 Public
            </label>
            <label>
              <input
                type="radio"
                value="private"
                checked={accessType === 'private'}
                onChange={(e) => setAccessType(e.target.value)}
              />
              👥 Private
            </label>
            <label>
              <input
                type="radio"
                value="protected"
                checked={accessType === 'protected'}
                onChange={(e) => setAccessType(e.target.value)}
              />
              🔐 Protected
            </label>
          </div>
        </div>

        {accessType === 'protected' && (
          <div className="modal-section">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>
        )}

        <div className="modal-section">
          <label>Permissions</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                value="view"
                checked={shareType === 'view'}
                onChange={(e) => setShareType(e.target.value)}
              />
              👁️ View Only
            </label>
            <label>
              <input
                type="radio"
                value="download"
                checked={shareType === 'download'}
                onChange={(e) => setShareType(e.target.value)}
              />
              📥 Download
            </label>
          </div>
        </div>

        <div className="modal-section">
          <label>Expiry</label>
          <select
            value={expiresIn}
            onChange={(e) => setExpiresIn(e.target.value)}
          >
            <option value="">No Expiry</option>
            <option value="3600">1 Hour</option>
            <option value="86400">1 Day</option>
            <option value="604800">1 Week</option>
            <option value="2592000">1 Month</option>
          </select>
        </div>

        <div className="modal-buttons">
          <button
            onClick={handleCreateShare}
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? '⏳ Creating...' : '✓ Create Share'}
          </button>
          <button onClick={onClose} className="btn btn-secondary">
            ✕ Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
