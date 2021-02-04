/* ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
INITIALIZE 
/////////////////////////////////////////////////////////////////////////////////////////////////////////////// */
var myuser;
var room;
var opponentID;
var openKey = false;
var hint;
var correction = 0;
var pattern;
var currentCursor = 'music';
var theme = 'FOREST';
var currentBG = '';
var interval1;
var gameon = true;

const socket = io();

socket.on('InitialSocket', message => {
    // console.log(message.id);
    myuser = message;
    // window.alert(myuser.id + myuser.name + myuser.avatar + myuser.isLogin);
});

var audio = new Audio();
var click = new Audio();
var keynote = new Audio();
var audioname = 'bgmRiverFlowsInYou';
audio.src = 'sounds/bgmRiverFlowsInYou.mp3';
click.src = 'sounds/click.mp3';
audio.volume = 0.5;
click.volume = 0.25;
keynote.volume = 0.5;

window.onload = function() {
    
};

/* ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
SOCKET PART
/////////////////////////////////////////////////////////////////////////////////////////////////////////////// */

//======================= USER FUNCTION =======================
socket.on('currentLogin', message => {
    // console.log(message);
});

socket.on('fullLoginUsers', array =>{
    newLoginUsers(array);
});

socket.on('newUserLogin', message => {
    LobbyAvailable(message);
});

socket.on('acceptLogin', () => {
    document.getElementById('chatmessage').innerHTML = ''
    document.getElementById('avatarMenu').src = 'images/' + myuser.avatar + '.png'
    document.getElementById('nameMenu').textContent = myuser.name;
    changeTo('WelcomePage');
    changeBG('welcome.jpg');
})

socket.on('rejectLogin', message => {
    myuser = message;
    window.alert('There is a duplicated name in the server!')
})

socket.on('aUserLogout', message => {
    let lobbycard = document.getElementById("LOBBYCARD-" + message.id);
    let lobbybr = document.getElementById("LOBBYBR-" + message.id);
    lobbycard.parentNode.removeChild(lobbycard);
    lobbybr.parentNode.removeChild(lobbybr);
});

socket.on('YouAreLogout', message => {
    newLoginUsers(message);
});

socket.on('newChallenger', message => {
    document.getElementById('LOBBYCARD-' + message.id).style.backgroundColor = 'orange';
    document.getElementById('LOBBYCHALLENGE-' + message.id).value = 'Accept';
    document.getElementById('LOBBYCHALLENGE-' + message.id).onclick = function (){accept(message);};
});

socket.on('challengeCancelled', message => {
    document.getElementById('LOBBYCARD-' + message.id).style.backgroundColor = 'white';
    document.getElementById('LOBBYCHALLENGE-' + message.id).value = 'Challenge';
    document.getElementById('LOBBYCHALLENGE-' + message.id).onclick = function (){challenge('LOBBYCHALLENGE-'+message.id);};  //message = user
});

socket.on('PairingCompleted', message => {
    myuser.inGame = true;
    audio.pause();
    room = message;
    if(room.player1.id != myuser.id) opponentID = room.player1.id;
    if(room.player2.id != myuser.id) opponentID = room.player2.id;
    changeTo('PairedPage');
    changeBG('lobby.jpg');
    document.getElementById('player1-avatar').src = "images/" + room.player1.avatar + ".png";
    document.getElementById('player1-name').textContent = room.player1.name;
    document.getElementById('player1-score').textContent = room.score1.toString().padStart(7,"0");
    document.getElementById('player2-avatar').src = "images/" + room.player2.avatar + ".png";
    document.getElementById('player2-name').textContent = room.player2.name;
    document.getElementById('player2-score').textContent = room.score2.toString().padStart(7,"0");
    hint = 3;
    triggerHint(false);
    initialTimer = setTimeout(function() {
        changeTo('GamePage');
        startTimer(0); //Start gameplay
        clearTimeout(initialTimer);
    },3000);
    gameon = true;
    // console.log(room.round);
});

