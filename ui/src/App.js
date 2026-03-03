/*global chrome*/
import { jwtDecode } from "jwt-decode";
import { createContext, useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "./App.scss";
import storage from "./lib/storage";
import AuthorizedPage from "./pages/AuthorizedPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";

export const AuthContext = createContext({
  loggedIn: false,
  setLoggedIn: () => {},
  userData: null,
  setUserData: () => {},
  authToken: null,
  setAuthToken: () => {},
});

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [authToken, setAuthToken] = useState(null);

  const getCurrentTab = async () => {
    chrome.runtime.sendMessage(
      {
        action: "ADD_CURRENT_TAB",
      },
      (response) => {
        // Handle the response from the service worker
        if (response && response.status === "success") {
          toast.success("Current tab data added successfully!");
        }
      },
    );
  };

  useEffect(() => {
    async function checkAuth() {
      // Listen for messages from the background script
      try {
        const loggedInStatus = await storage.get("authToken");
        console.log("Auth token from storage:", loggedInStatus);
        if (!loggedInStatus) {
          setLoggedIn(false);
        }
        setAuthToken(loggedInStatus);
        const data = jwtDecode(loggedInStatus.authToken);
        setUserData(data);
        setLoggedIn(true);
      } catch (error) {
        console.error("Error sending message to service worker:", error);
      }
    }
    checkAuth();
    const thisIs = "side panel React application";

    console.log("🚀 --------------------------------------🚀");
    console.log("🚀 ~ thisIs:", thisIs);
    console.log("🚀 --------------------------------------🚀");
  }, []);
  return (
    <AuthContext.Provider
      value={{
        loggedIn,
        setLoggedIn,
        userData,
        setUserData,
        authToken,
        setAuthToken,
      }}
    >
      <div className="App">
        <ToastContainer />
        {loggedIn ? (
          <AuthorizedPage />
        ) : (
          <UnauthorizedPage setLoggedIn={setLoggedIn} />
        )}
      </div>
    </AuthContext.Provider>
  );
}

export default App;
