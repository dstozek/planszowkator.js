var Game = require('../game').Game;
var assert = require('assert');

/* global describe, it, beforeEach */


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
    
    var g;
    
    beforeEach(function() {
        g = Game([player("Dom"), player("Kos")]);
    })
    
    it("starts", function() {
        assert(g.players.length == 2);
        assert(g.players[0].name == "Dom");
        assert(g.players[0].hand.length == 3);
        assert(!!g.players[0].hand[0]);
        assert(!!g.players[0].hand[0].definition);
        assert(!!g.players[0].hand[0].id);
        
    });
    it("has turns", function() {
        assert(g.whose_turn === 0);
        g.play_card(g.players[0], g.players[0].hand[0].id);
        assert(g.whose_turn === 1);
        g.play_card(g.players[1], g.players[1].hand[0].id);
        assert(g.whose_turn === 0);
    });
    it("disallows out of order play", function() {
        assert(g.whose_turn === 0);
        g.play_card(g.players[1], 0);
        assert(g.whose_turn === 0);
    });
    it("describes resources", function() {
        assert.deepEqual(g.players[0].resources, {food: 10, gold: 5});
    });
    it("tests card preconditions", function() {
        var p = g.players[0];
        p.resources.food = 3;
        assert(g.is_card_playable(g.rules.cards.blacklotus, p));
        assert(!g.is_card_playable(g.rules.cards.whitelotus, p));
    });
    it("resolves cards correctly", function() {
        var p = g.players[0];
        p.resources.food = 5;
        g.resolve_card(g.rules.cards.blacklotus, p);
        assert.equal(p.resources.food, 3);
    });
    it("resolves cards after play", function() {
        var p = g.players[0];
        p.resources.food = 5;
        p.hand[0].definition = {
            type: "instant", conditions: [],
            modifiers: [{"resource": "food", "change": -2}]};
        g.play_card(p, p.hand[0].id);
        assert(p.resources.food == 3);
    });
    
});