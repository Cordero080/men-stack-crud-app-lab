// public/js/main.js
// Purpose: Global client-side behaviors used across pages (kept out of templates).
document.addEventListener("DOMContentLoaded", function () {
  const beltColors = {
    white: "#fff",
   
    orange:"#c47e14ff" ,
    green:"#28a745",
   
    purple: "#7e4bdcff",
    brown: "#855830ff" ,
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
});
