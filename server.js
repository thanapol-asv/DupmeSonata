const express = require("express");
const socket = require("socket.io");
const ipAd = require('quick-local-ip');
const open = require('open');

// App setup
const PORT = 5050;
const app = express();
const server = app.listen(PORT, function () {
    console.log("Listening on port " + PORT);
    console.log("http://localhost:" + PORT);
    console.log('http://' + ipAd.getLocalIP4() + ':' + PORT)
    console.log('==============================================');
    
    open('server.html');
});

// Static files
app.use(express.static("public"));

// Socket setup
const io = socket(server);

var users = [];
var rooms = [];
var currentSocket = 0;
var currentLogin = 0;
var serverID = 0;

io.on('connection', function (socket) {
    let user = new UserAccount();
    user.id = socket.id
    currentSocket++;
    socket.emit('InitialSocket', user);
    socket.emit('currentLogin',currentLogin);
    users.push(user);
    // for(i in users){ // debug
    //     console.log(users[i].inGame);
    // }
    socket.emit('fullLoginUsers',users);
    
    console.log('( ' + socket.id + ' ) is connected');
    serverStatus(currentSocket,currentLogin);

    socket.on('disconnect', () => {
        let i = findUser(socket.id)
        if(users[i].isLogin) {
            currentLogin--;
            io.emit('currentLogin',currentLogin);
            io.emit('aUserLogout',users[i]);
            if(users[i].inGame) {
                let check;
                for(k in rooms){
                    if(rooms[k].roomID.includes(users[i].id)) check = k;
                }
                if(rooms[k].player1.id == users[i].id){
                    rooms[k].score1 = 0;
                    rooms[k].score2 = 1000000;
                    io.to(rooms[k].player2.id).emit('updateroom',rooms[k]);
                    io.to(rooms[k].player2.id).emit('win');
                    io.to(rooms[k].player2.id).emit('Updateuser',rooms[k].player2);
                    io.to(rooms[k].player2.id).emit('OpponentLeave',rooms[k]);
                }
                if(rooms[k].player2.id == users[i].id){
                    rooms[k].score1 = 1000000;
                    rooms[k].score2 = 0;
                    io.to(rooms[k].player1.id).emit('updateroom',rooms[k]);
                    io.to(rooms[k].player1.id).emit('win');
                    io.to(rooms[k].player1.id).emit('Updateuser',rooms[k].player1);
                    io.to(rooms[k].player1.id).emit('OpponentLeave',rooms[k]);
                }
            }
        }
        currentSocket--;
        console.log(users[i].name + ' ( ' + users[i].id + ' ) is disconnected');
        users.splice(i,1);
        serverStatus(currentSocket,currentLogin);

        if(socket.id == serverID){
            console.log('Server Terminated');
            process.exit();
        }
    });

    socket.on('Login', message => {
        let duplicatedname = false;
        for(k in users) if(users[k].name == message.name) {
            duplicatedname = true;
        }
        if(!duplicatedname){
            let i = findUser(socket.id)
            users[i] = message;
            currentLogin++;
            io.emit('currentLogin',currentLogin);
            io.emit('newUserLogin',message);
            io.to(message.id).emit('acceptLogin',null);
            console.log(users[i].name + ' ( ' + users[i].id + ' ) is Login');
            serverStatus(currentSocket,currentLogin);
        } else{
            let i = findUser(socket.id)
            users[i].isLogin = false;
            io.to(message.id).emit('rejectLogin',users[i]);
        }
        
    });

    socket.on('Logout', message => {
        let i = findUser(socket.id);
        currentLogin--;
        io.emit('currentLogin',currentLogin);
        io.emit('aUserLogout',users[i]);
        console.log(users[i].name + ' ( ' + users[i].id + ' ) is Logout');
        users[i] = message;
        io.to(socket.id).emit('YouAreLogout', users);
        serverStatus(currentSocket,currentLogin);
    })

    socket.on('challengeNOW', message => {
        let i = findUser(socket.id);
        users[i] = message;
        io.to(message.challenging).emit('newChallenger',users[i]); // users[i] is challenger
    })

    socket.on('cancelChallenge', message => {
        let i = findUser(socket.id);
        users[i] = message.myuser;
        io.to(message.challenged).emit('challengeCancelled',users[i]);
    })

    socket.on('acceptChallenge', message => {
        message[0].inGame = true;
        message[1].inGame = true;
        let rand = Math.round(Math.random());
        let room = new Room();
        let i0 = findUser(message[0].id);
        users[i0] = message[0]
        let i1 = findUser(message[1].id);
        users[i1] = message[1]
        if(rand == 0){
            room.roomID = message[0].id + message[1].id;
            room.player1 = message[0];
            room.player2 = message[1];
        } else{
            room.roomID = message[1].id + message[0].id;
            room.player1 = message[1];
            room.player2 = message[0]
        }
        rooms.push(room);
        io.emit('newPair',[room.player1.id,room.player2.id]);
        io.to(room.player1.id).emit('PairingCompleted',room);
        io.to(room.player2.id).emit('PairingCompleted',room);
        io.to(users[i0].id).emit('Updateuser',users[i0]);
        io.to(users[i1].id).emit('Updateuser',users[i1]);
        // console.log("ROOM: " + room.player1.inGame)
        // console.log("ROOM: " + room.player2.inGame)
    })

    socket.on('playOnOtherSide', message => {
        var sender = message[0];
        var r = findRoom(message[1].roomID);
        var key = message[2];
        if(sender.id==rooms[r].player1.id){
            io.to(rooms[r].player2.id).emit('playkey', [key,message[3]]); 
        }else{
            io.to(rooms[r].player1.id).emit('playkey', [key,message[3]]); 
        }
    })

    socket.on('patternRecord', message => {
        //console.log('patternRecord called');
        //message is the array sent
        var sender = message[0];
        var i = findRoom(message[1].roomID); //because script changes, the r called need to be searched from server!
        var key = message[2];
        //Cases
        if(rooms[i].round%4 == 1){
            if (sender.id == rooms[i].player1.id){
                rooms[i].pattern1.push(key);
                //console.log(rooms[i].pattern1.toString()); //debug
            }
        } else if(rooms[i].round%4 == 3){
            if  (sender.id == rooms[i].player2.id){
                rooms[i].pattern2.push(key);
                //console.log(rooms[i].pattern2.toString()); //debug
            }
        }
    })

    socket.on('EndOfPattern', message => {
        io.to(socket.id).emit('PatternEnded', null);
        io.to(message).emit('PatternEnded', null);
    })

    socket.on('nextround', message => {
        let i = findRoom(message.roomID);
        if(rooms[i] != null) {

        if(rooms[i].round%4==0){
            rooms[i].pattern1 = [];
            rooms[i].pattern2 = [];
        }
        rooms[i].round++;
        rooms[i].currentNote = 0;
        rooms[i].combo = 0;
        rooms[i].endOfPattern = false;
        //console.log("Nextround got invoked " + rooms[i].round);
        io.to(rooms[i].player1.id).emit('updateroom', rooms[i]);
        io.to(rooms[i].player2.id).emit('updateroom', rooms[i]);
        //Send to each script to start timer
        io.to(rooms[i].player1.id).emit('startTimer', rooms[i]);
        io.to(rooms[i].player2.id).emit('startTimer', rooms[i]);
        }
    })
    socket.on('noinput', message => {
        let i = findRoom(message[0]);
        if(message[1] == 1) rooms[i].score1 += 500000;
        if(message[1] == 2) rooms[i].score2 += 500000;
        io.to(rooms[i].player1.id).emit('updateroom', rooms[i]);
        io.to(rooms[i].player2.id).emit('updateroom', rooms[i]);
    })

    socket.on('score', message => {
        //console.log("score got invoked");
        let i = findRoom(message[1].roomID);
        rooms[i] = message[1];
        io.to(rooms[i].player1.id).emit('updatescore', rooms[i]);
        io.to(rooms[i].player2.id).emit('updatescore', rooms[i]);
    })

    socket.on('surrender', message => {
        io.to(message[0].player1.id).emit('someonesurrender',[message[1],message[0].player2.id]);
        io.to(message[0].player2.id).emit('someonesurrender',[message[1],message[0].player1.id]);
    })

    socket.on('endgame', message => {
        let k = findRoom(message.roomID);
        rooms[k].end = true;
        message.end = true;
        // console.log("endgame got triggered");
        io.to(message.player1.id).emit('updateroom',message);
        io.to(message.player2.id).emit('updateroom',message);
        // io.to(message.player1.id).emit('stopTimer',null);
        // io.to(message.player2.id).emit('stopTimer',null);
        if(message.score1 != message.score2){
            var winner = message.score1 > message.score2 ? message.player1 : message.player2;
            var loser = message.score1 < message.score2 ? message.player1 : message.player2;
            io.to(winner.id).emit('updateroom',message);
            io.to(winner.id).emit('win');
            io.to(loser.id).emit('lose');
            io.to(winner.id).emit('Updateuser',winner);
            io.to(loser.id).emit('Updateuser',loser);
        } else{
            io.to(message.player1.id).emit('draw');
            io.to(message.player2.id).emit('draw');
        }
    })

    socket.on('rematch', message => {
        let i = findRoom(message.roomID);
        rooms[i] = message;
        io.to(rooms[i].player1.id).emit('updateroom', rooms[i]);
        io.to(rooms[i].player2.id).emit('updateroom', rooms[i]);
        var winner;
        var loser;

        if(message.score1 != message.score2){
            winner = message.score1 > message.score2 ? message.player1 : message.player2;
            loser = message.score1 < message.score2 ? message.player1 : message.player2;
        }else{ //no winner or loser, just random for first player of new game
            let rand = Math.round(Math.random());
            if(rand==0){
                winner = message.player1;
                loser = message.player2;
            }
            else{
                winner = message.player2;
                loser = message.player1;
            } 
        }

        
        // console.log(rooms[i].rematch1 + ", " + rooms[i].rematch2);
        if(rooms[i].rematch1 && rooms[i].rematch2){
            rooms.splice(i,1);
            let room = new Room();
            room.roomID = winner.id + loser.id;
            room.player1 = winner;
            room.player2 = loser;
            rooms.push(room);
            io.emit('newPair',[room.player1.id,room.player2.id]);
            io.to(room.player1.id).emit('PairingCompleted',room);
            io.to(room.player2.id).emit('PairingCompleted',room);
            io.to(room.player1.id).emit('Updateuser',winner);
            io.to(room.player2.id).emit('Updateuser',loser);
            io.to(rooms[i].player1.id).emit('updateroom', room);
            io.to(rooms[i].player2.id).emit('updateroom', room);
            // console.log("ROOMLEAVECHECK: " + room.leave1 + room.leave2);
            // console.log(rooms.length);
        }
    })

    socket.on('leaveRoom', message => {
        let i = findUser(message[0].id);
        users[i] = message[0];
        let k = findRoom(message[2].roomID);
        rooms[k] = message[2];
        // console.log("ROOMLEAVE: " + rooms[k].leave1 + rooms[k].leave2);
        io.emit('someoneLeaveRoom',users[i].id);
        if(rooms[k].leave1 && rooms[k].leave2) {
            rooms.splice(k,1);
        } else{
            // console.log('CHECKOUT' + message[1])
            io.to(message[1]).emit('OpponentLeave',rooms[k]);
        }
        // console.log("ROOM: " + rooms.length)
    })

    socket.on('chatinput', message => {
        io.emit('chatoutput', message);
    })

    socket.on('serverRegistration', () => {
        if(serverID == 0){
            socket.emit('ipV4',ipAd.getLocalIP4())
            serverID = socket.id;
        } else{
            socket.emit('ServerRegistrationFail', ipAd.getLocalIP4());
        }
    })

    socket.on('resetServer', () => {
        socket.broadcast.emit('resetAll', null);
    })
});


