const DEFAULT_APP_ORIGIN = "http://localhost:3000";
const ALLOWED_APP_ORIGINS = [
  "http://localhost:3000",
  "https://alyssa-creative-sop-app.vercel.app",
];

const pendingImports = new Map();

function normalizeAppOrigin(origin) {
  const normalized = String(origin || DEFAULT_APP_ORIGIN).replace(/\/+$/, "");
  return ALLOWED_APP_ORIGINS.includes(normalized) ? normalized : DEFAULT_APP_ORIGIN;
}

async function injectCaptureBatch(tabId, captureBatch) {
  await chrome.scripting.executeScript({
    target: { tabId },
    func: (payload) => {
      let attempts = 0;
      const postImportMessage = () => {
        attempts += 1;
        window.postMessage(
          {
            type: "ALYSSA_CAPTURE_IMPORT",
            payload,
          },
          window.location.origin
        );

        if (attempts < 8) {
          setTimeout(postImportMessage, 500);
        }
      };

      postImportMessage();
    },
    args: [captureBatch],
  });
}

async function openAlyssaApp(appOrigin = DEFAULT_APP_ORIGIN) {
  const origin = normalizeAppOrigin(appOrigin);
  return chrome.tabs.create({ url: `${origin}/?alyssaCaptureImport=1`, active: true });
}

async function openAppAndImport(captureBatch, appOrigin) {
  const origin = normalizeAppOrigin(appOrigin);
  await chrome.storage.local.set({
    alyssaLastCaptureBatch: captureBatch,
    alyssaAppOrigin: origin,
  });

  const tab = await openAlyssaApp(origin);
  pendingImports.set(tab.id, captureBatch);

  if (tab.status === "complete") {
    await injectCaptureBatch(tab.id, captureBatch);
    pendingImports.delete(tab.id);
  }

  return { tabId: tab.id, appOrigin: origin };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "ALYSSA_OPEN_APP") {
    openAlyssaApp(message.appOrigin)
      .then((tab) => sendResponse({ ok: true, tabId: tab.id }))
      .catch((error) => sendResponse({ ok: false, error: error?.message || "Unable to open Alyssa App" }));
    return true;
  }

  if (message?.type === "ALYSSA_SEND_TO_APP") {
    openAppAndImport(message.payload?.batch, message.payload?.appOrigin)
      .then((result) => sendResponse({ ok: true, ...result }))
      .catch((error) => sendResponse({ ok: false, error: error?.message || "Unable to send capture batch" }));
    return true;
  }

  return undefined;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status !== "complete" || !pendingImports.has(tabId)) return;

  const captureBatch = pendingImports.get(tabId);
  injectCaptureBatch(tabId, captureBatch)
    .then(() => pendingImports.delete(tabId))
    .catch(() => {
      setTimeout(() => {
        injectCaptureBatch(tabId, captureBatch)
          .then(() => pendingImports.delete(tabId))
          .catch(() => pendingImports.delete(tabId));
      }, 900);
    });
});
