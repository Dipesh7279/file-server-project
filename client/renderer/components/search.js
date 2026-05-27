class Search {
  constructor() {
    this.input = document.getElementById("search-input");
    this.clearBtn = document.getElementById("search-clear-btn");
    this.pagination = document.getElementById("pagination");
    this.prevBtn = document.getElementById("prev-page-btn");
    this.nextBtn = document.getElementById("next-page-btn");
    this.pageInfo = document.getElementById("page-info");
    
    this.timeout = null;
    this.currentPage = 1;
    this.isSearching = false;

    this.input.addEventListener("input", () => {
      this.clearBtn.hidden = this.input.value.length === 0;
      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => this.performSearch(1), 300);
    });

    this.clearBtn.addEventListener("click", () => {
      this.input.value = "";
      this.clearBtn.hidden = true;
      this.isSearching = false;
      this.pagination.hidden = true;
      window.dashboard.loadData();
    });

    this.prevBtn.addEventListener("click", () => {
      if (this.currentPage > 1) this.performSearch(this.currentPage - 1);
    });

    this.nextBtn.addEventListener("click", () => {
      this.performSearch(this.currentPage + 1);
    });
  }

  async performSearch(page) {
    const query = this.input.value.trim();
    if (!query) {
      this.isSearching = false;
      this.pagination.hidden = true;
      window.dashboard.loadData();
      return;
    }

    this.isSearching = true;
    try {
      document.getElementById("loading-state").hidden = false;
      document.getElementById("empty-state").hidden = true;
      document.getElementById("file-table-body").innerHTML = "";

      const result = await window.api.searchFiles(query, page, 50);
      
      window.app.state.files = result.files;
      window.app.state.currentFolderId = "root"; // Show all files in search
      
      this.currentPage = result.currentPage;
      this.pageInfo.textContent = `Page ${result.currentPage} of ${result.totalPages || 1}`;
      
      this.prevBtn.disabled = this.currentPage <= 1;
      this.nextBtn.disabled = this.currentPage >= result.totalPages;
      this.pagination.hidden = result.totalPages <= 1;
      
      document.getElementById("breadcrumb").innerHTML = `
        <span class="breadcrumb-item active">Search: "${query}"</span>
      `;
      
      if (window.fileTable) window.fileTable.render();
      document.getElementById("loading-state").hidden = true;
    } catch (e) {
      document.getElementById("loading-state").hidden = true;
      console.error(e);
    }
  }
}

window.search = new Search();
