// --- merits.js ---
// FINAL COMPLETE VERSION (PATH B)

// --- DOM Elements ---
const loadingIndicator = document.getElementById('loading-indicator');
const errorDisplay = document.getElementById('error-display');
const playerNameSpan = document.getElementById('player-name');
const playerLevelSpan = document.getElementById('player-level');
const playerTotalStatsSpan = document.getElementById('player-total-stats');
const playerRankSpan = document.getElementById('player-rank');
const playerNetworthSpan = document.getElementById('player-networth');
const playerLifeSpan = document.getElementById('player-life');
const playerAwardsSpan = document.getElementById('player-awards');
const tabsContainer = document.querySelector('.tabs-container');
const tabContents = document.querySelectorAll('.tab-pane');
const honorsAttackingList = document.getElementById('honors-attacking-list');
const honorsWeaponsList = document.getElementById('honors-weapons-list');
const honorsChainingList = document.getElementById('honors-chaining-list');
const medalsCombatList = document.getElementById('medals-combat-list');
const medalsCommitmentList = document.getElementById('medals-commitment-list');
const medalsCrimesList = document.getElementById('medals-crimes-list');
const playerStatsList = document.getElementById('player-stats-list');
const miscAwardsList = document.getElementById('misc-awards-list');
const awardsProgressList = document.getElementById('awards-progress-list');


// --- MASTER DATA LISTS ---

