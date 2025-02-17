import axios from "axios";
import {  UserContextprovider } from "./assets/Usercontext";
import Routes from "./Routes";

function App() {
  axios.defaults.baseURL = "http://localhost:4040";
  axios.defaults.withCredentials = true;
  return (
    <>
      <UserContextprovider>
        <Routes />
      </UserContextprovider>
    </>
  );
}

export default App;

// 5:18:00 min
