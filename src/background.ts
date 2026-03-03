const API_BASE_URL = "http://localhost:8000";

let loggedIn = false;
let authToken: string | null = null;

const thisIs = "service worker background script";

console.log("🚀 --------------------------------------🚀");
console.log("🚀 ~ thisIs:", thisIs);
console.log("🚀 --------------------------------------🚀");

const syncAuth = () => {
  chrome.storage.local.get("authToken").then((result) => {
    console.log(result);
    if (result.authToken) {
      loggedIn = true;
      authToken = result.authToken;
    } else {
      loggedIn = false;
    }
  });
};

syncAuth();

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));
// // Background service worker for Omnibox Best URL
// chrome.omnibox.setDefaultSuggestion({
//   description: `Open best URL for "%s" (logged in: ${loggedIn ? "Yes" : "No"})`,
// });

interface AnalyzeLink {
  url: string;
  normalizedUrl: string;
  title: string;
  summary: string;
  keywords: string[];
}

async function getHtmlOfCurrentTab(tabId: number | null) {
  const injectionResult = await chrome.scripting.executeScript({
    target: { tabId: tabId || 0 },
    func: () => {
      return document.documentElement.outerHTML;
    },
  });

  return injectionResult[0].result;
}

async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let [tab] = await chrome.tabs.query(queryOptions);
  if (!tab || !tab.id) {
    throw new Error("No active tab found");
  }

  // The result of the 'func' is wrapped in an array/object structure
  const html = await getHtmlOfCurrentTab(tab.id);

  return {
    url: tab.url,
    title: tab.title,
    html,
    normalizedUrl: normalizeUrl(tab.url),
  };
}

async function storeCurrentTab() {
  let { url, title, html } = await getCurrentTab();

  const res = await fetch(API_BASE_URL + "/core/store-link", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      html_content: html,
      title: title,
      url: url,
    }),
  });
  if (!res.ok) {
    console.error("Failed to store link in backend:", res.statusText);
    throw new Error("Failed to store link in backend");
  }

  console.log("Successfully stored link in backend");
  return true;
}

/**
 * Normalizes a URL by removing scheme, query, fragments, and trailing slashes.
 * @param {string} urlString
 * @returns {string}
 */
function normalizeUrl(urlString: string | undefined) {
  if (!urlString) return "";

  // 1. Clean and lowercase the input
  let cleanUrl = urlString.trim().toLowerCase();

  // 2. Handle cases where the URL doesn't have a protocol (e.g., "google.com")
  // The URL constructor needs a protocol to parse netloc vs path correctly
  const hasProtocol = /^[a-z]+:\/\//i.test(cleanUrl);
  if (!hasProtocol) {
    cleanUrl = "http://" + cleanUrl;
  }

  try {
    const parsed = new URL(cleanUrl);

    // 3. Extract netloc (host) and path
    let netloc = parsed.host;
    let path = parsed.pathname;

    // 4. Remove trailing slash from the path (if not just "/")
    if (path.length > 1 && path.endsWith("/")) {
      path = path.slice(0, -1);
    }

    // 5. Rebuild the string: netloc + path
    return `${netloc}${path}`;
  } catch (e) {
    // Fallback for extremely malformed strings
    console.error("Invalid URL:", urlString);
    return urlString;
  }
}