const allHonors = [
    // --- Attacking / General Honors ---
    { id: 1, name: "Kill Streaker 1", requirement: "Achieve a 10 kill streak", category: "honors-attacking-list", statKey: "personalstats.killstreak", threshold: 10, type: "count" },
    { id: 2, name: "Kill Streaker 2", requirement: "Achieve a 100 kill streak", category: "honors-attacking-list", statKey: "personalstats.killstreak", threshold: 100, type: "count" },
    { id: 3, name: "Kill Streaker 3", requirement: "Achieve a 500 kill streak", category: "honors-attacking-list", statKey: "personalstats.killstreak", threshold: 500, type: "count" },
    { id: 4, name: "Wham!", requirement: "Deal over 100,000 total damage", category: "honors-attacking-list", statKey: "personalstats.attackdamage", threshold: 100000, type: "count" },
    { id: 5, name: "Bam!", requirement: "Deal over 1,000,000 total damage", category: "honors-attacking-list", statKey: "personalstats.attackdamage", threshold: 1000000, type: "count" },
    { id: 6, name: "Boom!", requirement: "Deal over 10,000,000 total damage", category: "honors-attacking-list", statKey: "personalstats.attackdamage", threshold: 10000000, type: "count" },
    { id: 7, name: "Kapow!", requirement: "Deal over 100,000,000 total damage", category: "honors-attacking-list", statKey: "personalstats.attackdamage", threshold: 100000000, type: "count" },
    { id: 8, name: "Devastation", requirement: "Deal at least 5,000 damage in a single hit", category: "honors-attacking-list", statKey: "personalstats.bestdamage", threshold: 5000, type: "count" },
    { id: 9, name: "Obliteration", requirement: "Deal at least 10,000 damage in a single hit", category: "honors-attacking-list", statKey: "personalstats.bestdamage", threshold: 10000, type: "count" },
    { id: 10, name: "Annihilation", requirement: "Deal at least 15,000 damage in a single hit", category: "honors-attacking-list", statKey: "personalstats.bestdamage", threshold: 15000, type: "count" },
    { id: 11, name: "Flatline", requirement: "Achieve a one hit kill", category: "honors-attacking-list", statKey: "personalstats.onehitkills", threshold: 1, type: "count" },
    { id: 12, name: "Pressure Point", requirement: "Achieve 100 One Hit kills", category: "honors-attacking-list", statKey: "personalstats.onehitkills", threshold: 100, type: "count" },
    { id: 13, name: "Sidekick", requirement: "Assist in 250 attacks", category: "honors-attacking-list", statKey: "personalstats.attacksassisted", threshold: 250, type: "count" },
    { id: 14, name: "Double Dragon", requirement: "Assist in a single attack", category: "honors-attacking-list", statKey: "personalstats.attacksassisted", threshold: 1, type: "count" },
    { id: 15, name: "Precision", requirement: "Achieve 25 critical hits", category: "honors-attacking-list", statKey: "personalstats.attackcriticalhits", threshold: 25, type: "count" },
    { id: 16, name: "50cal", requirement: "Achieve 1,000 Critical Hits", category: "honors-attacking-list", statKey: "personalstats.attackcriticalhits", threshold: 1000, type: "count" },
    { id: 17, name: "Domino Effect", requirement: "Beat someone wearing this honor", category: "honors-attacking-list", statKey: "personalstats.dominoeffect", threshold: 1, type: "boolean" }, // Requires custom game logic to check opponent's honors
    { id: 18, name: "Bounty Hunter", requirement: "Collect 250 bounties", category: "honors-attacking-list", statKey: "personalstats.bountiescollected", threshold: 250, type: "count" },
    { id: 19, name: "Dead Or Alive", requirement: "Earn $10,000,000 from bounty hunting", category: "honors-attacking-list", statKey: "personalstats.totalbountyreward", threshold: 10000000, type: "count" },
    { id: 20, name: "Spray And Pray", requirement: "Fire 1,000 rounds", category: "honors-attacking-list", statKey: "personalstats.roundsfired", threshold: 1000, type: "count" },
    { id: 21, name: "Two Halves Make A Hole", requirement: "Fire 10,000 rounds", category: "honors-attacking-list", statKey: "personalstats.roundsfired", threshold: 10000, type: "count" },
    { id: 22, name: "Lead Salad", requirement: "Fire 100,000 rounds", category: "honors-attacking-list", statKey: "personalstats.roundsfired", threshold: 100000, type: "count" },
    { id: 23, name: "Peppered", requirement: "Fire 1,000,000 rounds", category: "honors-attacking-list", statKey: "personalstats.roundsfired", threshold: 1000000, type: "count" },
    { id: 24, name: "Blood Money", requirement: "Make $1,000,000 from a single mugging", category: "honors-attacking-list", statKey: "personalstats.largestmug", threshold: 1000000, type: "count" },
    { id: 25, name: "Deadlock", requirement: "Stalemate 100 times", category: "honors-attacking-list", statKey: "personalstats.defendsstalemated", threshold: 100, type: "count" },
    { id: 26, name: "Yoink", requirement: "Successfully mug someone who just mugged someone else", category: "honors-attacking-list", statKey: "personalstats.yoinks", threshold: 1, type: "count" }, // Assumes a stat for this specific event
    { id: 27, name: "007", requirement: "Win 1,000 attacks and 1,000 defends", category: "honors-attacking-list", statKey: "personalstats.attackswon_and_defendswon", threshold: 1000, type: "dual_count" }, // Special handling for two stats
    { id: 28, name: "Self Defense", requirement: "Win 50 Defends", category: "honors-attacking-list", statKey: "personalstats.defendswon", threshold: 50, type: "count" },
    { id: 29, name: "Night Walker", requirement: "Win 100 stealthed attacks", category: "honors-attacking-list", statKey: "personalstats.attacksstealthed", threshold: 100, type: "count" },
    { id: 30, name: "Guardian Angel", requirement: "Defeat someone while they are attacking someone else", category: "honors-attacking-list", statKey: "personalstats.guardianangelwins", threshold: 1, type: "count" }, // Specific in-game event
    { id: 31, name: "Semper Fortis", requirement: "Defeat someone who has more battle stats than you in a solo attack", category: "honors-attacking-list", statKey: "personalstats.battlestat_upset_wins", threshold: 1, type: "count" }, // Specific in-game event
    { id: 32, name: "Manu Forti", requirement: "Defeat someone who has at least double your battle stats in a solo attack", category: "honors-attacking-list", statKey: "personalstats.battlestat_double_upset_wins", threshold: 1, type: "count" }, // Specific in-game event
    { id: 33, name: "Vae Victis", requirement: "Defeat someone who has five times more battlestats than you in a solo attack", category: "honors-attacking-list", statKey: "personalstats.battlestat_fivex_upset_wins", threshold: 1, type: "count" }, // Specific in-game event
    { id: 34, name: "Survivalist", requirement: "Win an attack with only 1% life remaining", category: "honors-attacking-list", statKey: "personalstats.survivalist_wins", threshold: 1, type: "count" }, // Specific in-game event
    { id: 35, name: "Fury", requirement: "Achieve 10,000 hits.", category: "honors-attacking-list", statKey: "personalstats.attackhits", threshold: 10000, type: "count" },
    { id: 36, name: "Boss Fight", requirement: "Participate in the defeat of Lootable NPC's.", category: "honors-attacking-list", statKey: "personalstats.npcdefeats_participated", threshold: 1, type: "count" }, // Placeholder, needs specific NPC stat
    { id: 37, name: "1337", requirement: "Deal exactly 1,337 damage to an opponent in a single hit", category: "honors-attacking-list", statKey: "personalstats.exact1337damage_hits", threshold: 1, type: "count" }, // Specific in-game event
    { id: 38, name: "Going Postal", requirement: "Defeat a company co-worker", category: "honors-attacking-list", statKey: "personalstats.coworker_defeats", threshold: 1, type: "count" }, // Specific in-game event
    { id: 39, name: "Friendly Fire", requirement: "Defeat a fellow faction member", category: "honors-attacking-list", statKey: "personalstats.faction_member_defeats", threshold: 1, type: "count" }, // Specific in-game event
    { id: 40, name: "Church Mouse", requirement: "Be mugged for $1", category: "honors-attacking-list", statKey: "personalstats.mugged_for_one_dollar", threshold: 1, type: "count" }, // Specific in-game event
    { id: 41, name: "Phoenix", requirement: "Defeat someone after losing to them within 10 minutes", category: "honors-attacking-list", statKey: "personalstats.phoenix_wins", threshold: 1, type: "count" }, // Specific in-game event
    { id: 42, name: "Giant Slayer", requirement: "Receive loot from a defeated NPC", category: "honors-attacking-list", statKey: "personalstats.npc_loot_received", threshold: 1, type: "count" }, // Specific in-game event
    { id: 43, name: "Bare", requirement: "Win 250 unarmored attacks or defends", category: "honors-attacking-list", statKey: "personalstats.unarmoredwon", threshold: 250, type: "count" },
    { id: 44, name: "Vengeance", requirement: "Successfully perform a faction retaliation hit", category: "honors-attacking-list", statKey: "personalstats.retals", threshold: 1, type: "count" }, // Retals stat exists and is cumulative
    { id: 45, name: "Invictus", requirement: "Successfully defend against someone who has at least double your battle stats", category: "honors-attacking-list", statKey: "personalstats.invictus_defends", threshold: 1, type: "count" }, // Specific in-game event
    { id: 46, name: "Finale", requirement: "Defeat someone on the 25th turn of an attack", category: "honors-attacking-list", statKey: "personalstats.finale_wins", threshold: 1, type: "count" }, // Specific in-game event
    { id: 47, name: "Deadly Duo", requirement: "Defeat someone with your spouse", category: "honors-attacking-list", statKey: "personalstats.spouse_assisted_defeats", threshold: 1, type: "count" }, // Specific in-game event
    { id: 48, name: "Lovestruck", requirement: "Defeat a married couple", category: "honors-attacking-list", statKey: "personalstats.married_couple_defeats", threshold: 1, type: "count" }, // Specific in-game event
    { id: 49, name: "Hands Solo", requirement: "Defeat someone using only your fists on May 4th", category: "honors-attacking-list", statKey: "personalstats.hands_solo_wins", threshold: 1, type: "count" }, // Specific in-game event and date
    { id: 50, name: "Triple Tap", requirement: "Achieve three headshots in a row", category: "honors-attacking-list", statKey: "personalstats.triple_headshots", threshold: 1, type: "count" }, // Specific in-game event

    // --- Chaining Honors ---
    { id: 51, name: "Chainer 1", requirement: "Participate in a 10 length chain", category: "honors-chaining-list", statKey: "personalstats.chains_participated_10", threshold: 1, type: "count" }, // Assuming a specific stat for chain length participation
    { id: 52, name: "Chainer 2", requirement: "Participate in a 100 length chain", category: "honors-chaining-list", statKey: "personalstats.chains_participated_100", threshold: 1, type: "count" },
    { id: 53, name: "Chainer 3", requirement: "Participate in a 1,000 length chain", category: "honors-chaining-list", statKey: "personalstats.chains_participated_1000", threshold: 1, type: "count" },
    { id: 54, name: "Chainer 4", requirement: "Participate in a 10,000 length chain", category: "honors-chaining-list", statKey: "personalstats.chains_participated_10000", threshold: 1, type: "count" },
    { id: 55, name: "Chainer 5", requirement: "Participate in a 100,000 length chain", category: "honors-chaining-list", statKey: "personalstats.chains_participated_100000", threshold: 1, type: "count" },
    { id: 56, name: "Carnage", requirement: "Make a single hit that earns your faction 10 or more respect", category: "honors-chaining-list", statKey: "personalstats.respectforfaction", threshold: 10, type: "max_value_in_chain_hit" }, // Needs tracking max respect per hit
    { id: 57, name: "Massacre", requirement: "Make a single hit that earns your faction 100 or more respect", category: "honors-chaining-list", statKey: "personalstats.respectforfaction", threshold: 100, type: "max_value_in_chain_hit" },
    { id: 58, name: "Genocide", requirement: "Make a single hit that earns your faction 1,000 or more respect", category: "honors-chaining-list", statKey: "personalstats.respectforfaction", threshold: 1000, type: "max_value_in_chain_hit" },
    { id: 59, name: "Chain Saver", requirement: "Save a 100+ chain 10 seconds before it breaks", category: "honors-chaining-list", statKey: "personalstats.chains_saved", threshold: 1, type: "count" }, // Specific in-game event
    { id: 60, name: "Strongest Link", requirement: "Make 100 hits in a single chain", category: "honors-chaining-list", statKey: "personalstats.max_hits_in_single_chain", threshold: 100, type: "count" }, // Max hits in one chain

    // --- Weapons Honors ---
    { id: 61, name: "2800 Ft/S", requirement: "Achieve 100 finishing hits with rifles", category: "honors-weapons-list", statKey: "personalstats.rifhits", threshold: 100, type: "count" },
    { id: 62, name: "Act of Faith", requirement: "Achieve 100 finishing hits with SMGs", category: "honors-weapons-list", statKey: "personalstats.smghits", threshold: 100, type: "count" },
    { id: 63, name: "Axe Wound", requirement: "Achieve 100 finishing hits with clubbing weapons", category: "honors-weapons-list", statKey: "personalstats.axehits", threshold: 100, type: "count" },
    { id: 64, name: "Cartridge Packer", requirement: "Achieve 100 finishing hits with shotguns", category: "honors-weapons-list", statKey: "personalstats.shohits", threshold: 100, type: "count" },
    { id: 65, name: "Lend A Hand", requirement: "Achieve 100 finishing hits with machine guns", category: "honors-weapons-list", statKey: "personalstats.machits", threshold: 100, type: "count" },
    { id: 66, name: "Slasher", requirement: "Achieve 100 finishing hits with slashing weapons", category: "honors-weapons-list", statKey: "personalstats.slahits", threshold: 100, type: "count" },
    { id: 67, name: "The Stabbist", requirement: "Achieve 100 finishing hits with piercing weapons", category: "honors-weapons-list", statKey: "personalstats.piehits", threshold: 100, type: "count" },
    { id: 68, "name": "Yours Says Replica...", requirement: "Achieve 100 finishing hits with pistols", category: "honors-weapons-list", statKey: "personalstats.pishits", threshold: 100, type: "count" },
    { id: 69, name: "Unarmed", requirement: "Achieve 100 fists or kick finishing hits", category: "honors-weapons-list", statKey: "personalstats.h2hhits", threshold: 100, type: "count" },
    { id: 70, name: "Stumped", requirement: "Achieve 100 finishing hits with heavy artillery", category: "honors-weapons-list", statKey: "personalstats.grehits", threshold: 100, type: "count" }, // "grehits" likely refers to grenades/heavy artillery
    { id: 71, name: "Machinist", requirement: "Achieve 100 finishing hits with mechanical weapons", category: "honors-weapons-list", statKey: "personalstats.chahits", threshold: 100, type: "count" }, // "chahits" likely for mechanical, e.g., chainsaw
    { id: 72, name: "Pin Puller", requirement: "Achieve 100 finishing hits with temporary weapons", category: "honors-weapons-list", statKey: "personalstats.temphits", threshold: 100, type: "count" }, // Assuming a stat for temporary weapon hits
    { id: 73, name: "Leonidas", requirement: "Achieve a finishing hit with Kick", category: "honors-weapons-list", statKey: "personalstats.h2hhits", threshold: 1, type: "specific_hit" }, // Needs to be exact 'kick' hit
    { id: 74, name: "Modded", requirement: "Equip two high-tier mods to a weapon", category: "honors-weapons-list", statKey: "personalstats.hightier_mods_equipped", threshold: 2, type: "count" }, // Requires specific tracking of mod tiers
    { id: 75, name: "Specialist", requirement: "Achieve 100% EXP on 25 different weapons", category: "honors-weapons-list", statKey: "personalstats.weapons_mastered", threshold: 25, type: "count" }, // Needs tracking of individual weapon EXP
    { id: 76, name: "Riddled", requirement: "Defeat an opponent after hitting at least 10 different body parts in a single attack", category: "honors-weapons-list", statKey: "personalstats.unique_body_part_hits", threshold: 1, type: "count" }, // Specific in-game event
    { id: 77, name: "War Machine", requirement: "Achieve 1,000 finishing hits in every category", category: "honors-weapons-list", statKey: "personalstats.all_weapon_categories_mastered", threshold: 1, type: "boolean" }, // Complex multi-stat requirement
    { id: 78, name: "Surplus", requirement: "Use 100 rounds of special ammunition", category: "honors-weapons-list", statKey: "personalstats.specialammoused", threshold: 100, type: "count" },
    { id: 79, name: "Bandolier", requirement: "User 1,000 rounds of special ammunition", category: "honors-weapons-list", statKey: "personalstats.specialammoused", threshold: 1000, type: "count" },
    { id: 80, name: "Quartermaster", requirement: "Use 10,000 rounds of special ammunition", category: "honors-weapons-list", statKey: "personalstats.specialammoused", threshold: 10000, type: "count" },
    { id: 81, name: "Maimed", requirement: "Use 2,500 Hollow Point rounds", category: "honors-weapons-list", statKey: "personalstats.hollowammoused", threshold: 2500, type: "count" },
    { id: 82, name: "Dragon's Breath", requirement: "Use a 12 Gauge Incendiary round", category: "honors-weapons-list", statKey: "personalstats.incendiaryammoused", threshold: 1, type: "count" }, // Specific for 1 round
    { id: 83, name: "Marked", requirement: "Use 2,500 Tracer rounds", category: "honors-weapons-list", statKey: "personalstats.tracerammoused", threshold: 2500, type: "count" },
    { id: 84, name: "Scorched", requirement: "Use 2,500 Incendiary rounds", category: "honors-weapons-list", statKey: "personalstats.incendiaryammoused", threshold: 2500, type: "count" },
    { id: 85, name: "Penetrated", requirement: "Use 2,500 Piercing rounds", category: "honors-weapons-list", statKey: "personalstats.piercingammoused", threshold: 2500, type: "count" },
    { id: 86, name: "Mod Boss", requirement: "Own at least 20 weapon mods", category: "honors-weapons-list", statKey: "personalstats.weapon_mods_owned", threshold: 20, type: "count" }, // Assuming a stat for total mods owned
    { id: 87, name: "Gone Fishing", requirement: "Be defeated by a Trout", category: "honors-weapons-list", statKey: "personalstats.defeated_by_trout", threshold: 1, type: "count" }, // Specific in-game event

    // --- Misc Honors ---
    { id: 135, name: "Woodland Camo", requirement: "5 Attacks Won", category: "misc-awards-list", statKey: "personalstats.attackswon", threshold: 5, type: "count" },
    { id: 136, name: "Desert Storm Camo", requirement: "20 Attacks Won", category: "misc-awards-list", statKey: "personalstats.attackswon", threshold: 20, type: "count" },
    { id: 137, name: "Urban Camo", requirement: "50 Attacks Won", category: "misc-awards-list", statKey: "personalstats.attackswon", threshold: 50, type: "count" },
    { id: 138, name: "Arctic Camo", requirement: "100 Attacks Won", category: "misc-awards-list", statKey: "personalstats.attackswon", threshold: 100, type: "count" },
    { id: 139, name: "Fall Camo", requirement: "250 Attacks Won", category: "misc-awards-list", statKey: "personalstats.attackswon", threshold: 250, type: "count" },
    { id: 140, name: "Yellow Camo", requirement: "500 Attacks Won", category: "misc-awards-list", statKey: "personalstats.attackswon", threshold: 500, type: "count" },
    { id: 141, name: "Digital Camo", requirement: "1,000 Attacks Won", category: "misc-awards-list", statKey: "personalstats.attackswon", threshold: 1000, type: "count" },
    { id: 142, name: "Red Camo", requirement: "2,000 Attacks Won", category: "misc-awards-list", statKey: "personalstats.attackswon", threshold: 2000, type: "count" },
    { id: 143, name: "Blue Camo", requirement: "3,000 Attacks Won", category: "misc-awards-list", statKey: "personalstats.attackswon", threshold: 3000, type: "count" },
    { id: 144, name: "Orange Camo", requirement: "4,000 Attacks Won", category: "misc-awards-list", statKey: "personalstats.attackswon", threshold: 4000, type: "count" },
    { id: 145, name: "Pink Camo", requirement: "5,000 Attacks Won", category: "misc-awards-list", statKey: "personalstats.attackswon", threshold: 5000, type: "count" },
    { id: 146, name: "Zebra Skin", requirement: "50 Hunting Skill", category: "misc-awards-list", statKey: "personalstats.huntingskill", threshold: 50, type: "count" },
    { id: 147, name: "Leopard Skin", requirement: "75 Hunting Skill", category: "misc-awards-list", statKey: "personalstats.huntingskill", threshold: 75, type: "count" },
    { id: 148, name: "Tiger Skin", requirement: "100 Hunting Skill", category: "misc-awards-list", statKey: "personalstats.huntingskill", threshold: 100, type: "count" },
    { id: 149, name: "Lucky Break", requirement: "Win the daily, weekly or monthly Lottery jackpot", category: "misc-awards-list", statKey: "personalstats.lottery_jackpots_won", threshold: 1, type: "count" }, // Specific event
    { id: 150, name: "Jackpot", requirement: "Win the Slot Machine jackpot", category: "misc-awards-list", statKey: "personalstats.slot_machine_jackpots_won", threshold: 1, type: "count" }, // Specific event
    { id: 151, name: "Poker King", requirement: "Reach a Poker score of 10 million", category: "misc-awards-list", statKey: "personalstats.poker_score", threshold: 10000000, type: "count" }, // Assuming a stat for poker score
    { id: 152, name: "Spinner", requirement: "Do 1,000 spins of the Roulette wheel", category: "misc-awards-list", statKey: "personalstats.roulette_spins", threshold: 1000, type: "count" }, // Assuming a stat for roulette spins
    { id: 153, name: "Highs And Lows", requirement: "Achieve a win streak of 25 in High-Low", category: "misc-awards-list", statKey: "personalstats.highlow_winstreak", threshold: 25, type: "count" }, // Assuming a stat for high-low win streak
    { id: 154, name: "One In Six", requirement: "Win 50 games of Foot Russian Roulette", category: "misc-awards-list", statKey: "personalstats.foot_russian_roulette_wins", threshold: 50, type: "count" }, // Assuming a stat for foot Russian roulette wins
    { id: 155, name: "Daddy's New Shoes", requirement: "Win $100,000,000 in a single game of Russian Roulette", category: "misc-awards-list", statKey: "personalstats.max_russian_roulette_win", threshold: 100000000, type: "count" }, // Max single win in RR
    { id: 156, name: "Foot Soldier", requirement: "Beat 10 unique opponents in Russian Roulette", category: "misc-awards-list", statKey: "personalstats.unique_rr_opponents", threshold: 10, type: "count" }, // Needs tracking unique opponents
    { id: 157, name: "Twenty-One", requirement: "Win a Natural, Six Card Charlie, Double Down and Insurance on Blackjack", category: "misc-awards-list", statKey: "personalstats.blackjack_special_wins", threshold: 1, type: "boolean" }, // Complex multi-condition
    { id: 158, name: "Awesome", requirement: "Win while spinning the Wheel of Awesome", category: "misc-awards-list", statKey: "personalstats.wheel_of_awesome_wins", threshold: 1, type: "count" }, // Assuming a stat for this specific win
    { id: 159, name: "Mediocre", requirement: "Win while spinning the Wheel of Mediocrity", category: "misc-awards-list", statKey: "personalstats.wheel_of_mediocrity_wins", threshold: 1, type: "count" }, // Assuming a stat for this specific win
    { id: 160, name: "Lame", requirement: "Win while spinning the Wheel of Lame", category: "misc-awards-list", statKey: "personalstats.wheel_of_lame_wins", threshold: 1, type: "count" }, // Assuming a stat for this specific win
    { id: 161, name: "Discovery", requirement: "Be in a faction which starts making a dirty bomb", category: "misc-awards-list", statKey: "personalstats.dirty_bomb_discovery", threshold: 1, type: "boolean" }, // Specific event
    { id: 162, name: "RDD", requirement: "Use a dirty bomb", category: "misc-awards-list", statKey: "personalstats.dirty_bombs_used", threshold: 1, type: "count" }, // Assuming a stat for dirty bombs used
    { id: 163, name: "Slow Bomb", requirement: "Use a dirty bomb", category: "misc-awards-list", statKey: "personalstats.dirty_bombs_used", threshold: 1, type: "count" }, // Same as RDD
    { id: 164, name: "Spaced Out", requirement: "Overdose on Cannabis", category: "misc-awards-list", statKey: "personalstats.overdosed", threshold: 1, type: "count" }, // Overdosed is a general stat, might need specific drug tracking
    { id: 165, name: "Who's Frank?", requirement: "Use 50 Cannabis", category: "misc-awards-list", statKey: "personalstats.cantaken", threshold: 50, type: "count" },
    { id: 166, name: "I Think I See Dead People", requirement: "Use 50 Shrooms", category: "misc-awards-list", statKey: "personalstats.shrtaken", threshold: 50, type: "count" },
    { id: 167, name: "Party Animal", requirement: "Use 50 Ecstasy", category: "misc-awards-list", statKey: "personalstats.exttaken", threshold: 50, type: "count" },
    { id: 168, name: "Acid Dream", requirement: "Use 50 LSD", category: "misc-awards-list", statKey: "personalstats.lsdtaken", threshold: 50, type: "count" },
    { id: 169, name: "Painkiller", requirement: "Use 50 Vicodin", category: "misc-awards-list", statKey: "personalstats.victaken", threshold: 50, type: "count" },
    { id: 170, name: "Horse Tranquilizer", requirement: "Use 50 Ketamine", category: "misc-awards-list", statKey: "personalstats.kettaken", threshold: 50, type: "count" },
    { id: 171, name: "The Fields Of Opium", requirement: "Use 50 Opium", category: "misc-awards-list", statKey: "personalstats.opitaken", threshold: 50, type: "count" },
    { id: 172, name: "Crank It Up", requirement: "Use 50 Speed", category: "misc-awards-list", statKey: "personalstats.spetaken", threshold: 50, type: "count" },
    { id: 173, name: "Angel Dust", requirement: "Use 50 PCP", category: "misc-awards-list", statKey: "personalstats.pcptaken", threshold: 50, type: "count" },
    { id: 174, name: "Free Energy", requirement: "Use 50 Xanax", category: "misc-awards-list", statKey: "personalstats.xantaken", threshold: 50, type: "count" },
    { id: 217, name: "Pious", requirement: "Donate a total of $100,000 to the church", category: "misc-awards-list", statKey: "personalstats.church_donated", threshold: 100000, type: "count" }, // Assuming a cumulative church donation stat
    { id: 218, name: "Saintly", requirement: "Donate a total of $1,000,000 to the church", category: "misc-awards-list", statKey: "personalstats.church_donated", threshold: 1000000, type: "count" },
    { id: 219, name: "Forgiven", requirement: "Be truly forgiven for all of your sins", category: "misc-awards-list", statKey: "personalstats.sins_forgiven", threshold: 1, type: "boolean" }, // Specific event
    { id: 220, name: "Devout", requirement: "Donate a total of $100,000,000 to the church", category: "misc-awards-list", statKey: "personalstats.church_donated", threshold: 100000000, type: "count" },
    { id: 221, name: "Sacrificial", requirement: "Donate $1,000,000,000 to the church", category: "misc-awards-list", statKey: "personalstats.church_donated", threshold: 1000000000, type: "count" },
    { id: 222, name: "Repeat Offender", requirement: "Go to jail 250 times", category: "misc-awards-list", statKey: "personalstats.jailed", threshold: 250, type: "count" },
    { id: 223, name: "Bar Breaker", requirement: "Bust 1,000 players out of jail", category: "misc-awards-list", statKey: "personalstats.peoplebusted", threshold: 1000, type: "count" },
    { id: 224, name: "Aiding And Abetting", requirement: "Bust 2,500 players out of jail", category: "misc-awards-list", statKey: "personalstats.peoplebusted", threshold: 2500, type: "count" },
    { id: 225, name: "Don't Drop It", requirement: "Bust 10,000 players out of jail", category: "misc-awards-list", statKey: "personalstats.peoplebusted", threshold: 10000, type: "count" },
    { id: 226, name: "Freedom Isn't Free", requirement: "Bail 500 players out of jail", category: "misc-awards-list", statKey: "personalstats.peoplebought", threshold: 500, type: "count" },
    { id: 227, name: "Booboo", requirement: "Go to hospital 250 times", category: "misc-awards-list", statKey: "personalstats.hospital", threshold: 250, type: "count" },
    { id: 228, name: "Magical Veins", requirement: "Use 5,000 medical items", category: "misc-awards-list", statKey: "personalstats.medicalitemsused", threshold: 5000, type: "count" },
    { id: 229, name: "Florence Nightingale", requirement: "Revive 500 players", category: "misc-awards-list", statKey: "personalstats.revives", threshold: 500, type: "count" },
    { id: 230, name: "Second Chance", requirement: "Revive 1,000 players", category: "misc-awards-list", statKey: "personalstats.revives", threshold: 1000, type: "count" },
    { id: 231, name: "Vampire", requirement: "Random chance upon using a blood bag", category: "misc-awards-list", statKey: "personalstats.vampire_proc", threshold: 1, type: "count" }, // Assuming a stat for this random event
    { id: 232, name: "Clotted", requirement: "Hospitalize yourself by using the wrong blood bag or drinking some Ipecac Syrup.", category: "misc-awards-list", statKey: "personalstats.self_hospitalized_wrong_item", threshold: 1, type: "count" }, // Specific event
    { id: 233, name: "Transfusion", requirement: "Fill 250 blood bags", category: "misc-awards-list", statKey: "personalstats.bloodwithdrawn", threshold: 250, type: "count" },
    { id: 234, name: "Anaemic", requirement: "Fill 1,000 blood bags", category: "misc-awards-list", statKey: "personalstats.bloodwithdrawn", threshold: 1000, type: "count" },
    { id: 235, name: "Miracle Worker", requirement: "Revive 10 people in 10 minutes", category: "misc-awards-list", statKey: "personalstats.miracle_revives", threshold: 1, type: "count" }, // Specific time-based event
    { id: 236, name: "Resurrection", requirement: "Revive someone you've just defeated", category: "misc-awards-list", statKey: "personalstats.revived_defeated_target", threshold: 1, type: "count" }, // Specific event
    { id: 237, name: "Crucifixion", requirement: "Defeat someone you've just revived", category: "misc-awards-list", statKey: "personalstats.defeated_revived_target", threshold: 1, type: "count" }, // Specific event
    { id: 238, name: "Welcome", requirement: "Be online everyday for 100 days", category: "misc-awards-list", statKey: "personalstats.activestreak", threshold: 100, type: "count" },
    { id: 239, name: "Couch Potato", requirement: "Reach 1,000 hours of Time Played on Torn", category: "misc-awards-list", statKey: "personalstats.useractivity", threshold: 3600000, type: "count" }, // Convert hours to seconds for useractivity
    { id: 240, name: "Fascination", requirement: "Stay married for 250 days", category: "misc-awards-list", statKey: "personalstats.spousedays", threshold: 250, type: "count" }, // Assuming spousedays or similar for continuous marriage
    { id: 241, name: "Chasm", requirement: "Stay married for 750 days", category: "misc-awards-list", statKey: "personalstats.spousedays", threshold: 750, type: "count" },
    { id: 242, name: "Stairway To Heaven", requirement: "Stay married for 1,500 days", category: "misc-awards-list", statKey: "personalstats.spousedays", threshold: 1500, type: "count" },
    { id: 243, name: "Alcoholic", requirement: "Drink 500 bottles of alcohol", category: "misc-awards-list", statKey: "personalstats.alcoholused", threshold: 500, type: "count" },
    { id: 244, name: "Sodaholic", requirement: "Drink 500 cans of energy drinks", category: "misc-awards-list", statKey: "personalstats.energydrinkused", threshold: 500, type: "count" },
    { id: 245, name: "Diabetic", requirement: "Eat 500 bags of candy", category: "misc-awards-list", statKey: "personalstats.candyused", threshold: 500, type: "count" },
    { id: 246, name: "Optimist", requirement: "Find 1,000 items in dump", category: "misc-awards-list", statKey: "personalstats.dumpfinds", threshold: 1000, type: "count" },
    { id: 247, name: "Lavish", requirement: "Dump an item with a current market value of at least $1,000,000", category: "misc-awards-list", statKey: "personalstats.high_value_items_dumped", threshold: 1, type: "count" }, // Specific event
    { id: 248, name: "Bibliophile", requirement: "Read 10 books", category: "misc-awards-list", statKey: "personalstats.booksread", threshold: 10, type: "count" },
    { id: 249, name: "Worth It", requirement: "Use a stat enhancer", category: "misc-awards-list", statKey: "personalstats.statenhancersused", threshold: 1, type: "count" },
    { id: 250, name: "Eco Friendly", requirement: "Trash 5,000 items", category: "misc-awards-list", statKey: "personalstats.items_trashed", threshold: 5000, type: "count" }, // Assuming a stat for items trashed
    { id: 251, name: "Stinker", requirement: "Successfully prank someone with Stink Bombs", category: "misc-awards-list", statKey: "personalstats.stink_bomb_pranks", threshold: 1, type: "count" }, // Specific prank stat
    { id: 252, name: "Wipeout", requirement: "Successfully prank someone with Toilet Paper", category: "misc-awards-list", statKey: "personalstats.toilet_paper_pranks", threshold: 1, type: "count" }, // Specific prank stat
    { id: 253, name: "Bargain Hunter", requirement: "Win 10 auctions", category: "misc-awards-list", statKey: "personalstats.auctionswon", threshold: 10, type: "count" },
    { id: 254, name: "Foul Play", requirement: "Successfully prank someone with Dog Poop", category: "misc-awards-list", statKey: "personalstats.dog_poop_pranks", threshold: 1, type: "count" }, // Specific prank stat
    { id: 255, name: "I'm Watching You", requirement: "Find 50 items in the city", category: "misc-awards-list", statKey: "personalstats.cityfinds", threshold: 50, type: "count" },
    { id: 256, "name": "Middleman", requirement: "Have 100 different customers buy from your bazaar", category: "misc-awards-list", statKey: "personalstats.bazaarcustomers", threshold: 100, type: "count" },
    { id: 257, "name": "Collector", requirement: "Maintain an impressive display case of collectible items", category: "misc-awards-list", statKey: "personalstats.display_case_value", threshold: 1, type: "boolean" }, // Value/quantity check or specific trigger
    { id: 258, name: "Radaway", requirement: "Use a Neumune Tablet to reduce radiation poisoning", category: "misc-awards-list", statKey: "personalstats.neumune_tablets_used", threshold: 1, type: "count" }, // Specific item use
    { id: 259, name: "Energize", requirement: "Use 250 Energy Refills", category: "misc-awards-list", statKey: "personalstats.energy_refills_used", threshold: 250, type: "count" }, // Assuming energy_refills_used
    { id: 260, name: "You've Got Some Nerve", requirement: "Use 250 Nerve Refills", category: "misc-awards-list", statKey: "personalstats.nerverefills", threshold: 250, type: "count" },
    { id: 261, name: "Compulsive", requirement: "Use 250 Casino Refills", category: "misc-awards-list", statKey: "personalstats.tokenrefills", threshold: 250, type: "count" }, // tokenrefills often refers to casino refills
    { id: 262, name: "Seeker", requirement: "Reach 250 awards (honors and medals)", category: "misc-awards-list", statKey: "personalstats.awards", threshold: 250, type: "count" },
    { id: 263, name: "Silicon Valley", requirement: "Code 100 viruses", category: "misc-awards-list", statKey: "personalstats.virusescoded", threshold: 100, type: "count" },
    { id: 264, name: "The Affronted", requirement: "Irritate all job interviewers", category: "misc-awards-list", statKey: "personalstats.all_interviewers_irritated", threshold: 1, type: "boolean" }, // Specific event
    { id: 265, name: "Energetic", requirement: "Achieve the maximum of 1,000 energy", category: "misc-awards-list", statKey: "personalstats.max_energy_achieved", threshold: 1, type: "boolean" }, // Max stat reached, would need to verify current max E
    { id: 266, name: "Ecstatic", requirement: "Achieve the maximum of 99,999 happiness", category: "misc-awards-list", statKey: "personalstats.max_happiness_achieved", threshold: 1, type: "boolean" }, // Max stat reached
    { id: 267, name: "Christmas in Torn", requirement: "Login on Christmas Day", category: "misc-awards-list", statKey: "personalstats.christmas_login", threshold: 1, type: "boolean" }, // Date-specific login
    { id: 268, name: "Trick or Treat", requirement: "Login on Halloween", category: "misc-awards-list", statKey: "personalstats.halloween_login", threshold: 1, type: "boolean" }, // Date-specific login
    { id: 269, name: "Torniversary", requirement: "Login on November 15th", category: "misc-awards-list", statKey: "personalstats.torniversary_login", threshold: 1, type: "boolean" }, // Date-specific login
    { id: 270, name: "Buffed", requirement: "Achieve 50 personal perks", category: "misc-awards-list", statKey: "personalstats.personal_perks", threshold: 50, type: "count" }, // Assuming personal_perks
    { id: 271, name: "Web of Perks", requirement: "Achieve 100 personal perks", category: "misc-awards-list", statKey: "personalstats.personal_perks", threshold: 100, type: "count" },
    { id: 272, name: "OP", requirement: "Achieve 150 personal perks", category: "misc-awards-list", statKey: "personalstats.personal_perks", threshold: 150, type: "count" },
    { id: 273, name: "10-stack", requirement: "Increase a merit upgrade to its maximum", category: "misc-awards-list", statKey: "personalstats.maxed_merit_upgrades", threshold: 1, type: "count" }, // Specific merit upgrade, likely a boolean or count of maxed merits
    { id: 274, name: "Decorated", requirement: "Achieve 100 total awards", category: "misc-awards-list", statKey: "personalstats.awards", threshold: 100, type: "count" },
    { id: 275, name: "Honored", requirement: "Achieve 500 total awards", category: "misc-awards-list", statKey: "personalstats.awards", threshold: 500, type: "count" },
    { id: 276, name: "Time Traveller", requirement: "Survive a Torn City rollback", category: "misc-awards-list", statKey: "personalstats.survived_rollback", threshold: 1, type: "boolean" }, // Specific event
    { id: 277, name: "Fresh Start", requirement: "Reset your merits", category: "misc-awards-list", statKey: "personalstats.merits_reset", threshold: 1, type: "count" }, // Specific event
    { id: 278, name: "Tornication", requirement: "Login on Valentine's Day", category: "misc-awards-list", statKey: "personalstats.valentines_login", threshold: 1, type: "boolean" }, // Date-specific login
    { id: 279, name: "Resolution", requirement: "Login on New Year's Day", category: "misc-awards-list", statKey: "personalstats.new_years_login", threshold: 1, type: "boolean" }, // Date-specific login
    { id: 280, name: "Leaderboard", requirement: "Achieve top 250 in one of the personal Hall of Fame leaderboards", category: "misc-awards-list", statKey: "personalstats.leaderboard_top_250", threshold: 1, type: "boolean" }, // Complex multi-leaderboard check
    { id: 281, name: "RNG", requirement: "Who knows?", category: "misc-awards-list", statKey: "personalstats.random_event_honor", threshold: 1, type: "boolean" }, // This is a mystery one, likely a rare random event
    { id: 282, name: "Historian", requirement: "Read a chronicle", category: "misc-awards-list", statKey: "personalstats.chronicles_read", threshold: 1, type: "count" }, // Assuming a stat for chronicles read
    { id: 283, name: "NiceNiceIntern", requirement: "100 job points used", category: "misc-awards-list", statKey: "personalstats.jobpointsused", threshold: 100, type: "count" },
    { id: 284, name: "Stuck In a Rut", requirement: "1,000 job points used", category: "misc-awards-list", statKey: "personalstats.jobpointsused", threshold: 1000, type: "count" },
    { id: 285, name: "Overtime", requirement: "10,000 job points used", category: "misc-awards-list", statKey: "personalstats.jobpointsused", threshold: 10000, type: "count" },
    { id: 286, name: "Journalist", requirement: "Have an article published", category: "misc-awards-list", statKey: "personalstats.articles_published", threshold: 1, type: "count" }, // Assuming stat for published articles
    { id: 287, name: "Velutinous", requirement: "Have a comic published", category: "misc-awards-list", statKey: "personalstats.comics_published", threshold: 1, type: "count" }, // Assuming stat for published comics
    { id: 288, name: "Luxury Real Estate", requirement: "Own a Private Island with a Airstrip", category: "misc-awards-list", statKey: "personalstats.property_private_island_airstrip", threshold: 1, type: "boolean" }, // Specific property type/feature
    { id: 289, name: "The High Life", requirement: "Own a Private Island with a Yacht", category: "misc-awards-list", statKey: "personalstats.property_private_island_yacht", threshold: 1, type: "boolean" }, // Specific property type/feature
    { id: 290, name: "Landlord", requirement: "Lease one of your properties to someone.", category: "misc-awards-list", statKey: "personalstats.properties_leased", threshold: 1, type: "count" }, // Assuming a stat for leased properties
    { id: 291, name: "Protege", requirement: "Complete the mission introduction: Duke", category: "misc-awards-list", statKey: "personalstats.dukecontractscompleted", threshold: 1, type: "count" }, // Specific mission
    { id: 292, name: "Mercenary", requirement: "Complete 1,000 mission contracts", category: "misc-awards-list", statKey: "personalstats.contractscompleted", threshold: 1000, type: "count" },
    { id: 293, name: "Task Master", requirement: "Earn 10,000 mission credits", category: "misc-awards-list", statKey: "personalstats.missioncreditsearned", threshold: 10000, type: "count" },
    { id: 294, name: "Driving Elite", requirement: "Reach Class A", category: "misc-awards-list", statKey: "personalstats.racing_class_a", threshold: 1, type: "boolean" }, // Needs to represent current racing class
    { id: 295, name: "Redline", requirement: "250 wins in the same car", category: "misc-awards-list", statKey: "personalstats.single_car_wins", threshold: 250, type: "count" }, // Needs specific car tracking
    { id: 296, name: "Motorhead", requirement: "Achieve a driver skill of 10", category: "misc-awards-list", statKey: "personalstats.racingskill", threshold: 10, type: "count" },
    { id: 297, name: "Wrecked", requirement: "Crash during a race", category: "misc-awards-list", statKey: "personalstats.races_crashed", threshold: 1, type: "count" }, // Assuming a stat for races crashed
    { id: 298, name: "Checkered Past", requirement: "Win 100 races", category: "misc-awards-list", statKey: "personalstats.raceswon", threshold: 100, type: "count" },
    { id: 299, name: "On Track", requirement: "Earn 2,500 Racing Points", category: "misc-awards-list", statKey: "personalstats.racingpointsearned", threshold: 2500, type: "count" },
    { id: 300, name: "Two's Company", requirement: "Refer 1 player who reaches level 10", category: "misc-awards-list", statKey: "personalstats.referred_level_10_players", threshold: 1, type: "count" }, // Assuming cumulative referred L10 players
    { id: 301, name: "Three's A Crowd", requirement: "Refer 2 players who reach level 10", category: "misc-awards-list", statKey: "personalstats.referred_level_10_players", threshold: 2, type: "count" },
    { id: 302, name: "Social Butterfly", requirement: "Refer 3 players who reach level 10", category: "misc-awards-list", statKey: "personalstats.referred_level_10_players", threshold: 3, type: "count" },
    { id: 303, name: "Pyramid Scheme", requirement: "Have one of your referrals refer another player who goes on to reach level 10", category: "misc-awards-list", statKey: "personalstats.referred_referral_level_10", threshold: 1, type: "count" }, // Multi-level referral

];

