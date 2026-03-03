/*global chrome*/
import { jwtDecode } from "jwt-decode";
import { useContext, useState } from "react";
import { toast } from "react-toastify";
import { AuthContext } from "../App";
import Button from "../components/Button";
import FormInput from "../components/FormInput";
import storage from "../lib/storage";
import "./UnauthorizedPage.scss";

const formFields = {
  name: { label: "Full Name*", placeholder: "Enter your full name" },
  email: { label: "Email Address*", placeholder: "Enter your email address" },
  password: { label: "Password*", placeholder: "Enter your password" },
  confirmPassword: {
    label: "Confirm Password*",
    placeholder: "Re-enter your password",
    required: false,
  },
};

const initSignUpData = {
  name: { data: "", error: "" },
  email: { data: "", error: "" },
  password: { data: "", error: "" },
  confirmPassword: { data: "", error: "" },
};

const initSignInData = {
  email: { data: "", error: "" },
  password: { data: "", error: "" },
};

export default function UnauthorizedPage() {
  const [signUpData, setSignUpData] = useState(initSignUpData);
  const [signInData, setSignInData] = useState(initSignInData);

  const authObj = useContext(AuthContext);

  const handleSignUpChange = (field, value) => {
    setSignUpData((prev) => ({
      ...prev,
      [field]: { data: value, error: "" },
    }));
  };

  const handleSignInChange = (field, value) => {
    setSignInData((prev) => ({
      ...prev,
      [field]: { data: value, error: "" },
    }));
  };

  const handleSignUp = async () => {
    // Implement sign-up logic here
    try {
      if (signUpData.password.data !== signUpData.confirmPassword.data) {
        setSignUpData((prev) => ({
          ...prev,
          password: { data: "", error: "Passwords do not match" },
          confirmPassword: { data: "", error: "Passwords do not match" },
        }));
        toast.error("Passwords do not match");
        return;
      }
      const response = await fetch(
        process.env.REACT_APP_API_BASE_URL + "/auth/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: signUpData.name.data,
            email: signUpData.email.data,
            password: signUpData.password.data,
          }),
        },
      );
      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.detail || "Sign-up failed");
        return;
      }
      const data = await response.json();
      console.log("Sign-up successful:", data);
      toast.success("Sign-up successful! Please sign in.");
      setSignUpData(initSignUpData);
    } catch (error) {
      console.error("Sign-up error:", error);
      toast.error("Sign-up failed. Please try again.");
    }
  };

  const handleSignIn = async () => {
    // Implement sign-in logic here
    try {
      const response = await fetch(
        process.env.REACT_APP_API_BASE_URL + "/auth/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            username: signInData.email.data,
            password: signInData.password.data,
          }),
        },
      );
      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.detail || "Sign-in failed");
        return;
      }
      const data = await response.json();
      const token = data.access_token;

      storage.set({ authToken: token });
      authObj.setAuthToken(token);

      const decodedData = jwtDecode(token);
      authObj.setUserData(decodedData);

      console.log("Sign-in successful");
      toast.success("Sign-in successful!");
      setSignInData(initSignInData);
      setTimeout(() => {
        authObj.setLoggedIn(true);
      }, 1000);
      chrome.runtime.sendMessage({
        action: "LOG_IN",
      });
    } catch (error) {
      console.error("Sign-in error:", error);
      toast.error("Sign-in failed. Please try again.");
    }
  };

  return (
    <div className="main">
      <div className="mainContainer">
        <div className="form form-1">
          <h1 className="mainHeader">
            Get Started with <span>XpertFlo</span>
          </h1>
          <span className="subtext">
            Unleashing the power of seamless workflow automation.
          </span>
          <FormInput
            id="name"
            fieldData={formFields.name}
            error={signUpData.name.error}
            value={signUpData.name.data}
            onChange={(e) => handleSignUpChange("name", e.target.value)}
            classNames="input"
          />
          <FormInput
            fieldData={formFields.email}
            classNames="input"
            error={signUpData.email.error}
            value={signUpData.email.data}
            onChange={(e) => handleSignUpChange("email", e.target.value)}
          />
          <FormInput
            fieldData={formFields.password}
            classNames="input"
            type="password"
            error={signUpData.password.error}
            value={signUpData.password.data}
            onChange={(e) => handleSignUpChange("password", e.target.value)}
          />
          <FormInput
            fieldData={formFields.confirmPassword}
            classNames="input"
            type="password"
            error={signUpData.confirmPassword.error}
            value={signUpData.confirmPassword.data}
            onChange={(e) =>
              handleSignUpChange("confirmPassword", e.target.value)
            }
          />
          <Button
            label="Sign Up"
            classNames={"button"}
            onClick={handleSignUp}
          />
        </div>

        <div className="form">
          <h1 className="mainHeader">
            Already <span>SuperUser?</span>
          </h1>
          <FormInput
            fieldData={formFields.email}
            classNames="input"
            error={signInData.email.error}
            value={signInData.email.data}
            onChange={(e) => handleSignInChange("email", e.target.value)}
          />
          <FormInput
            fieldData={formFields.password}
            classNames="input"
            type="password"
            error={signInData.password.error}
            value={signInData.password.data}
            onChange={(e) => handleSignInChange("password", e.target.value)}
          />
          <Button
            label="Sign In"
            classNames={"button"}
            onClick={handleSignIn}
          />
        </div>
      </div>
    </div>
  );
}
