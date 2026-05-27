class FolderTree {
  constructor() {
    this.container = document.getElementById("folder-tree");
    
    document.querySelector(".root-folder").addEventListener("click", () => {
      this.selectFolder("root", "All Files");
    });
  }

  render() {
    this.container.innerHTML = this.buildTreeHTML(window.app.state.folderTree);
    
    // Add click listeners to folders
    this.container.querySelectorAll(".folder-item").forEach(item => {
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        this.selectFolder(item.dataset.folderId, item.dataset.folderName);
      });

      // Right click to delete folder
      item.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.promptDeleteFolder(item.dataset.folderId, item.dataset.folderName);
      });
    });

    this.updateSelection();
  }

  buildTreeHTML(nodes) {
    if (!nodes || nodes.length === 0) return "";
    
    let html = `<div class="folder-children">`;
    nodes.forEach(node => {
      html += `
        <div class="folder-item" data-folder-id="${node._id}" data-folder-name="${node.name}">
          <span class="folder-icon">📁</span>
          <span class="folder-name">${node.name}</span>
        </div>
      `;
      if (node.children && node.children.length > 0) {
        html += this.buildTreeHTML(node.children);
      }
    });
    html += `</div>`;
    return html;
  }

  selectFolder(id, name) {
    window.app.state.currentFolderId = id;
    
    document.getElementById("breadcrumb").innerHTML = `
      <span class="breadcrumb-item active">${name}</span>
    `;
    
    this.updateSelection();
    if (window.fileTable) window.fileTable.render();
  }

  updateSelection() {
    document.querySelectorAll(".sidebar-content .folder-item").forEach(el => el.classList.remove("selected"));
    const selected = document.querySelector(`.sidebar-content .folder-item[data-folder-id="${window.app.state.currentFolderId}"]`);
    if (selected) selected.classList.add("selected");
  }

  promptDeleteFolder(id, name) {
    window.modals.show(
      "Delete Folder",
      `<p>Are you sure you want to delete the folder <strong>${name}</strong>? All files inside it must be moved or deleted first.</p>`,
      "Delete",
      async () => {
        try {
          await window.api.deleteFolder(id);
          if (window.app.state.currentFolderId === id) {
            this.selectFolder("root", "All Files");
          }
          window.modals.close();
          window.dashboard.loadData();
        } catch (e) {
          alert("Error deleting folder: " + e.message);
        }
      }
    );
  }
}

window.folderTree = new FolderTree();
