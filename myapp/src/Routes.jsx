import React, { useContext, useEffect } from "react";
import { UserContext } from "./assets/Usercontext";
import RegisterAndLoginForm from "./assets/RegisterAndLoginForm";
import axios from "axios";
import Chat from "./assets/Chat";

function Routes() {
  const { username, setUsername, setId } = useContext(UserContext);

  // Check if the user is logged in by fetching the profile
  useEffect(() => {
    async function fetchProfile() {
      try {
        const { data } = await axios.get("/profile");
        setUsername(data.username);  // Set the username to indicate user is logged in
        setId(data.userId);
      } catch (err) {
        console.log("User not logged in");
      }
    }
    fetchProfile();
  }, [setUsername, setId]);

  // Show "logged in" if the username is set
  if (username) {
    return <Chat/>;
  }

  return <RegisterAndLoginForm />;

}

export default Routes;
