const express = require('express');
const path = require('path');
const bodyparser = require('body-parser');
const PORT = process.env.PORT || 8080;
const app = express();

app.use(bodyparser.urlencoded({extended:true}));

app.use(bodyparser.json());

app.set('view engine', 'ejs');

app.use('/css', express.static(path.resolve(__dirname, 'assets/css')));
app.use('/img', express.static(path.resolve(__dirname, 'assets/img')));
app.use('/js', express.static(path.resolve(__dirname, 'assets/js')));


app.use('/', require('./server/routes/router'));

var server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const io = require('socket.io')(server);

var userConnection = [];

io.on('connect', (socket) => {
  console.log("Socket ID is : ",socket.id); // User ID

  socket.on("user connected", (data) => {
    console.log("Logged in username :", data.displayName);// Username

    userConnection.push({
        connectionId: socket.id,
        user_id: data.displayName,
      });
      var userCount = userConnection.length;
      console.log("Usercount : ",userCount);//Usercount
      
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

    var disconnectedUser = userConnection.find((p) => (p.connectionId = socket.id));

    if(disconnectedUser){
      userConnection = userConnection.filter((p) => (p.connectionId !== socket.id)
      );
      console.log("All connected users are : ", userConnection.map(function(user){
        return user.user_id;
      })
      ); 
    }
  });
});