socket.on('newPair', message => { // message is 2 ids
    if(myuser.challenging == message[0]) {
        myuser.inGame = true;
        cancel('LOBBYCHALLENGE-'+message[0]);
        document.getElementById('LOBBYCARD-' + message[0]).style.backgroundColor = 'aquamarine';
        document.getElementById('LOBBYCHALLENGE-' + message[0]).value = 'In Game';
        document.getElementById('LOBBYCHALLENGE-' + message[0]).onclick = '';
    }
    if(myuser.challenging == message[1]) {
        myuser.inGame = true;
        cancel('LOBBYCHALLENGE-'+message[1]);
        document.getElementById('LOBBYCARD-' + message[1]).style.backgroundColor = 'aquamarine';
        document.getElementById('LOBBYCHALLENGE-' + message[1]).value = 'In Game';
        document.getElementById('LOBBYCHALLENGE-' + message[1]).onclick = '';
    }
    document.getElementById('LOBBYCARD-' + message[0]).style.backgroundColor = 'aquamarine';
    document.getElementById('LOBBYCARD-' + message[1]).style.backgroundColor = 'aquamarine';
    document.getElementById('LOBBYCHALLENGE-' + message[0]).onclick = '';
    document.getElementById('LOBBYCHALLENGE-' + message[1]).onclick = '';
    document.getElementById('LOBBYCHALLENGE-' + message[0]).value = 'In Game';
    document.getElementById('LOBBYCHALLENGE-' + message[1]).value = 'In Game';
});

socket.on('startTimer', message => {
    room = message;
    if(room.round%2 == 0){
        // console.log("20secs, Round = " + room.round + ', ' + myuser.name);
        startTimer(20);
    } else if (room.round%2 == 1) {
        // console.log("10secs, Round = " + room.round + ', ' + myuser.name);
        startTimer(10);
    }
});

socket.on('playkey', message => {
    correction = message[1];
    if(room.round%4 == 2) {
        pattern = room.pattern1;
    } else if(room.round%4 == 0){
        pattern = room.pattern2;
    }
    room.currentNote++;
    if(correction == 0) {
        playNote(message[0]);
    } else if(correction == 1) {
        playNote(message[0]);
    } else if(correction == 2) {
        playNote(message[0]);
    }
});

socket.on('Updateuser', message => {
    myuser = message;
});

socket.on('updateroom', message => {
    room = message;
    // console.log('Room1: ' + room.score1);
    // console.log('Room2: ' + room.score2);
    updateScore();
});

socket.on('updatescore', message => {
    room = message;
    updateScore();
});

socket.on('PatternEnded', () => {
    document.getElementById('round').textContent = 'Pattern Ended'
    document.getElementById('naviTimer').style.visibility = 'hidden';
    document.getElementById('Timer').textContent = ''
    clearInterval(interval1);
    // console.log('test2')
    timer3 = setTimeout(function() {
        if(myuser.id == room.player1.id) nextround();
        clearTimeout(timer3);
    }, 3000)
})

socket.on('win',() => {
    getEndPage('win');
})

socket.on('lose', () => {
    getEndPage('lose');
})

socket.on('draw', () => {
    getEndPage('draw');
})

socket.on('OpponentLeave', message => {
    room = message;
    if(myuser.inGame){
        window.alert('Your opponent has left!');
        document.getElementById('rematchButton').style.display = 'none';
    }
})

socket.on('someoneLeaveRoom', message => {
    document.getElementById('LOBBYCARD-' + message).style.backgroundColor = 'white';
    document.getElementById('LOBBYCHALLENGE-' + message).value = 'Challenge';
    document.getElementById('LOBBYCHALLENGE-' + message).onclick = function (){challenge('LOBBYCHALLENGE-'+message);};
})

socket.on('chatoutput', message => {
    chatoutput(message[0],message[1]);
})

socket.on('resetAll', () => {
    window.location.reload();
})

socket.on('stopTimer', () => {
    clearInterval(interval1);
})

socket.on('someonesurrender', message => {
    gameon = false;
    if(message[0] == myuser.id) {
        document.getElementById('LOBBYCARD-' + message[1]).style.backgroundColor = 'aquamarine';
        document.getElementById('LOBBYCHALLENGE-' + message[1]).value = 'In Game';
        document.getElementById('LOBBYCHALLENGE-' + message[1]).onclick = '';
        leaveRoom();
    }
})

/* ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
CLIENT PART
/////////////////////////////////////////////////////////////////////////////////////////////////////////////// */

//======================= USER FUNCTION =======================
function Login(){
    let tempname = document.getElementById('LoginForm-Name').value;
    tempname = tempname.trim();
    if(/^[0-9a-zA-Z]+$/.test(tempname) && tempname.length <= 8 && tempname.length >= 2){
        myuser.name = tempname;
        myuser.isLogin = true;
        socket.emit('Login', myuser);
    } else{
        window.alert('Please input a valid username\nconsists of only a-z,A-Z,0-9\nUsername must be 2 to 8 characters')
    }
}

function LobbyAvailable(message){
    const div = document.createElement('div');
    const br = document.createElement('br');
    div.id = 'LOBBYCARD-' + message.id;
    br.id = 'LOBBYBR-' + message.id;
    div.classList.add('lobbyCard');
    div.style = 'width:50%; margin:auto;'
    if(myuser.id == message.id || myuser.challenging != 'None' ){
        div.innerHTML = `
        <div style="display:inline-block; width:40%; text-align: left;">
            <img src="images/${message.avatar}.png" style="border-radius: 50%; width: 25%; height: 25%; vertical-align:middle;">
            <h4 style="display: inline;">${message.name}</h4>
        </div>
        <div style="display:inline-block; width:40%; text-align: right;">
            <input id="LOBBYCHALLENGE-${message.id}" type="button" value="Challenge" class="challenge-button" onclick="challenge('LOBBYCHALLENGE-${message.id}')" style="visibility: hidden;">
        </div>
        `
    }
    else if(message.inGame){
        div.style.backgroundColor = 'aquamarine'
        div.innerHTML = `
        <div style="display:inline-block; width:40%; text-align: left;">
            <img src="images/${message.avatar}.png" style="border-radius: 50%; width: 25%; height: 25%; vertical-align:middle;">
            <h4 style="display: inline;">${message.name}</h4>
        </div>
        <div style="display:inline-block; width:40%; text-align: right;">
            <input id="LOBBYCHALLENGE-${message.id}" type="button" value="In Game" class="challenge-button">
        </div>
        `
    } else{
        div.innerHTML = `
        <div style="display:inline-block; width:40%; text-align: left;">
            <img src="images/${message.avatar}.png" style="border-radius: 50%; width: 25%; height: 25%; vertical-align:middle;">
            <h4 style="display: inline;">${message.name}</h4>
        </div>
        <div style="display:inline-block; width:40%; text-align: right;">
            <input id="LOBBYCHALLENGE-${message.id}" type="button" value="Challenge" class="challenge-button" onclick="challenge('LOBBYCHALLENGE-${message.id}')">
        </div>
        `
    }
    document.getElementById('lobbyOnline').appendChild(div);
    document.getElementById('lobbyOnline').appendChild(br);
}

function newLoginUsers(message){
    document.getElementById('lobbyOnline').innerHTML = "";
    for(i in message){
        if(message[i].isLogin) LobbyAvailable(message[i]);
    }
}

function Exit(){
    click.play()
    if(confirm('Are you sure?\nWe will miss you!')){
        changeTo('FirstPage')
        changeBG('first.jpg');
        document.getElementById('chatmessage').innerHTML = ''
        let tempid = myuser.id;
        let tempavatar = myuser.avatar;
        myuser = new UserAccount();
        myuser.id = tempid;
        myuser.avatar = tempavatar;
        socket.emit('Logout', myuser);
    }
}

function changeAvatar(selectedAvatar){
    click.play()
    document.getElementById(myuser.avatar).style.background = 'none';
    document.getElementById(selectedAvatar).style.background = 'bisque';
    myuser.avatar = selectedAvatar;
}

