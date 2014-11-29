var fs = require('fs');
var _ = require('underscore');


var rules = JSON.parse(fs.readFileSync(__dirname + '/game_rules.json', {encoding: 'utf-8'}));

var Game = function(players) {
    
    var self = {
        players: players.slice(0),
        table: [],
        decks: {},
        hand_deck: null,
    };
    
    players.forEach(function(p) {
        p.game = self;
        p.hand = [];
        p.play_area = [];
        p.socket.emit("Game started", _(self.players).pluck("name"), self.players.indexOf(p));
    });
    
    // initialize decks
    rules.decks.forEach(function(deck) {
        var d = [];
        
        _(deck.cards).pairs().forEach(function(card) {
            for(var i = 0; i < card[1]; i++) {
                d.push(rules.cards[card[0]]);
            }
        });
        
        d = _(d).shuffle();
        self.decks[deck.id] = d;
    });
    
    self.hand_deck = self.decks[rules.hands.deck];

    self.draw_cards = function(p) {
        while(p.hand.length < rules.hands.count) {
            var card = self.hand_deck.pop();
            p.hand.push(card);
            p.socket.emit("hand add", card);

            self.players.forEach(function(np) {
                if (p != np)
                np.socket.emit("hand add hidden", self.players.indexOf(p)); 
            });
        }
    }
    
    // push cards from deck to hands
    self.players.forEach(self.draw_cards);
    
    
    self.remove_player = function(p) {
        /*
        var idx = self.players.indexOf(p);
        if (idx == -1) {
            return;
        }
        self.players.splice(idx, 1);
        self.players.forEach(function(p2) {
            p2.socket.emit('player_left', p);
        });
        if (self.players.length < 2) {
            self.players.forEach(self.send_game_over);
        }
        */
        
    };
    
    return self;
};

exports.Game = Game;