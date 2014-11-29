/* global io */
var socket = io.connect('/');

socket.on('lobby list', function(names) {
    $('#players').html('');
    names.forEach(function(n) {
        $('<li>').text(n).appendTo($('#players')).addClass("list-group-item");
    });
});

var PLAYER_DIVS = [];
var MY_IDX = null;


socket.on('Game started', function(player_names, my_idx) {
    $('#lobby').hide();
    $('#game').show();
    MY_IDX = my_idx;
    player_names.forEach(function (p, i) {
        if (i != my_idx) {
            var d = $('<div>').text(p).appendTo($('#players-game'))
                .addClass("list-group-item");
            PLAYER_DIVS[i] = d;
        }
    });
    
});

socket.on('Game over', function() {
    $('#game').hide();
    $('#gameover').show();
});

socket.on('hand add', function(card) {
    var d = $('<div>').text(JSON.stringify(card)).appendTo($('#my-hand')).addClass("list-group-item");
    d.click(function() {
        console.log("playing card", card);
        socket.emit('play card', card.id);
        
    });
});


socket.on('hand add hidden', function(id) {
    if (PLAYER_DIVS[id]) {
        $('<div>').text('Hidden card').appendTo(PLAYER_DIVS[id]);
    }
});

socket.on('turn', function(player_id) {
    console.log("It's player "+player_id+"'s turn now.");
    $("#my-hand").toggleClass("active", player_id == MY_IDX);
    
});

$('#nick_accept').click(function() {
    var n = $('#nick').val();
    if (!n) return;
    console.log("emit", n);
    socket.emit('name', n);
});
$('#start_game').click(function() {
    socket.emit('start_game');
});
