import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import FileManager from './FileManager';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Dashboard({ user, onLogout }) {
  const [currentFolder, setCurrentFolder] = useState(null);
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [storageInfo, setStorageInfo] = useState(null);

  useEffect(() => {
    loadFolders();
    loadStorageInfo();

    // Refresh storage info every 30 seconds
    const storageInterval = setInterval(loadStorageInfo, 30000);

    return () => clearInterval(storageInterval);
  }, []);

  const loadFolders = async () => {
    try {
      setLoading(true);
      const response = await window.api.getFolders();
      setFolders(response.folder || response);
    } catch (err) {
      console.error('Failed to load folders:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadFiles = async (folderId = null) => {
    try {
      setLoading(true);
      const endpoint = folderId ? `/api/files?folderId=${folderId}` : '/api/files';
      const response = await window.api.get(endpoint);
      setFiles(response.files || response);
    } catch (err) {
      console.error('Failed to load files:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStorageInfo = async () => {
    try {
      const response = await window.api.getProfile();
      const user = response.user || response;
      setStorageInfo({
        used: user.storageUsed,
        quota: user.storageQuota,
        percentage: (user.storageUsed / user.storageQuota) * 100
      });
    } catch (err) {
      console.error('Failed to load storage info:', err);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      await window.api.createFolder(newFolderName, currentFolder);
      setNewFolderName('');
      setShowCreateFolder(false);
      loadFolders();
      loadStorageInfo();
    } catch (err) {
      alert(err.message || 'Failed to create folder');
    }
  };

  const deleteFile = async (fileId) => {
    if (!window.confirm('Delete this file?')) return;

    try {
      await window.api.deleteFile(fileId);
      loadFiles(currentFolder);
      loadStorageInfo();
    } catch (err) {
      alert(err.message || 'Failed to delete file');
    }
  };

  const deleteFolder = async (folderId) => {
    if (!window.confirm('Delete this folder and all contents?')) return;

    try {
      await window.api.deleteFolder(folderId);
      loadFolders();
      loadStorageInfo();
    } catch (err) {
      alert(err.message || 'Failed to delete folder');
    }
  };

  const uploadFile = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (currentFolder) {
        formData.append('folderId', currentFolder);
      }

      await window.api.request('POST', '/api/files/upload', formData);
      loadFiles(currentFolder);
      loadStorageInfo();
    } catch (err) {
      alert(err.message || 'Upload failed');
    }
  };

  return (
    <div className="dashboard">
      <Header user={user} storageInfo={storageInfo} onLogout={onLogout} />

      <div className="dashboard-content">
        <Sidebar
          folders={folders}
          storageInfo={storageInfo}
          onFolderSelect={setCurrentFolder}
          onFolderCreate={() => setShowCreateFolder(true)}
          onFolderDelete={deleteFolder}
        />

        <main className="main-content">
          <div className="toolbar">
            <button onClick={() => setShowCreateFolder(true)} className="btn btn-primary">
              📁 New Folder
            </button>
            <input
              type="file"
              id="file-input"
              onChange={(e) => {
                if (e.target.files[0]) uploadFile(e.target.files[0]);
              }}
              style={{ display: 'none' }}
            />
            <button onClick={() => document.getElementById('file-input').click()} className="btn btn-primary">
              📤 Upload
            </button>
            <input
              type="text"
              placeholder="Search files..."
              className="search-input"
              onChange={(e) => {
                // Implement search
              }}
            />
          </div>

          {showCreateFolder && (
            <div className="modal-overlay" onClick={() => setShowCreateFolder(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h3>Create Folder</h3>
                <input
                  type="text"
                  placeholder="Folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') createFolder();
                  }}
                  autoFocus
                />
                <div className="modal-buttons">
                  <button onClick={createFolder} className="btn btn-primary">Create</button>
                  <button onClick={() => setShowCreateFolder(false)} className="btn btn-secondary">Cancel</button>
                </div>
              </div>
            </div>
          )}

          <FileManager
            files={files}
            loading={loading}
            onFolderOpen={(folderId) => {
              setCurrentFolder(folderId);
              loadFiles(folderId);
            }}
            onFileDelete={deleteFile}
            onFileDownload={(fileId) => {
              window.open(`${process.env.REACT_APP_API_URL}/files/download/${fileId}?token=${localStorage.getItem('accessToken')}`, '_blank');
            }}
          />
        </main>
      </div>
    </div>
  );
}
