var fs = require('fs');
var _ = require('underscore');


var DefaultRules = JSON.parse(fs.readFileSync(__dirname + '/game_rules.json', {encoding: 'utf-8'}));

var Game = function(players) {
    
    var self = {
        players: players.slice(0),
        table: [],
        decks: {},
        hand_deck: null,
        whose_turn: null,
        rules: DefaultRules
    };
    
    
    
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
    
    self.play_card = function(player, card) {
        var player_id = self.players.indexOf(player);
        if (player_id != self.whose_turn) {
            return; // Nope!
        }
        var player = self.players[player_id];
        self.pass_turn();
    };
    
    self.pass_turn = function(turn) {
        if (turn !== undefined) {
            self.whose_turn = turn;
        } else {
                
            self.whose_turn++;
            self.whose_turn %= self.players.length;
            
        }
        self.players.forEach(function(p) {
            p.socket.emit("turn", self.whose_turn);
        });
    };
    
    self.draw_cards = function(p) {
        while(p.hand.length < self.rules.hands.count) {
            var card = self.hand_deck.pop();
            p.hand.push(card);
            p.socket.emit("hand add", card);
 
            self.players.forEach(function(np) {
                if (p != np)
                    np.socket.emit("hand add hidden", self.players.indexOf(p)); 
            });
        }
    };
    
    self.is_card_playable = function(card_def, player) {
        return _(card_def.conditions).all(function(c) {
            return player.resources[c.resource] >= c.amount;
        });
    };
    
    self.resolve_card = function(card_def, player) {
        card_def.modifiers.forEach(function(m) {
             player.resources[m.resource] += m.change;
        });
    };
    
    players.forEach(function(p) {
        p.game = self;
        p.hand = [];
        p.play_area = [];
        p.game_id = players.indexOf;
        p.socket.emit("Game started", _(self.players).pluck("name"), self.players.indexOf(p));
    });
    
    // initialize decks
    var id_counter = 1;
    self.rules.decks.forEach(function(deck) {
        var d = [];
        
        _(deck.cards).pairs().forEach(function(card) {
            for(var i = 0; i < card[1]; i++) {
                d.push({
                    id: id_counter,
                    definition: self.rules.cards[card[0]],
                });
                id_counter++;
            }
        });
        
        d = _(d).shuffle();
        self.decks[deck.id] = d;
    });
    
    self.hand_deck = self.decks[self.rules.hands.deck];

    
    // push cards from deck to hands
    self.players.forEach(self.draw_cards);
    
    // init player resources
    self.players.forEach(function(p) {
        p.resources = _(self.rules.resources).chain()
            .map(function(d) { return [d.id, d.initial] })
            .object()
            .value();
    });
    
    
    // officially start the game (players can make actions)
    self.pass_turn(0);
    
    
    return self;
};

exports.Game = Game;