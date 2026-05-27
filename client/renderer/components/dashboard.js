class Dashboard {
  constructor() {
    document.getElementById("logout-btn").addEventListener("click", () => this.logout());
    document.getElementById("refresh-btn").addEventListener("click", () => this.loadData());
    document.getElementById("new-folder-btn").addEventListener("click", () => this.promptNewFolder());
    
    this.contextMenu = document.getElementById("context-menu");
    document.addEventListener("click", () => {
      this.contextMenu.hidden = true;
    });

    this.contextMenu.addEventListener("click", (e) => {
      const item = e.target.closest(".context-menu-item");
      if (!item) return;
      
      const action = item.dataset.action;
      const fileId = this.contextMenu.dataset.fileId;
      
      if (action && fileId) {
        this.handleFileAction(action, fileId);
      }
    });
  }

  async init() {
    await this.loadData();
  }

  async loadData() {
    try {
      document.getElementById("loading-state").hidden = false;
      document.getElementById("empty-state").hidden = true;
      document.getElementById("file-table-body").innerHTML = "";

      const [filesRes, treeRes, foldersRes] = await Promise.all([
        window.api.getFiles(),
        window.api.getFolderTree(),
        window.api.getFolders()
      ]);

      window.app.state.files = filesRes.files;
      window.app.state.folderTree = treeRes.tree;
      window.app.state.folders = foldersRes.folder;

      if (window.folderTree) window.folderTree.render();
      if (window.fileTable) window.fileTable.render();
      
      document.getElementById("loading-state").hidden = true;
    } catch (error) {
      document.getElementById("loading-state").hidden = true;
      console.error(error);
    }
  }

  logout() {
    window.api.setToken(null);
    window.app.state = {
      currentFolderId: "root",
      files: [],
      folders: [],
      folderTree: []
    };
    window.app.showScreen("login-screen");
  }

  promptNewFolder() {
    window.modals.show(
      "Create New Folder",
      `<input type="text" id="new-folder-name" class="search-input" style="width:100%;border:1px solid var(--border-color);" placeholder="Folder Name">`,
      "Create",
      async () => {
        const name = document.getElementById("new-folder-name").value;
        if (!name) return;
        
        try {
          const parentID = window.app.state.currentFolderId === "root" ? null : window.app.state.currentFolderId;
          await window.api.createFolder(name, parentID);
          window.modals.close();
          this.loadData();
        } catch (err) {
          alert("Error creating folder: " + err.message);
        }
      }
    );
  }

  showContextMenu(x, y, fileId) {
    this.contextMenu.dataset.fileId = fileId;
    this.contextMenu.style.left = `${x}px`;
    this.contextMenu.style.top = `${y}px`;
    this.contextMenu.hidden = false;
  }

  handleFileAction(action, fileId) {
    const file = window.app.state.files.find(f => f._id === fileId);
    if (!file) return;

    if (action === "download") {
      if (window.upload) window.upload.downloadFile(file);
    } else if (action === "rename") {
      this.promptRenameFile(file);
    } else if (action === "delete") {
      this.promptDeleteFile(file);
    } else if (action === "move") {
      this.promptMoveFile(file);
    }
  }

  promptRenameFile(file) {
    const currentName = file.originalname.split('.').slice(0, -1).join('.') || file.originalname;
    window.modals.show(
      "Rename File",
      `<input type="text" id="rename-input" class="search-input" style="width:100%;border:1px solid var(--border-color);" value="${currentName}">`,
      "Rename",
      async () => {
        const newName = document.getElementById("rename-input").value;
        if (!newName) return;
        try {
          await window.api.renameFile(file._id, newName);
          window.modals.close();
          this.loadData();
        } catch (e) {
          alert("Error renaming: " + e.message);
        }
      }
    );
  }

  promptDeleteFile(file) {
    window.modals.show(
      "Delete File",
      `<p>Are you sure you want to delete <strong>${file.originalname}</strong>?</p>`,
      "Delete",
      async () => {
        try {
          await window.api.deleteFile(file._id);
          window.modals.close();
          this.loadData();
        } catch (e) {
          alert("Error deleting: " + e.message);
        }
      }
    );
  }

  promptMoveFile(file) {
    let options = `<option value="root">All Files (Root)</option>`;
    window.app.state.folders.forEach(f => {
      options += `<option value="${f._id}">${f.name}</option>`;
    });

    window.modals.show(
      "Move File",
      `<select id="move-select" style="width:100%;padding:0.5rem;border:1px solid var(--border-color);">${options}</select>`,
      "Move",
      async () => {
        const folderId = document.getElementById("move-select").value;
        try {
          await window.api.moveFile(file._id, folderId === "root" ? null : folderId);
          window.modals.close();
          this.loadData();
        } catch (e) {
          alert("Error moving: " + e.message);
        }
      }
    );
  }
}

window.dashboard = new Dashboard();
