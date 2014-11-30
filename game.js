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
        table: [],
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
    
    self.play_card = function(player, card_id) {
        var player_id = self.players.indexOf(player);
        if (player_id != self.whose_turn) {
            return; // Nope!
        }
        var matching_card_p = function(c) { return c.id == card_id};
        var permanent_activated = false;
        
        var card = _(player.hand).find(matching_card_p);
        if (!card) {
            card = _(self.table).find(matching_card_p);
        }
        if (!card) {
            card = _(player.play_area).find(matching_card_p);
            if (card) {
                permanent_activated = true;
            }
        }
        if (!card) {
            return;
        }
        if (!self.is_card_playable(card.definition, player)) {
            return;
        }
        
        if (!permanent_activated) {
            self.players.forEach(function(p) {
                p.socket.emit('hand remove', card.id);
            });
        } else {
            self.players.forEach(function(p) {
                p.socket.emit('activate card', card.id);
            });
        }
        
        if (card.definition.type == "permanent" && !permanent_activated) {
            // place perms in play area;
            player.play_area.push(card);
            self.players.forEach(function(p) {
                p.socket.emit('play area add', card, player_id);
            });
        }
        if (card.definition.type == "instant" || permanent_activated) {
            self.resolve_card(card.definition, player);
        }
       
        player.hand = _(player.hand).without(card);
        self.table = _(self.table).without(card);
       
        
        self.draw_cards(player);
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
        self.draw_cards_table();
    };
    
    self.draw_cards = function(p) {
        while(self.hand_deck.length && p.hand.length < self.rules.hands.count) {
            var card = self.hand_deck.pop();
            p.hand.push(card);
            p.socket.emit("hand add", card);
 
            self.players.forEach(function(np) {
                if (p != np)
                    np.socket.emit("hand add hidden", card.id, self.players.indexOf(p)); 
            });
        }
    };
    
    self.draw_cards_table = function() {
        while(self.hand_deck.length && self.table.length < self.rules.table.count) {
            var card = self.hand_deck.pop();
            self.table.push(card);
            
            self.players.forEach(function(np) {
                np.socket.emit("table add", card); 
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
        
        self.update_resources(player);
    };
    
    self.update_resources = function(player) {
        self.players.forEach(function(recv_player) {
            recv_player.socket.emit("update resources",
                                    self.players.indexOf(player), player.resources);
        });
    };
    
    players.forEach(function(p) {
        p.game = self;
        p.hand = [];
        p.play_area = [];
        p.game_id = players.indexOf;
        p.socket.emit("Game started", _(self.players).pluck("name"),
                      self.players.indexOf(p), self.rules);
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
    
    // draw onto table
    self.draw_cards_table();
    
    // init player resources
    self.players.forEach(function(p) {
        p.resources = _(self.rules.resources).chain()
            .map(function(d) { return [d.id, d.initial] })
            .object()
            .value();
        self.update_resources(p);
    });
    
    
    // officially start the game (players can make actions)
    self.pass_turn(0);
    
    
    return self;
};

exports.Game = Game;