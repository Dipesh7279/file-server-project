const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("fileServer", {
  // File dialogs
  openFileDialog: () => ipcRenderer.invoke("dialog:openFile"),
  openSaveDialog: (defaultName) =>
    ipcRenderer.invoke("dialog:saveFile", defaultName),

  // File upload with progress
  uploadFile: (serverUrl, token, filePath, folderId) =>
    ipcRenderer.invoke("server:uploadFile", {
      serverUrl,
      token,
      filePath,
      folderId,
    }),

  // File download with progress
  downloadFile: (serverUrl, token, fileId, savePath) =>
    ipcRenderer.invoke("server:downloadFile", {
      serverUrl,
      token,
      fileId,
      savePath,
    }),

  // Generic API requests (login, register, CRUD)
  apiRequest: (serverUrl, token, method, endpoint, body) =>
    ipcRenderer.invoke("server:apiRequest", {
      serverUrl,
      token,
      method,
      endpoint,
      body,
    }),

  // Progress listeners
  onUploadProgress: (callback) => {
    ipcRenderer.removeAllListeners("upload:progress");
    ipcRenderer.on("upload:progress", (event, progress) =>
      callback(progress)
    );
  },

  onDownloadProgress: (callback) => {
    ipcRenderer.removeAllListeners("download:progress");
    ipcRenderer.on("download:progress", (event, progress) =>
      callback(progress)
    );
  },
});