chrome.tabs.onActivated.addListener((activeInfo) => {
  // activeInfo.tabId is the ID of the newly focused tab
  console.log("Tab changed to:", activeInfo.tabId);

  // Optional: Get full tab details
  chrome.tabs.get(activeInfo.tabId, async (tab) => {
    console.log("New tab URL:", tab.url);

    // const tabHtml = await getHtmlOfCurrentTab(tab.id || 0);
    // // Send a message to the side panel

    // const res = await fetch(API_BASE_URL + "/core/analyze-link", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     Authorization: `Bearer ${authToken}`,
    //   },
    //   body: JSON.stringify({
    //     html_content: tabHtml,
    //     title: tab.title,
    //     url: tab.url,
    //   }),
    // });

    // const data: AnalyzeLink = await res.json();

    // chrome.runtime.sendMessage({
    //   type: "TAB_CHANGED",
    //   tabData: {
    //     url: data.url,
    //     title: data.title,
    //     normalizedUrl: data.normalizedUrl,
    //     summary: data.summary,
    //     keywords: data.keywords,
    //   },
    // });
    const normalizedUrl = normalizeUrl(tab.url);
    console.log(normalizedUrl);
    chrome.runtime.sendMessage({
      type: "TAB_CHANGED",
      tabData: {
        url: tab.url,
        title: tab.title,
        normalizedUrl: normalizedUrl,
        // summary: data.summary,
        // keywords: data.keywords,
      },
    });
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "LOG_IN") {
    syncAuth();
    sendResponse(true);
  }
  if (message.action === "IS_LOGGED_IN") {
    // Perform logic (API calls, storage access, etc.)
    const data = {
      status: "success",
      result: loggedIn,
    };

    // Send the data back to the sidebar
    sendResponse(data);
  }

  if (message.action === "GET_CURRENT_TAB") {
    getCurrentTab()
      .then((tab) => {
        const data = {
          status: "success",
          ok: true,
          tab,
        };
        sendResponse(data);
      })
      .catch((error) => {
        const data = {
          status: "error",
          ok: false,
        };
        sendResponse(data);
      });
  }

  if (message.action === "ANALYZE_TAB") {
    getCurrentTab().then(async (tab) => {
      try {
        const res = await fetch(API_BASE_URL + "/core/analyze-link", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            html_content: tab.html,
            title: tab.title,
            url: tab.url,
          }),
        });

        const data: AnalyzeLink = await res.json();
        sendResponse({
          success: true,
          tabData: data,
        });
      } catch (error) {
        sendResponse({
          success: false,
        });
      }
    });
  }

  if (message.action === "ADD_CURRENT_TAB") {
    storeCurrentTab()
      .then((tab) => {
        const data = {
          status: "success",
          ok: true,
        };
        sendResponse(data);
      })
      .catch((error) => {
        const data = {
          status: "error",
          ok: false,
        };
        sendResponse(data);
      });
  }

  // Return true if you're planning to send a response asynchronously
  return true;
});

function looksLikeDomain(text: string): boolean {
  return /\./.test(text) && !/\s/.test(text);
}

function getBestUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "https://www.google.com/";

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (looksLikeDomain(trimmed)) {
    // Prefer HTTPS with the raw host first, then www prefix, then http.
    return "https://" + trimmed;
  }

  // For ambiguous queries, use Google "I'm Feeling Lucky" to go to best result.
  const q = encodeURIComponent(trimmed);
  return "https://www.google.com/search?q=" + q + "&btnI=1";
}

let debounceTimer: any;
chrome.omnibox.onInputChanged.addListener(
  (
    text: string,
    suggest: (suggestions: chrome.omnibox.SuggestResult[]) => void,
  ) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      if (!text) return;

      try {
        // 3. Fetch your data
        const response = await fetch(
          `${API_BASE_URL}/core/search-link?query=${encodeURIComponent(text)}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          },
        );
        const data = await response.json();

        console.log("Search results:", data);
        // 4. Format for Omnibox suggestions
        const suggestions = data.map((item: any) => ({
          content: item.url,
          description: `<match>${item.title}</match> <dim>${item.url}</dim>`,
        }));

        suggest(suggestions);
      } catch (error) {
        console.error("Search error:", error);
      }
    }, 300);
  },
);

chrome.omnibox.onInputEntered.addListener(
  (text: string, disposition: string) => {
    const url = getBestUrl(text);

    // Open according to disposition (current tab, new tab, background tab)
    const createProps: chrome.tabs.CreateProperties = { url };
    if (disposition === "currentTab") {
      chrome.tabs.update({ url });
    } else {
      chrome.tabs.create(createProps);
    }
  },
);
