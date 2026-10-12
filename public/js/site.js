document.querySelectorAll(".nav-toggle").forEach((button) => {
  const nav = document.getElementById("mobile-nav");
  button.addEventListener("click", () => {
    const willOpen = nav.hasAttribute("hidden");
    if (willOpen) nav.removeAttribute("hidden");
    else nav.setAttribute("hidden", "");
    button.setAttribute("aria-expanded", willOpen ? "true" : "false");
  });
});

document.querySelectorAll(".faq-item button").forEach((button) => {
  button.addEventListener("click", () => {
    const item = button.closest(".faq-item");
    const open = item.classList.toggle("open");
    button.setAttribute("aria-expanded", open ? "true" : "false");
  });
});

const regionFilter = document.querySelector("#region-filter");
if (regionFilter) {
  regionFilter.addEventListener("input", () => {
    const query = regionFilter.value.trim();
    document.querySelectorAll("[data-region]").forEach((row) => {
      row.hidden = Boolean(query) && !row.dataset.region.includes(query);
    });
  });
}
