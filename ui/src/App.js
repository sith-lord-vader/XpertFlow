/*global chrome*/
import { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import "./App.scss";
import UnauthorizedPage from "./pages/UnauthorizedPage";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => {
    // Listen for messages from the background script
    try {
      chrome.runtime.sendMessage(
        {
          action: "IS_LOGGED_IN",
        },
        (response) => {
          // Handle the response from the service worker
          setLoggedIn(response.result);
        },
      );
    } catch (error) {
      console.error("Error sending message to service worker:", error);
    }
  }, []);
  return (
    <div className="App">
      <ToastContainer />
      {loggedIn ? (
        <div>LoggedIn</div>
      ) : (
        <UnauthorizedPage setLoggedIn={setLoggedIn} />
      )}
    </div>
  );
}

export default App;