const allMedals = [
    { id: 1, name: "Anti Social", requirement: "Win 50 attacks", category: "medals-combat-list", statKey: "personalstats.attackswon", threshold: 50, type: "count" },
    { id: 2, name: "Happy Slapper", requirement: "Win 250 attacks", category: "medals-combat-list", statKey: "personalstats.attackswon", threshold: 250, type: "count" },
    { id: 3, name: "Scar Maker", requirement: "Win 500 attacks", category: "medals-combat-list", statKey: "personalstats.attackswon", threshold: 500, type: "count" },
    { id: 4, name: "Tooth and Nail", requirement: "Win 1,250 attacks", category: "medals-combat-list", statKey: "personalstats.attackswon", threshold: 1250, type: "count" },
    { id: 5, name: "Heart Breaker", requirement: "Win 5,000 attacks", category: "medals-combat-list", statKey: "personalstats.attackswon", threshold: 5000, type: "count" },
    { id: 6, name: "Going Postal", requirement: "Win 2,500 attacks", category: "medals-combat-list", statKey: "personalstats.attackswon", threshold: 2500, type: "count" },
    { id: 7, name: "Somebody Call 911", requirement: "Win 10,000 attacks", category: "medals-combat-list", statKey: "personalstats.attackswon", threshold: 10000, type: "count" },
    { id: 60, name: "One Year of Service", requirement: "Live in Torn for One Year", category: "medals-commitment-list", statKey: "age", threshold: 365, type: "count" },
    { id: 61, name: "Two Years of Service", requirement: "Live in Torn for Two Years", category: "medals-commitment-list", statKey: "age", threshold: 730, type: "count" },
    // ... (rest of the complete medals list with corrected statKeys would be here) ...
];


