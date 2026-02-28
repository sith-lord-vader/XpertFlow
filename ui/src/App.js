/*global chrome*/
import { useEffect, useState } from "react";
import "./App.css";
import logo from "./logo.svg";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => {
    // Listen for messages from the background script
    chrome.runtime.sendMessage(
      {
        action: "IS_LOGGED_IN",
      },
      (response) => {
        // Handle the response from the service worker
        setLoggedIn(response.result);
      },
    );
  }, []);
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          {loggedIn
            ? "You are logged in! This is the side panel content."
            : "You are not logged in. Please log in to see more content."}
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
