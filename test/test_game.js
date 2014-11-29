var Game = require('../game').Game;
var assert = require('assert');

/* global describe, it */


function player(name) {
    return {
        name: name,
        socket: {
            emit: function() {},
            on: function() {}
        }
    };
}

describe("Game", function() {
    it("starts", function() {
        
        var g = Game([player("Dom"), player("Kos")]);
        assert(g.players.length == 2);
        assert(g.players[0].name == "Dom");
        assert(g.players[0].hand.length == 2);
        assert(!!g.players[0].hand[0]);
        assert(!!g.players[0].hand[0].definition);
        assert(!!g.players[0].hand[0].id);
        
    });
    it("has_turns", function() {
        var g = Game([player("Dom"), player("Kos")]);
        assert(g.whose_turn === 0);
        g.play_card(g.players[0], 0);
        assert(g.whose_turn === 1);
        g.play_card(g.players[1], 0);
        assert(g.whose_turn === 0);
    });
    it("disallows out of order play", function() {
        var g = Game([player("Dom"), player("Kos")]);
        assert(g.whose_turn === 0);
        g.play_card(g.players[1], 0);
        assert(g.whose_turn === 0);
    });
});