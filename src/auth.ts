export const loginHandler = async (email: string, password: string) => {
  try {
    const response = await fetch("http://localhost:8000/auth", {
      method: "POST",
      body: JSON.stringify({ email, password, name: "chrome-extension" }),
      headers: { "Content-Type": "application/json" },
    });
    console.log(response);
    const data = await response.json();
    chrome.storage.local.set({ authToken: data.access_token });
    return data;
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
};
