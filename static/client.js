/* global io */
var socket = io.connect('/');

socket.on('lobby list', function(nicks) {
    $('#players').html('');
    nicks.forEach(function(n) {
        $('<li>').text(n).appendTo($('#players')).addClass("list-group-item");
    });
});

$('#nick_accept').click(function() {
    var n = $('#nick').val();
    if (!n) return;
    console.log("emit", n);
    socket.emit('name', n);
});