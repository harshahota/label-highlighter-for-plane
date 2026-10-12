const SCRIPT_ID = "plh-self-hosted";

// Run the highlighter on every self-hosted Plane site the user has allowed.
const syncScripts = async () => {
  const { origins = [] } = await chrome.permissions.getAll();
  const matches = origins.filter((o) => !o.startsWith("https://app.plane.so"));
  const existing = await chrome.scripting.getRegisteredContentScripts({ ids: [SCRIPT_ID] });
  if (existing.length) await chrome.scripting.unregisterContentScripts({ ids: [SCRIPT_ID] });
  if (!matches.length) return;
  await chrome.scripting.registerContentScripts([{
    id: SCRIPT_ID,
    matches,
    js: ["defaults.js", "highlight.js"],
    css: ["highlight.css"],
    runAt: "document_idle",
  }]);
};

chrome.runtime.onInstalled.addListener(syncScripts);
chrome.runtime.onStartup.addListener(syncScripts);
chrome.permissions.onAdded.addListener(syncScripts);
chrome.permissions.onRemoved.addListener(syncScripts);
chrome.action.onClicked.addListener(() => chrome.runtime.openOptionsPage());
