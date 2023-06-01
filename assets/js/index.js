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

let init = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  });

  document.getElementById('user-1').srcObject = localStream;
  createOffer();
};

init();


let socket = io.connect();

socket.on('connect', () => {
  if(socket.connected) {
    socket.emit("user connected", {
      displayName: username,
    });
  }
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
  
  chatTextArea.innerHTML += "<div style='margin-top: 2px; margin-bottom: 2px;'><b>Me: </b>" +msgData+"</div>";
  
  if(sendChannel){
    onSendChannelStateChange();
    sendChannel.send(msgData);
  } else {
    receiveChannel.send(msgData);
  }
}

function receiveChannelCallback(event){
  console.log("Receive channel callback");
  receiveChannel = event.channel;
  receiveChannel.onmesssage = onReceiveChannelMessageCallBack;
  receiveChannel.onopen = onReceiveChannelStateChange;
  receiveChannel.onclose = onReceiveChannelStateChange;
}

function onReceiveChannelMessageCallBack(event){
  console.log("Receive message");
  chatTextArea.innerHTML = "<div style='margin-top: 2px; margin-bottom: 2px;'><b>Stranger: </b>" +event.data+"</div>";
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
  remoteUser = data.username;

  createPeerConnection();

  await peerConnection.setRemoteDescription(data.offer);

  let answer = await peerConnection.createAnswer();

  await peerConnection.setLocalDescription(answer);

  socket.emit("Answer sent to user 1", {
    answer: answer,
    sender: data.remoteUser,
    receiver: data.username,
  })
}

socket.on("Receive offer", function(data){
  createAnswer(data);
});

let addAnswer = async (data) => {
  await peerConnection.setRemoteDescription(data.answer);
}

socket.on("Receive answer", function(data){
  addAnswer(data);
});

socket.on("Candidate receiver", function(data){
  peerConnection.addIceCandidate(data.iceCandidateData);
});

msgSendBtn.addEventListener("click", function(event) {
  sendData();
});