function challenge(message){
    if(myuser.challenging != 'None') cancel('LOBBYCHALLENGE-'+myuser.challenging);
    let x = message.substring(15);
    myuser.challenging = x;
    cards = document.getElementsByClassName('challenge-button');
    for(i = 0; i < cards.length; i++){
        cards[i].style = 'visibility: hidden';
    }
    document.getElementById(message).style = 'visibility: visible';
    document.getElementById(message).value = 'Cancel';
    document.getElementById(message).onclick = function (){cancel(message);};
    document.getElementById('lobbyback').onclick = function (){changeTo('WelcomePage'); cancel(message);};
    socket.emit('challengeNOW',myuser);
}

function cancel(message){
    let x = message.substring(15);
    myuser.challenging = 'None';
    cards = document.getElementsByClassName('challenge-button');
    document.getElementById(message).onclick = function (){challenge(message);};
    document.getElementById(message).value = 'Challenge';
    document.getElementById('lobbyback').onclick = function (){changeTo('WelcomePage');};
    for(i = 0; i < cards.length; i++){
        cards[i].style = 'visibility: visible';
        if(cards[i].id == "LOBBYCHALLENGE-"+myuser.id){
            cards[i].style = 'visibility: hidden';
        }
    }
    socket.emit('cancelChallenge',{'myuser': myuser, 'challenged':x});
}

function accept(message){
    socket.emit('acceptChallenge', [myuser,message]);
}

function leaveRoom(){
    if(room.player1.id == myuser.id) room.leave1 = true;
    if(room.player2.id == myuser.id) room.leave2 = true;
    click.play()
    changeTo('LobbyPage');
    document.getElementById('chatmessage').innerHTML = ''
    myuser.inGame = false;
    myuser.challenging = 'None';
    socket.emit('leaveRoom',[myuser,opponentID,room]);
    opponentID = null;
    document.getElementById('rematchButton').style.display = 'block';
}

//======================= PAGE FUNCTION =======================
function changeTo(open){
    click.play()
    closeAllPage();
    document.getElementById(open).style.display = 'block';
    return;
}

function closeAllPage() {
    document.getElementById('FirstPage').style.display = 'none';
    document.getElementById('LoginPage').style.display = 'none';
    document.getElementById('WelcomePage').style.display = 'none';
    document.getElementById('LobbyPage').style.display = 'none';
    document.getElementById('HowToPlayPage').style.display = 'none';
    document.getElementById('SettingPage').style.display = 'none';
    document.getElementById('PairedPage').style.display = 'none';
    document.getElementById('GamePage').style.display = 'none';
    document.getElementById('Endpage').style.display = 'none';
}

function closeAllCard(){
    document.getElementById('card-bgmSelector').style.display = 'none';
    document.getElementById('card-bgmVolume').style.display = 'none';
    document.getElementById('card-seVolume').style.display = 'none';
    document.getElementById('card-cursor').style.display = 'none';
    document.getElementById('card-theme').style.display = 'none';
}

function openCard(card){
    click.play()
    closeAllCard();
    document.getElementById(card).style.display = 'block';
}

function changeTheme(chosenTheme){
    document.getElementById(theme).style.color = 'black';
    theme = chosenTheme;
    document.getElementById(theme).style.color = 'red';
    document.body.style.backgroundImage = 'url("images/' + theme + currentBG + '")';
}
function changeBG(page){
    document.body.style.backgroundImage = 'url("images/' + theme + page + '")';
    currentBG = page;
}

function chatinput(){
    let message = document.getElementById('chattextform').value;
    message = message.trim();
    if(message.length >= 1){
        socket.emit('chatinput', [myuser.name,message])
        document.getElementById('chatform').reset();
    }
}

function chatoutput(name,message) {
    const div = document.createElement('div');
    div.innerHTML = `
    <p style="display: inline;"><b><i>${name}</i></b></p>
    <p style="display: inline;"> : </p>
    <p style="display: inline;">${message}</p>
    `;
    document.getElementById('chatmessage').appendChild(div);
    document.getElementById('chatmessage').scrollTop = document.getElementById('chatmessage').scrollHeight;
}

function changeCursor(newCursorURL){
    document.getElementsByTagName('html')[0].style.cursor = 'url("features/' +newCursorURL+ '.png"), progress';
    document.getElementById(currentCursor).style.color = 'black'
    document.getElementById(newCursorURL).style.color = 'red'
    currentCursor = newCursorURL;
}

