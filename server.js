var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var _ = require('underscore');

server.listen(process.env.PORT, process.env.IP);

app.use('/static', express.static(__dirname + '/static'));
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/static/index.html');
});


io.on('connection', function (socket) {
    
    var player = {
        socket: socket,
        name: null,
        game: null,
    };
    
    Lobby.send_list_to(player);
    
    socket.on('name', function(name) {
        player.name = name;
        Lobby.add_player(player);
    });
    socket.on('start_game', function() {
        if (Lobby.can_player_start_game(player)) {
            Lobby.start_game();
        }
    });
    socket.on('disconnect', function() {
        Lobby.remove_player(player);
        if (player.game) {
            player.game.remove_player(player);   
        }
    });
    
});


var Lobby = (function() {
    var self = {
        players: [],
    };
    
    self.add_player = function(p) {
        if (_(self.players).any(function(p2) { p2.name === p.name })) {
            return;
        }
        self.players.push(p);
        self.players.forEach(self.send_list_to);
    };
    
    self.send_list_to = function(p) {
        p.socket.emit('lobby list', self.players.map(function(p) { return p.name; }));
    };
    
    self.can_player_start_game = function(p) {
        return self.players.length >= 2 && _(self.players).contains(p);
    };
    
    self.start_game = function() {
        var MAX_PLAYERS = 4;
        var players_for_new_game = _(self.players).first(MAX_PLAYERS);
        self.players = _(self.players).rest(MAX_PLAYERS);
        self.players.forEach(self.send_list_to);
        var game = Game(players_for_new_game);
        return game;
    };
    
    self.remove_player = function(p) {
        var idx = self.players.indexOf(p);
        if (idx == -1) {
            return;
        }
        self.players.splice(idx, 1);
        self.players.forEach(self.send_list_to);
    };
    
    return self;
})();

var Game = function(players) {
    
    players.forEach(function(p) {
        p.socket.emit("Game started");
    });
    
};