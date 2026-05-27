class Modals {
  constructor() {
    this.overlay = document.getElementById("modal-overlay");
    this.title = document.getElementById("modal-title");
    this.body = document.getElementById("modal-body");
    this.btnCancel = document.getElementById("modal-cancel");
    this.btnConfirm = document.getElementById("modal-confirm");
    
    document.getElementById("modal-close").addEventListener("click", () => this.close());
    this.btnCancel.addEventListener("click", () => this.close());
    
    this.confirmCallback = null;
    this.btnConfirm.addEventListener("click", () => {
      if (this.confirmCallback) this.confirmCallback();
    });
  }

  show(title, bodyHTML, confirmText, onConfirm) {
    this.title.textContent = title;
    this.body.innerHTML = bodyHTML;
    this.btnConfirm.textContent = confirmText;
    this.confirmCallback = onConfirm;
    this.overlay.hidden = false;
  }

  close() {
    this.overlay.hidden = true;
    this.body.innerHTML = "";
    this.confirmCallback = null;
  }
}

window.modals = new Modals();
