(() => {
  const storageKey = "bynji-site-theme";
  const root = document.documentElement;
  let stored = null;
  try {
    stored = localStorage.getItem(storageKey);
  } catch {
    // Graceful fallback when localStorage is disabled or restricted
  }

  // Detect OS preference when no explicit choice stored
  const prefersLight =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: light)").matches;

  const initialTheme =
    stored === "light" || stored === "dark"
      ? stored
      : prefersLight
        ? "light"
        : "dark";

  const applyTheme = (theme, animate = false) => {
    if (animate) {
      root.classList.add("theme-transitioning");
      setTimeout(() => root.classList.remove("theme-transitioning"), 300);
    }
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#06111e" : "#fbfaf7");
    const toggle = document.querySelector("[data-theme-toggle]");
    if (!toggle) return;
    const nextTheme = theme === "dark" ? "light" : "dark";
    toggle.textContent = theme === "dark" ? "☀" : "☾";
    toggle.setAttribute("aria-label", `Switch to ${nextTheme} mode`);
    toggle.setAttribute("title", `Switch to ${nextTheme} mode`);
  };

  applyTheme(initialTheme);

  // Listen to OS theme changes if user hasn't explicitly set one
  if (typeof window !== "undefined" && window.matchMedia) {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    mediaQuery.addEventListener?.("change", (e) => {
      let currentStored = null;
      try {
        currentStored = localStorage.getItem(storageKey);
      } catch (_) {}
      if (!currentStored) {
        applyTheme(e.matches ? "light" : "dark", true);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const header = document.querySelector(".site-header");
    if (!header) return;
    let toggle = header.querySelector("[data-theme-toggle]");
    if (!toggle) {
      toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "theme-toggle";
      toggle.dataset.themeToggle = "true";
      header.append(toggle);
    }
    toggle.addEventListener("click", () => {
      const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(storageKey, nextTheme);
      } catch (_) {}
      applyTheme(nextTheme, true);
    });
    applyTheme(root.dataset.theme || initialTheme);
  });
})();
