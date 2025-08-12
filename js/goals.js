// This file is now structured to be loaded directly on the page without an extra script tag.
// The code inside the jQuery document.ready block will automatically run when the page is ready.
$(document).ready(function () {
    $('#gymSelect').change(function () {
        console.log("Gym dropdown changed. Selected gym ID:", $(this).find('option:selected').attr('value'));

        // Hide all gym details by setting their display to 'none'
        for (let i = 1; i <= 33; i++) {
            $('#gym_' + i).css('display', 'none');
        }
        
        // Show the selected gym's details by setting its display to 'block'
        $('#gym_' + $(this).find('option:selected').attr('value')).css('display', 'block');

        calculateGain();
    });

    $('.traincalc').change(function () {
        calculateGain();
    });

    function calculateGain() {
        var strength = 0;
        var defense = 0;
        var speed = 0;
        var dexterity = 0;
        $('.progress-bar:visible').each(function () {
            if ($(this).hasClass('strength')) {
                strength = $(this).data('amount');
            }
            if ($(this).hasClass('defense')) {
                defense = $(this).data('amount');
            }
            if ($(this).hasClass('speed')) {
                speed = $(this).data('amount');
            }
            if ($(this).hasClass('dexterity')) {
                dexterity = $(this).data('amount');
            }
        });
        var energy = parseInt($('.energy:visible').html());
        var happy = isNaN(parseInt($('#happy').val())) ? 0 : parseInt($('#happy').val());
        // Steadfast bonuses
        var strSteadfast = isNaN(parseInt($('#strength_steadfast').val())) ? 0 : parseInt($('#strength_steadfast').val());
        var defSteadfast = isNaN(parseInt($('#defense_steadfast').val())) ? 0 : parseInt($('#defense_steadfast').val());
        var spdSteadfast = isNaN(parseInt($('#speed_steadfast').val())) ? 0 : parseInt($('#speed_steadfast').val());
        var dexSteadfast = isNaN(parseInt($('#dexterity_steadfast').val())) ? 0 : parseInt($('#dexterity_steadfast').val());

        // Book bonuses
        var strBonus = isNaN(parseInt($('#str_bonus').val())) ? 0 : parseInt($('#str_bonus').val());
        var defBonus = isNaN(parseInt($('#def_bonus').val())) ? 0 : parseInt($('#def_bonus').val());
        var spdBonus = isNaN(parseInt($('#spd_bonus').val())) ? 0 : parseInt($('#spd_bonus').val());
        var dexBonus = isNaN(parseInt($('#dex_bonus').val())) ? 0 : parseInt($('#dex_bonus').val());

        // Misc perks
        var ladies = $('input#ladies').is(':checked') ? 10 : 0;
        var gents = $('input#gents').is(':checked') ? 10 : 0;
        var fitness = $('input#fitness').is(':checked') ? 3 : 0;
        var sneakers = $('input#sneakers').is(':checked') ? 5 : 0;
        var property = $('input#property').is(':checked') ? 2 : 0;
        // Education perks
        var eduStr = $('input#edu_strength').is(':checked') ? 1 : 0;
        var eduDef = $('input#edu_defense').is(':checked') ? 1 : 0;
        var eduSpd = $('input#edu_speed').is(':checked') ? 1 : 0;
        var eduDex = $('input#edu_dexterity').is(':checked') ? 1 : 0;
        var eduAll = $('input#edu_overall').is(':checked') ? 1 : 0;
        // Current stats
        var curStr = parseFloat($('#curStrength').val().replace(/\,/g, ''));
        var curDef = parseFloat($('#curDefense').val().replace(/\,/g, ''));
        var curSpd = parseFloat($('#curSpeed').val().replace(/\,/g, ''));
        var curDex = parseFloat($('#curDexterity').val().replace(/\,/g, ''));
        if (curStr > 50000000) {
            // curStr = 50000000;
            curStr = (curStr - 50000000) / (8.77635 * Math.log10(curStr)) + 50000000;
        }
        if (curDef > 50000000) {
            // curDef = 50000000;
            curDef = (curDef - 50000000) / (8.77635 * Math.log10(curDef)) + 50000000;
        }
        if (curSpd > 50000000) {
            // curSpd = 50000000;
            curSpd = (curSpd - 50000000) / (8.77635 * Math.log10(curSpd)) + 50000000;
        }
        if (curDex > 50000000) {
            // curDex = 50000000;
            curDex = (curDex - 50000000) / (8.77635 * Math.log10(curDex)) + 50000000;
        }

        // Calculate Strength gains
        // steadfast * property * edustat * eduoverall * job * book
        var bonus = (1 + (strSteadfast / 100)) * (1 + (property / 100)) * (1 + (eduStr / 100)) * (1 + (eduAll / 100)) * (1 + (strBonus / 100)) * (1 + (fitness / 100));
        $('#strBonus').html(bonus.toFixed(5));

        var strGain = (1 / 200000) * strength * energy * (bonus) * (curStr * (1 + 0.07 * (Math.log(1 + happy / 250)).toFixed(4)).toFixed(4) + 8 * Math.pow(happy, 1.05) + 1600 * (1 - Math.pow(happy / 99999, 2)) + 1700);
        $('#strGain').html(commaSeparateNumber(strGain.toFixed(2)));

        // Calculate Defense gains
        var bonus = (1 + (defSteadfast / 100)) * (1 + (property / 100)) * (1 + (eduDef / 100)) * (1 + (eduAll / 100)) * (1 + (defBonus / 100)) * (1 + (fitness / 100)) * (1 + (ladies / 100));
        $('#defBonus').html(bonus.toFixed(5));

        var defGain = (1 / 200000) * defense * energy * (bonus) * (curDef * (1 + 0.07 * (Math.log(1 + happy / 250)).toFixed(4)).toFixed(4) + 8 * Math.pow(happy, 1.05) + 2100 * (1 - Math.pow(happy / 99999, 2)) - 600);
        $('#defGain').html(commaSeparateNumber(defGain.toFixed(2)));

        // Calculate Speed gains
        var bonus = (1 + (spdSteadfast / 100)) * (1 + (property / 100)) * (1 + (eduSpd / 100)) * (1 + (eduAll / 100)) * (1 + (spdBonus / 100)) * (1 + (fitness / 100)) * (1 + (sneakers / 100));
        $('#spdBonus').html(bonus.toFixed(5));

        var spdGain = (1 / 200000) * speed * energy * (bonus) * (curSpd * (1 + 0.07 * (Math.log(1 + happy / 250)).toFixed(4)).toFixed(4) + 8 * Math.pow(happy, 1.05) + 1600 * (1 - Math.pow(happy / 99999, 2)) + 2000);
        $('#spdGain').html(commaSeparateNumber(spdGain.toFixed(2)));

        // Calculate Dexterity gains
        var bonus = (1 + (dexSteadfast / 100)) * (1 + (property / 100)) * (1 + (eduDex / 100)) * (1 + (eduAll / 100)) * (1 + (dexBonus / 100)) * (1 + (fitness / 100)) * (1 + (gents / 100));
        $('#dexBonus').html(bonus.toFixed(5));

        var dexGain = (1 / 200000) * dexterity * energy * (bonus) * (curDex * (1 + 0.07 * (Math.log(1 + happy / 250)).toFixed(4)).toFixed(4) + 8 * Math.pow(happy, 1.05) + 1800 * (1 - Math.pow(happy / 99999, 2)) + 1500);
        $('#dexGain').html(commaSeparateNumber(dexGain.toFixed(2)));
    }

    $('.stats').on('keyup', function (e) {
        var amount = parseFloat($(this).val().replace(/\,/g, ''));
        amount = isNaN(amount) ? 0 : amount;
        $(this).val(commaSeparateNumber(amount));
        calculateGain();
    });

    $('.happycheck').on('keyup', function (e) {
        var amount = parseFloat($(this).val().replace(/\,/g, ''));
        amount = isNaN(amount) ? 0 : amount;
        if (amount >= 99999) {
            amount = 99999;
        }
        $(this).val(amount);
        // calculateGain();
    });

    $('.gymstat').on('keyup', function (e) {
        var amount = parseFloat($(this).val().replace(/\,/g, ''));
        amount = isNaN(amount) ? 0 : amount;
        $(this).val(commaSeparateNumber(amount));
        calculateGyms();
    });

    function calculateGyms() {
        var str = parseFloat($('#gym_strength').val().replace(/\,/g, ''));
        var def = parseFloat($('#gym_defense').val().replace(/\,/g, ''));
        var spd = parseFloat($('#gym_speed').val().replace(/\,/g, ''));
        var dex = parseFloat($('#gym_dexterity').val().replace(/\,/g, ''));
        var tot = str + def + spd + dex;

        var str_perc = (str / tot) * 100;
        var def_perc = (def / tot) * 100;
        var spd_perc = (spd / tot) * 100;
        var dex_perc = (dex / tot) * 100;
        $('#gym_str_perc').html(str_perc.toFixed(2));
        $('#gym_def_perc').html(def_perc.toFixed(2));
        $('#gym_spd_perc').html(spd_perc.toFixed(2));
        $('#gym_dex_perc').html(dex_perc.toFixed(2));
        var message = '';
        if (str >= def && str >= spd && str >= dex) {
            // console.log('strength main', str, def, spd, dex);
            if (def >= spd && def >= dex) { // Def second highest
                var secondary = def;
                var secondaryStat = 'defense';
            } else if (spd >= def && spd >= dex) { // Speed second highest
                var secondary = spd;
                var secondaryStat = 'speed';
            } else { // Dex second highest
                var secondary = dex;
                var secondaryStat = 'dexterity';
            }
            var required = secondary * 1.25;
            if (str >= required) {
                var extra = Math.ceil(str / 1.25);
                var extraDef = extra - def;
                var extraSpd = extra - spd;
                var extraDex = extra - dex;
                message = 'Gym 3000 (strength) is open! You can train an extra ' + commaSeparateNumber(extraDef) + ' defense or ' + commaSeparateNumber(extraSpd) + ' speed or ' + commaSeparateNumber(extraDex) + ' dexterity and still keep this gym open.';
            } else {
                var extra = Math.ceil(required - str);
                message = 'Gym 3000 (strength) is closed. You need to train an extra ' + commaSeparateNumber(extra) + ' strength to open it.';
            }
        } else if (def >= str && def >= spd && def >= dex) {
            // console.log('defense main', str, def, spd, dex);
            if (str >= spd && str >= dex) { // Str second highest
                var secondary = str;
                var secondaryStat = 'strength';
            } else if (spd >= str && spd >= dex) { // Speed second highest
                var secondary = spd;
                var secondaryStat = 'speed';
            } else { // Dex second highest
                var secondary = dex;
                var secondaryStat = 'dexterity';
            }
            var required = secondary * 1.25;
            if (def >= required) {
                var extra = Math.ceil(def / 1.25);
                var extraStr = extra - str;
                var extraSpd = extra - spd;
                var extraDex = extra - dex;
                message = 'Mr. Isoyamas (defense) is open! You can train an extra ' + commaSeparateNumber(extraStr) + ' strength or ' + commaSeparateNumber(extraSpd) + ' speed or ' + commaSeparateNumber(extraDex) + ' dexterity and still keep this gym open.';
            } else {
                var extra = Math.ceil(required - def);
                message = 'Mr. Isoyamas (defense) is closed. You need to train an extra ' + commaSeparateNumber(extra) + ' defense to open it.';
            }
        } else if (spd >= str && spd >= def && spd >= dex) {
            // console.log('speed main', str, def, spd, dex);
            if (str >= def && str >= dex) { // Str second highest
                var secondary = str;
                var secondaryStat = 'strength';
            } else if (def >= str && def >= dex) { // Def second highest
                var secondary = def;
                var secondaryStat = 'defense';
            } else { // Dex second highest
                var secondary = dex;
                var secondaryStat = 'dexterity';
            }
            var required = secondary * 1.25;
            if (spd >= required) {
                var extra = Math.ceil(spd / 1.25);
                var extraStr = extra - str;
                var extraDef = extra - def;
                var extraDex = extra - dex;
                message = 'Total Rebound (speed) is open! You can train an extra ' + commaSeparateNumber(extraStr) + ' strength or ' + commaSeparateNumber(extraDef) + ' defense or ' + commaSeparateNumber(extraDex) + ' dexterity and still keep this gym open.';
            } else {
                var extra = Math.ceil(required - spd);
                message = 'Total Rebound (speed) is closed. You need to train an extra ' + commaSeparateNumber(extra) + ' speed to open it.';
            }
        } else if (dex >= str && dex >= def && dex >= spd) {
            // console.log('dex main', str, def, spd, dex);
            if (str >= def && str >= spd) { // Str second highest
                var secondary = str;
                var secondaryStat = 'strength';
            } else if (def >= str && def >= spd) { // Def second highest
                var secondary = def;
                var secondaryStat = 'defense';
            } else { // Dex second highest
                var secondary = spd;
                var secondaryStat = 'speed';
            }
            var required = secondary * 1.25;
            if (dex >= required) {
                var extra = Math.ceil(dex / 1.25);
                var extraStr = extra - str;
                var extraDef = extra - def;
                var extraSpd = extra - spd;
                message = 'Elites (dexterity) is open! You can train an extra ' + commaSeparateNumber(extraStr) + ' strength or ' + commaSeparateNumber(extraDef) + ' defense or ' + commaSeparateNumber(extraSpd) + ' speed and still keep this gym open.';
            } else {
                var extra = Math.ceil(required - dex);
                message = 'Elites (dexterity) is closed. You need to train an extra ' + commaSeparateNumber(extra) + ' dexterity to open it.';
            }
        } else {
            console.log("Who knows");
        }

        var off_stat = str + spd;
        var def_stat = def + dex;
        if (off_stat > def_stat) { // Offense stats are higher, check for frontline -- Double check not strength whore + balboas
            var required = def_stat * 1.25;
            if (off_stat >= required) {
                // Frontline open
                var extra = Math.ceil(off_stat / 1.25);
                var extraStats = extra - def_stat;
                message += '<br><br>Frontline Fitness is open! You can train an extra ' + commaSeparateNumber(extraStats) + ' defense or dexterity and still keep this gym open.';
            } else { // It's closed, check a defensive build with offensive whore
                // Frontline closed
                var required = off_stat * 1.25;
                if (def_stat >= required) {
                    var extra = Math.ceil(def_stat / 1.25);
                    var extraStats = extra - off_stat;
                    message += '<br><br>Balboas Gym is open! You can train an extra ' + commaSeparateNumber(extraStats) + ' strength or speed and still keep this gym open.';
                } else {
                    var extra = Math.ceil(required - off_stat);
                    message += '<br><br>Frontline Fitness is closed. You need to train an extra ' + commaSeparateNumber(extra) + ' strength or speed to open it.';
                }
            }
        } else if (def_stat > off_stat) {// Defense stats are higher, check for balboas
            var required = off_stat * 1.25;
            if (def_stat >= required) {
                var extra = Math.ceil(def_stat / 1.25);
                var extraStats = extra - off_stat;
                message += '<br><br>Balboas Gym is open! You can train an extra ' + commaSeparateNumber(extraStats) + ' strength or speed and still keep this gym open.';
            } else { // It's closed, check a offensive build with defensive whore
                var required = def_stat * 1.25;
                if (off_stat >= required) {
                    var extra = Math.ceil(off_stat / 1.25);
                    var extraStats = extra - def_stat;
                    message += '<br><br>Frontline Fitness is open! You can train an extra ' + commaSeparateNumber(extraStats) + ' strength or speed and still keep this gym open.';
                } else {
                    var extra = Math.ceil(required - def_stat);
                    message += '<br><br>Balboas Gym is closed. You need to train an extra ' + commaSeparateNumber(extra) + ' defense or dexterity to open it.';
                }
            }
        } else { // They're perfectly equal
            console.log("Who knows");
        }

        $('#gym_message').html(message);
        // console.log(message);
        // console.log(stats, total);

        // console.log(str, def, spd, dex, total);
    }
    
    // Initial run to populate the calculator on page load
    calculateGain();
    calculateGyms();
});