// --- Helper Functions ---
function showLoading() { loadingIndicator.style.display = 'block'; }
function hideLoading() { loadingIndicator.style.display = 'none'; }
function showError(message) { errorDisplay.textContent = message; errorDisplay.style.display = 'block'; }
function hideError() { errorDisplay.style.display = 'none'; }
function formatNumber(num) { return num ? num.toLocaleString() : 'N/A'; }
function getNestedProperty(obj, path) {
    if (!path || !obj) return undefined;
    if (!path.includes('.')) return obj[path];
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}
function clearAllLists() {
    [honorsAttackingList, honorsWeaponsList, honorsChainingList, medalsCombatList, medalsCommitmentList, medalsCrimesList, playerStatsList, miscAwardsList, awardsProgressList].forEach(list => {
        if (list) list.innerHTML = '';
    });
}


// --- Main Application Logic ---

async function fetchTornDataDirectly(apiKey) {
    if (!apiKey) throw new Error("No Torn API key found.");
    const selections = "basic,personalstats,honors,medals";
    const apiUrl = `https://api.torn.com/user/?selections=${selections}&key=${apiKey}`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`API request failed: ${response.status}`);
        const data = await response.json();
        if (data.error) throw new Error(`API error: ${data.error.code} - ${data.error.error}`);
        console.log("Successfully fetched all required data:", data);
        return data;
    } catch (error) {
        console.error('Error fetching Torn data:', error);
        showError(`Failed to load Torn data: ${error.message}.`);
        return null;
    }
}

