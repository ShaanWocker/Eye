const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const connectDB = require("./server/database/connection");

const PORT = process.env.PORT || 8080;
connectDB();

app.set('view engine', 'ejs');

app.use('/css', express.static(path.resolve(__dirname, 'assets/css')));
app.use('/img', express.static(path.resolve(__dirname, 'assets/img')));
app.use('/js', express.static(path.resolve(__dirname, 'assets/js')));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/', require('./server/routes/router'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Internal Server Error');
});

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const io = require('socket.io')(server);

// Socket.IO related code
require('socket.io')(io);

var userConnection = [];

io.on('connect', (socket) => {
  console.log("Socket ID is : ",socket.id); // User ID

  socket.on("user connected", (data) => {
    console.log("Logged in username :", data.displayName); // Username
  
    // Check if the user is already present in userConnection
    const existingUser = userConnection.find((user) => user.user_id === data.displayName);
  
    if (existingUser) {
      // Update the connectionId for the existing user
      existingUser.connectionId = socket.id;
    } else {
      // Add a new user object to userConnection
      userConnection.push({
        connectionId: socket.id,
        user_id: data.displayName,
      });
    }
  
    const userCount = userConnection.length;
    console.log("Usercount : ", userCount); // Usercount
  });  

  socket.on("Offer sent to remote server", (data) => {
    var offerReceiver = userConnection.find((o) => o.user_id === data.remoteUser);
  
    if(offerReceiver) {
      console.log("Offer receiver user ID is : ", offerReceiver.connectionId);
      socket.to(offerReceiver.connectionId).emit("Receive offer", data);
    }
  });

  socket.on("Answer sent to user 1", (data) => {
    var answerReceiver = userConnection.find((o) => o.user_id === data.receiver);

    if(answerReceiver){
      console.log("Answer receiver user ID is : ", answerReceiver.connectionId);
      socket.to(answerReceiver.connectionId).emit("Receive answer", data);
    }
  });

  socket.on("Candidate sent to user", (data) => {
    var candidateReceiver = userConnection.find((o) => o.user_id === data.remoteUser);

    if(candidateReceiver){
      console.log("Candidate receiver user ID is : ", candidateReceiver.connectionId);
      socket.to(candidateReceiver.connectionId).emit("Candidate receiver", data);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");

    var disconnectedUser = userConnection.find((p) => (p.connectionId === socket.id));

    if(disconnectedUser){
      userConnection = userConnection.filter((p) => (p.connectionId !== socket.id)
      );
      console.log("All connected users are : ", userConnection.map(function(user){
        return user.user_id;
      })
      ); 
    }

    socket.on("Remote user closed", (data) => {
      var closedUser = userConnection.find((o) => o.user_id === data.remoteUser);

    if(closedUser){
      console.log("Closed user ID is : ", closedUser.connectionId);
      socket.to(closedUser.connectionId).emit("Closed remote user", data);
    }
    });
  });
});


