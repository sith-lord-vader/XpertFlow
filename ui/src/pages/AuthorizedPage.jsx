/*global chrome*/

import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../App";
import Button from "../components/Button";
import "./AuthorizedPage.scss";

export default function AuthorizedPage() {
  const authObj = useContext(AuthContext);
  const [tabData, setTabData] = useState({
    normalizedUrl: "",
    title: "",
    url: "",
    // summary:
    //   "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam ipsum mauris, suscipit a suscipit vitae, ultricies eget velit. Ut gravida orci in ante commodo volutpat. Vestibulum tortor ligula, consequat sed est eget, aliquam condimentum quam. Maecenas in nisl eget lorem rhoncus mollis a id ipsum. Donec pulvinar nibh eget nulla dapibus, vitae elementum nulla lobortis. Interdum et malesuada fames ac ante ipsum primis in faucibus. Praesent finibus justo quam, ac maximus nunc imperdiet eget. Proin quis porta justo. Integer rutrum felis vel dui ullamcorper congue. In dapibus, odio vel porta rhoncus, elit orci elementum ante, quis fermentum arcu nunc in leo. In sed libero nec nisl congue rhoncus. Duis id elementum mauris. Aliquam nec arcu et tortor convallis tincidunt ut ut elit.",
    summary: "",
    keywords: ["", "", ""],
  });

  const analyzeTab = () => {
    chrome.runtime.sendMessage(
      {
        action: "ANALYZE_TAB",
      },
      (response) => {
        if (response.success) setTabData(response.tabData);
      },
    );
  };

  useEffect(() => {
    const handleMessage = (message, sender, sendResponse) => {
      if (message.type === "TAB_CHANGED") {
        console.log("Tab switched to:", message.tabData);
        setTabData((prev) => {
          return {
            ...prev,
            url: message.tabData.url,
            normalizedUrl: message.tabData.normalizedUrl,
            title: message.tabData.title,
            summary: "",
            keywords: [],
          };
        });
      }
    };
    const getCurrentTab = async () => {
      chrome.runtime.sendMessage(
        {
          action: "GET_CURRENT_TAB",
        },
        (response) => {
          if (response && response.status === "success") {
            console.log("Current tab data:", response.tab);
            setTabData((prev) => {
              return {
                ...prev,
                normalizedUrl: response.tab.normalizedUrl,
                title: response.tab.title,
                url: response.tab.url,
                summary: "",
                keywords: [],
                // summary: response.tab.summary,
                // keywords: response.tab.keywords,
              };
            });
          }
        },
      );
    };
    try {
      chrome.runtime.onMessage.addListener(handleMessage);
      getCurrentTab();
    } catch (error) {
      console.error(
        "Error setting up message listener or getting current tab:",
        error,
      );
    }

    // 3. Cleanup: Remove listener when component unmounts
    return () => {
      try {
        chrome.runtime.onMessage.removeListener(handleMessage);
      } catch (error) {
        console.error("Error removing message listener:", error);
      }
    };
  }, []);
  return (
    <div className="main-container">
      <nav>
        <span>
          Welcome, <b>{authObj.userData.name}</b>!
        </span>
      </nav>
      <main>
        <div className="top-bar">
          <div className="bar-1">
            <h3>
              UID: <span>{tabData.normalizedUrl}</span>
            </h3>
            <h3>
              URL: <span>{tabData.url}</span>
            </h3>
          </div>
          <hr />
          <div className="bar-2">{tabData.title}</div>
        </div>
        <div className="buttons">
          <Button label="Analyze Tab" onClick={analyzeTab} />
          <Button label="Add Tab" />
        </div>
        <p className="summary">{tabData.summary}</p>
        <div>
          {tabData.keywords.length > 0 ? (
            <>
              <b>Keywords: </b>
              <span>
                <i>{tabData.keywords.join(", ")}</i>
              </span>
            </>
          ) : (
            <></>
          )}
        </div>
      </main>
      <footer>asdsad</footer>
    </div>
  );
}
