// Adapted from https://github.com/priologic/easyrtc/tree/master/server_example

// Load required modules
var https   = require("https");     // https server core module
var fs      = require("fs");        // file system core module

var express = require("express");           // web framework external module
var serveStatic = require('serve-static');  // serve static files
var socketIo = require("socket.io");        // web socket external module
var easyrtc = require("../");               // EasyRTC external module

// Set process name
process.title = "node-easyrtc";

// Setup and configure Express http server. Expect a subfolder called "static" to be the web root.
var app = express();
app.use(serveStatic('static', {'index': ['index.html']}));

// Start Express https server on port 8443
var webServer = https.createServer(
{

    key:  fs.readFileSync("/etc/letsencrypt/archive/your-server/privkey1.pem"),
    cert: fs.readFileSync("/etc/letsencrypt/archive/your-server/fullchain1.pem"),
    ca: fs.readFileSync("/etc/letsencrypt/archive/your-server/chain1.pem")
},
app).listen(8443);


// Start Socket.io so it attaches itself to Express server
var socketServer = socketIo.listen(webServer, {"log level":1});

//easyrtc.setOption("logLevel", "debug");
easyrtc.setOption("roomDefaultEnable", false); // prevents default room being created

// Overriding the default easyrtcAuth listener, only so we can directly access its callback
easyrtc.events.on("easyrtcAuth", function(socket, easyrtcid, msg, socketCallback, callback) {
    easyrtc.events.defaultListeners.easyrtcAuth(socket, easyrtcid, msg, socketCallback, function(err, connectionObj){
        if (err || !msg.msgData || !msg.msgData.credential || !connectionObj) {
            callback(err, connectionObj);
            return;
        }
        connectionObj.setField("credential", msg.msgData.credential, {"isShared":false});
        callback(err, connectionObj);
    });
});

// To test, lets print the credential to the console for every room join!
easyrtc.events.on("roomJoin", function(connectionObj, roomName, roomParameter, callback) {
    console.log("["+connectionObj.getEasyrtcid()+"] Credential retrieved!", connectionObj.getFieldValueSync("credential"));
    console.log("name "+connectionObj.getUsername());
    var username = connectionObj.getUsername();
    console.log("roomJoinfired! Trying to join: " + roomName);
    if(username == "libbybot"){
       console.log("libby bot is online - "+str);
    }
    easyrtc.events.defaultListeners.roomJoin(connectionObj, roomName, roomParameter, callback);
});

easyrtc.events.on("roomLeave", function(connectionObj, roomName, roomParameter, callback) {
    console.log("roomLeave name "+connectionObj.getUsername());
    easyrtc.events.defaultListeners.roomJoin(connectionObj, roomName, roomParameter, callback);
});


// Start EasyRTC server
var rtc = easyrtc.listen(app, socketServer, null, function(err, rtcRef) {
    console.log("EasyRTC server initiated");

    rtcRef.events.on("roomCreate", function(appObj, creatorConnectionObj, roomName, roomOptions, callback) {
        console.log("roomCreate fired! Trying to create: " + roomName);
        appObj.events.defaultListeners.roomCreate(appObj, creatorConnectionObj, roomName, roomOptions, callback);
    });
});

