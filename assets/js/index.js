let localStream;
let username;
let remoteUser;
let remoteStream;
let url = new URL(window.location.href);
let peerConnection;
let sendChannel;
let receiveChannel;

var msgInput = document.querySelector("#msg_input");
var msgSendBtn = document.querySelector(".msg_send_button");
var chatTextArea = document.querySelector(".chat_text_area");

username = url.searchParams.get('username');
remoteUser = url.searchParams.get('remoteuser');

var eyeID = localStorage.getItem('eyeID');
if(eyeID){
  username = eyeID;

  $.ajax({
    url: "/new_user_update/" + eyeID + "",
    type: "PUT",
    success: function (response) {
      alert(response);
    },
  });

} else {
  var postData = {data: "Demo data"};
  
  $.ajax({
    url: "/api/users",
    type: "POST",
    data: postData,
    success: function (response) {
      console.log(response);
      localStorage.setItem("eyeID", response);
      username = response;
    },
    error: function (error) {
      console.log(error);
    }
  });
}

let init = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  });

  document.getElementById('user-1').srcObject = localStream;

  $.post("http://localhost:3000/get_remote_users", { eyeID: eyeID})
    .done(function (data) {
      if(data[0]){
        if(data[0]._id == remoteUser || data[0]._id == username){

        }else{
          remoteUser = data[0]._id;
        }
      }
      createOffer();
    })
    .fail(function (xhr, textStatus, errorThrown){
      console.log(xhr.responseText);
    });
};

init();


let socket = io.connect();

socket.on('connect', () => {
  socket.emit("user connected", {
    displayName: username,
  });
});

let servers = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302", "stun:stun3.l.google.com:19302", "stun:stun4.l.google.com:19302"],
    },
  ],
};


let createPeerConnection = async () => {

  peerConnection = new RTCPeerConnection(servers);

  remoteStream = new MediaStream();

  document.getElementById("user-2").srcObject = remoteStream;
  
  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream)
  });

  peerConnection.ontrack = async (event) => {
    event.streams.forEach((stream) => {
      stream.getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
    });
  };

  remoteStream.oninactive = () => {
    remoteStream.getTracks().forEach((track) => {
      track.enabled = !track.enabled
    });
    peerConnection.close();
  };


  peerConnection.onicecandidate = async (event) => {
    if(event.candidate){
      socket.emit("Candidate sent to user", {
        username: username,
        remoteUser: remoteUser,
        iceCandidateData: event.candidate,
      })
    }
  };

  sendChannel = peerConnection.createDataChannel("Send data channel");
  sendChannel.onopen = () => {
    console.log("Data channel is now open and ready to use.");
    onSendChannelStateChange();
  }

  peerConnection.ondatachannel = receiveChannelCallback;
  // sendChannel.onmessage = onSendChannelMessageCallback;



};

function sendData(){
  const msgData = msgInput.value;
  
  chatTextArea.innerHTML += 
  "<div style='margin-top: 2px; margin-bottom: 2px;'><b>Me: </b>"
    +msgData+
  "</div>";
  
  if(sendChannel){
    onSendChannelStateChange();
    sendChannel.send(msgData);
    msgInput.value = "";
  } else {
    receiveChannel.send(msgData);
    msgInput.value = "";
  }
}

function receiveChannelCallback(event){
  console.log("Receive channel callback");
  receiveChannel = event.channel;
  receiveChannel.onmessage = onReceiveChannelMessageCallBack;
  receiveChannel.onopen = onReceiveChannelStateChange;
  receiveChannel.onclose = onReceiveChannelStateChange;
}

function onReceiveChannelMessageCallBack(event){
  console.log("Received message");
  // Display received message
  chatTextArea.innerHTML +=
    "<div style='margin-top: 2px; margin-bottom: 2px;'><b>Stranger: </b>" +
    event.data +
    "</div>";
}

function onReceiveChannelStateChange(){
  const readyState = receiveChannel.readyState;
  console.log("Receive channel state is :" + readyState);
  if(readyState === "open") {
    console.log("Data channel ready state is open - onReceiveChannelStateChange");
  } else {
    console.log("Data channel ready state is closed - onReceiveChannelStateChange");
  }
}

function onSendChannelStateChange(){
  const readyState = sendChannel.readyState;
  console.log("Send channel state is :" + readyState);
  if(readyState === "open") {
    console.log("Data channel ready state is open - onSendChannelStateChange");
  } else {
    console.log("Data channel ready state is closed - onSendChannelStateChange");
  }
}

function fetchNextUser(remoteUser){
  $.post("http://localhost:3000/get_next_user", {eyeID: eyeID, remoteUser: remoteUser}, function(data){
    console.log("Next user ID is :" + data);

    if(data[0]){
      if(data[0]._id == remoteUser || data[0]._id == username){

      }else{
        remoteUser = data[0]._id;
      }
      createOffer();
    }
  });
}

let createOffer = async () => {
  createPeerConnection();

  let offer = await peerConnection.createOffer();

  await peerConnection.setLocalDescription(offer);

  socket.emit("Offer sent to remote server", {
    username: username,
    remoteUser: remoteUser,
    offer: peerConnection.localDescription,
  });
};

let createAnswer = async (data) => {

  createPeerConnection();

  await peerConnection.setRemoteDescription(data.offer);

  let answer = await peerConnection.createAnswer();

  await peerConnection.setLocalDescription(answer);

  socket.emit("Answer sent to user 1", {
    answer: answer,
    sender: data.remoteUser,
    receiver: data.username,
  });

  document.querySelector(".next_chat").style.pointerEvents = "auto";

  $.ajax({
    url: "/update_on_engagement/" + username + "",
    type: "PUT",
    success: function (response) {},
  })
}

socket.on("Receive offer", function(data){
  createAnswer(data);
});

let addAnswer = async (data) => {
  await peerConnection.setRemoteDescription(data.answer);

  document.querySelector(".next_chat").style.pointerEvents = "auto";

  $.ajax({
    url: "/update_on_engagement/" + username + "",
    type: "PUT",
    success: function (response) {},
  })
}

socket.on("Receive answer", function(data){
  addAnswer(data);
});

socket.on("Closed remote user", function(data){
  $.ajax({
    url: "/update_on_next/" + username + "",
    type: "PUT",
    success: function(response){
      fetchNextUser(remoteUser);
    }
  })
});

socket.on("Candidate receiver", function(data){
  peerConnection.addIceCandidate(data.iceCandidateData);
});

msgSendBtn.addEventListener("click", function(event) {
  sendData();
});

window.addEventListener("unload", function(event) {
  $.ajax({
    url: "/leaving_user_update/" + username + "",
    type: "PUT",
    success: function(response){
      alert(response);
    },
  });
});

async function closeConnection(){
  await peerConnection.close();
  await socket.emit("Remote user closed", {
    username: username,
    remoteUser: remoteUser
  });
  $.ajax({
    url: "/update_on_next/" + username + "",
    type: "PUT",
    success: function(response){
      fetchNextUser(remoteUser);
    }
  })
}

document.querySelector(".next_chat").onclick = function(){
  console.log('Next chat button clicked');
  document.querySelector(".chat_text_area").innerHTML = "";

  if(peerConnection.connectionState === "connected" || peerConnection.iceCandidateState === "connected") {
    closeConnection();
    console.log("User closed");
  } else {
    fetchNextUser(remoteUser);
    console.log("Next user");
  }
}
