// Background service worker for Omnibox Best URL
chrome.omnibox.setDefaultSuggestion({
  description: 'Open best URL for "%s"',
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
    const suggestions: chrome.omnibox.SuggestResult[] = [];
    const trimmed: string = text.trim();
    const texts: string[] = trimmed.split(/\s+/);
    const action: string = texts[0].toLowerCase();

    if (action === "login") {
      if (texts.length < 2) {
        suggestions.push({
          content: "login <email> <password>",
          description: "Please type 'login <email> <password>' to login",
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
