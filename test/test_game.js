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
        console.log(g.players[0]);
        assert(!!g.players[0].hand[0]);
        
    });
});