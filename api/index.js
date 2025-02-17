const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Message = require("./models/massage");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieperser = require("cookie-parser");
const bcrypt = require("bcryptjs"); // Import bcrypt
const User = require("./models/User");
const http = require("http");
const ws = require("ws");
const { send } = require("process");
const fs = require('fs')
const path = require('path');

// Load environment variables
dotenv.config();

const Mongo_Url ="mongodb+srv://Rahirajrahul:mongo@cluster0.y71u2.mongodb.net/Mernchat?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(Mongo_Url);

const JwtSecret = process.env.JwtSecret;
console.log("JwtSecret:", JwtSecret);
const app = express();
app.use('/uploads',express.static(__dirname + '/uploads'));
app.use(express.json());
app.use(cookieperser());
app.use(
  cors({
    credentials: true,
    origin: "http://localhost:5173",
  })
);

async function getUserDataFromRequest(req) {
  return new Promise((resolve, reject) => {
    const token = req.cookies?.token;
    if (token) {
      jwt.verify(token, JwtSecret, {}, (err, userData) => {
        if (err) {
          reject(err); // Reject the promise with the error
        } else {
          resolve(userData); // Resolve the promise with user data
        }
      });
    } else {
      reject('No token provided');
    }
  });
}

// Define the route
app.get("/test", (req, res) => {
  res.json({ message: "test ok" });
});

app.get("/message/:userId", async (req, res) => {
  const {userId}=req.params;
  const userData= await getUserDataFromRequest(req);
  const ourUserId=userData.userId;
  // console.log({userId,ourUserId});
  const messages = await Message.find({
    sender:{$in:[userId,ourUserId]},
    recipient:{$in:[userId,ourUserId]}
  }).sort({createAt:1});
  res.json(messages); 
}); 

app.get('/people', async (req,res)=>{
  const users = await User.find({},{'_id':1, username:1});
  res.json(users);
});
 
app.get("/profile", (req, res) => { 
  const token = req.cookies?.token;
  if (token) {
    jwt.verify(token, JwtSecret, {}, (err, userData) => {
      if (err) throw err;
      res.json(userData);
    });
  } else {
    res.status(401).json("no token");
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const foundUser = await User.findOne({ username });
  if (foundUser) {
    const passok = await bcrypt.compare(password, foundUser.password);
    if (passok) {
      jwt.sign(
        { userId: foundUser._id, username },
        JwtSecret,
        {},
        (err, token) => {
          res.cookie("token", token, { sameSite: "none", secure: true }).json({
            id: foundUser._id,
          });
        }
      );
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
});


app.post('/logout' , (req,res)=>{
  res.cookie("token", '', { sameSite: "none", secure: true }).json('ok')

})

// Register route with password hashing
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10); // Hash with saltRounds = 10
    const userCreated = await User.create({
      username,
      password: hashedPassword,
    }); // Save hashed password

    // Generate JWT token
    jwt.sign(
      { userId: userCreated._id, username },
      JwtSecret,
      {},
      (err, token) => {
        if (err) {
          console.error("JWT Sign Error:", err);
          return res.status(500).json({ message: "Error creating token" });
        }
        //Set the cookie with the JWT token
        res
          .cookie("token", token, { sameSite: "none", secure: true })
          .status(201)
          .json("ok");
      }
    );
  } catch (err) {
    console.error("User Creation Error:", err);
    res.status(500).json({ message: "Error registering user" });
  }
});

const server = app.listen(4040, () => {
  console.log("HTTP Server running on port 4040");
});

// Initialize WebSocket server
const wss = new ws.Server({ server });

// WebSocket connection handler
wss.on("connection", (connection, req) => {

  function notifyAboutOnlinePeople() {
    [...wss.clients].forEach((client) => {
      client.send(
        JSON.stringify({
          online: [...wss.clients].map((c) => ({
            userId: c.userId,
            username: c.username,
          })),
        })
      );
    });
  }

   connection.isAlive=true;
   connection.timer = setTimeout(() => {
     connection.ping();
     connection.death = setTimeout(() => {
      connection.isAlive=false;
      clearInterval(connection.timer);
      connection.terminate();
      notifyAboutOnlinePeople();
      // console.log('death');
     }, 1000);
   }, 5000);

   connection.on('pong',()=>{
    clearTimeout(connection.deathTimer);
   })
   
  const cookies = req.headers.cookie;
  if (cookies) {
    const tokenCookieString = cookies
      .split(";")
      .find((str) => str.startsWith("token="));
    if (tokenCookieString) {
      const token = tokenCookieString.split("=")[1];
      if (token) {
        jwt.verify(token, JwtSecret, {}, (err, userData) => {
          if (err) {
            throw err;
          }
          const { userId, username } = userData;
          connection.userId = userId;
          connection.username = username;
        });
      }
    }
  }

  connection.on("message", async (message) => {
    const messageData = JSON.parse(message.toString());
    console.log("Server received:", messageData);
    const { recipient, text ,file } = messageData.message; 
    let filename=null
    if (file) {
      const parts = file.name.split('.');
      const ext = parts[parts.length - 1];
      filename = Date.now() + '.' + ext;
      const path = __dirname + '/uploads/' + filename; // Add a separator (/) before filename
      const bufferData = Buffer.from(file.data, 'base64'); // Use Buffer.from for creating the buffer
      fs.writeFile(path, bufferData, (err) => {
        if (err) {
          console.error('Error saving file:', err); // Log any error that occurs during saving
        } else {
          console.log('File saved:', path);
        }
      });
      
      console.log({ file });
    }
    if (recipient && (text || file)) {
      const messageDoc = await Message.create({
        sender: connection.userId,
        recipient,
        text,
        file: file ? filename : null,
      });
      console.log('Message document created:', messageDoc);

      [...wss.clients]
        .filter((c) => c.userId === recipient)  
        .forEach((c) =>
          c.send(
            JSON.stringify({
              text,
              sender: connection.userId,
              recipient,
              file:file ? filename : null,
              _id: messageDoc._id,
            })
          )
        ); 
    }
  });

  // notify everyone about online poeple  (when someone connect ) 

   notifyAboutOnlinePeople();

});


