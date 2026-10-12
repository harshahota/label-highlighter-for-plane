const $ = (id) => document.getElementById(id);

const flash = (el, text, cls = "ok") => {
  el.className = cls;
  el.textContent = text;
  setTimeout(() => (el.textContent = ""), 3000);
};

// ---- Labels ----
const addRow = (rule = { label: "", fill: "#fde047", border: "#dc2626" }) => {
  const row = document.createElement("div");
  row.className = "row";
  const label = Object.assign(document.createElement("input"), { type: "text", value: rule.label, placeholder: "e.g. Bug" });
  const fill = Object.assign(document.createElement("input"), { type: "color", value: rule.fill, title: "Fill" });
  const border = Object.assign(document.createElement("input"), { type: "color", value: rule.border, title: "Border" });
  const del = Object.assign(document.createElement("button"), { className: "del", textContent: "✕", title: "Remove" });
  del.addEventListener("click", () => row.remove());
  row.append(label, fill, border, del);
  $("rules").append(row);
};

chrome.storage.sync.get(PLH_DEFAULTS, (s) => {
  s.rules.length ? s.rules.forEach((r) => addRow(r)) : addRow();
  $("card").checked = s.card;
});

$("add").addEventListener("click", () => addRow());

$("save").addEventListener("click", () => {
  const rules = [...$("rules").querySelectorAll(".row")]
    .map((row) => {
      const [label, fill, border] = row.querySelectorAll("input");
      return { label: label.value.trim(), fill: fill.value, border: border.value };
    })
    .filter((r) => r.label);
  chrome.storage.sync.set({ rules, card: $("card").checked }, () =>
    flash($("status"), "Saved. Open boards update right away."));
});

// ---- Sites (each allowed site is an optional host permission) ----
const renderSites = async () => {
  const { origins = [] } = await chrome.permissions.getAll();
  // app.plane.so is built in and can't be removed, so only list user-added sites.
  const added = origins.filter((o) => !o.startsWith("https://app.plane.so"));
  $("sites").replaceChildren(...added.map((pattern) => {
    const row = document.createElement("div");
    row.className = "site";
    const name = Object.assign(document.createElement("code"), { textContent: pattern.replace(/\/\*$/, "") });
    const del = Object.assign(document.createElement("button"), { textContent: "Remove" });
    del.addEventListener("click", async () => {
      await chrome.permissions.remove({ origins: [pattern] });
      renderSites();
    });
    row.append(name, del);
    return row;
  }));
};

$("addSite").addEventListener("click", async () => {
  let origin;
  try {
    const raw = $("siteInput").value.trim();
    origin = new URL(/^https?:\/\//.test(raw) ? raw : `https://${raw}`).origin;
  } catch {
    return flash($("siteStatus"), "That doesn't look like a web address.", "err");
  }
  const granted = await chrome.permissions.request({ origins: [`${origin}/*`] });
  if (!granted) return flash($("siteStatus"), "Not allowed, so nothing was added.", "err");
  $("siteInput").value = "";
  flash($("siteStatus"), `Added ${origin}. Reload its board tab.`);
  renderSites();
});

renderSites();
