import React, { useContext, useState } from "react";
import axios from "axios";
import { UserContext } from "./Usercontext";

function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [IsloginOrRegister, setIsloginOrRegister] = useState("login");
  const { setUsername: setLoggedInUserName, setId } = useContext(UserContext);

  async function register(ev) {
    ev.preventDefault();
    try {
      if (IsloginOrRegister === "register") {
        const { data } = await axios.post("/register", { username, password });
      } else {
        const { data } = await axios.post("/login", { username, password });
      }

      // Immediately fetch profile to update logged in state
      const { data: profileData } = await axios.get("/profile");
      setLoggedInUserName(profileData.username);
      setId(profileData.userId);
    } catch (error) {
      console.error("Action failed:", error);
    }
  }

  return (
    <div className="bg-blue-50 h-screen flex items-center">
      <form className="w-64 mx-auto mb-12" onSubmit={register}>
        <input
          value={username}
          onChange={(ev) => setUsername(ev.target.value)}
          type="text"
          placeholder="Username"
          className="block w-full rounded-sm p-2 mb-2 border"
        />
        <input
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          type="password"
          placeholder="Password"
          className="block w-full rounded-sm p-2 mb-2 border"
        />
        <button className="bg-blue-500 text-white block w-full rounded-sm p-2">
          {IsloginOrRegister === "register" ? "register" : "login"}
        </button>
        <div className="text-center m-2">
          {IsloginOrRegister === "register" && (
            <div>
              Already a member?
              <button onClick={() => setIsloginOrRegister("login")}>
                login here
              </button>
            </div>
          )}

          {IsloginOrRegister === "login" && (
            <div>
              don't have an account ?
              <button className =" m-2" onClick={() => setIsloginOrRegister("register")}>
                register
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

export default Register;
