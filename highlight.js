let settings = PLH_DEFAULTS;

const norm = (s) => s.replace(/\s+/g, " ").trim().toLowerCase();

const unmark = (e) => {
  e.classList.remove("plh-hit", "plh-card");
  e.style.removeProperty("--plh-fill");
  e.style.removeProperty("--plh-border");
};

const mark = (e, cls, rule) => {
  e.classList.add(cls);
  e.style.setProperty("--plh-fill", rule.fill);
  e.style.setProperty("--plh-border", rule.border);
};

const scan = () => {
  // Clear old marks first so removed labels un-highlight (same task, so no flicker).
  document.querySelectorAll(".plh-hit, .plh-card").forEach(unmark);
  const byName = new Map(settings.rules.filter((r) => r.label.trim()).map((r) => [norm(r.label), r]));
  if (!byName.size) return;
  // Plane renders each label name in a "truncate" div inside a bordered chip.
  document.querySelectorAll("div.truncate, span.truncate").forEach((el) => {
    const rule = byName.get(norm(el.textContent || ""));
    if (!rule) return;
    mark(el.closest('[class*="border-"]') || el.parentElement, "plh-hit", rule);
    // Each board card is a link to its work item.
    const card = settings.card && el.closest('a[href*="/browse/"]');
    if (card && !card.classList.contains("plh-card")) mark(card, "plh-card", rule);
  });
};

chrome.storage.sync.get(PLH_DEFAULTS, (s) => { settings = s; scan(); });
chrome.storage.onChanged.addListener((_, area) => {
  if (area === "sync") chrome.storage.sync.get(PLH_DEFAULTS, (s) => { settings = s; scan(); });
});

// The board re-renders often: rescan shortly after DOM changes, plus a slow safety timer.
let timer = null;
new MutationObserver(() => {
  clearTimeout(timer);
  timer = setTimeout(scan, 150);
}).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
setInterval(scan, 2000);
scan();
