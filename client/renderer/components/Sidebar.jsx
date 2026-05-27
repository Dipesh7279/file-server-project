import React from 'react';

export default function Sidebar({ folders, onFolderSelect, onFolderCreate, onFolderDelete, storageInfo }) {
  const buildFolderTree = (folderList, parentID = null, level = 0) => {
    return folderList
      .filter(f => (f.parentID === null && parentID === null) || (f.parentID === parentID))
      .map(folder => (
        <div key={folder._id} className="folder-item" style={{ paddingLeft: `${level * 20}px` }}>
          <div className="folder-header">
            <span onClick={() => onFolderSelect(folder._id)} className="folder-name">
              📁 {folder.name}
            </span>
            <button
              onClick={() => onFolderDelete(folder._id)}
              className="btn-icon-small"
              title="Delete"
            >
              ✕
            </button>
          </div>
          {buildFolderTree(folderList, folder._id, level + 1)}
        </div>
      ));
  };

  const formatBytes = (bytes) => {
    if (!bytes && bytes !== 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <aside className="sidebar">
      <h3>Folders</h3>

      {storageInfo && (
        <div className="storage-quota-container">
          <div className="storage-label">Storage Usage</div>
          <div className="storage-text">
            {formatBytes(storageInfo.used)} / {formatBytes(storageInfo.quota)}
          </div>
          <div className="storage-bar-container">
            <div className="storage-bar" style={{ width: Math.min(storageInfo.percentage || 0, 100) + '%' }}></div>
          </div>
          <div className="storage-percent">{Math.round(storageInfo.percentage || 0)}%</div>
        </div>
      )}

      <button onClick={() => onFolderSelect(null)} className="btn btn-block">
        🏠 All Files
      </button>

      <div className="folder-tree">
        {folders && folders.length > 0 ? (
          buildFolderTree(folders)
        ) : (
          <p className="help-text">No folders yet</p>
        )}
      </div>

      <button onClick={onFolderCreate} className="btn btn-secondary btn-block">
        + New Folder
      </button>
    </aside>
  );
}
