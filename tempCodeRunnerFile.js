{

  let conn = null;
  let call = null;
  let mystream = null;
  let name = null;
  let peer = null;

  document.getElementById("disconnect").disabled = true;
  document.getElementById("clrmsg").disabled = true;
  document.getElementById("onlyvideo").disabled = true;
  document.getElementById("chat-msg").disabled = true;
  document.getElementById("chat-send").disabled = true;

 

  const land_name = document.getElementById("land-name");
  land_name.addEventListener("keyup", (event) => {
    name = land_name.value.trim();
    if (event.keyCode === 13 && name != "") {
      peer = new Peer(`${name}${Math.floor(Math.random() * 2 ** 8)}`); 
      document.getElementById("chat-name").innerHTML = `${name} (id: ${peer.id})`;
      document.getElementById("land-name-div").style.display = "none";
      land_name.value = "";
      init();
    }
  });


  
  let remoteid = null;
  let currentPear = null;
  let isaudio = true;
  let isvideo = true;
  let toggleNav = false;


  const sharescreen = document.getElementById("sharescreen");
  const videoframe = document.getElementById("video-call-div");
  const cover = document.getElementById("cover");
  const connecttopeer = document.getElementById("connectpeer");
  const input_remote_id = document.getElementById("inputremoteid");
  const main_chat_input = document.getElementById("chat-msg");


  function init() {
    peer.on("open", (id) => { 
      console.log(`connected to peer server with ID: ${id}`);
    });
    peer.on("connection", (c) => { 
      document.getElementById("reconnect").style.display = "none";
      document.getElementById("disconnect").disabled = false;
      document.getElementById("clrmsg").disabled = false;
      document.getElementById("onlyvideo").disabled = false;
      document.getElementById("chat-msg").disabled = false;
      document.getElementById("chat-send").disabled = false;
      conn = c;
      cover.style.display = "none";
      document.getElementById(
        "chat-name"
      ).innerHTML = `connected with: ${conn.peer}`;
      remoteid = conn.peer;
      ready(); 
    });
    peer.on("call", (c) => { 
      document.getElementById("mute-audio").innerHTML =
        "<i class='fas fa-microphone'></i>"
      document.getElementById("mute-video").innerHTML =
        "<i class='fas fa-video'></i>"
      navigator.mediaDevices 
        .getUserMedia({
          video: true,
          audio: true,
        })
        .then((stream) => { 
          videoframe.style.display = "inline";
          mystream = stream;
          addLocalVideo(stream); 
          c.answer(stream); 
          c.on("stream", (remoteStream) => { 
            addRemoteVideo(remoteStream); 
            currentPear = c.peerConnection; 
            call = c;
          });
        })
        .catch((err) => { 
          console.log(err);
        });

      c.on("close", () => { 
        mystream.getVideoTracks()[0].disabled = true
        videoframe.style.display = "none";
        c.close();
      });
    });
    peer.on("close", function () { 
      console.log("connection closed");
    });

    peer.on("error", function (err) { 
      switch (err.type) {
        case "peer-unavailable": 
          alert("Entered ID Doesnt Exist or is invalid.\n Please re-enter");
          document.getElementById("connect-with-someone").click();
          document.getElementById("reconnect").style.display = "inline";
          document.getElementById("disconnect").disabled = true;
          document.getElementById("clrmsg").disabled = true;
          document.getElementById("onlyvideo").disabled = true;
          document.getElementById("chat-msg").disabled = true;
          document.getElementById("chat-send").disabled = true;
          break;
        case "unavailable-id": //error occurred when id entered is not found
          alert("ID not found or Unavailable.\n Please try again");
          location.reload();
          break;
        case "webrtc": //SDP transaction error or ICE candidate not found
          alert("please enter peer's ID")
          document.getElementById("connect-with-someone").click();
          document.getElementById("reconnect").style.display = "inline";
          document.getElementById("disconnect").disabled = true;
          document.getElementById("clrmsg").disabled = true;
          document.getElementById("onlyvideo").disabled = true;
          document.getElementById("chat-msg").disabled = true;
          document.getElementById("chat-send").disabled = true;
          break
        case "browser-incompatible": //when the client's browser does not support some or all WebRTC features
          alert("Browser incompatible.Please switch to Chrome")
          location.reload();
          break;
        case "network": //lost or cannot establish a connection to the signalling server
          alert("Network connection lost.")
          peer.reconnect();
          break;
        case "invalid-id": //when the id contains illegal characters
          alert("Invalid ID")
          location.reload();
          break;
        case "invalid-key": //when API key passed into the Peer constructor contains illegal characters 
          alert("Invalid ID")
          location.reload();
          break;
        default:
          alert("Error occurred. Please try again");
          console.log(err.type);
          location.reload();
      }
    });
  }

  connecttopeer.addEventListener("click", () => {
    remoteid = input_remote_id.value;
    remoteid = remoteid.trim();
    if (remoteid != "") {
      document.getElementById("connect-with-someone").click();
      joinChat(remoteid); //connects to remote peer when button is clicked
      cover.style.display = "none";
    }
  });

  //handling calls below

  const videobtn = document.getElementById("onlyvideo");
  videobtn.addEventListener("click", () => {
    document.getElementById("mute-audio").innerHTML =
      "<i class='fas fa-microphone'></i>"
    document.getElementById("mute-video").innerHTML =
      "<i class='fas fa-video'></i>"
    videoframe.style.display = "inline";
    startvideocall(remoteid); //starts the media connection by taking local user media
  });


  function startvideocall(id) {
    navigator.mediaDevices //takes local video stream
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then((stream) => {
        mystream = stream;
        addLocalVideo(stream); //add the local stream to the local video element
        call = peer.call(id, stream); //initializing a media connection object with target id and local stream
        call.on("stream", (remoteStream) => { //listens on incoming stream 
          addRemoteVideo(remoteStream); //adds the incoming stream to the local video object
          currentPear = call.peerConnection; //initializes a WebRTC peer object on the local stream
          callstart(call); //starts listening to call events
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function callstart(call) {
    console.log(call.peer);
    call.on("close", () => { //listens to close event from the remote peer
      mystream.getVideoTracks()[0].disabled = true;
      videoframe.style.display = "none";
      call.close(); //closes the media connection of the media connection
    });
  }