//======================= SOUND FUNCTION =======================
function changeBGMVolume(x){
    document.getElementById('volumeBGM').textContent = x + '%';
    audio.volume = x/100;
}

function setSoundEffect(setSE){
    if(setSE == 'on') {
        click.volume = 0.25;
        keynote.volume = 0.5;
        click.play();
        document.getElementById('seON').style.color = 'red';
        document.getElementById('seOFF').style.color = 'black';
    }
    if(setSE == 'off') {
        click.volume = 0;
        keynote.volume = 0;
        document.getElementById('seON').style.color = 'black';
        document.getElementById('seOFF').style.color = 'red';
    }
}

function startstopBGM(){
    if(audio.paused) startBGM();
    else stopBGM();
}

function startBGM(){
    click.play()
    audio.play();
}

function stopBGM(){
    click.play()
    audio.pause();
    audio.currentTime = 0;
}

function changeBGM(newBGM){
    click.play()
    audio.pause();
    document.getElementById(audioname).style.color = 'black';
    audio.currentTime = 0;
    audioname = newBGM;
    audio.src = 'sounds/' + newBGM + '.mp3';
    document.getElementById(audioname).style.color = 'red';
    audio.play();
}

//======================= GAME FUNCTION =======================
function playNote(key){
    if(correction == 0) {
        keynote = document.getElementById(key);
        document.getElementById('t'+key).classList.add('active');
        keynote.currentTime = 0;
        keynote.play();
        window.setTimeout(function(){
            document.getElementById('t'+key).classList.remove('active');
        }, 100);
    } else if(correction == 1) {
        keynote = document.getElementById(key);
        document.getElementById('t'+key).classList.add('active2');
        keynote.currentTime = 0;
        keynote.play();
        window.setTimeout(function(){
            document.getElementById('t'+key).classList.remove('active2');
        }, 100);
    } else if(correction == 2) {
        keynote = document.getElementById(key);
        document.getElementById('t'+key).classList.add('active');
        let checkNote = room.currentNote -1;
        document.getElementById('t'+pattern[checkNote]).classList.add('active3');
        keynote.currentTime = 0;
        keynote.play();
        window.setTimeout(function(){
            document.getElementById('t'+key).classList.remove('active');
            document.getElementById('t'+pattern[checkNote]).classList.remove('active3');
        }, 100);
    }
}

function playKey(key){
    if(openKey){
        if(room.round%4==1){ //player1 create pattern
            if(room.player1.id == myuser.id){
                playNote(key);
                socket.emit('playOnOtherSide', [myuser,room, key, 0]);
                socket.emit('patternRecord', [myuser,room, key]);
            }
        }else if(room.round%4==3){ //player2 create pattern
            if(room.player2.id == myuser.id){
                playNote(key);
                socket.emit('playOnOtherSide', [myuser,room, key, 0]);
                socket.emit('patternRecord', [myuser,room, key]);
            }
        }else if(room.round%4==0){ //player1 copy pattern
            if(room.player1.id == myuser.id){
                
                //And score function!
                room.score1 += calScore(key);
                playNote(key);
                // console.log(correction);
                socket.emit('playOnOtherSide', [myuser,room, key, correction]);
                socket.emit('score', [myuser,room, key]);
                if(room.endOfPattern){
                    // console.log('END OF PATTERN')
                    openKey = false;
                    triggerHint(false);
                    socket.emit('EndOfPattern', opponentID);
                }
                
            }
        }else if(room.round %4==2){ //player2 copy pattern
            if(room.player2.id == myuser.id){
                
                //And score function!
                room.score2 += calScore(key);
                playNote(key);
                // console.log(correction);
                socket.emit('playOnOtherSide', [myuser,room, key, correction]);
                socket.emit('score', [myuser,room, key]);
                if(room.endOfPattern){
                    // console.log('END OF PATTERN')
                    openKey = false;
                    triggerHint(false);
                    socket.emit('EndOfPattern', opponentID);
                }
            }
        }
    }
    correction = 0;
}

