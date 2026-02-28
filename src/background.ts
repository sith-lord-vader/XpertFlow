import { loginHandler } from "./auth";

let loggedIn = false;

chrome.storage.local.get("authToken").then((result) => {
  console.log(result);
  if (result.authToken) {
    loggedIn = true;
  } else {
    loggedIn = false;
  }
});

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));
// Background service worker for Omnibox Best URL
chrome.omnibox.setDefaultSuggestion({
  description: `Open best URL for "%s" (logged in: ${loggedIn ? "Yes" : "No"})`,
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "IS_LOGGED_IN") {
    // Perform logic (API calls, storage access, etc.)
    const data = {
      status: "success",
      result: loggedIn,
    };

    // Send the data back to the sidebar
    sendResponse(data);
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

chrome.omnibox.onInputChanged.addListener(
  (
    text: string,
    suggest: (suggestions: chrome.omnibox.SuggestResult[]) => void,
  ) => {
    // Provide a set of suggestions based on the current input text.
    fetch("https://www.google.com")
      .then(() => {
        console.log("Background fetch successful");
        suggestions.push({
          content: "login failed",
          description: "Background fetch successful.",
        });
      })
      .catch((error) => {
        // console.error("Background fetch failed:", error);
        suggest([
          {
            content: "login failed",
            description: "Background fetch failed.",
          },
        ]);
      });
    const suggestions: chrome.omnibox.SuggestResult[] = [];
    const trimmed: string = text.trim();
    const texts: string[] = trimmed.split(/\s+/);
    const action: string = texts[0].toLowerCase();

    if ("login".includes(action)) {
      if (texts.length < 2) {
        suggestions.push({
          content: "login &lt;email&gt; &lt;password&gt;",
          description:
            "Please type 'login &lt;email&gt; &lt;password&gt;' to login",
        });
      }
      if (texts.length === 3) {
        const email = texts[1];
        const password = texts[2];
        loginHandler(email, password)
          .then((response) => {
            console.log("Login response:", response);
            suggestions.push({
              content: "login success",
              description: "Login successful!",
            });
          })
          .catch((error) => {
            // console.error("Login error:", error);
            suggestions.push({
              content: "login failed",
              description: "Login failed.",
            });
          });
      }
    }
    suggest(suggestions);
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
