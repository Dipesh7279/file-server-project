class FileTable {
  constructor() {
    this.tbody = document.getElementById("file-table-body");
    this.emptyState = document.getElementById("empty-state");
    
    document.querySelectorAll(".sortable").forEach(th => {
      th.addEventListener("click", () => this.sort(th.dataset.sort));
    });

    this.currentSort = { column: "date", asc: false };
  }

  render() {
    let files = window.app.state.files;
    
    // Filter by current folder
    const currentFolderId = window.app.state.currentFolderId;
    if (currentFolderId === "root") {
      files = files.filter(f => !f.folderId);
    } else {
      files = files.filter(f => f.folderId === currentFolderId);
    }

    // Sort
    files.sort((a, b) => {
      let valA, valB;
      if (this.currentSort.column === "name") {
        valA = a.originalname.toLowerCase();
        valB = b.originalname.toLowerCase();
      } else if (this.currentSort.column === "size") {
        valA = a.size || 0;
        valB = b.size || 0;
      } else {
        valA = new Date(a.createdAt).getTime();
        valB = new Date(b.createdAt).getTime();
      }

      if (valA < valB) return this.currentSort.asc ? -1 : 1;
      if (valA > valB) return this.currentSort.asc ? 1 : -1;
      return 0;
    });

    this.tbody.innerHTML = "";
    
    if (files.length === 0) {
      this.emptyState.hidden = false;
      return;
    }

    this.emptyState.hidden = true;

    files.forEach(file => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>📄 ${file.originalname}</td>
        <td>${window.app.formatSize(file.size)}</td>
        <td>${window.app.formatDate(file.createdAt)}</td>
        <td>
          <button class="btn btn-sm btn-outline action-btn" data-id="${file._id}" data-action="download">⬇</button>
          <button class="btn btn-sm btn-outline action-btn" data-id="${file._id}" data-action="menu">⋮</button>
        </td>
      `;

      // Right click
      tr.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        window.dashboard.showContextMenu(e.pageX, e.pageY, file._id);
      });

      this.tbody.appendChild(tr);
    });

    // Action buttons
    this.tbody.querySelectorAll(".action-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = btn.dataset.id;
        const action = btn.dataset.action;
        if (action === "menu") {
          const rect = btn.getBoundingClientRect();
          window.dashboard.showContextMenu(rect.left, rect.bottom, id);
        } else {
          window.dashboard.handleFileAction(action, id);
        }
      });
    });
  }

  sort(column) {
    if (this.currentSort.column === column) {
      this.currentSort.asc = !this.currentSort.asc;
    } else {
      this.currentSort.column = column;
      this.currentSort.asc = true;
    }
    this.render();
  }
}

window.fileTable = new FileTable();
