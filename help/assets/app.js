// Vidflow Help Center client-side search. No dependencies.
(function () {
  "use strict";

  var THEME_KEY = "vf-help-theme";

  function initTheme() {
    var toggle = document.querySelector(".theme-toggle");
    if (!toggle) return;
    toggle.addEventListener("click", function () {
      var current = document.documentElement.getAttribute("data-theme") || "dark";
      var next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem(THEME_KEY, next);
    });
  }

  function initSidebar() {
    var toggle = document.querySelector(".sidebar-toggle");
    var sidebar = document.querySelector(".sidebar");
    if (toggle && sidebar) {
      toggle.addEventListener("click", function () {
        var isOpen = sidebar.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });
    }
    var catToggles = document.querySelectorAll(".sidebar-category-toggle");
    catToggles.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var li = btn.closest(".sidebar-category");
        var isOpen = li.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });
    });
  }

  var searchIndexPromise = null;
  function loadSearchIndex() {
    if (!searchIndexPromise) {
      searchIndexPromise = fetch("/help/assets/search-index.json")
        .then(function (res) { return res.json(); })
        .catch(function () { return []; });
    }
    return searchIndexPromise;
  }

  function scoreEntry(entry, query) {
    var q = query.toLowerCase();
    var title = entry.title.toLowerCase();
    var description = (entry.description || "").toLowerCase();
    var category = (entry.category || "").toLowerCase();
    var headings = (entry.headings || []).join(" ").toLowerCase();
    var body = (entry.body || "").toLowerCase();

    var score = 0;
    if (title === q) score += 100;
    if (title.indexOf(q) !== -1) score += 40;
    if (description.indexOf(q) !== -1) score += 15;
    if (headings.indexOf(q) !== -1) score += 12;
    if (category.indexOf(q) !== -1) score += 6;
    if (body.indexOf(q) !== -1) score += 4;

    // Reward matches on individual words too, so multi-word queries still
    // rank sensibly against single-word titles.
    var words = q.split(/\s+/).filter(Boolean);
    words.forEach(function (w) {
      if (title.indexOf(w) !== -1) score += 8;
      if (description.indexOf(w) !== -1) score += 3;
      if (headings.indexOf(w) !== -1) score += 2;
      if (body.indexOf(w) !== -1) score += 1;
    });

    return score;
  }

  function renderResults(container, results, activeIndex) {
    if (!results.length) {
      container.innerHTML = '<div class="search-empty">No results. Try different words.</div>';
      container.hidden = false;
      return;
    }
    container.innerHTML = results
      .map(function (r, i) {
        var activeCls = i === activeIndex ? " is-active" : "";
        return (
          '<a class="search-result' + activeCls + '" href="/help/' + r.slug + '/" data-index="' + i + '">' +
          '<span class="search-result-title">' + escapeHtml(r.title) + '</span>' +
          '<span class="search-result-category">' + escapeHtml(r.category || "") + '</span>' +
          '<span class="search-result-description">' + escapeHtml(r.description || "") + '</span>' +
          '</a>'
        );
      })
      .join("");
    container.hidden = false;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function initSearchBox(input, container) {
    var activeIndex = -1;
    var currentResults = [];

    input.addEventListener("input", function () {
      var query = input.value.trim();
      if (!query) {
        container.hidden = true;
        container.innerHTML = "";
        activeIndex = -1;
        return;
      }
      loadSearchIndex().then(function (index) {
        var scored = index
          .map(function (entry) {
            return { entry: entry, score: scoreEntry(entry, query) };
          })
          .filter(function (x) { return x.score > 0; })
          .sort(function (a, b) { return b.score - a.score; })
          .slice(0, 8)
          .map(function (x) { return x.entry; });
        currentResults = scored;
        activeIndex = -1;
        renderResults(container, scored, activeIndex);
      });
    });

    input.addEventListener("keydown", function (e) {
      if (container.hidden || !currentResults.length) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        activeIndex = Math.min(activeIndex + 1, currentResults.length - 1);
        renderResults(container, currentResults, activeIndex);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        activeIndex = Math.max(activeIndex - 1, 0);
        renderResults(container, currentResults, activeIndex);
      } else if (e.key === "Enter") {
        if (activeIndex >= 0 && currentResults[activeIndex]) {
          e.preventDefault();
          window.location.href = "/help/" + currentResults[activeIndex].slug + "/";
        }
      } else if (e.key === "Escape") {
        container.hidden = true;
        container.innerHTML = "";
        activeIndex = -1;
      }
    });

    document.addEventListener("click", function (e) {
      if (!container.contains(e.target) && e.target !== input) {
        container.hidden = true;
      }
    });
  }

  function initSearch() {
    var boxes = document.querySelectorAll(".header-search, .hero-search");
    boxes.forEach(function (box) {
      var input = box.querySelector(".search-input");
      var container = box.querySelector(".search-results");
      if (input && container) initSearchBox(input, container);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initTheme();
    initSidebar();
    initSearch();
  });
})();