function getHint(){
    if(room.player1.id == myuser.id){
        if(room.round%4 != 0){
            // alert("Not your turn!");
        }else{
            hint--;
            room.combo = 0;
            var key = room.pattern2[room.currentNote];
            correction = 1;
            playNote(key);
            socket.emit('playOnOtherSide', [myuser,room, key, 1])
            room.score1 += calScore(key);
            room.combo = 0;
            socket.emit('score', [myuser,room, key]);
            if(room.endOfPattern){
                // console.log('END OF PATTERN')
                openKey = false;
                socket.emit('EndOfPattern', opponentID);
                triggerHint(false);
            }
        }
    }else if(room.player2.id == myuser.id){
        if(room.round%4 != 2){
            // alert("Not your turn!");
        }else{
            hint--;
            room.combo = 0;
            var key = room.pattern1[room.currentNote];
            correction = 1;
            playNote(key);
            socket.emit('playOnOtherSide', [myuser,room, key, 1])
            room.score2 += calScore(key);
            room.combo = 0;
            socket.emit('score', [myuser,room, key]);
            if(room.endOfPattern){
                // console.log('END OF PATTERN')
                openKey = false;
                socket.emit('EndOfPattern', opponentID);
                triggerHint(false);
            }
        }
    }
    // console.log('Hint Left: ' + hint)
    if(hint <= 0) {
        triggerHint(false);
        
    }
}

function nextround(){
    if(room.round >= 8 ){
        if(room.pattern2.length == 0) {
            socket.emit('noinput', [room.roomID, 1])
            room.score1 += 500000;
        }
        socket.emit("endgame", room);
    }else{
        socket.emit('nextround', room);
    }
}

function startTimer(duration) { //Timer to round change & lock keyboard
    //Condition to make both keyboards to be locked
    //Might add Ready Set Go! button
    let timer = duration;
    document.getElementById('naviTimer').style.visibility = 'hidden';
    if(room.round == 0){
        prepareAnnounce();
        if(gameon) gameCountdown(timer);
    } else if(room.round%4 == 2 && room.pattern1.length == 0){
        if(room.player1.id == myuser.id){
            socket.emit('noinput',[room.roomID,2]);
            nextround();
            return;
        }
    } else if(room.round%4 == 0 && room.pattern2.length == 0){
        if(room.player1.id == myuser.id){
            socket.emit('noinput',[room.roomID,1]);
            nextround();
            return
        }
    } else {
        prepareAnnounce();
        if(gameon) gameCountdown(timer);
    }
    //Function to make both cannot play

    
}


function gameCountdown(duration) {
    let timer = duration;
    timeout1 = setTimeout(function() {
        openKey = true;
        interval1 = setInterval(function() {
            setRoundText();
            correction = 0;
            document.getElementById('Timer').textContent = timer;
            if(timer <= 0) {
                openKey = false;
                clearInterval(interval1);
                if(room.player1.id == myuser.id){
                    // console.log('RoomPATTERN : ' + room.pattern1);
                    // console.log('RoomPATTERN : ' + room.pattern2);
                    nextround();
                }
                return;
            }
            timer--;
        },1000)
        clearTimeout(timeout1);
    },3000);
}

function prepareAnnounce() { //Announcement for round preparation
    // console.log('Turn Declaration');
    if(room.round == 0){
        document.getElementById('round').innerHTML = 'Get Ready!'
    } else if(room.round%4 == 1){
        document.getElementById('round').innerHTML = `${room.player1.name}'s Turn<br>to<br>Create Pattern`;
    } else if(room.round%4 == 2){
        document.getElementById('round').innerHTML = `${room.player2.name}'s Turn<br>to<br>Copy Pattern`;
    } else if(room.round%4 == 3){
        document.getElementById('round').innerHTML = `${room.player2.name}'s Turn<br>to<br>Create Pattern`;
    } else if(room.round%4 == 0){
        document.getElementById('round').innerHTML = `${room.player1.name}'s Turn<br>to<br>Copy Pattern`;
    } 
}

