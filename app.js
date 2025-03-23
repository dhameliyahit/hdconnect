const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.get("/",(req,res)=>{
    res.sendFile(__dirname+'/client/index.html')
})



app.use(express.static(path.join(__dirname, "client"))); // Serve frontend files

let users = {}; // Store connected users

// When a user connects
io.on("connection", (socket) => {
    console.log("User Connected:", socket.id);

    // Store user with their socket ID
    socket.on("register", (username) => {
        users[socket.id] = username;
        io.emit("updateUsers", users);
    });

    // Handle messages
    socket.on("message", ({ sender, receiver, text }) => {
        if (receiver === "everyone") {
            io.emit("message", { sender, text });
        } else {
            const targetSocket = Object.keys(users).find(key => users[key] === receiver);
            if (targetSocket) {
                io.to(targetSocket).emit("message", { sender, text });
            }
        }
    });

    // Handle file transfer
    socket.on("sendFile", ({ sender, receiver, fileName, fileType, fileData }) => {
        if (receiver === "everyone") {
            io.emit("receiveFile", { sender, fileName, fileType, fileData });
        } else {
            const targetSocket = Object.keys(users).find(key => users[key] === receiver);
            if (targetSocket) {
                io.to(targetSocket).emit("receiveFile", { sender, fileName, fileType, fileData });
            }
        }
    });
    

    // When a user disconnects
    socket.on("disconnect", () => {
        delete users[socket.id];
        io.emit("updateUsers", users);
    });
});

server.listen(3000, () => console.log("Server running on port 3000"));
