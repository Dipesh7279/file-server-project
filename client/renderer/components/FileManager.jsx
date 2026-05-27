import React, { useState } from 'react';

export default function FileManager({ files, loading, onFileDelete, onFileDownload, onFolderOpen }) {
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedItems, setSelectedItems] = useState([]);

  const sortedFiles = [...(files || [])].sort((a, b) => {
    let aVal = a[sortBy] || '';
    let bVal = b[sortBy] || '';

    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return <div className="loader">Loading files...</div>;
  }

  if (!files || files.length === 0) {
    return (
      <div className="empty-state">
        <p>📁 No files here</p>
        <p className="help-text">Upload files or create folders to get started</p>
      </div>
    );
  }

  return (
    <div className="file-manager">
      <div className="file-list-header">
        <button
          onClick={() => {
            if (sortBy === 'originalname') {
              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
            } else {
              setSortBy('originalname');
              setSortOrder('asc');
            }
          }}
        >
          Name {sortBy === 'originalname' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
        <button
          onClick={() => {
            if (sortBy === 'size') {
              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
            } else {
              setSortBy('size');
              setSortOrder('asc');
            }
          }}
        >
          Size {sortBy === 'size' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
        <button
          onClick={() => {
            if (sortBy === 'createdAt') {
              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
            } else {
              setSortBy('createdAt');
              setSortOrder('asc');
            }
          }}
        >
          Modified {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
        <div>Actions</div>
      </div>

      <div className="file-list">
        {sortedFiles.map((file) => (
          <div key={file._id} className="file-item">
            <div className="file-name">
              {file.mimetype?.startsWith('image/') ? '🖼️' : '📄'}
              {file.originalname}
            </div>
            <div className="file-size">
              {formatFileSize(file.size)}
            </div>
            <div className="file-date">
              {formatDate(file.createdAt)}
            </div>
            <div className="file-actions">
              <button
                onClick={() => onFileDownload(file._id)}
                className="btn-icon"
                title="Download"
              >
                📥
              </button>
              <button
                onClick={() => onFileDelete(file._id)}
                className="btn-icon"
                title="Delete"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
