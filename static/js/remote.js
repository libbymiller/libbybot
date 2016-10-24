var activeBox = -1;  // nothing selected
var aspectRatio = 4/3;  // standard definition video aspect ratio
var maxCALLERS = 3;
var numVideoOBJS = maxCALLERS+1;
var layout;


function getIdOfBox(boxNum) {
    return "box" + boxNum;
}


var boxUsed = [true, false, false, false];
var connectCount = 0;
var hshbox;

function callEverybodyElse(roomName, otherPeople) {

    var list = [];
    var connectCount = 0;
    for(var easyrtcid in otherPeople ) {
        list.push(easyrtcid);
    }

    easyrtc.setRoomOccupantListener(null); // so we're only called once.

    //
    // Connect in reverse order. Latter arriving people are more likely to have
    // empty slots.
    //
    function establishConnection(position) {
        function callSuccess() {
            connectCount++;
            if( connectCount < maxCALLERS && position > 0) {
                establishConnection(position-1);
            }
        }
        function callFailure(errorCode, errorText) {
            easyrtc.showError(errorCode, errorText);
            if( connectCount < maxCALLERS && position > 0) {
                establishConnection(position-1);
            }
        }
        easyrtc.call(list[position], callSuccess, callFailure);

    }
    if( list.length > 0) {
        establishConnection(list.length-1);
    }
}


function loginSuccess() {
}

function appInit() {

    easyrtc.enableVideo(false);

    //change roomname
    roomName = theroom;
    var room = document.getElementById('room');
    room.innerHTML = "Room: "+roomName;

    easyrtc.setRoomOccupantListener(null); // so we're only called once.

    // join a specific room to avoid "default"
    console.log("bot 4 is joining "+roomName);

    easyrtc.joinRoom(roomName, null,
      function(roomName) {
           console.log("I'm now in room " + roomName);
      },
      function(errorCode, errorText, roomName) {
          console.log("had problems joining " + roomName);
      }
    );

    easyrtc.setRoomOccupantListener(callEverybodyElse);
    easyrtc.easyApp("easyrtc.multiparty", "box0", ["box1", "box2", "box3"], loginSuccess);
    easyrtc.setDisconnectListener( function() {
        easyrtc.showError("LOST-CONNECTION", "Lost connection to signaling server");
    });
    easyrtc.setOnCall( function(easyrtcid, slot) {
        console.log("getConnection count="  + easyrtc.getConnectionCount() );
        console.log("box is "+getIdOfBox(slot+1));
        document.getElementById("num_peers").innerHTML = easyrtc.getConnectionCount()+" people connected";
        var username = easyrtc.idToName(easyrtcid);
        if(username == "libbybot"){
          document.getElementById("offair").style.display = "none";
          document.getElementById("onair").style.display = "block";
          document.getElementById("room").style.display = "block";
          document.getElementById(getIdOfBox(slot+1)).style.width = "600px";
          document.getElementById(getIdOfBox(slot+1)).style.float = "left";
        }else{
          document.getElementById(getIdOfBox(slot+1)).style.width = "100px";
        }
        boxUsed[slot+1] = true;
        document.getElementById(getIdOfBox(slot+1)).style.display = "block";
    });


    easyrtc.setOnHangup(function(easyrtcid, slot) {
        boxUsed[slot+1] = false;
        setTimeout(function() {
            document.getElementById(getIdOfBox(slot+1)).style.display = "none";

            if( easyrtc.getConnectionCount() == 0 ) { // no more connections
               document.getElementById("offair").style.display = "block";
            }
        },20);
    });
}


