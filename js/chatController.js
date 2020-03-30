window.mainUsername = new Date().getTime();
window.members = [];
window.socket = io.connect('http://' + document.domain + ':' + location.port);
window.mainRoom = "example";
window.myStream;

$('#username').html('<b>Usuer</b> : ' + mainUsername);
$('#chatname').html('<b>Room</b> : ' + mainRoom);
var screenShare=null;
window.myStream;
window.videoRTCController = new VideoRTCController();

socket.on('connect', function(){
    $('.memeber-container').remove();
    var userMedia = ( navigator.getUserMedia ||
                        navigator.webkitGetUserMedia ||
                        navigator.mozGetUserMedia ||
                        navigator.msGetUserMedia 
						);

    var getUserMedia = userMedia.bind(navigator);  
    getUserMedia({audio: true, video: true}, start, function() {alert('Error');});

   
});


function start(stream) {
    myStream = stream;
  
    document.querySelector("#main-video").srcObject = stream;

    socket.emit('room', {room : mainRoom, user : mainUsername});

    socket.on('onConnectRoom', function(data) {
        for (var i in data.members) {
            var user = data.members[i];
            if (user !== mainUsername) {
                members.push(user);
                showNewMember(user);
                videoRTCController.createOffer(user.username);
            }
        }
    });

    socket.on('onTextMessage', function(data) {
        var labelUser = data.user;
        if (data.user == mainUsername) {
            labelUser = 'ME';
        }
        $('#content').append('<div style="width:400px;height:20px;position:relative"><div style="float:left;margin-right: 11px;font-size:10px;line-height:19px;postion:absolute">' + labelUser + ' : </div><div>' + data.text + '</div></div>');
    });

    socket.on('onNewMember', function(data) {
        console.log('new member : ', data);
        var user = {username : data.username};
        members.push(user);
        showNewMember(user);
    });

    socket.on('onDisconnectMember', function(data) {
        console.log('onDisconnectMember');
        members.splice(data.user, 1);
        $('#m' + data.user).remove();
        $('#v' + data.user).remove();
        videoRTCController.memberDisconnect(data.user);
    });

    socket.on('disconnect',function() {
        $('.memeber-container').remove();
    });

    $('#send').click(function() {
        if ($('#field').val().length > 0) {
            sendMessage($('#field').val());
        }
    });

    $('#share').click(function() {
        let displayMediaOptions = {video: true, audio: true};
        navigator.mediaDevices.getDisplayMedia(displayMediaOptions)
        .then(function(stream){
            screenShare=stream;
            document.querySelector("#other-video").srcObject = screenShare;
        })
    });
$('#record').click(function(){

startrecord(5000);
});
let displayMediaOptions = {video: true, audio: true};

var startrecord = ms => navigator.mediaDevices.getDisplayMedia(displayMediaOptions)
  .then(stream => record(stream, ms)
    .then(recording => {
      stop(stream);
      recordedvideo.src = recordedlink.href = URL.createObjectURL(new Blob(recording));
      recordedlink.download = "recording.blob";
      recordedlink.innerHTML = "Download blob";
      log("Playing "+ recording[0].type +" recording:");
    })
    .catch(log).then(() => stop(stream)))
  .catch(log);

var record = (stream, ms) => {
  var rec = new MediaRecorder(stream), data = [];
  rec.ondataavailable = e => data.push(e.data);
  rec.start();
  log(rec.state + " for "+ (ms / 1000) +" seconds...");
  var stopped = new Promise((r, e) => (rec.onstop = r, rec.onerror = e));
  return Promise.all([stopped, wait(ms).then(() => rec.stop())])
    .then(() => data);
};

var stop = stream => stream.getTracks().forEach(track => track.stop());
var wait = ms => new Promise(resolve => setTimeout(resolve, ms));
var log = msg => $("#log")[0].innerHTML += "<br>" + msg;

    $('#field').keyup(function(e) {
        if (e.keyCode == 13 && $('#field').val().length > 0) {
            sendMessage($('#field').val());
        }
    });

    function sendMessage(text) {
        socket.emit('textMessage', {room : mainRoom, text : text, user : mainUsername});
        $('#field').val('');
    }

    function showNewMember(user) {
        if (user.username != mainUsername) {
            $('#m' + user.username).remove();
            $('.members-container').append('<div class="memeber-container" style="padding:5px" id="m' + user.username + '"><p><b>Conectado con</b> : ' + user.username + '</p></div>');
        }
        
    }
}
