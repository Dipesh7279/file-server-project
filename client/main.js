const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");
const https = require("https");
const FormData = require("form-data");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
    title: "FileServer",
  });

  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.webContents.openDevTools();
  });

  // Remove default menu in production
  if (process.env.NODE_ENV !== "development") {
    mainWindow.setMenuBarVisibility(false);
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// ============ IPC Handlers ============

// Open file dialog for upload
ipcMain.handle("dialog:openFile", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    title: "Select a file to upload",
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  const filePath = result.filePaths[0];
  const stats = fs.statSync(filePath);
  return {
    path: filePath,
    name: path.basename(filePath),
    size: stats.size,
  };
});

// Open save dialog for download
ipcMain.handle("dialog:saveFile", async (event, defaultName) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: "Save file as",
    defaultPath: defaultName,
  });
  if (result.canceled) {
    return null;
  }
  return result.filePath;
});

// Upload file to server
ipcMain.handle(
  "server:uploadFile",
  async (event, { serverUrl, token, filePath, folderId }) => {
    return new Promise((resolve, reject) => {
      const fileName = path.basename(filePath);
      const fileStream = fs.createReadStream(filePath);
      const stats = fs.statSync(filePath);

      // Use form-data module for multipart upload
      const form = new FormData();
      form.append("file", fileStream, { filename: fileName });
      if (folderId) form.append("folderId", folderId);

      let url;
      try {
        let finalUrlStr = serverUrl;
        if (!finalUrlStr.startsWith("http://") && !finalUrlStr.startsWith("https://")) {
          finalUrlStr = "http://" + finalUrlStr;
        }
        url = new URL(`${finalUrlStr}/api/files/upload`);
      } catch (err) {
        return resolve({
          success: false,
          error: `Invalid server URL: ${err.message}`
        });
      }

      const isHttps = url.protocol === "https:";
      const transport = isHttps ? https : http;

      // Get headers from form-data (including proper boundary)
      const formHeaders = form.getHeaders();

      // Calculate content length
      form.getLength((err, length) => {
        if (err) {
          return resolve({ success: false, error: `Failed to compute form length: ${err.message}` });
        }

        const options = {
          hostname: url.hostname,
          port: url.port || (isHttps ? 443 : 80),
          path: url.pathname,
          method: "POST",
          headers: Object.assign({}, formHeaders, {
            Authorization: `Bearer ${token}`,
            "Content-Length": length,
          }),
        };

        const req = transport.request(options, (res) => {
          let body = "";
          res.on("data", (chunk) => {
            body += chunk;
          });
          res.on("end", () => {
            try {
              const data = JSON.parse(body);
              console.log(`Upload response - Status: ${res.statusCode}, Body:`, data);

              if (res.statusCode >= 200 && res.statusCode < 300) {
                resolve({ success: true, data });
              } else {
                resolve({
                  success: false,
                  error: data.message || `Server error: ${res.statusCode}`,
                });
              }
            } catch (e) {
              console.error("Failed to parse response:", body);
              resolve({ success: false, error: "Invalid server response" });
            }
          });
        });

        req.on("error", (err) => {
          resolve({ success: false, error: `Connection error: ${err.message}` });
        });

        // Track progress using file stream 'data' events
        let uploaded = 0;
        fileStream.on("data", (chunk) => {
          uploaded += chunk.length;
          const progress = Math.round((uploaded / stats.size) * 100);
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send("upload:progress", progress);
          }
        });

        fileStream.on("error", (err) => {
          resolve({ success: false, error: `File read error: ${err.message}` });
        });

        // Pipe form to request
        form.pipe(req);
      });
    });
  }
);

// Download file from server
ipcMain.handle(
  "server:downloadFile",
  async (event, { serverUrl, token, fileId, savePath }) => {
    return new Promise((resolve, reject) => {
      let url;
      try {
        let finalUrlStr = serverUrl;
        if (!finalUrlStr.startsWith("http://") && !finalUrlStr.startsWith("https://")) {
          finalUrlStr = "http://" + finalUrlStr;
        }
        url = new URL(`${finalUrlStr}/api/files/download/${fileId}`);
      } catch (err) {
        return resolve({
          success: false,
          error: `Invalid server URL: ${err.message}`
        });
      }

      const isHttps = url.protocol === "https:";
      const transport = isHttps ? https : http;

      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname,
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const req = transport.request(options, (res) => {
        if (res.statusCode !== 200) {
          let body = "";
          res.on("data", (chunk) => (body += chunk));
          res.on("end", () => {
            try {
              const data = JSON.parse(body);
              resolve({
                success: false,
                error: data.message || "Download failed",
              });
            } catch {
              resolve({ success: false, error: "Download failed" });
            }
          });
          return;
        }

        const totalSize = parseInt(res.headers["content-length"] || "0", 10);
        const writeStream = fs.createWriteStream(savePath);
        let downloaded = 0;

        res.on("data", (chunk) => {
          downloaded += chunk.length;
          writeStream.write(chunk);
          if (totalSize > 0 && mainWindow && !mainWindow.isDestroyed()) {
            const progress = Math.round((downloaded / totalSize) * 100);
            mainWindow.webContents.send("download:progress", progress);
          }
        });

        res.on("end", () => {
          writeStream.end();
          resolve({ success: true });
        });

        res.on("error", (err) => {
          writeStream.destroy();
          fs.unlinkSync(savePath);
          resolve({
            success: false,
            error: `Download error: ${err.message}`,
          });
        });
      });

      req.on("error", (err) => {
        resolve({
          success: false,
          error: `Connection error: ${err.message}`,
        });
      });

      req.end();
    });
  }
);

// Generic API request handler
ipcMain.handle(
  "server:apiRequest",
  async (event, { serverUrl, token, method, endpoint, body }) => {
    return new Promise((resolve) => {
      let url;
      try {
        let finalUrlStr = serverUrl;
        if (!finalUrlStr.startsWith("http://") && !finalUrlStr.startsWith("https://")) {
          finalUrlStr = "http://" + finalUrlStr;
        }
        url = new URL(`${finalUrlStr}${endpoint}`);
      } catch (err) {
        return resolve({
          status: 0,
          data: { message: `Invalid server URL: ${err.message}` }
        });
      }

      const isHttps = url.protocol === "https:";
      const transport = isHttps ? https : http;

      const bodyStr = body ? JSON.stringify(body) : null;

      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
      };

      if (token) {
        options.headers["Authorization"] = `Bearer ${token}`;
      }

      if (bodyStr) {
        options.headers["Content-Length"] = Buffer.byteLength(bodyStr);
      }

      const req = transport.request(options, (res) => {
        let responseBody = "";
        res.on("data", (chunk) => (responseBody += chunk));
        res.on("end", () => {
          try {
            const data = JSON.parse(responseBody);
            resolve({ status: res.statusCode, data });
          } catch {
            resolve({
              status: res.statusCode,
              data: { message: responseBody },
            });
          }
        });
      });

      req.on("error", (err) => {
        resolve({
          status: 0,
          data: { message: `Connection error: ${err.message}` },
        });
      });

      if (bodyStr) {
        req.write(bodyStr);
      }
      req.end();
    });
  }
);