function findUser(id){
    for(i = 0; i < users.length ; i++){
        if(users[i].id == id){
            return i;
        }
    }
}

function findRoom(roomid){
    for(i = 0; i < rooms.length ; i++){
        if(rooms[i].roomID == roomid){
            return i;
        }
    }
}

function serverStatus(socket,login){
    console.log('Number of Socket Connection : ' + socket);
    console.log('Number of Login Connection : ' + login);
    console.log('==============================================');
    io.emit('updateUser', [currentSocket,currentLogin]);
}

class UserAccount {
    constructor(){
        this.id = null;
        this.name = 'Anonymous';
        this.avatar = 'avatar2';
        this.challenging = 'None';
        this.record = 0;
        this.isLogin = false;
        this.inGame = false;
    }
}

class Room {
    constructor(){
        this.roomID = 'NOT-GENERATED'
        this.player1 = null;
        this.player2 = null;
        this.pattern1 = [];
        this.pattern2 = [];
        this.score1 = 0;
        this.score2 = 0;
        this.round = 0; //1,3,5,7 is constructing. 2,4,6,8 is copying
        //1,4,5,8 is player1. 2,3,6,7 is player2
        this.currentNote = 0;
        this.combo = 0;
        this.endOfPattern = false;
        this.rematch1 = false;
        this.rematch2 = false;
        this.leave1 = false;
        this.leave2 = false;
        this.end = false;
    }
}