function setRoundText(){ //Announcement for round play
    if(room.round != 0) document.getElementById('naviTimer').style.visibility = 'visible';
    if(room.round == 0){
        triggerHint(false);
    } else if(room.round%4 == 1){
        triggerHint(false);
        if(room.player1.id== myuser.id){
            // console.log('test')
            document.getElementById("round").textContent = "Create Pattern!";
        }else{
            document.getElementById("round").textContent = "Watch Pattern!";
        }
    }else if(room.round%4==2){
        if(room.player1.id== myuser.id){
            document.getElementById("round").textContent = "Waiting for opponent";
        }else{
            document.getElementById("round").textContent = "Copy pattern!";
            if(hint > 0) triggerHint(true);
        }
    }else if(room.round%4==3){
        triggerHint(false);
        if(room.player1.id== myuser.id){
            document.getElementById("round").textContent = "Watch Pattern!";
        }else{
            document.getElementById("round").textContent = "Create Pattern!";
        }
    }else{
        if(room.player1.id== myuser.id){
            document.getElementById("round").textContent = "Copy Pattern!";
            if(hint > 0) triggerHint(true);
        }else{
            document.getElementById("round").textContent = "Waiting for opponent!";
        }
    }
}

function updateScore(){
    document.getElementById('player1-score').textContent = Math.round(room.score1).toString().padStart(7,"0");
    document.getElementById('player2-score').textContent = Math.round(room.score2).toString().padStart(7,"0");
}

function Rematch(){
    if(room.player1.id == myuser.id) room.rematch1 = true;
    if(room.player2.id == myuser.id) room.rematch2 = true;
    socket.emit('rematch', room);
}



function calScore(key){
    if(room.player1.id == myuser.id){
        pattern = room.pattern2;
    }else if(room.player2.id == myuser.id){
        pattern = room.pattern1;
    }
    //console.log("Current Index: "+ room.currentNote);
    //console.log (pattern[room.currentNote] + " : " + key);
    let base;
    let combo;
    if(pattern.length >=2){
        base = 900000/pattern.length;
        combo = 200000/ (pattern.length * (pattern.length-1) );
    }else if(pattern.length == 1){
        base = 1000000;
        combo = 0;
    }
    if(pattern[room.currentNote] != key){
        correction = 2;
        room.combo = 0;
        room.currentNote++;
        room.endOfPattern = (room.currentNote == pattern.length);
        return 0;
    }else{
        correction = 1;
        let score = base + combo*room.combo;
        room.combo++;
        room.currentNote++;
        room.endOfPattern = (room.currentNote == pattern.length);
        return score/2;
    }
}

function getEndPage(message){
    // console.log(room.player1.name + " : " + room.score1);
    // console.log(room.player2.name + " : " + room.score2);
    document.getElementById('endPicture').src = "images/" + message + ".jpg";
    document.getElementById('player1-endName').textContent = room.player1.name;
    document.getElementById('player1-endScore').textContent = Math.round(room.score1).toString().padStart(7,"0");
    document.getElementById('player2-endName').textContent = room.player2.name;
    document.getElementById('player2-endScore').textContent = Math.round(room.score2).toString().padStart(7,"0");
    if(room.score1 != room.score2){
        var winner = room.score1 > room.score2 ? room.player1.name : room.player2.name;
        document.getElementById('winner').textContent = winner + " wins!";
    }else{
        document.getElementById('winner').textContent = "It's a draw!";
    }
    changeTo('Endpage');
}

function surrender() {
    clearInterval(interval1);
    if(myuser.id == room.player1.id){
        room.score1 = 0;
        room.score2 = 1000000;
    }
    if(myuser.id == room.player2.id){
        room.score1 = 1000000;
        room.score2 = 0;
    }
    let tempr = room;
    socket.emit('endgame', room);
    socket.emit('surrender', [tempr,myuser.id]);
}

function triggerHint(message) {
    if(message){
        document.getElementById('hintbutton').onclick = function (){getHint();};
        document.getElementById('hintbutton').style.backgroundColor = 'darkslateblue ';
    } else{
        document.getElementById('hintbutton').onclick = '';
        document.getElementById('hintbutton').style.backgroundColor = 'gray';
    }
}

/* ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
Class Part
/////////////////////////////////////////////////////////////////////////////////////////////////////////////// */

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