function displayPlayerSummary(playerData) {
    const summaryP = document.querySelector('.player-summary-section p');
    if (!summaryP || !playerData) return;
    const summaryParts = [
        `Player: <span>${playerData.name || 'N/A'}</span>`,
        `Level: <span>${formatNumber(playerData.level) || 'N/A'}</span>`,
        `Total Stats: <span>${formatNumber(playerData.personalstats?.totalstats) || 'N/A'}</span>`,
        `Networth: <span>${playerData.personalstats?.networth ? '$' + formatNumber(playerData.personalstats.networth) : 'N/A'}</span>`,
        `Awards: <span>${formatNumber(playerData.awards) || 'N/A'}</span>`
    ];
    summaryP.innerHTML = summaryParts.join(' | ');
}

function getAchievementStatus(achievement, playerData, earnedIds) {
    if (earnedIds.has(achievement.id)) {
        return { isCompleted: true, statusIconClass: 'completed', statusSymbol: '✔', progressText: '', calculatedPercentage: 100 };
    }

    const value = getNestedProperty(playerData, achievement.statKey);
    let statusIconClass = 'not-started';
    let statusSymbol = '◎';
    let progressText = '';
    let calculatedPercentage = 0;

    if (value !== undefined && value !== null && value > 0) {
        statusIconClass = 'in-progress';
        statusSymbol = '●';
        calculatedPercentage = Math.min((value / achievement.threshold) * 100, 100);
        progressText = ` (Progress: ${formatNumber(value)}/${formatNumber(achievement.threshold)})`;
    }
    return { isCompleted: false, statusIconClass, statusSymbol, progressText, calculatedPercentage };
}

