// public/js/main.js
// Purpose: Global client-side behaviors used across pages (kept out of templates).
document.addEventListener("DOMContentLoaded", function () {
  const beltColors = {
    white: "#fff",

    orange: "#c47e14ff",
    green: "#28a745",

    purple: "#7e4bdcff",
    brown: "#855830ff",
    black: "#050505ff",
  };

  const select = document.getElementById("beltColor");
  const label = document.getElementById("beltLabel");

  if (select && label) {
    // Set initial color on page load
    label.style.color = beltColors[select.value] || "#222";
    select.addEventListener("change", function () {
      label.style.color = beltColors[this.value] || "#222";
    });
  }

  // Copy dropdown selection into the "name" text input on /new
  const nameSelect = document.getElementById("nameSelect");
  const nameInput = document.getElementById("name");

  if (nameSelect && nameInput) {
    nameSelect.addEventListener("change", (e) => {
      nameInput.value = e.target.value || "";
    });
  }

  // Hard Delete overlay logic for trash.ejs
  let hardDeleteFormId = null;
  const hardDeleteLinks = document.querySelectorAll(".hard-delete-link");
  const hardDeleteOverlay = document.getElementById("hard-delete-overlay");
  const confirmHardDeleteBtn = document.getElementById("confirm-hard-delete-btn");
  const cancelHardDeleteBtn = document.getElementById("cancel-hard-delete-btn");

  if (hardDeleteLinks.length && hardDeleteOverlay && confirmHardDeleteBtn && cancelHardDeleteBtn) {
    hardDeleteLinks.forEach((link) => {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        hardDeleteFormId = this.getAttribute("data-id");
        hardDeleteOverlay.style.display = "flex";
      });
    });
    cancelHardDeleteBtn.onclick = function () {
      hardDeleteOverlay.style.display = "none";
      hardDeleteFormId = null;
    };
    confirmHardDeleteBtn.onclick = function () {
      if (hardDeleteFormId) {
        document.getElementById("hard-del-" + hardDeleteFormId).submit();
      }
    };
  }
});
