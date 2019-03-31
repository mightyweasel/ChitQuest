$(function () {

    FastClick.attach(document.body);

    var _nf = null;
    if (window.Intl) {
        _nf = new Intl.NumberFormat();
    } else {
        _nf = { format: function (n) { return n; } };
    }

    $.fn.extend({
        animateCss: function (animationName) {
            var animationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
            //if($(this).hasClass('animated') == false) {
            $(this).addClass('animated ' + animationName).one(animationEnd, function () {
                $(this).removeClass('animated ' + animationName);
            });
            //}
        }
    });
    $.fn.extend({
        animateCssTemp: function (animationName) {
            var animationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
            $(this).addClass('animated ' + animationName).one(animationEnd, function () {
                $(this).removeClass('animated ' + animationName);
                $(this).remove();
            });
        }
    });
    $.fn.extend({
        animateCssHide: function (animationName) {
            var animationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
            $(this).addClass('animated ' + animationName).one(animationEnd, function () {
                $(this).removeClass('animated ' + animationName);
                $(this).hide();
            });
        }
    });
    var gamedata = {
        ver: 'mq03',
        // the current local store var, if the game data changes too much, update this force all users to reset
        hardwipe: 'no',
        // yes will clear the current ver of ls
        streak: [],
        // storage game data
        db: {
            impact: 10,
            combo: 1,
            bosses: {},
            bosstime: {},
            bossgps: {
                lat: 2,
                lon: 2
            },
            herogps: {
                lat: 0,
                lon: 0
            },
            heromap: [{
                lat: 0,
                lon: 0
            }],
            world: {
                maxlat: 4,
                maxlon: 4
            }
        },
        storageAvailable: function (type) {
            try {
                var storage = window[type];
                var x = '__storage_test__';
                storage.setItem(x, x);
                storage.removeItem(x);
                if (gamedata.hardwipe === "yes") {
                    storage.clear();
                }
                return true;
            } catch (e) {
                return false;
            }
        },
        updateLocalDB: function () {
            if (gamedata.storageAvailable('localStorage')) {
                localStorage.setItem(gamedata.ver, JSON.stringify(gamedata.db));
            } else {
                alert("Your device does not support localStorage. You can still play, but if you refresh or close this page you will lose your progress. Apologies!");
            }
        },
        enableResetDB: function () {
            $("#act-reset").off("click").on("click", function (e) {
                e.preventDefault();
                if (confirm("Reset: Are you sure?")) {
                    localStorage.removeItem(gamedata.ver);
                    gamedata.db = {
                        impact: 10,
                        combo: 1,
                        bosses: {},
                        bosstime: {},
                        bossgps: {
                            lat: 2,
                            lon: 2
                        },
                        herogps: {
                            lat: 0,
                            lon: 0
                        },
                        heromap: [{
                            lat: 0,
                            lon: 0
                        }],
                        world: { // 25 player squares
                            maxlat: 4,
                            maxlon: 4
                        }
                    };
                    $("#user-pow").html(gamedata.db.impact);
                    localStorage.setItem(gamedata.ver, JSON.stringify(gamedata.db));
                    announce("New Player!");
                    $("#menu-current").html("");
                    $("#user-pow").html(gamedata.db.impact);
                    $("#user-combo").html(gamedata.db.combo);
                    rebuild_world();
                }
            });
        },
        db_integrity_and_upgrade: function () {
            // perform silent upgrades to prevent localstorage explosion
            // if all else fails
            if (typeof gamedata.db.impact === "undefined") { gamedata.db['impact'] = 10; }
            if (typeof gamedata.db.combo === "undefined") { gamedata.db['combo'] = 1; }
            if (typeof gamedata.db.bosses === "undefined") { gamedata.db['bosses'] = {}; }
            if (typeof gamedata.db.bosstime === "undefined") { gamedata.db['bosstime'] = {}; }
            if (typeof gamedata.db.bossgps === "undefined") { gamedata.db['bossgps'] = { lat: 2, lon: 2 }; }
            if (typeof gamedata.db.herogps === "undefined") { gamedata.db['herogps'] = { lat: 0, lon: 0 }; }
            if (typeof gamedata.db.heromap === "undefined") { gamedata.db['heromap'] = [{ lat: 0, lon: 0 }] }
            if (typeof gamedata.db.world === "undefined") { gamedata.db['world'] = { maxlat: 10, maxlon: 10 }; }
            //TODO: UPDATE THIS
        },
        initLocalStore: function () {
            if (gamedata.storageAvailable('localStorage')) {
                if (!localStorage.getItem(gamedata.ver)) {
                    if (confirm("New ChitQuest Player?")) {
                        localStorage.setItem(gamedata.ver, JSON.stringify(gamedata.db));
                        //alert(gamedata.db.impact);
                        $("#user-pow").html(gamedata.db.impact);
                        $("#user-combo").html(gamedata.db.combo);
                    }
                } else {
                    gamedata.db = JSON.parse(localStorage.getItem(gamedata.ver));
                    // check the data make sure it is good and ready.
                    gamedata.db_integrity_and_upgrade();

                    //console.log( localStorage.getItem(gamedata.ver) );
                    //console.log( JSON.stringify( gamedata.db ) );
                    $("#user-pow").html(gamedata.db.impact);
                    $("#user-combo").html(gamedata.db.combo);
                }
            }
        }
    };

    var getPlayAgainTemplate = function () {
        var tmp = '<div class="play-again"><p>PLAY AGAIN ?!?<br>(Keep Stats)</p></div>';
        return tmp;
    };
    var getBossTimesTemplate = function () {
        var tmp = '' +
            "Chit Times:<br>01:" + gamedata.db.bosstime['E'] + "<br>" +
            "02:" + gamedata.db.bosstime['D'] + "<br>" +
            "03:" + gamedata.db.bosstime['C'] + "<br>" +
            "04:" + gamedata.db.bosstime['B'] + "<br>" +
            "05:" + gamedata.db.bosstime['A'] + "<br>" +
            "06:" + gamedata.db.bosstime['A+'] + "<br>" +
            "07:" + gamedata.db.bosstime['S'] + "<br>" +
            "08:" + gamedata.db.bosstime['S+'] + "<br>" +
            "09:" + gamedata.db.bosstime['X'] + "<br>" +
            "10:" + gamedata.db.bosstime['X+'];
        return tmp;
    };
    var getItemTemplate = function (gs, gsr, gname, ghp) {
        var tmp = '<div class="row menu-item ' + gsr + ' ">' + //animated infinite jello animated infinite wobble
            '<div>' +
            '<span class="menu-item-hp-current ">' + ghp + '</span>' +
            '<span class="menu-item-gearscore ">' + gs + '</span>' +
            '<span class="menu-item-name">' + gname + '</span>' +
            '</div>' +
            '</div>';
        return tmp;
    };
    var getBufferTemplate = function () {
        var tmp = '<div class="row gear-buffer">' + //animated infinite jello animated infinite wobble
            '<div>' +
            '&nbsp;' +
            '</div>' +
            '</div>';
        return tmp;
    };
    var getDirectionTemplate = function (gs, gsr, gname, ghp) {
        var tmp = '<div class="row menu-item ' + gsr + ' ">' + //animated infinite jello animated infinite wobble
            '<div>' +
            '<span class="menu-item-hp-current ">' + ghp + '</span>' +
            '<span class="menu-item-gearscore ">' + gs + '</span>' +
            '<span class="menu-item-name">' + gname + '</span>' +
            '</div>' +
            '</div>';
        return tmp;
    };
    var getLootTemplate = function (level) {
        var tmp = '<div class="row menu-item gear-treasure ">' +
            '<div>' +
            '<span class="menu-item-hp-current ">1</span>' +
            '<span class="menu-item-gearscore ">LOOT!</span>' +
            '<span class="menu-item-name"><img src="static/images/chest.png" class="lootimg" />' + level + ' Taxi Chit Cache</span>' +
            '</div>' +
            '</div>';
        return tmp;
    };
    var getHUDTemplate = function (pow) {
        var tmp = '' +
            '<div class="hud gear-12">' +
            'CHITS: <span id="user-pow">' + pow + '</span>' +
            '<span id="user-combo">1</span>' +

            //'<span id="resetdb_in_b">R</span>'+
            '<span class="hud-menu-open act-menu">M</span>' +

            '</div>' +
            '<span class="game-menu-open act-menu">MENU</span>' +
            '<span class="game-menu-close" id="act-menu-close">CLOSE MENU</span>' +
            '';


        tmp += '' +
            '<div class="game-menu">' +
            '<div class="game-menu-button" id="act-character">My Character</div>' +
            '<div class="game-menu-character game-submenu">' +
            '<table class="ui-charsh">' +
            '<tr><td class="ui-charsh-emp"> </td><td class="ui-charsh-emp"> </td><td class="ui-charsh-emp"> </td><td class="ui-charsh-flg">F</td><td class="ui-charsh-emp"> </td></tr>' +
            '<tr><td class="ui-charsh-wep">|</td><td class="ui-charsh-emp"> </td><td class="ui-charsh-emp"> </td><td class="ui-charsh-hlm">H</td><td class="ui-charsh-emp"> </td></tr>' +
            '<tr><td class="ui-charsh-wep">|</td><td class="ui-charsh-emp"> </td><td class="ui-charsh-shd">S</td><td class="ui-charsh-vsr">V</td><td class="ui-charsh-shd">S</td></tr>' +
            '<tr><td class="ui-charsh-wep">X</td><td class="ui-charsh-glv">G</td><td class="ui-charsh-elb">E</td><td class="ui-charsh-arm">A</td><td class="ui-charsh-elb">E</td></tr>' +
            '<tr><td class="ui-charsh-wep">|</td><td class="ui-charsh-emp"> </td><td class="ui-charsh-emp"> </td><td class="ui-charsh-wst">W</td><td class="ui-charsh-glv">G</td></tr>' +
            '<tr><td class="ui-charsh-emp"> </td><td class="ui-charsh-emp"> </td><td class="ui-charsh-emp"> </td><td class="ui-charsh-pnt">P</td><td class="ui-charsh-emp"> </td></tr>' +
            '<tr><td class="ui-charsh-emp"> </td><td class="ui-charsh-emp"> </td><td class="ui-charsh-knp">K</td><td class="ui-charsh-emp"> </td><td class="ui-charsh-knp">K</td></tr>' +
            '<tr><td class="ui-charsh-emp"> </td><td class="ui-charsh-emp"> </td><td class="ui-charsh-bts">B</td><td class="ui-charsh-emp"> </td><td class="ui-charsh-bts">B</td></tr>' +
            '</table>' +
            '</div>' +
            //'<div class="game-menu-button" id="act-worldselect">World Select</div>' +
            //'<div class="game-menu-worldselect game-submenu">' +
            //'<img src="static/images/wm.png" />' +
            //'</div>' +
            '<div class="game-menu-button" id="act-localmap">Local Map</div>' +
            '<div class="game-menu-localmap game-submenu">' +
            '<div><span class="ui-localmap-herogps"></span></div>' +
            '<table class="ui-localmap">' +
            '<tr><td class="ui-localmap-00">00</td><td class="ui-localmap-01">01</td><td class="ui-localmap-02">02</td><td class="ui-localmap-03">03</td><td class="ui-localmap-04">04</td></tr>' +
            '<tr><td class="ui-localmap-10">10</td><td class="ui-localmap-11">11</td><td class="ui-localmap-12">12</td><td class="ui-localmap-13">13</td><td class="ui-localmap-14">14</td></tr>' +
            '<tr><td class="ui-localmap-20">20</td><td class="ui-localmap-21">21</td><td class="ui-localmap-22">22</td><td class="ui-localmap-23">23</td><td class="ui-localmap-24">24</td></tr>' +
            '<tr><td class="ui-localmap-30">30</td><td class="ui-localmap-31">31</td><td class="ui-localmap-32">32</td><td class="ui-localmap-44">33</td><td class="ui-localmap-34">34</td></tr>' +
            '<tr><td class="ui-localmap-40">40</td><td class="ui-localmap-41">41</td><td class="ui-localmap-42">42</td><td class="ui-localmap-43">43</td><td class="ui-localmap-44">44</td></tr>' +
            '</table>' +
            '</div>' +
            '<div class="game-menu-button" id="act-graveyard">Graveyard</div>' +
            '<div class="game-menu-graveyard game-submenu">' +
            getBossTimesTemplate() +
            '</div>' +
            '<div class="game-menu-button" id="act-help">Help!</div>' +
            '<div class="game-menu-help game-submenu">' +
            '<div>Tap Everything. Tap similar things. Tap responsibly.<br><br><br>Help Screen Coming Soon!</div>' +
            '</div>' +
            '<div class="game-menu-button" id="act-opts">Game Options</div>' +
            '<div class="game-menu-opts game-submenu">' +
            '<div class="game-menu-options" id="act-save">Save Game Data</div>' +
            '<div class="game-menu-options" id="act-load">Load Save</div>' +
            '<div class="game-menu-options" id="act-reset">Reset Game Data</div>' +
            '</div>' +

            '</div>' +

            '';
        return tmp;
    };
    var getSparkTemplate = function () {
        var tmp = "";
        for (var i = 0; i < 10; i++) {
            tmp += "<div class='spark'></div>";
        }
        return tmp;
    }

    $("#sparks").css("display", "none"); // want css animation to stop
    $("#sparks").prepend(getSparkTemplate());

    $("#hud").append(getHUDTemplate(gamedata.db.impact));
    gamedata.enableResetDB();
    gamedata.initLocalStore();

    var item_creator = {
        //Commoon Angry Sword Imp of Everlasting Torment
        //           0        1         2         3       4         5      6           7     8         9      index chaos
        gearlevel: ["Basic", "Common", "Uncommon", "Rare", "Relic", "Superb", "Legendary", "Epic", "Awesome", "Mythic", "INDEX", "C H A O S"],
        gearmeanness: ["Delerious", "Angry", "Grumbling", "Jovial", "Uncontrollable", "Lacrymosal", "Displeased", "Whirling", "Twirling", "Swirling", "Wobbly", "Timey-Wimey", "Sparkling", "Crackling", "Riveting", "Heart-Stopping", "Sleeping", "Herding", "Tambourine Clanging"],
        //geartype: ["Spoon", "Knife", "Fork", "Plate", "Laptop", "Night Table", "Alphabet", "Soup", "Keyboard", "Controller", "Lamp", "Hose"],
        geartype: ["Time Sensitive", "Challenging", "Mind melting", "Complicated", "Tricky", "Difficult", "Unique", "Urgent", "Showstopping"],
        //gearmob: ["Fish", "Gopher", "Paladin", "Halfling", "Nightbeast", "Razormaw", "Canary", "Pidgeon", "Beast", "Imp", "Ghoul", "Flea", "Doge", "Demon", "Cake", "Weasel", "Honey Badger", "Skeleton", "Nanite Rat", "Gamer", "NPC", "Knight", "Pirate", "Ninja", "Wizard", "Troll", "Sorcerer", "Pothole", "Queue", "Wraith", "Leech", "Fly", "Horse", "Duck", "Horse-sized duck", "Magic Fish who is a Carp", "Electric Mouse", "Fox with too many tails", "Hedgehog who is quick"],
        gearmob: ["Deck", "Report", "Wind Down", "Retreat", "Meeting", "VPN", "Application", "HR Request", "IT Request", "Email", "TB Sub", "Regulation", "Legislation", "Elevator", "Training", "Bilat", "Trilat", "Quadrilat", "Cross Department"],
        gearconnector: ["of", "from", "with", "bringing", "singing", "heralding", "rep'n", "word up to", "and", "feat.", "the one the only", "alongside", "managing", "wishing for"],
        gearduration: ["Everlasting", "Neverending", "Always Running", "Purposeful", "Driven", "Tremendous", "Awe-Inspring", "Square", "Triangular", "Circular", "Geometric", "Calculating", "and, um well "],
        gearfinal: ["Torment", "Doom", "Change", "Pop-up Ads", "Robots", "Weasels", "Termites", "Mosquitos", "Stubbed Toes", "Stepping on Legos", "Developers", "Politcians", "Snowstorms", "Climate Change", "Bananas", "Traffic", "Dropped Packets", "High Bills", "Runny Noses", "Long Buffer Times", "Corrupt Save Data", "Empty Cookie Jars"],
        // get a random entry from the lists
        randomEntry: function (a, limiter) {
            var idx = Math.floor(Math.random() * a.length);
            if (!isNaN(limiter)) {
                idx = idx % limiter;
            }
            return { "k": idx, "v": a[idx] };
        },
        create: function (limiter) {
            var gsr = item_creator.randomEntry(item_creator.gearlevel, limiter);
            var hpV = (gsr.k + 1) * Math.floor(Math.random() * 999);
            var gsV = Math.floor(hpV / 10) + (10 * (gsr.k + 1));

            return {
                gs: gsV,
                gsr: "gear-" + (gsr.k + 1),
                gname: "" +
                    gsr.v + " " +
                    item_creator.randomEntry(item_creator.gearmeanness).v + " " +
                    item_creator.randomEntry(item_creator.geartype).v + " " +
                    item_creator.randomEntry(item_creator.gearmob).v + " " +
                    item_creator.randomEntry(item_creator.gearconnector).v + " " +
                    item_creator.randomEntry(item_creator.gearduration).v + " " +
                    item_creator.randomEntry(item_creator.gearfinal).v + " " +
                    "",
                ghp: hpV
            };
        },
        spawnMob: function (limiter) {
            var mob = item_creator.create(limiter);
            return getItemTemplate(_nf.format(mob.gs), mob.gsr, mob.gname, _nf.format(mob.ghp));
        }
    };

    //
    // Add Elements
    //

    var enable_menu_buttons = function (button) {
        $("#act-" + button).off("click").on("click", function (e) {
            e.stopPropagation();
            $(".game-menu-button").hide();
            $(".game-menu-" + button).show();
        });
    };
    var enable_ui_elements = function () {

        //$(".menu-item-hp-current").html("1");

        $(".act-menu").off("click").on("click", function (e) {
            e.stopPropagation();
            //alert(1);
            $(".game-menu-close").show();
            $(".game-menu-button").show();
            $(".game-submenu").hide();
            $(".game-menu").show();//.animateCss('bounceInRight');
        });
        $(".game-menu-close").off("click").on("click", function (e) {
            e.stopPropagation();
            //alert(1);
            $(".game-menu-close").hide();
            $(".game-menu").hide();//.animateCssHide('bounceOutRight').hide();
        });
        enable_menu_buttons("character");
        enable_menu_buttons("worldselect");
        enable_menu_buttons("localmap");
        enable_menu_buttons("graveyard");
        enable_menu_buttons("help");
        enable_menu_buttons("opts");

        $(".play-again").off("click").on("click", function (e) {
            e.stopPropagation();
            if (confirm('Play Again?')) {
                $(".gear-hero").remove();
                $(".play-again").remove();
                gamedata.db.bosses = {};
                gamedata.db.bosstime = {};
                rebuild_world();
            }
        });

        $(".menu-item").off("click").on("click", function (e) {

            e.stopPropagation();

            var g = $(this).find('div > span.menu-item-hp-current');
            var hp = null;
            var gs_raw = $(this).find('div > span.menu-item-gearscore');
            var gs = null;
            var gn_raw = $(this).find('div > span.menu-item-name');
            var gn = null;

            $(this).animateCss('tada');
            $(this).append("<div class='sp1'>OOH!</div><div class='sp2'>CHIT!</div><div class='sp3'>WOW!<div>");
            $(".sp1").animateCssTemp('lightSpeedOut');
            $(".sp2").animateCssTemp('hinge');
            $(".sp3").animateCssTemp('bounceOutUp');

            if (typeof g.html() !== "undefined") {
                hp = parseInt(g.html().replace(/,/g, ""));
            }
            if (typeof gs_raw.html() !== "undefined") {
                gs = parseInt(gs_raw.html().replace(/,/g, ""));
            }
            if (typeof gn_raw.html() !== "undefined") {
                gn = gn_raw.html();
            }
            // why does boss still disappear afterward?
            if (!isNaN(hp)) {
                hp = hp - (gamedata.db.impact * gamedata.db.combo);
                g.html(_nf.format(hp));


                if (hp < 0) {
                    hp = 0;
                    g.html(hp);
                    //
                    if (isNaN(gs)) {
                        //alert(gs_raw.html());
                        if (gs_raw.html() == "LOOT!") {
                            // loot
                            $(this).animateCssTemp('rollOut');
                            var pct = Math.floor(Math.random() * 10);
                            var powerup = Math.floor((pct / 100.00) * gamedata.db.impact);

                            gamedata.db.impact += powerup;

                            announce(pct + "% Bump");

                            $("#user-pow").html(_nf.format(gamedata.db.impact));
                            gamedata.updateLocalDB();

                        } else if (gs_raw.html().indexOf("&gt;&gt;") != -1) {
                            // TODO: REFACTOR
                            var dirmove = gs_raw.html();
                            dirmove = dirmove.charAt("&gt;&gt;".length);
                            if (dirmove == "N") {
                                gamedata.db.herogps.lat = gamedata.db.herogps.lat - 1;

                                var lt = gamedata.db.herogps.lat; var ln = gamedata.db.herogps.lon;
                                gamedata.db.heromap.push({ lat: lt, lon: ln });

                            } else if (dirmove == "E") {
                                gamedata.db.herogps.lon = gamedata.db.herogps.lon + 1;

                                var lt = gamedata.db.herogps.lat; var ln = gamedata.db.herogps.lon;
                                gamedata.db.heromap.push({ lat: lt, lon: ln });

                            } else if (dirmove == "S") {
                                gamedata.db.herogps.lat = gamedata.db.herogps.lat + 1;

                                var lt = gamedata.db.herogps.lat; var ln = gamedata.db.herogps.lon;
                                gamedata.db.heromap.push({ lat: lt, lon: ln });

                            } else if (dirmove == "W") {
                                gamedata.db.herogps.lon = gamedata.db.herogps.lon - 1;

                                var lt = gamedata.db.herogps.lat; var ln = gamedata.db.herogps.lon;
                                gamedata.db.heromap.push({ lat: lt, lon: ln });
                            } else if (dirmove == "R") {
                                gamedata.db.herogps.lat = 0;
                                gamedata.db.herogps.lon = 0;
                                if (gamedata.db.herogps.lat == gamedata.db.bossgps.lat && gamedata.db.herogps.lon == gamedata.db.bossgps.lon) {
                                    gamedata.db.herogps.lat = 1;
                                    gamedata.db.herogps.lon = 1;
                                }
                                var lt = gamedata.db.herogps.lat; var ln = gamedata.db.herogps.lon;
                                gamedata.db.heromap.push({ lat: lt, lon: ln });

                                // wipe content since you're running
                                $("#menu-current").html("");
                            }

                            gamedata.updateLocalDB();

                            announce(gs_raw.html());

                            $(".ui-localmap-herogps").html("Lat: " + gamedata.db.herogps.lat + " Lon: " + gamedata.db.herogps.lon);

                            $(this).animateCssTemp('rollOut');
                            $(".gear-direction").remove();

                            rebuild_world(); // enables ui

                        } else {

                            announce("CHITS!");

                            // boss
                            var bossdef = new Date().getTime();
                            var distance = bossdef - now;

                            var days = Math.floor(distance / (1000 * 60 * 60 * 24));
                            var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                            var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                            var seconds = Math.floor((distance % (1000 * 60)) / 1000);
                            //alert("Yay! Boss ["+gs+"]Defeated! Time: " + days + "d " + hours + "h " + minutes + "m " + seconds + "s ");

                            $(this).removeClass("menu-item");
                            $(this).addClass("dead-boss");

                            $(".gear-runaway").remove();

                            gs_raw = gs_raw.html();
                            gamedata.db.bosses[gs_raw] = "dead";
                            gamedata.db.bosstime[gs_raw] = "" + days + "d " + hours + "h " + minutes + "m " + seconds + "s ";

                            gamedata.db.bossgps.lat = Math.floor(Math.random() * 4);
                            gamedata.db.bossgps.lon = Math.floor(Math.random() * 4);

                            $(".ui-localmap-" + gamedata.db.herogps.lat + "" + gamedata.db.herogps.lon).css({ backgroundColor: "transparent" });

                            gamedata.updateLocalDB();

                            $(this).html("<div class='ded'>X</div><div class='menu-item-name'>Yay! Chit Defeated!<br>But HARDER foes await!<br><br>Time: " + days + "d " + hours + "h " + minutes + "m " + seconds + "s " + "</div>");

                            // TODO
                            spawn_loot(gs_raw + " Chit ");
                            spawn_loot(gs_raw + " Chit ");
                            spawn_loot(gs_raw + " Chit ");
                            spawn_loot(gs_raw + " Chit ");
                            spawn_loot(gs_raw + " Chit ");
                            // ADD NESW DIRECTION BUTTONS

                            add_choose_direction();

                            enable_ui_elements();

                            $(this).off("click").on("click", function () {
                                $('.dead-boss').animateCss('wobble');
                                setTimeout(function () {
                                    $('.dead-boss').animateCssTemp('rollOut');
                                }, 1000);
                            });

                            $("#sparks").fadeIn();
                        }
                    } else {
                        announce("CHIT!");

                        $(this).animateCssTemp('rollOut');
                        $("#sparks").css("display", "none"); // want css animation to stop
                        if (!isNaN(gs)) {
                            var rarity = gn.split(" ")[0];
                            var iscombo = true;

                            gamedata.streak.push(rarity);
                            if (gamedata.streak.length == 2) {
                                for (var i = 0; i < gamedata.streak.length; i++) {
                                    if (gamedata.streak[i] != rarity) {
                                        iscombo = false;
                                    }
                                }
                                if (iscombo == true) {
                                    gamedata.db.combo += 1;
                                    $("#user-combo").html(gamedata.db.combo);
                                    var rarcol = {
                                        "Basic": { "background-color": "#e0e0e0" },
                                        "Common": { "background-color": "#e6ee9c" },
                                        "Uncommon": { "background-color": "#66bb6a" },
                                        "Rare": { "background-color": "#26c6da" },
                                        "Relic": { "background-color": "#2196f3" },
                                        "Superb": { "background-color": "#e91e63" },
                                        "Legendary": { "background-color": "#8e24aa" },
                                        "Epic": { "background-color": "#fbc02d" },
                                        "Awesome": { "background-color": "#ff5722" },
                                        "Mythic": { "background-color": "#ff4000" },
                                        "INDEX": { "background-color": "#e1f5fe" },
                                        "C H A O S": { "background-color": "#212121" }
                                    };
                                    $(".hud-menu-open").css(rarcol[rarity]);
                                    var itmtype = {
                                        "i0": "wep",
                                        "i1": "flg",
                                        "i2": "hlm",
                                        "i3": "vsr",
                                        "i4": "shd",
                                        "i5": "elb",
                                        "i6": "glv",
                                        "i7": "arm",
                                        "i8": "wst",
                                        "i9": "pnt",
                                        "i10": "knp",
                                        "i11": "bts"
                                    };
                                    var item = Math.floor(Math.random() * 12);
                                    $(".ui-charsh-" + itmtype["i" + item]).css(rarcol[rarity]);


                                } else {
                                    gamedata.db.combo = 1;
                                    $("#user-combo").html(gamedata.db.combo);
                                    $(".hud-menu-open").css({ "background-color": "transparent" });
                                }
                                gamedata.streak.shift();
                            }

                            gamedata.db.impact += gs;
                            $("#user-pow").html(_nf.format(gamedata.db.impact));
                            gamedata.updateLocalDB();
                        }
                        $(".hud").animateCss('jello');
                    }
                } else {
                    g.animateCss('flash');
                }
            }
        });
    };
    var announcing = false;
    var announce = function (msg) {
        $('#announcer').html(msg);
        if (announcing == false) {
            announcing = true;
            $('#announcer').fadeIn();
            $('#announcer').animateCss('tada');
            setTimeout(function () {
                $('#announcer').fadeOut();
                announcing = false;
            }, 790);
        }
    };
    var apply_buffer = function () {
        $(".gear-buffer").remove();
        $("#menu-current").append(getBufferTemplate());
    };
    var spawn_loot = function (level) {
        $("#menu-current").append(getLootTemplate(level));
    };
    var spawn_loot_random = function (level) {
        var ding = Math.floor(Math.random() * 100);
        if (ding > 80) {
            $("#menu-current").append(getLootTemplate(level));
        }
    };

    // db.world.maxlat, db.heromap[0].lat, herogps.lat, bossgps.lat
    var find_valid_directions = function () {
        var x = 0;
        var y = 0;
        var valid_dir = {
            N: false,
            E: false,
            S: false,
            W: false
        };
        // # TODO: Perform check

        if (gamedata.db.herogps.lat < gamedata.db.world.maxlat) {
            valid_dir.S = true;
        }
        if (gamedata.db.herogps.lon < gamedata.db.world.maxlon) {
            valid_dir.E = true;
        }
        if (gamedata.db.herogps.lat > 0) {
            valid_dir.N = true;
        }
        if (gamedata.db.herogps.lon > 0) {
            valid_dir.W = true;
        }

        return valid_dir;
    }
    var add_run_away = function () {

        valid_dir = find_valid_directions();

        $("#menu-current").append(getDirectionTemplate("&gt;&gt;RUN", "gear-direction gear-runaway", "FLY YOU FOOL! Flee home out of fear", "1"));

        apply_buffer();

    };
    var add_choose_direction = function () {

        valid_dir = find_valid_directions();

        if (valid_dir.N == true) { $("#menu-current").append(getDirectionTemplate("&gt;&gt;N", "gear-direction", "Go North towards PARLIAMENT", "1")); }
        if (valid_dir.E == true) { $("#menu-current").append(getDirectionTemplate("&gt;&gt;E", "gear-direction", "Go East towards the ASTICOU", "1")); }
        if (valid_dir.S == true) { $("#menu-current").append(getDirectionTemplate("&gt;&gt;S", "gear-direction", "Go South towards the LASALLE", "1")); }
        if (valid_dir.W == true) { $("#menu-current").append(getDirectionTemplate("&gt;&gt;W", "gear-direction", "Go West towards the TUNNEYS", "1")); }

        apply_buffer();

    };

    //gamedata.db.bossgps.lat = 1;
    //gamedata.db.bossgps.lon = 1;
    var survey_area = function () {
        $(".ui-localmap-herogps").html("Lat: " + gamedata.db.herogps.lat + " Lon: " + gamedata.db.herogps.lon);

        $(".ui-localmap-" + gamedata.db.herogps.lat + "" + gamedata.db.herogps.lon).css({ backgroundColor: "green" });

    };
    var make_generic_level = function (level) {

        var cond_bossprerq = true;
        if (typeof level.bossprerq !== "undefined") { cond_bossprerq = (gamedata.db.bosses[level.bossprerq] == "dead"); }// else { gamedata.db.bossgps.lat = 1; gamedata.db.bossgps.lon = 1; }
        if (typeof level.levelboss === "undefined") { level.levelboss = "G"; }
        if (typeof level.levelboss_name === "undefined") { level.levelboss_name = "CHIT! Level Chit"; }
        if (typeof level.levelboss_hp === "undefined") { level.mobslevel = "1,000,000"; }
        if (typeof level.mobslevel === "undefined") { level.mobslevel = 3; }
        if (typeof level.mobscount === "undefined") { level.mobscount = 10; }
        if (typeof level.levelloot === "undefined") { level.levelloot = "Adventure"; }
        var cond_levelboss = (gamedata.db.bosses[level.levelboss] != "dead");
        var cond_bonusloot = (typeof level.bonusloot !== "undefined");

        if (cond_bossprerq && cond_levelboss) {
            if (cond_bonusloot) {
                spawn_loot(level.bonusloot);
            }
            for (var i = 0; i < level.mobscount; i++) {
                $("#menu-current").append(item_creator.spawnMob(level.mobslevel));
                spawn_loot_random(level.levelloot);
            }
            if (gamedata.db.herogps.lat == gamedata.db.bossgps.lat && gamedata.db.herogps.lon == gamedata.db.bossgps.lon) {
                $("#menu-current").append(getItemTemplate(level.levelboss, "gear-boss", level.levelboss_name, level.levelboss_hp));
                announce("CHIT<br>FOUND");
                $(".ui-localmap-" + gamedata.db.herogps.lat + "" + gamedata.db.herogps.lon).css({ backgroundColor: "red" });
                add_run_away();
            } else {
                add_choose_direction();
            }

        }

    };
    var rebuild_world = function (opt) {

        survey_area();

        make_generic_level({ bonusloot: "Tutorial", /*bossprerq: "",*/levelboss: "T", levelboss_name: "CHIT! Tutorial Chit", levelboss_hp: "1000", mobslevel: 1, mobscount: 3, levelloot: "Adventure-1" });
        make_generic_level({ bonusloot: "Starter", bossprerq: "T", levelboss: "E", levelboss_name: "CHIT! Level 1 Chit", levelboss_hp: "103,999", mobslevel: 3, mobscount: 10, levelloot: "Adventure-1" });
        make_generic_level({ /*bonusloot:, */bossprerq: "E", levelboss: "D", levelboss_name: "CHIT! Level 2 Chit", levelboss_hp: "962,999", mobslevel: 4, mobscount: 10, levelloot: "Adventure-2" });
        make_generic_level({ /*bonusloot:, */bossprerq: "D", levelboss: "C", levelboss_name: "CHIT! Level 3 Chit", levelboss_hp: "3,885,999", mobslevel: 5, mobscount: 20, levelloot: "Adventure-3" });
        make_generic_level({ /*bonusloot:, */bossprerq: "C", levelboss: "B", levelboss_name: "CHIT! Level 4 Chit", levelboss_hp: "20,119,999", mobslevel: 6, mobscount: 20, levelloot: "Adventure-4" });
        make_generic_level({ /*bonusloot:, */bossprerq: "B", levelboss: "A", levelboss_name: "CHIT! Level 5 Chit", levelboss_hp: "40,511,999", mobslevel: 7, mobscount: 30, levelloot: "Adventure-5" });
        make_generic_level({ /*bonusloot:, */bossprerq: "A", levelboss: "A+", levelboss_name: "CHIT! Level 6 Chit", levelboss_hp: "99,945,999", mobslevel: 8, mobscount: 30, levelloot: "Adventure-6" });
        make_generic_level({ /*bonusloot:, */bossprerq: "A+", levelboss: "S", levelboss_name: "CHIT! Level 7 Chit", levelboss_hp: "400,999,999", mobslevel: 9, mobscount: 40, levelloot: "Adventure-7" });
        make_generic_level({ /*bonusloot:, */bossprerq: "S", levelboss: "S+", levelboss_name: "CHIT! Level 8 Chit", levelboss_hp: "600,112,999", mobslevel: 10, mobscount: 40, levelloot: "Adventure-8" });
        make_generic_level({ /*bonusloot:, */bossprerq: "S+", levelboss: "X", levelboss_name: "CHIT! Level 9 Chit", levelboss_hp: "900,170,999", mobslevel: 11, mobscount: 50, levelloot: "Adventure-9" });
        make_generic_level({ /*bonusloot:, */bossprerq: "X", levelboss: "X+", levelboss_name: "CHIT! Level 10 Chit", levelboss_hp: "2,999,999,999", mobslevel: 12, mobscount: 50, levelloot: "Adventure-10" });

        if (gamedata.db.bosses['X+'] == "dead") {
            $("#menu-current").append(getItemTemplate("YOU WIN", "gear-hero", "<p>AWESOME!<br><br>You defeated all the chit in your way! Truly you are the champion fortold in the tomes of public service.<br><br>But beware. There is more to see. More to loot.<br><br>And more chit to ChitQuest!<br><br>Coming Soon!<br><br>" +
                getBossTimesTemplate() + "<br></p>"
                , "1,000,000,000,000,000"));
            $("#sparks").fadeIn();
            $("#menu-current").append(getPlayAgainTemplate());
            $(".play-again").fadeIn();
        }
        apply_buffer();

        enable_ui_elements();
    };

    $("#user-pow").html(_nf.format(gamedata.db.impact));

    // kyles secret!
    $("html").keydown(function () {
        $(".menu-item").first().trigger("click");
    });

    var now = new Date().getTime(); // game start

    rebuild_world();

    document.addEventListener('gesturestart', function (e) { e.preventDefault(); });

    gamedata.db.world.maxlat = 4;
    gamedata.db.world.maxlon = 4;

});
