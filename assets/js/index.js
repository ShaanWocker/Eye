let localStream;
let username;
let remoteUser;
let remoteStream;
let url = new URL(window.location.href);
let peerConnection;


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

  // remoteStream = new navigator.mediaDevices.getUserMedia({
  //   video: true,
  //   audio: true
  // });

  document.getElementById("user-2").srcObject = remoteStream;

  // await 
  
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

};

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

