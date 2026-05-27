class UploadManager {
  constructor() {
    this.uploadBtn = document.getElementById("upload-btn");

    this.upProgress = document.getElementById("upload-progress");
    this.upPercent = document.getElementById("upload-percent");
    this.upFill = document.getElementById("upload-progress-fill");
    this.upFilename = document.getElementById("upload-filename");

    this.downProgress = document.getElementById("download-progress");
    this.downPercent = document.getElementById("download-percent");
    this.downFill = document.getElementById("download-progress-fill");

    this.uploadBtn.addEventListener("click", () => this.startUpload());

    window.fileServer.onUploadProgress((percent) => {
      this.upPercent.textContent = `${percent}%`;
      this.upFill.style.width = `${percent}%`;
    });

    window.fileServer.onDownloadProgress((percent) => {
      this.downPercent.textContent = `${percent}%`;
      this.downFill.style.width = `${percent}%`;
    });
  }

  async startUpload() {
    try {
      const fileInfo = await window.fileServer.openFileDialog();
      if (!fileInfo) return; // Cancelled

      if (fileInfo.size > 100 * 1024 * 1024) {
        alert("File is too large. Maximum size is 100 MB.");
        return;
      }

      this.upFilename.textContent = `Uploading ${fileInfo.name}...`;
      this.upPercent.textContent = "0%";
      this.upFill.style.width = "0%";
      this.upProgress.hidden = false;
      this.uploadBtn.disabled = true;

      const folderId = window.app.state.currentFolderId === "root" ? null : window.app.state.currentFolderId;

      const result = await window.fileServer.uploadFile(
        window.api.serverUrl,
        window.api.token,
        fileInfo.path,
        folderId
      );

      this.upProgress.hidden = true;
      this.uploadBtn.disabled = false;

      if (result.success) {
        window.dashboard.loadData();
      } else {
        const errorMsg = result.error || "Upload failed";
        console.error("Upload error:", errorMsg);

        if (window.modals) {
          window.modals.show("❌ Upload Failed", `<p style="color: #d32f2f; font-size: 16px;">${errorMsg}</p>`, "OK", () => window.modals.close());
        } else {
          alert("❌ Upload failed:\n\n" + errorMsg);
        }
      }
    } catch (e) {
      this.upProgress.hidden = true;
      this.uploadBtn.disabled = false;
      alert("Error: " + e.message);
    }
  }

  async downloadFile(file) {
    try {
      const savePath = await window.fileServer.openSaveDialog(file.originalname);
      if (!savePath) return; // Cancelled

      this.downPercent.textContent = "0%";
      this.downFill.style.width = "0%";
      this.downProgress.hidden = false;

      const result = await window.fileServer.downloadFile(
        window.api.serverUrl,
        window.api.token,
        file._id,
        savePath
      );

      this.downProgress.hidden = true;

      if (!result.success) {
        alert("Download failed: " + result.error);
      }
    } catch (e) {
      this.downProgress.hidden = true;
      alert("Error: " + e.message);
    }
  }
}

window.upload = new UploadManager();
