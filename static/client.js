/* global io, _ */
var socket = io.connect('/');

socket.on('lobby list', function(names) {
    $('#players').html('');
    names.forEach(function(n) {
        $('<li>').text(n).appendTo($('#players')).addClass("list-group-item"); 
    });
    if (names.length >= 2 && MY_NICK){
        console.log("Start enabled")
        $("#lobby-start").show();
    }
});

var PLAYER_DIVS = [];
var MY_IDX = null;
var MY_NICK = null;

socket.on('Game started', function(player_names, my_idx, rules) {
    $('#lobby').hide();
    $('#game').show();
    MY_IDX = my_idx;
    
    var res_init = function(container) {
        rules.resources.forEach(function(resource) {
            var r = $('<div>').text(resource.title + ": ").appendTo(container);
            $('<span>').attr('data-resource', resource.id).appendTo(r);
        });    
    };
    
    player_names.forEach(function (p, i) {
        if (i != my_idx) {
            var d = $('<div>').appendTo($('#players-game'))
                .addClass("list-group-item");
                $('<h4>').text(p).appendTo(d);
            PLAYER_DIVS[i] = d;
            
            PLAYER_DIVS[i].hand = $('<div class="hand">').appendTo(d);
            $('<div class="handovr">').appendTo(d);
            $('<div id="play-area-'+i+'">').appendTo(d);
            $('<div class="handovr">').appendTo(d);
            res_init(d);
            
            
        
        }

    });
    
    $('<div id="play-area-'+ my_idx +'">').appendTo('#my-play');
    
    res_init($("#my-resources"));
    //$('#my-resources').find("[data-resource=food]")
    //PLAYER_DIVS[n].find("[data-resource=food]")
});

socket.on('Game over', function() {
    $('#game').hide();
    $('#gameover').show();
});

var make_card = function(card) {
    var d = $('<div>').addClass("card");
    //d.text(JSON.stringify(card));
    
    $('<p><em>'+card.definition.type+'</em></p>').appendTo(d);
    $('<img src="'+card.definition.image+'">').appendTo(d);
    $('<h3>'+card.definition.title+'</h3>').appendTo(d);
    $('<p>'+card.definition.description+'</p>').appendTo(d);
    var reqs = $('<ul>').appendTo(d);
    card.definition.conditions.forEach(function(c) {
        $('<li>').text("Requires " + c.amount +" "+c.resource).appendTo(reqs);
    });
    var mods = $('<ul>').appendTo(d);
    card.definition.modifiers.forEach(function(c) {
        var f = c.change < 0?"Costs ":"Gives ";
        $('<li>').text(f + c.change +" "+c.resource).appendTo(mods);
    });
    $('<p><em>'+card.definition.flavour_text+'</em></p>').appendTo(d);
    
    d.click(function() {
        console.log("playing card", card);
        socket.emit('play card', card.id);
    });
    d.attr('data-card-id', card.id);
    d.hide().delay(800).show('fast');
    
    return d;
}

socket.on('hand add', function(card) {
    var c = make_card(card);
    c.appendTo($('#my-hand'));
});

socket.on('table add', function(card) {
    console.log("table add", card);
    var c = make_card(card);
    c.appendTo($('#table'));
});

socket.on('play area add', function(card, player_id) {
    var c = make_card(card);
    c.appendTo($('#play-area-'+player_id));
});

socket.on('hand remove', function(card_id) {
    console.log("hand remove", card_id);
    $('[data-card-id='+card_id+']').hide('fast');
});

socket.on('hand add hidden', function(id, player_id) {
    if (PLAYER_DIVS[player_id]) {
        var d = $('<div>').html('&nbsp;')
            .appendTo(PLAYER_DIVS[player_id].hand)
            .addClass("hidden-card")
            .attr("data-card-id", id);
            
         d.hide().delay(800).show('fast');
    }
});

socket.on('turn', function(player_id) {
    console.log("It's player "+player_id+"'s turn now.");
    if (player_id == MY_IDX) {
        $("#my-turn-indicator").show('slow');
    } else {
        $("#my-turn-indicator").hide('slow');
    }
    
});

socket.on('update resources', function(player_id, resources) {
    console.log('update resources', player_id, resources);
    var part;
    if (player_id == MY_IDX) {
        part = $('#my-resources');
    } else {
        part = PLAYER_DIVS[player_id];
    }
    _(resources).pairs().forEach(function(pair) {
        var res_name = pair[0], value = pair[1];
        part.find("[data-resource="+res_name+"]").text(value);
    });
});

$('#nick_accept').click(function() {
    var n = $('#nick').val();
    if (!n) return;
    MY_NICK = n;
    console.log("emit", n);
    socket.emit('name', n);
    $("#lobby-login").hide();
});
$('#start_game').click(function() {
    socket.emit('start_game');
});