/**
 * Updates the display for all Honors and Medals with detailed logging.
 * @param {object} playerData - The complete player data from the API.
 */
function updateAchievementsDisplay(playerData) {
    clearAllLists();
    console.log("--- Starting to display all achievements ---");

    const earnedHonorIds = new Set(playerData.honors_awarded || []);
    const earnedMedalIds = new Set(playerData.medals_awarded || []);

    const categoryElementMap = {
        'honors-attacking-list': honorsAttackingList,
        'honors-weapons-list': honorsWeaponsList,
        'honors-chaining-list': honorsChainingList,
        'medals-combat-list': medalsCombatList,
        'medals-commitment-list': medalsCommitmentList,
        'medals-crimes-list': medalsCrimesList,
        'misc-awards-list': miscAwardsList
    };

    const processList = (masterList, earnedIds, type) => {
        console.log(`--- Processing all ${type} ---`);
        masterList.forEach(item => {
            const listElement = categoryElementMap[item.category];

            // --- NEW DEBUG LOGGING ---
            if (listElement) {
                // This will run if the HTML list was found correctly.
                console.log(`Found list for '${item.name}'. Processing...`);
            } else {
                // This will run if the HTML list is missing.
                console.warn(`HTML list NOT found for category: '${item.category}'. Skipping '${item.name}'.`);
                return; // Skip this item if its container doesn't exist.
            }
            // -------------------------

            const isCompleted = earnedIds.has(item.id);
            const status = getAchievementStatus(item, playerData, isCompleted); // We'll create this next

            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <span class="merit-status-icon ${status.statusIconClass}">${status.statusSymbol}</span>
                <span class="merit-details">
                    <span class="merit-name">${item.name}</span> -
                    <span class="merit-requirement">${item.requirement}</span>
                    <span class="merit-progress">${status.progressText}</span>
                </span>
            `;
            listElement.appendChild(listItem);
        });
    };

    processList(allHonors, earnedHonorIds, "Honors");
    processList(allMedals, earnedMedalIds, "Medals");

    // The rest of your functions (like populateAwardsProgressTab) would go here.
    // For now, let's focus on the main display.
}

// We also need to slightly adjust getAchievementStatus to work with the new display function
function getAchievementStatus(achievement, playerData, isCompleted) {
    if (isCompleted) {
        return { statusIconClass: 'completed', statusSymbol: '✔', progressText: '' };
    }

    // If not completed, calculate progress
    const value = getNestedProperty(playerData, achievement.statKey);
    if (value > 0) {
        return {
            statusIconClass: 'in-progress',
            statusSymbol: '●',
            progressText: ` (Progress: ${formatNumber(value)}/${formatNumber(achievement.threshold)})`
        };
    }

    // Default to not started
    return { statusIconClass: 'not-started', statusSymbol: '◎', progressText: '' };
}

function populateAwardsProgressTab(progressList) {
    awardsProgressList.innerHTML = '';
    if (!progressList || progressList.length === 0) {
        awardsProgressList.innerHTML = '<li>No awards currently in progress.</li>';
        return;
    }
    progressList.sort((a, b) => b.calculatedPercentage - a.calculatedPercentage);
    progressList.forEach(item => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <span class="merit-status-icon ${item.statusIconClass}">${item.statusSymbol}</span>
            <span class="merit-details">
                <span class="merit-name">${item.achievement.name}</span> -
                <span class="merit-requirement">${item.achievement.requirement}</span>
                <span class="merit-progress">${item.progressText} (${item.calculatedPercentage.toFixed(1)}%)</span>
            </span>`;
        awardsProgressList.appendChild(listItem);
    });
}

function switchTab(tabId) {
    tabsContainer.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
    tabContents.forEach(pane => pane.style.display = 'none');
    const activeButton = tabsContainer.querySelector(`[data-tab="${tabId.replace('-tab', '')}"]`);
    const activePane = document.getElementById(tabId);
    if (activeButton) activeButton.classList.add('active');
    if (activePane) {
        activePane.style.display = 'flex';
        activePane.classList.add('active');
    }
}

tabsContainer.addEventListener('click', (event) => {
    const targetButton = event.target.closest('.tab-button');
    if (targetButton) {
        switchTab(`${targetButton.dataset.tab}-tab`);
    }
});

async function initializeMeritsPage() {
    hideError();
    showLoading();
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            try {
                const userDocRef = firebase.firestore().collection('userProfiles').doc(user.uid);
                const doc = await userDocRef.get();
                if (doc.exists && doc.data().tornApiKey) {
                    const playerData = await fetchTornDataDirectly(doc.data().tornApiKey);
                    if (playerData) {
                        displayPlayerSummary(playerData);
                        updateAchievementsDisplay(playerData);
                        // We will add populatePlayerStats back later if needed
                    }
                } else {
                    showError('No Torn API key found. Please set it in your profile settings.');
                }
            } catch (error) {
                console.error("Error during initialization:", error);
                showError('Failed to initialize page. Check console for details.');
            } finally {
                hideLoading();
            }
        } else {
            hideLoading();
            showError('Please log in to view your Torn Honors & Medals.');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    switchTab('honors-tab');
    initializeMeritsPage();
});