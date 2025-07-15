// --- merits.js ---

// DOM Elements
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

// Lists for dynamic content
const honorsAttackingList = document.getElementById('honors-attacking-list');
const honorsWeaponsList = document.getElementById('honors-weapons-list');
const honorsChainingList = document.getElementById('honors-chaining-list');

const medalsCombatList = document.getElementById('medals-combat-list');
const medalsCommitmentList = document.getElementById('medals-commitment-list'); // This list will now hold both Level and Commitment Medals

const medalsCrimesList = document.getElementById('medals-crimes-list');

const playerStatsList = document.getElementById('player-stats-list');
const miscAwardsList = document.getElementById('misc-awards-list'); // For miscellaneous awards in Stats Overview tab
const awardsProgressList = document.getElementById('awards-progress-list'); // NEW: For Awards Progress tab


// --- Static Merit/Medal Data (COMPREHENSIVE LIST - VERIFY STATKEYS!) ---
// This contains all awards from your provided wiki text, mapped to categories and statKeys.
// YOU MUST VERIFY EACH statKey and threshold against your actual Torn API response.
// Some statKeys are inferred or generalized and might need fine-tuning.
const allHonors = [
    // --- Chaining Honors ---
    { name: "Chainer 1", requirement: "Participate in a 10 length chain", statKey: "personalstats.chains", threshold: 10, category: "honors-chaining-list", type: "count" },
    { name: "Chainer 2", requirement: "Participate in a 100 length chain", statKey: "personalstats.chains", threshold: 100, category: "honors-chaining-list", type: "count" },
    { name: "Chainer 3", requirement: "Participate in a 1,000 length chain", statKey: "personalstats.chains", threshold: 1000, category: "honors-chaining-list", type: "count" },
    { name: "Chainer 4", requirement: "Participate in a 10,000 length chain", statKey: "personalstats.chains", threshold: 10000, category: "honors-chaining-list", type: "count" },
    { name: "Chainer 5", requirement: "Participate in a 100,000 length chain", statKey: "personalstats.chains", threshold: 100000, category: "honors-chaining-list", type: "count" },
    { name: "Carnage", requirement: "Make a single hit that earns your faction 10 or more respect", statKey: "personalstats.best_chain_hit", threshold: 10, category: "honors-chaining-list", type: "count" },
    { name: "Massacre", requirement: "Make a single hit that earns your faction 100 or more respect", statKey: "personalstats.best_chain_hit", threshold: 100, category: "honors-chaining-list", type: "count" },
    { name: "Genocide", requirement: "Make a single hit that earns your faction 1,000 or more respect", statKey: "personalstats.best_chain_hit", threshold: 1000, category: "honors-chaining-list", type: "count" },
    { name: "Chain Saver", requirement: "Save a 100+ chain 10 seconds before it breaks", statKey: "personalstats.chains_saved", threshold: 1, category: "honors-chaining-list", type: "count" }, // Placeholder, needs specific log/stat check
    { name: "Strongest Link", requirement: "Make 100 hits in a single chain", statKey: "personalstats.max_chain", threshold: 100, category: "honors-chaining-list", type: "count" },

    // --- Weapons Honors ---
    { name: "2800 Ft/S", requirement: "Achieve 100 finishing hits with rifles", statKey: "personalstats.rifhits", threshold: 100, category: "honors-weapons-list", type: "count" },
    { name: "Act of Faith", requirement: "Achieve 100 finishing hits with SMGs", statKey: "personalstats.smghits", threshold: 100, category: "honors-weapons-list", type: "count" },
    { name: "Axe Wound", requirement: "Achieve 100 finishing hits with clubbing weapons", statKey: "personalstats.axehits", threshold: 100, category: "honors-weapons-list", type: "count" },
    { name: "Cartridge Packer", requirement: "Achieve 100 finishing hits with shotguns", statKey: "personalstats.shohits", threshold: 100, category: "honors-weapons-list", type: "count" },
    { name: "Leonidas", requirement: "Achieve a finishing hit with Kick", statKey: "personalstats.kickhits", threshold: 1, category: "honors-weapons-list", type: "count" }, // Placeholder for specific kick hits
    { name: "Lend A Hand", requirement: "Achieve 100 finishing hits with machine guns", statKey: "personalstats.machits", threshold: 100, category: "honors-weapons-list", type: "count" }, // Placeholder
    { name: "Pin Puller", requirement: "Achieve 100 finishing hits with temporary weapons", statKey: "personalstats.temphits", threshold: 100, category: "honors-weapons-list", type: "count" }, // Placeholder
    { name: "Machinist", requirement: "Achieve 100 finishing hits with mechanical weapons", statKey: "personalstats.mechits", threshold: 100, category: "honors-weapons-list", type: "count" }, // Placeholder
    { name: "Slasher", requirement: "Achieve 100 finishing hits with slashing weapons", statKey: "personalstats.slahits", threshold: 100, category: "honors-weapons-list", type: "count" },
    { name: "Stumped", requirement: "Achieve 100 finishing hits with heavy artillery", statKey: "personalstats.artihits", threshold: 100, category: "honors-weapons-list", type: "count" }, // Placeholder
    { name: "The Stabbist", requirement: "Achieve 100 finishing hits with piercing weapons", statKey: "personalstats.piehits", threshold: 100, category: "honors-weapons-list", type: "count" },
    { name: "Yours Says Replica...", requirement: "Achieve 100 finishing hits with pistols", statKey: "personalstats.pishits", threshold: 100, category: "honors-weapons-list", type: "count" },
    { name: "Unarmed", requirement: "Achieve 100 fists or kick finishing hits", statKey: "personalstats.h2hhits", threshold: 100, category: "honors-weapons-list", type: "count" },
    { name: "Modded", requirement: "Equip two high-tier mods to a weapon", statKey: "personalstats.modded_weapons", threshold: 1, category: "honors-weapons-list", type: "count" }, // Placeholder, needs inventory access
    { name: "Specialist", requirement: "Achieve 100% EXP on 25 different weapons", statKey: "personalstats.weapons_mastered", threshold: 25, category: "honors-weapons-list", type: "count" }, // Placeholder, needs /user/weapon_exp selection
    { name: "Riddled", requirement: "Defeat an opponent after hitting at least 10 different body parts in a single attack", statKey: "personalstats.distinct_body_hits", threshold: 1, category: "honors-weapons-list", type: "count" }, // Placeholder, needs log or specific stat
    { name: "War Machine", requirement: "Achieve 1,000 finishing hits in every category", statKey: "personalstats.all_finishing_hits", threshold: 1000, category: "honors-weapons-list", type: "count" }, // Placeholder, needs complex check
    { name: "Surplus", requirement: "Use 100 rounds of special ammunition", statKey: "personalstats.specialammoused", threshold: 100, category: "honors-weapons-list", type: "count" },
    { name: "Bandolier", requirement: "User 1,000 rounds of special ammunition", statKey: "personalstats.specialammoused", threshold: 1000, category: "honors-weapons-list", type: "count" },
    { name: "Quartermaster", requirement: "Use 10,000 rounds of special ammunition", statKey: "personalstats.specialammoused", threshold: 10000, category: "honors-weapons-list", type: "count" },
    { name: "Maimed", requirement: "Use 2,500 Hollow Point rounds", statKey: "personalstats.hollowammoused", threshold: 2500, category: "honors-weapons-list", type: "count" },
    { name: "Dragon's Breath", requirement: "Use a 12 Gauge Incendiary round", statKey: "personalstats.incendiaryammoused", threshold: 1, category: "honors-weapons-list", type: "count" },
    { name: "Marked", requirement: "Use 2,500 Tracer rounds", statKey: "personalstats.tracerammoused", threshold: 2500, category: "honors-weapons-list", type: "count" },
    { name: "Scorched", requirement: "Use 2,500 Incendiary rounds", statKey: "personalstats.incendiaryammoused", threshold: 2500, category: "honors-weapons-list", type: "count" },
    { name: "Penetrated", requirement: "Use 2,500 Piercing rounds", statKey: "personalstats.piercingammoused", threshold: 2500, category: "honors-weapons-list", type: "count" },
    { name: "Mod Boss", requirement: "Own at least 20 weapon mods", statKey: "personalstats.weapon_mods_owned", threshold: 20, category: "honors-weapons-list", type: "count" }, // Placeholder
    { name: "Gone Fishing", requirement: "Be defeated by a Trout", statKey: "personalstats.defeated_by_trout", threshold: 1, category: "honors-weapons-list", type: "count" }, // Placeholder

    // --- Attacking / General Honors ---
    { name: "Kill Streaker 1", requirement: "Achieve a 10 kill streak", statKey: "personalstats.killstreak", threshold: 10, category: "honors-attacking-list", type: "count" },
    { name: "Kill Streaker 2", requirement: "Achieve a 100 kill streak", statKey: "personalstats.killstreak", threshold: 100, category: "honors-attacking-list", type: "count" },
    { name: "Kill Streaker 3", requirement: "Achieve a 500 kill streak", statKey: "personalstats.killstreak", threshold: 500, category: "honors-attacking-list", type: "count" },
    { name: "Wham!", requirement: "Deal over 100,000 total damage", statKey: "personalstats.attackdamage", threshold: 100000, category: "honors-attacking-list", type: "count" },
    { name: "Flatline", requirement: "Achieve a one hit kill", statKey: "personalstats.onehitkills", threshold: 1, category: "honors-attacking-list", type: "count" },
    { name: "Sidekick", requirement: "Assist in 250 attacks", statKey: "personalstats.attacksassisted", threshold: 250, category: "honors-attacking-list", type: "count" },
    { name: "Precision", requirement: "Achieve 25 critical hits", statKey: "personalstats.attackcriticalhits", threshold: 25, category: "honors-attacking-list", type: "count" },
    { name: "50cal", requirement: "Achieve 1,000 Critical Hits", statKey: "personalstats.attackcriticalhits", threshold: 1000, category: "honors-attacking-list", type: "count" },
    { name: "Domino Effect", requirement: "Beat someone wearing this honor", statKey: "personalstats.domino_effect_wins", threshold: 1, category: "honors-attacking-list", type: "count" },
    { name: "Bounty Hunter", requirement: "Collect 250 bounties", statKey: "personalstats.bountiescollected", threshold: 250, category: "honors-attacking-list", type: "count" },
    { name: "Dead Or Alive", requirement: "Earn $10,000,000 from bounty hunting", statKey: "personalstats.totalbountyreward", threshold: 10000000, category: "honors-attacking-list", type: "count" },
    { name: "Spray And Pray", requirement: "Fire 1,000 rounds", statKey: "personalstats.roundsfired", threshold: 1000, category: "honors-attacking-list", type: "count" },
    { name: "Two Halves Make A Hole", requirement: "Fire 10,000 rounds", statKey: "personalstats.roundsfired", threshold: 10000, category: "honors-attacking-list", type: "count" },
    { name: "Blood Money", requirement: "Make $1,000,000 from a single mugging", statKey: "personalstats.largestmug", threshold: 1000000, category: "honors-attacking-list", type: "count" },
    { name: "Deadlock", requirement: "Stalemate 100 times", statKey: "personalstats.defendsstalemated", threshold: 100, category: "honors-attacking-list", type: "count" },
    { name: "Boom!", requirement: "Deal over 10,000,000 total damage", statKey: "personalstats.attackdamage", threshold: 10000000, category: "honors-attacking-list", type: "count" },
    { name: "Yoink", requirement: "Successfully mug someone who just mugged someone else", statKey: "personalstats.yoink_mugs", threshold: 1, category: "honors-attacking-list", type: "count" },
    { name: "007", requirement: "Win 1,000 attacks and 1,000 defends", statKey: "personalstats.attackswon", threshold: 1000, category: "honors-attacking-list", type: "count_complex", checkAlso: "personalstats.defendswon", thresholdAlso: 1000 },
    { name: "Self Defense", requirement: "Win 50 Defends", statKey: "personalstats.defendswon", threshold: 50, category: "honors-attacking-list", type: "count" },
    { name: "Night Walker", requirement: "Win 100 stealthed attacks", statKey: "personalstats.attacksstealthed", threshold: 100, category: "honors-attacking-list", type: "count" },
    { name: "Guardian Angel", requirement: "Defeat someone while they are attacking someone else", statKey: "personalstats.guardian_angel_wins", threshold: 1, category: "honors-attacking-list", type: "count" },
    { name: "Semper Fortis", requirement: "Defeat someone who has more battle stats than you in a solo attack", statKey: "personalstats.semper_fortis_wins", threshold: 1, category: "honors-attacking-list", type: "count" },
    { name: "Manu Forti", requirement: "Defeat someone who has at least double your battle stats in a solo attack", statKey: "personalstats.manu_forti_wins", threshold: 1, category: "honors-attacking-list", type: "count" },
    { name: "Vae Victis", requirement: "Defeat someone who has five times more battlestats than you in a solo attack", statKey: "personalstats.vae_victis_wins", threshold: 1, category: "honors-attacking-list", type: "count" },
    { name: "Survivalist", requirement: "Win an attack with only 1% life remaining", statKey: "personalstats.survivalist_wins", threshold: 1, category: "honors-attacking-list", type: "count" },
    { name: "Bam!", requirement: "Deal over 1,000,000 total damage", statKey: "personalstats.attackdamage", threshold: 1000000, category: "honors-attacking-list", type: "count" },
    { name: "Double Dragon", requirement: "Assist in a single attack", statKey: "personalstats.double_dragon_assists", threshold: 1, category: "honors-attacking-list", type: "count" },
    { name: "Pressure Point", requirement: "Achieve 100 One Hit kills", statKey: "personalstats.onehitkills", threshold: 100, category: "honors-attacking-list", type: "count" },
    { name: "Fury", requirement: "Achieve 10,000 hits.", statKey: "personalstats.attackhits", threshold: 10000, category: "honors-attacking-list", type: "count" },
    { name: "Boss Fight", requirement: "Participate in the defeat of Lootable NPC's.", statKey: "personalstats.npc_defeats", threshold: 1, category: "honors-attacking-list", type: "count" },
    { name: "1337", requirement: "Deal exactly 1,337 damage to an opponent in a single hit", statKey: "personalstats.exact_1337_damage", threshold: 1, category: "honors-attacking-list", type: "count" },
    { name: "Going Postal", requirement: "Defeat a company co-worker", statKey: "personalstats.company_coworker_defeats", threshold: 1, category: "honors-attacking-list", type: "count" },
    { name: "Friendly Fire", requirement: "Defeat a fellow faction member", statKey: "personalstats.friendly_fire_defeats", threshold: 1, category: "honors-attacking-list", type: "count" },
    { name: "Church Mouse", requirement: "Be mugged for $1", statKey: "personalstats.mugged_for_1", threshold: 1, category: "honors-attacking-list", type: "count" },
    { name: "Phoenix", requirement: "Defeat someone after losing to them within 10 minutes", statKey: "personalstats.phoenix_wins", threshold: 1, category: "honors-attacking-list", type: "count" },
    { name: "Devastation", requirement: "Deal at least 5,000 damage in a single hit", statKey: "personalstats.bestdamage", threshold: 5000, category: "honors-attacking-list", type: "count" },
    { name: "Obliteration", requirement: "Deal at least 10,000 damage in a single hit", statKey: "personalstats.bestdamage", threshold: 10000, category: "honors-attacking-list", type: "count" },
    { name: "Annihilation", requirement: "Deal at least 15,000 damage in a single hit", statKey: "personalstats.bestdamage", threshold: 15000, category: "honors-attacking-list", type: "count" },
    { name: "Kapow!", requirement: "Deal over 100,000,000 total damage", statKey: "personalstats.attackdamage", threshold: 100000000, category: "honors-attacking-list", type: "count" },
    { name: "Giant Slayer", requirement: "Receive loot from a defeated NPC", statKey: "personalstats.giant_slayer_loots", threshold: 1, category: "honors-attacking-list", type: "count" },
    { name: "Bare", requirement: "Win 250 unarmored attacks or defends", statKey: "personalstats.unarmoredwon", threshold: 250, category: "honors-attacking-list", type: "count" },
    { name: "Vengeance", requirement: "Successfully perform a faction retaliation hit", statKey: "personalstats.retals", threshold: 1, category: "honors-attacking-list", type: "count" },
    { name: "Invictus", requirement: "Successfully defend against someone who has at least double your battle stats", statKey: "personalstats.invictus_defends", threshold: 1, category: "honors-attacking-list", type: "count" },
    { name: "Lead Salad", requirement: "Fire 100,000 rounds", statKey: "personalstats.roundsfired", threshold: 100000, category: "honors-attacking-list", type: "count" },
    { name: "Peppered", requirement: "Fire 1,000,000 rounds", statKey: "personalstats.roundsfired", threshold: 1000000, category: "honors-attacking-list", type: "count" },
    { name: "Finale", requirement: "Defeat someone on the 25th turn of an attack", statKey: "personalstats.finale_wins", threshold: 1, category: "honors-attacking-list", type: "count" },
    { name: "Deadly Duo", requirement: "Defeat someone with your spouse", statKey: "personalstats.deadly_duo_wins", threshold: 1, category: "honors-attacking-list", type: "count" },
    { name: "Lovestruck", requirement: "Defeat a married couple", statKey: "personalstats.lovestruck_wins", threshold: 1, category: "honors-attacking-list", type: "count" },
    { name: "Hands Solo", requirement: "Defeat someone using only your fists on May 4th", statKey: "personalstats.hands_solo_wins", threshold: 1, category: "honors-attacking-list", type: "count" },
    { name: "Triple Tap", requirement: "Achieve three headshots in a row", statKey: "personalstats.triple_tap", threshold: 1, category: "honors-attacking-list", type: "count" },

    // --- Miscellaneous Honors (Assigned to miscAwardsList) ---
    // Defaults (Likely not trackable directly for individual player, usually for display)
    { name: "Standard Bar", requirement: "Default", statKey: "player_id", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "Philistine", requirement: "In memory of our dear friend Philistine", statKey: "player_id", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "Biccy", requirement: "In memory of our dear friend Biccy", statKey: "player_id", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "787thWarDog", requirement: "In memory of our dear friend 787thWarDog", statKey: "player_id", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "Various Country Flags", requirement: "Various", statKey: "player_id", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "Various Non-Country Flags", requirement: "Default", statKey: "player_id", threshold: 1, category: "misc-awards-list", type: "boolean" },

    // Camo
    { name: "Woodland Camo", requirement: "5 Attacks Won", statKey: "personalstats.attackswon", threshold: 5, category: "misc-awards-list", type: "count" },
    { name: "Desert Storm Camo", requirement: "20 Attacks Won", statKey: "personalstats.attackswon", threshold: 20, category: "misc-awards-list", type: "count" },
    { name: "Urban Camo", requirement: "50 Attacks Won", statKey: "personalstats.attackswon", threshold: 50, category: "misc-awards-list", type: "count" },
    { name: "Arctic Camo", requirement: "100 Attacks Won", statKey: "personalstats.attackswon", threshold: 100, category: "misc-awards-list", type: "count" },
    { name: "Fall Camo", requirement: "250 Attacks Won", statKey: "personalstats.attackswon", threshold: 250, category: "misc-awards-list", type: "count" },
    { name: "Yellow Camo", requirement: "500 Attacks Won", statKey: "personalstats.attackswon", threshold: 500, category: "misc-awards-list", type: "count" },
    { name: "Digital Camo", requirement: "1,000 Attacks Won", statKey: "personalstats.attackswon", threshold: 1000, category: "misc-awards-list", type: "count" },
    { name: "Red Camo", requirement: "2,000 Attacks Won", statKey: "personalstats.attackswon", threshold: 2000, category: "misc-awards-list", type: "count" },
    { name: "Blue Camo", requirement: "3,000 Attacks Won", statKey: "personalstats.attackswon", threshold: 3000, category: "misc-awards-list", type: "count" },
    { name: "Orange Camo", requirement: "4,000 Attacks Won", statKey: "personalstats.attackswon", threshold: 4000, category: "misc-awards-list", type: "count" },
    { name: "Pink Camo", requirement: "5,000 Attacks Won", statKey: "personalstats.attackswon", threshold: 5000, category: "misc-awards-list", type: "count" },
    { name: "Zebra Skin", requirement: "50 Hunting Skill", statKey: "personalstats.huntingskill", threshold: 50, category: "misc-awards-list", type: "count" },
    { name: "Leopard Skin", requirement: "75 Hunting Skill", statKey: "personalstats.huntingskill", threshold: 75, category: "misc-awards-list", type: "count" },
    { name: "Tiger Skin", requirement: "100 Hunting Skill", statKey: "personalstats.huntingskill", threshold: 100, category: "misc-awards-list", type: "count" },

    // Casino
    { name: "Lucky Break", requirement: "Win the daily, weekly or monthly Lottery jackpot", statKey: "personalstats.lottery_jackpot_wins", threshold: 1, category: "misc-awards-list", type: "count" },
    { name: "Jackpot", requirement: "Win the Slot Machine jackpot", statKey: "personalstats.slot_jackpot_wins", threshold: 1, category: "misc-awards-list", type: "count" },
    { name: "Poker King", requirement: "Reach a Poker score of 10 million", statKey: "personalstats.poker_score", threshold: 10000000, category: "misc-awards-list", type: "count" },
    { name: "Spinner", requirement: "Do 1,000 spins of the Roulette wheel", statKey: "personalstats.roulettewheelspins", threshold: 1000, category: "misc-awards-list", type: "count" },
    { name: "Highs And Lows", requirement: "Achieve a win streak of 25 in High-Low", statKey: "personalstats.highlowwins", threshold: 25, category: "misc-awards-list", type: "count" },
    { name: "One In Six", requirement: "Win 50 games of Foot Russian Roulette", statKey: "personalstats.roulettefootwins", threshold: 50, category: "misc-awards-list", type: "count" },
    { name: "Daddy's New Shoes", requirement: "Win $100,000,000 in a single game of Russian Roulette", statKey: "personalstats.roulettefoot_max_win", threshold: 100000000, category: "misc-awards-list", type: "count" },
    { name: "Foot Soldier", requirement: "Beat 10 unique opponents in Russian Roulette", statKey: "personalstats.roulettefoot_unique_opponents", threshold: 10, category: "misc-awards-list", type: "count" },
    { name: "Twenty-One", requirement: "Win a Natural, Six Card Charlie, Double Down and Insurance on Blackjack", statKey: "personalstats.blackjack_wins", threshold: 4, category: "misc-awards-list", type: "count" },
    { name: "Awesome", requirement: "Win while spinning the Wheel of Awesome", statKey: "personalstats.wheel_of_awesome_wins", threshold: 1, category: "misc-awards-list", type: "count" },
    { name: "Mediocre", requirement: "Win while spinning the Wheel of Mediocrity", statKey: "personalstats.wheel_of_mediocrity_wins", threshold: 1, category: "misc-awards-list", type: "count" },
    { name: "Lame", requirement: "Win while spinning the Wheel of Lame", statKey: "personalstats.wheel_of_lame_wins", threshold: 1, category: "misc-awards-list", type: "count" },

    // Dirty Bombs
    { name: "Discovery", requirement: "Be in a faction which starts making a dirty bomb", statKey: "personalstats.dirtybomb_participated", threshold: 1, category: "misc-awards-list", type: "count" },
    { name: "RDD", requirement: "Use a dirty bomb", statKey: "personalstats.dirtybomb_used", threshold: 1, category: "misc-awards-list", type: "count" },
    { name: "Slow Bomb", requirement: "Use a dirty bomb", statKey: "personalstats.dirtybomb_used", threshold: 1, category: "misc-awards-list", type: "count" },

    // Drugs
    { name: "Spaced Out", requirement: "Overdose on Cannabis", statKey: "personalstats.overdosed", threshold: 1, category: "misc-awards-list", type: "count" },
    { name: "Who's Frank?", requirement: "Use 50 Cannabis", statKey: "personalstats.cantaken", threshold: 50, category: "misc-awards-list", type: "count" },
    { name: "I Think I See Dead People", requirement: "Use 50 Shrooms", statKey: "personalstats.shrtaken", threshold: 50, category: "misc-awards-list", type: "count" },
    { name: "Party Animal", requirement: "Use 50 Ecstasy", statKey: "personalstats.exttaken", threshold: 50, category: "misc-awards-list", type: "count" },
    { name: "Acid Dream", requirement: "Use 50 LSD", statKey: "personalstats.lsdtaken", threshold: 50, category: "misc-awards-list", type: "count" },
    { name: "Painkiller", requirement: "Use 50 Vicodin", statKey: "personalstats.victaken", threshold: 50, category: "misc-awards-list", type: "count" },
    { name: "Horse Tranquilizer", requirement: "Use 50 Ketamine", statKey: "personalstats.kettaken", threshold: 50, category: "misc-awards-list", type: "count" },
    { name: "The Fields Of Opium", requirement: "Use 50 Opium", statKey: "personalstats.opitaken", threshold: 50, category: "misc-awards-list", type: "count" },
    { name: "Crank It Up", requirement: "Use 50 Speed", statKey: "personalstats.spetaken", threshold: 50, category: "misc-awards-list", type: "count" },
    { name: "Angel Dust", requirement: "Use 50 PCP", statKey: "personalstats.pcptaken", threshold: 50, category: "misc-awards-list", type: "count" },
    { name: "Free Energy", requirement: "Use 50 Xanax", statKey: "personalstats.xantaken", threshold: 50, category: "misc-awards-list", type: "count" },

    // Education (Requires /user/education selection or specific job stats)
    { name: "Biology Bachelor", requirement: "Complete all Biology courses", statKey: "personalstats.education_biology", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "Business Bachelor", requirement: "Complete all Business Management courses", statKey: "personalstats.education_business", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "Combat Bachelor", requirement: "Complete all Combat Training courses", statKey: "personalstats.education_combat", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "ICT Bachelor", requirement: "Complete all Computer Science courses", statKey: "personalstats.education_ict", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "General Bachelor", requirement: "Complete all General Studies courses", statKey: "personalstats.education_general", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "Fitness Bachelor", requirement: "Complete all Health & Fitness courses", statKey: "personalstats.education_fitness", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "History Bachelor", requirement: "Complete all History courses", statKey: "personalstats.education_history", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "Law Bachelor", requirement: "Complete all Law courses", statKey: "personalstats.education_law", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "Mathematics Bachelor", requirement: "Complete all Maths courses", statKey: "personalstats.education_maths", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "Psychology Bachelor", requirement: "Complete all Psychology courses", statKey: "personalstats.education_psychology", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "Defense Bachelor", requirement: "Complete all Self Defence courses", statKey: "personalstats.education_defense", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "Sports Bachelor", requirement: "Complete all Sports Science courses", statKey: "personalstats.education_sports", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "Tough", requirement: "Attain 100,000 manual labour", statKey: "personalstats.manuallabor", threshold: 100000, category: "misc-awards-list", type: "count" },
    { name: "Talented", requirement: "Attain 100,000 intelligence", statKey: "personalstats.intelligence", threshold: 100000, category: "misc-awards-list", type: "count" },
    { name: "Tireless", requirement: "Attain 100,000 endurance", statKey: "personalstats.endurance", threshold: 100000, category: "misc-awards-list", type: "count" },
    { name: "Smart Alec", requirement: "Complete 10 Education courses", statKey: "personalstats.courses_completed", threshold: 10, category: "misc-awards-list", type: "count" },
    { name: "Clever Dick", requirement: "Complete 25 Education courses", statKey: "personalstats.courses_completed", threshold: 25, category: "misc-awards-list", type: "count" },
    { name: "Wise Guy", requirement: "Complete 50 Education courses", statKey: "personalstats.courses_completed", threshold: 50, category: "misc-awards-list", type: "count" },
    { name: "Whiz Kid", requirement: "Complete 100 Education courses", statKey: "personalstats.courses_completed", threshold: 100, category: "misc-awards-list", type: "count" },
    { name: "Worker Bee", requirement: "Achieve 10,000 in any working stat", statKey: "personalstats.totalworkingstats", threshold: 10000, category: "misc-awards-list", type: "count" },

    // Gyms & Stats (Gyms are complex, may need separate endpoint/logic)
    { name: "Bronze Belt", requirement: "Own all lightweight gym memberships", statKey: "personalstats.gym_memberships.lightweight", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "Silver Belt", requirement: "Own all middleweight gym memberships", statKey: "personalstats.gym_memberships.middleweight", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "Gold Belt", requirement: "Own all heavyweight gym memberships", statKey: "personalstats.gym_memberships.heavyweight", threshold: 1, category: "misc-awards-list", type: "boolean" },

    // Gyms & Stats (Stats - Total Stats are in Medals already. These are about gaining specific amounts.)
    { name: "Abaddon", requirement: "Gain 1,000,000 Strength", statKey: "personalstats.strength", threshold: 1000000, category: "misc-awards-list", type: "count" },
    { name: "Behemoth", requirement: "Gain 1,000,000 Defense", statKey: "personalstats.defense", threshold: 1000000, category: "misc-awards-list", type: "count" },
    { name: "Draco", requirement: "Gain 1,000,000 Dexterity", statKey: "personalstats.dexterity", threshold: 1000000, category: "misc-awards-list", type: "count" },
    { name: "Supersonic", requirement: "Gain 1,000,000 Speed", statKey: "personalstats.speed", threshold: 1000000, category: "misc-awards-list", type: "count" },
    { name: "Powerhouse", requirement: "Gain 10,000,000 Strength", statKey: "personalstats.strength", threshold: 10000000, category: "misc-awards-list", type: "count" },
    { name: "Turbocharged", requirement: "Gain 10,000,000 Speed", statKey: "personalstats.speed", threshold: 10000000, category: "misc-awards-list", type: "count" },
    { name: "Freerunner", requirement: "Gain 10,000,000 Dexterity", statKey: "personalstats.dexterity", threshold: 10000000, category: "misc-awards-list", type: "count" },
    { name: "Reinforced", requirement: "Gain 10,000,000 Defense", statKey: "personalstats.defense", threshold: 10000000, category: "misc-awards-list", type: "count" },
    { name: "Mighty Roar", requirement: "Gain 100,000,000 Strength", statKey: "personalstats.strength", threshold: 100000000, category: "misc-awards-list", type: "count" },
    { name: "Lightspeed", requirement: "Gain 100,000,000 Speed", statKey: "personalstats.speed", threshold: 100000000, category: "misc-awards-list", type: "count" },
    { name: "Bulletproof", requirement: "Gain 100,000,000 Defense", statKey: "personalstats.defense", threshold: 100000000, category: "misc-awards-list", type: "count" },
    { name: "Alpinist", requirement: "Gain 100,000,000 Dexterity", statKey: "personalstats.dexterity", threshold: 100000000, category: "misc-awards-list", type: "count" },
    { name: "Well Built", requirement: "Gain 1,000,000,000 Strength", statKey: "personalstats.strength", threshold: 1000000000, category: "misc-awards-list", type: "count" },
    { name: "Arrowshot", requirement: "Gain 1,000,000,000 Speed", statKey: "personalstats.speed", threshold: 1000000000, category: "misc-awards-list", type: "count" },
    { name: "Funambulist", requirement: "Gain 1,000,000,000 Dexterity", statKey: "personalstats.dexterity", threshold: 1000000000, category: "misc-awards-list", type: "count" },
    { name: "Shielded", requirement: "Gain 1,000,000,000 Defense", statKey: "personalstats.defense", threshold: 1000000000, category: "misc-awards-list", type: "count" },

    // Money & Trading - Banking
    { name: "Pocket Money", requirement: "Make an investment in the city bank", statKey: "personalstats.bank_investments", threshold: 1, category: "misc-awards-list", type: "count" },
    { name: "Green Green Grass", requirement: "Make an investment in the city bank of over $1,000,000,000", statKey: "personalstats.bank_investments", threshold: 1000000000, category: "misc-awards-list", type: "count" },

    // Money & Trading - Stock Market
    { name: "Moneybags", requirement: "Invest $100,000,000 in the stock market", statKey: "personalstats.moneyinvested", threshold: 100000000, category: "misc-awards-list", type: "count" },
    { name: "Stock Analyst", requirement: "Achieve excellent success in the stock market", statKey: "personalstats.stocknetprofits", threshold: 1, category: "misc-awards-list", type: "count" },
    { name: "Dividend", requirement: "Receive 100 stock payouts", statKey: "personalstats.stockpayouts", threshold: 100, category: "misc-awards-list", type: "count" },
    { name: "Monopoly", requirement: "Own every stock benefit at the same time", statKey: "personalstats.stock_monopoly", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "City Slicker", requirement: "Make a profit of $10,000,000 in a single Stock Market sale", statKey: "personalstats.stockprofits", threshold: 10000000, category: "misc-awards-list", type: "count" },
    { name: "Tendies", requirement: "Make a profit of $100,000,000 in a single Stock Market sale", statKey: "personalstats.stockprofits", threshold: 100000000, category: "misc-awards-list", type: "count" },
    { name: "Stonks", requirement: "Make a loss of $100,000,000 in a single Stock Market sale", statKey: "personalstats.stocklosses", threshold: 100000000, category: "misc-awards-list", type: "count" },
    { name: "Bullish", requirement: "Achieve $1,000,000,000 in total profits in the Stock Market", statKey: "personalstats.stocknetprofits", threshold: 1000000000, category: "misc-awards-list", type: "count" },
    { name: "Bearish", requirement: "Achieve $1,000,000,000 in total losses in the Stock Market", statKey: "personalstats.stocklosses", threshold: 1000000000, category: "misc-awards-list", type: "count" },
    { name: "Diamond Hands", requirement: "Make a profit of $1,000,000,000 in a single Stock Market sale", statKey: "personalstats.stockprofits", threshold: 1000000000, category: "misc-awards-list", type: "count" },

    // Money & Trading - Loan Shark
    { name: "Loan Shark", requirement: "Achieve a high credit score with Duke the Loan Shark.", statKey: "personalstats.duke_credit_score", threshold: 1, category: "misc-awards-list", type: "count" },

    // Money & Trading - Trading
    { name: "Wholesaler", requirement: "Sell 1,000 points in Points Market", statKey: "personalstats.pointssold", threshold: 1000, category: "misc-awards-list", type: "count" },

    // Church
    { name: "Pious", requirement: "Donate a total of $100,000 to the church", statKey: "personalstats.churchdonated", threshold: 100000, category: "misc-awards-list", type: "count" },
    { name: "Saintly", requirement: "Donate a total of $1,000,000 to the church", statKey: "personalstats.churchdonated", threshold: 1000000, category: "misc-awards-list", type: "count" },
    { name: "Forgiven", requirement: "Be truly forgiven for all of your sins", statKey: "personalstats.forgiven_sins", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "Devout", requirement: "Donate a total of $100,000,000 to the church", statKey: "personalstats.churchdonated", threshold: 100000000, category: "misc-awards-list", type: "count" },
    { name: "Sacrificial", requirement: "Donate $1,000,000,000 to the church", statKey: "personalstats.churchdonated", threshold: 1000000000, category: "misc-awards-list", type: "count" },

    // Jail & Hospital - Jail
    { name: "Repeat Offender", requirement: "Go to jail 250 times", statKey: "personalstats.jailed", threshold: 250, category: "misc-awards-list", type: "count" },
    { name: "Bar Breaker", requirement: "Bust 1,000 players out of jail", statKey: "personalstats.peoplebusted", threshold: 1000, category: "misc-awards-list", type: "count" },
    { name: "Aiding And Abetting", requirement: "Bust 2,500 players out of jail", statKey: "personalstats.peoplebusted", threshold: 2500, category: "misc-awards-list", type: "count" },
    { name: "Don't Drop It", requirement: "Bust 10,000 players out of jail", statKey: "personalstats.peoplebusted", threshold: 10000, category: "misc-awards-list", type: "count" },
    { name: "Freedom Isn't Free", requirement: "Bail 500 players out of jail", statKey: "personalstats.bails_given", threshold: 500, category: "misc-awards-list", type: "count" },

    // Jail & Hospital - Hospital
    { name: "Booboo", requirement: "Go to hospital 250 times", statKey: "personalstats.hospital", threshold: 250, category: "misc-awards-list", type: "count" },
    { name: "Magical Veins", requirement: "Use 5,000 medical items", statKey: "personalstats.medicalitemsused", threshold: 5000, category: "misc-awards-list", type: "count" },
    { name: "Florence Nightingale", requirement: "Revive 500 players", statKey: "personalstats.revives", threshold: 500, category: "misc-awards-list", type: "count" },
    { name: "Second Chance", requirement: "Revive 1,000 players", statKey: "personalstats.revives", threshold: 1000, category: "misc-awards-list", type: "count" },
    { name: "Vampire", requirement: "Random chance upon using a blood bag", statKey: "personalstats.vampire_blood_bags", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "Clotted", requirement: "Hospitalize yourself by using the wrong blood bag or drinking some Ipecac Syrup.", statKey: "personalstats.self_hospitalized_wrong_blood_bag", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "Transfusion", requirement: "Fill 250 blood bags", statKey: "personalstats.blood_bags_filled", threshold: 250, category: "misc-awards-list", type: "count" },
    { name: "Anaemic", requirement: "Fill 1,000 blood bags", statKey: "personalstats.blood_bags_filled", threshold: 1000, category: "misc-awards-list", type: "count" },
    { name: "Miracle Worker", requirement: "Revive 10 people in 10 minutes", statKey: "personalstats.miracle_worker_revives", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "Resurrection", requirement: "Revive someone you've just defeated", statKey: "personalstats.resurrection_revives", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "Crucifixion", requirement: "Defeat someone you've just revived", statKey: "personalstats.crucifixion_defeats", threshold: 1, category: "misc-awards-list", type: "boolean" },

    // Commitment (Leveling and Age are better as Medals; Forgiven is Church-related)
    { name: "Welcome", requirement: "Be online everyday for 100 days", statKey: "personalstats.activestreak", threshold: 100, category: "misc-awards-list", type: "count" },
    { name: "Couch Potato", requirement: "Reach 1,000 hours of Time Played on Torn", statKey: "personalstats.useractivity", threshold: 3600000, category: "misc-awards-list", type: "count" }, // Convert hours to seconds
    { name: "Fascination", requirement: "Stay married for 250 days", statKey: "personalstats.spousetime", threshold: 21600000, category: "misc-awards-list", type: "count_time_convert" }, // 250 days in seconds
    { name: "Chasm", requirement: "Stay married for 750 days", statKey: "personalstats.spousetime", threshold: 64800000, category: "misc-awards-list", type: "count_time_convert" },
    { name: "Stairway To Heaven", requirement: "Stay married for 1,500 days", statKey: "personalstats.spousetime", threshold: 129600000, category: "misc-awards-list", type: "count_time_convert" },
    { name: "Forgiven (Commitment)", requirement: "Be truly forgiven for all of your sins", statKey: "personalstats.forgiven_sins", threshold: 1, category: "misc-awards-list", type: "boolean" }, // Also under Church

    // Items
    { name: "Alcoholic", requirement: "Drink 500 bottles of alcohol", statKey: "personalstats.alcoholused", threshold: 500, category: "misc-awards-list", type: "count" },
    { name: "Sodaholic", requirement: "Drink 500 cans of energy drinks", statKey: "personalstats.energydrinkused", threshold: 500, category: "misc-awards-list", type: "count" },
    { name: "Diabetic", requirement: "Eat 500 bags of candy", statKey: "personalstats.candyused", threshold: 500, category: "misc-awards-list", type: "count" },
    { name: "Optimist", requirement: "Find 1,000 items in dump", statKey: "personalstats.dumpfinds", threshold: 1000, category: "misc-awards-list", type: "count" },
    { name: "Lavish", requirement: "Dump an item with a current market value of at least $1,000,000", statKey: "personalstats.items_dumped_value", threshold: 1000000, category: "misc-awards-list", type: "count" },
    { name: "Bibliophile", requirement: "Read 10 books", statKey: "personalstats.booksread", threshold: 10, category: "misc-awards-list", type: "count" },
    { name: "Worth It", requirement: "Use a stat enhancer", statKey: "personalstats.statenhancersused", threshold: 1, category: "misc-awards-list", type: "count" },
    { name: "Eco Friendly", requirement: "Trash 5,000 items", statKey: "personalstats.itemsdumped", threshold: 5000, category: "misc-awards-list", type: "count" },
    { name: "Stinker", requirement: "Successfully prank someone with Stink Bombs", statKey: "personalstats.pranks_stink_bomb", threshold: 1, category: "misc-awards-list", type: "count" },
    { name: "Wipeout", requirement: "Successfully prank someone with Toilet Paper", statKey: "personalstats.pranks_toilet_paper", threshold: 1, category: "misc-awards-list", type: "count" },
    { name: "Bargain Hunter", requirement: "Win 10 auctions", statKey: "personalstats.auctionswon", threshold: 10, category: "misc-awards-list", type: "count" },
    { name: "Foul Play", requirement: "Successfully prank someone with Dog Poop", statKey: "personalstats.pranks_dog_poop", threshold: 1, category: "misc-awards-list", type: "count" },
    { name: "I'm Watching You", requirement: "Find 50 items in the city", statKey: "personalstats.cityfinds", threshold: 50, category: "misc-awards-list", type: "count" },
    { name: "Middleman", requirement: "Have 100 different customers buy from your bazaar", statKey: "personalstats.bazaarcustomers", threshold: 100, category: "misc-awards-list", type: "count" },
    { name: "Collector", requirement: "Maintain an impressive display case of collectible items", statKey: "personalstats.display_case_value", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "Radaway", requirement: "Use a Neumune Tablet to reduce radiation poisoning", statKey: "personalstats.neumune_used", threshold: 1, category: "misc-awards-list", type: "count" },

    // Miscellaneous (Honors)
    { name: "Energize", requirement: "Use 250 Energy Refills", statKey: "personalstats.nerverefills", threshold: 250, category: "misc-awards-list", type: "count" },
    { name: "You've Got Some Nerve", requirement: "Use 250 Nerve Refills", statKey: "personalstats.nerverefills", threshold: 250, category: "misc-awards-list", type: "count" },
    { name: "Compulsive", requirement: "Use 250 Casino Refills", statKey: "personalstats.tokenrefills", threshold: 250, category: "misc-awards-list", type: "count" },
    { name: "Seeker", requirement: "Reach 250 awards (honors and medals)", statKey: "personalstats.awards", threshold: 250, category: "misc-awards-list", type: "count" },
    { name: "Silicon Valley", requirement: "Code 100 viruses", statKey: "personalstats.virusescoded", threshold: 100, category: "misc-awards-list", type: "count" },
    { name: "The Affronted", requirement: "Irritate all job interviewers", statKey: "personalstats.job_interviewers_irritated", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "Energetic", requirement: "Achieve the maximum of 1,000 energy", statKey: "personalstats.energy_maxed", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "Ecstatic", requirement: "Achieve the maximum of 99,999 happiness", statKey: "personalstats.happiness_maxed", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "Christmas in Torn", requirement: "Login on Christmas Day", statKey: "personalstats.christmas_logins", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "Trick or Treat", requirement: "Login on Halloween", statKey: "personalstats.halloween_logins", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "Torniversary", requirement: "Login on November 15th", statKey: "personalstats.torniversary_logins", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "Buffed", requirement: "Achieve 50 personal perks", statKey: "personalstats.perks_obtained", threshold: 50, category: "misc-awards-list", type: "count" },
    { name: "Web of Perks", requirement: "Achieve 100 personal perks", statKey: "personalstats.perks_obtained", threshold: 100, category: "misc-awards-list", type: "count" },
    { name: "OP", requirement: "Achieve 150 personal perks", statKey: "personalstats.perks_obtained", threshold: 150, category: "misc-awards-list", type: "count" },
    { name: "10-stack", requirement: "Increase a merit upgrade to its maximum", statKey: "personalstats.merit_upgrades_maxed", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "Decorated", requirement: "Achieve 100 total awards", statKey: "personalstats.awards", threshold: 100, category: "misc-awards-list", type: "count" },
    { name: "Honored", requirement: "Achieve 500 total awards", statKey: "personalstats.awards", threshold: 500, category: "misc-awards-list", type: "count" },
    { name: "Time Traveller", requirement: "Survive a Torn City rollback", statKey: "personalstats.rollbacks_survived", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "Fresh Start", requirement: "Reset your merits", statKey: "personalstats.merits_reset", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "Tornication", requirement: "Login on Valentine's Day", statKey: "personalstats.valentines_logins", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "Resolution", requirement: "Login on New Year's Day", statKey: "personalstats.new_years_logins", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "Leaderboard", requirement: "Achieve top 250 in one of the personal Hall of Fame leaderboards", statKey: "personalstats.hof_rankings_achieved", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "RNG", requirement: "Who knows?", statKey: "personalstats.rng_award", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "Historian", requirement: "Read a chronicle", statKey: "personalstats.chronicles_read", threshold: 1, category: "misc-awards-list", type: "count" },
    { name: "NiceNiceIntern", requirement: "100 job points used", statKey: "personalstats.jobpointsused", threshold: 100, category: "misc-awards-list", type: "count" },
    { name: "Stuck In a Rut", requirement: "1,000 job points used", statKey: "personalstats.jobpointsused", threshold: 1000, category: "misc-awards-list", type: "count" },
    { name: "Overtime", requirement: "10,000 job points used", statKey: "personalstats.jobpointsused", threshold: 10000, category: "misc-awards-list", type: "count" },

    // Newspaper
    { name: "Journalist", requirement: "Have an article published", statKey: "personalstats.articles_published", threshold: 1, category: "misc-awards-list", type: "count" },
    { name: "Velutinous", requirement: "Have a comic published", statKey: "personalstats.comics_published", threshold: 1, category: "misc-awards-list", type: "count" },

    // Properties
    { name: "Luxury Real Estate", requirement: "Own a Private Island with a Airstrip", statKey: "personalstats.property_id", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "The High Life", requirement: "Own a Private Island with a Yacht", statKey: "personalstats.property_id", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "Landlord", requirement: "Lease one of your properties to someone.", statKey: "personalstats.properties_leased", threshold: 1, category: "misc-awards-list", type: "count" },

    // Missions
    { name: "Protege", requirement: "Complete the mission introduction: Duke", statKey: "personalstats.missionscompleted", threshold: 1, category: "misc-awards-list", type: "count" },
    { name: "Mercenary", requirement: "Complete 1,000 mission contracts", statKey: "personalstats.contractscompleted", threshold: 1000, category: "misc-awards-list", type: "count" },
    { name: "Task Master", requirement: "Earn 10,000 mission credits", statKey: "personalstats.missioncreditsearned", threshold: 10000, category: "misc-awards-list", type: "count" },

    // Racing (Requires /user/races, /user/racingrecords, or other specific selections)
    { name: "Driving Elite", requirement: "Reach Class A", statKey: "personalstats.racing_class", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "Redline", requirement: "250 wins in the same car", statKey: "personalstats.racing_car_wins", threshold: 250, category: "misc-awards-list", type: "count" },
    { name: "Motorhead", requirement: "Achieve a driver skill of 10", statKey: "personalstats.racingskill", threshold: 10, category: "misc-awards-list", type: "count" },
    { name: "Wrecked", requirement: "Crash during a race", statKey: "personalstats.races_crashed", threshold: 1, category: "misc-awards-list", type: "count" },
    { name: "Checkered Past", requirement: "Win 100 races", statKey: "personalstats.raceswon", threshold: 100, category: "misc-awards-list", type: "count" },
    { name: "On Track", requirement: "Earn 2,500 Racing Points", statKey: "personalstats.racingpointsearned", threshold: 2500, category: "misc-awards-list", type: "count" },

    // Recruit Citizens
    { name: "Two's Company", requirement: "Refer 1 player who reaches level 10", statKey: "personalstats.referrals_lvl10", threshold: 1, category: "misc-awards-list", type: "count" },
    { name: "Three's A Crowd", requirement: "Refer 2 players who reach level 10", statKey: "personalstats.referrals_lvl10", threshold: 2, category: "misc-awards-list", type: "count" },
    { name: "Social Butterfly", requirement: "Refer 3 players who reach level 10", statKey: "personalstats.referrals_lvl10", threshold: 3, category: "misc-awards-list", type: "count" },
    { name: "Pyramid Scheme", requirement: "Have one of your referrals refer another player who goes on to reach level 10", statKey: "personalstats.referral_pyramid", threshold: 1, category: "misc-awards-list", type: "boolean" },

    // Competitions, Token Shop & Points Building
    { name: "Allure", requirement: "Make an entry for Mr/Miss Torn", statKey: "personalstats.mrmiss_torn_entries", threshold: 1, category: "misc-awards-list", type: "count" },
    { name: "Good Friday", requirement: "Exchange all eggs for a gold one in the Easter Egg hunt competition", statKey: "personalstats.easter_gold_egg_exchanged", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "KIA", requirement: "Collect 50 dog tags in the Dog Tags competition (must be holding 50 tags at once)", statKey: "personalstats.dog_tags_collected", threshold: 50, category: "misc-awards-list", type: "count" },
    { name: "Departure", requirement: "Collect 250 dog tags in the Dog Tags competition (must be holding 250 tags at once)", statKey: "personalstats.dog_tags_collected", threshold: 250, category: "misc-awards-list", type: "count" },
    { name: "Mission Accomplished", requirement: "Finish the Elimination competition with your team 1st, 2nd or 3rd.", statKey: "personalstats.elimination_team_rank", threshold: 3, category: "misc-awards-list", type: "count_less_equal" },
    { name: "Purple Heart", requirement: "Make 50 attacks against enemy team members in the Elimination competition.", statKey: "personalstats.elimination_attacks", threshold: 50, category: "misc-awards-list", type: "count" },
    { name: "Supremacy", requirement: "Finish the Elimination competition within the top 5% of attacking players in your team.", statKey: "personalstats.elimination_rank_percentile", threshold: 5, category: "misc-awards-list", type: "count_less_equal" },
    { name: "Domination", requirement: "Finish the Elimination competition with your team in 1st place.", statKey: "personalstats.elimination_team_rank", threshold: 1, category: "misc-awards-list", type: "count" },
    { name: "Champion", requirement: "Win a community event", statKey: "personalstats.community_event_wins", threshold: 1, category: "misc-awards-list", type: "count" },
    { name: "Phantastic", requirement: "Upgrade your Halloween Basket to Frightful Trick or Treat", statKey: "personalstats.halloween_basket_upgrades", threshold: 1, category: "misc-awards-list", type: "count" },
    { name: "Something Humerus", requirement: "Upgrade your Halloween Basket to Terrifying Trick or Treat", statKey: "personalstats.halloween_basket_upgrades", threshold: 2, category: "misc-awards-list", type: "count" },
    { name: "Oh My Gourd!", requirement: "Upgrade your Halloween Basket to Nightmarish Trick or Treat", statKey: "personalstats.halloween_basket_upgrades", threshold: 3, category: "misc-awards-list", type: "count" },

    // Token Shop (These are purchases, not directly tied to stats usually)
    { name: "Globule", requirement: "Purchased for 3 tokens from the Token Shop or for 500 points from the Points Building", statKey: "personalstats.tokens_spent", threshold: 3, category: "misc-awards-list", type: "count" },
    { name: "Retro", requirement: "Purchased for 4 tokens from the Token Shop or for 500 points from the Points Building", statKey: "personalstats.tokens_spent", threshold: 4, category: "misc-awards-list", type: "count" },
    { name: "Acute", requirement: "Purchased for 4 tokens from the Token Shop or for 500 points from the Points Building", statKey: "personalstats.tokens_spent", threshold: 4, category: "misc-awards-list", type: "count" },
    { name: "Serenity", requirement: "Purchased for 5 tokens from the Token Shop or for 600 points from the Points Building", statKey: "personalstats.tokens_spent", threshold: 5, category: "misc-awards-list", type: "count" },
    { name: "The Socialist", requirement: "Purchased for 5 tokens from the Token Shop or for 600 points from the Points Building", statKey: "personalstats.tokens_spent", threshold: 5, category: "misc-awards-list", type: "count" },
    { name: "Jack Of All Trades", requirement: "Purchased for 5 tokens from the Token Shop or for 600 points from the Points Building", statKey: "personalstats.tokens_spent", threshold: 5, category: "misc-awards-list", type: "count" },
    { name: "Futurity", requirement: "Purchased for 6 tokens from the Token Shop or for 700 points from the Points Building", statKey: "personalstats.tokens_spent", threshold: 6, category: "misc-awards-list", type: "count" },
    { name: "Constellations", requirement: "Purchased for 7 tokens from the Token Shop or for 700 points from the Points Building", statKey: "personalstats.tokens_spent", threshold: 7, category: "misc-awards-list", type: "count" },
    { name: "Parallel", requirement: "Purchased for 8 tokens from the Token Shop or for 700 points from the Points Building", statKey: "personalstats.tokens_spent", threshold: 8, category: "misc-awards-list", type: "count" },
    { name: "Labyrinth", requirement: "Purchased for 9 tokens from the Token Shop or for 700 points from the Points Building", statKey: "personalstats.tokens_spent", threshold: 9, category: "misc-awards-list", type: "count" },
    { name: "Glimmer", requirement: "Purchased for 10 tokens from the Token Shop or for 800 points from the Points Building", statKey: "personalstats.tokens_spent", threshold: 10, category: "misc-awards-list", type: "count" },
    { name: "Proven Capacity", requirement: "Purchased for 10 tokens from the Token Shop or for 800 points from the Points Building", statKey: "personalstats.tokens_spent", threshold: 10, category: "misc-awards-list", type: "count" },
    { name: "Master Of One", requirement: "Purchased for 10 tokens from the Token Shop or for 800 points from the Points Building", statKey: "personalstats.tokens_spent", threshold: 10, category: "misc-awards-list", type: "count" },
    { name: "Globally Effective", requirement: "Purchased for 10 tokens from the Token Shop or for 800 points from the Points Building", statKey: "personalstats.tokens_spent", threshold: 10, category: "misc-awards-list", type: "count" },
    { name: "Supernova", requirement: "Purchased for 12 tokens from the Token Shop or for 900 points from the Points Building", statKey: "personalstats.tokens_spent", threshold: 12, category: "misc-awards-list", type: "count" },
    { name: "Pepperoni", requirement: "Purchased for 13 tokens from the Token Shop or for 900 points from the Points Building", statKey: "personalstats.tokens_spent", threshold: 13, category: "misc-awards-list", type: "count" },
    { name: "Electric Dream", requirement: "Purchased for 15 tokens from the Token Shop or for 1000 points from the Points Building", statKey: "personalstats.tokens_spent", threshold: 15, category: "misc-awards-list", type: "count" },
    { name: "Resistance", requirement: "Purchased for 15 tokens from the Token Shop or for 1000 points from the Points Building", statKey: "personalstats.tokens_spent", threshold: 15, category: "misc-awards-list", type: "count" },
    { name: "Brainz", requirement: "Purchased for 20 tokens from the Token Shop or for 1300 points from the Points Building", statKey: "personalstats.tokens_spent", threshold: 20, category: "misc-awards-list", type: "count" },
    { name: "Survivor", requirement: "Purchased for 25 tokens from the Token Shop or for 1500 points from the Points Building", statKey: "personalstats.tokens_spent", threshold: 25, category: "misc-awards-list", type: "count" },
    { name: "Backdrop", requirement: "Unlock a backdrop from the Token Shop", statKey: "personalstats.backdrops_unlocked", threshold: 1, category: "misc-awards-list", type: "count" },
    { name: "Hairy", requirement: "Unlock a hairstyle from the Token Shop", statKey: "personalstats.hairstyles_unlocked", threshold: 1, category: "misc-awards-list", type: "count" },

    // Travel (Some covered, many more country-specific)
    { name: "Mile High Club", requirement: "Travel 100 times", statKey: "personalstats.traveltimes", threshold: 100, category: "misc-awards-list", type: "count" },
    { name: "There And Back", requirement: "Travel 1,000 times", statKey: "personalstats.traveltimes", threshold: 1000, category: "misc-awards-list", type: "count" },
    { name: "Cascado", requirement: "Travel to Mexico 50 times", statKey: "personalstats.mextravel", threshold: 50, category: "misc-awards-list", type: "count" },
    { name: "Toronto", requirement: "Travel to Canada 50 times", statKey: "personalstats.cantravel", threshold: 50, category: "misc-awards-list", type: "count" },
    { name: "Shark Bait", requirement: "Travel to Cayman Islands 50 times", statKey: "personalstats.caytravel", threshold: 50, category: "misc-awards-list", type: "count" },
    { name: "Hula", requirement: "Travel to Hawaii 50 times", statKey: "personalstats.hawtravel", threshold: 50, category: "misc-awards-list", type: "count" },
    { name: "British Pride", requirement: "Travel to England 50 times", statKey: "personalstats.lontravel", threshold: 50, category: "misc-awards-list", type: "count" },
    { name: "Like The Celebs", requirement: "Travel to Switzerland 50 times", statKey: "personalstats.switravel", threshold: 50, category: "misc-awards-list", type: "count" },
    { name: "Maradona", requirement: "Travel to Argentina 50 times", statKey: "personalstats.argtravel", threshold: 50, category: "misc-awards-list", type: "count" },
    { name: "The Rising Sun", requirement: "Travel to Japan 50 times", statKey: "personalstats.japtravel", threshold: 50, category: "misc-awards-list", type: "count" },
    { name: "Year Of The Dragon", requirement: "Travel to China 50 times", statKey: "personalstats.chitravel", threshold: 50, category: "misc-awards-list", type: "count" },
    { name: "Land Of Promise", requirement: "Travel to Dubai 50 times", statKey: "personalstats.dubtravel", threshold: 50, category: "misc-awards-list", type: "count" },
    { name: "Cape Town", requirement: "Travel to South Africa 50 times", statKey: "personalstats.soutravel", threshold: 50, category: "misc-awards-list", type: "count" },
    { name: "Tourist", requirement: "Spend 7 days in the air", statKey: "personalstats.traveltime", threshold: 604800, category: "misc-awards-list", type: "count" }, // 7 days in seconds
    { name: "Frequent Flyer (Honor)", requirement: "Spend 31 days in the air", statKey: "personalstats.traveltime", threshold: 2678400, category: "misc-awards-list", type: "count" }, // 31 days in seconds
    { name: "Globetrotter", requirement: "Spend 365 days in the air", statKey: "personalstats.traveltime", threshold: 31536000, category: "misc-awards-list", type: "count" }, // 365 days in seconds
    { name: "Mule", requirement: "Import 100 items from abroad", statKey: "personalstats.itemsboughtabroad", threshold: 100, category: "misc-awards-list", type: "count" },
    { name: "Smuggler", requirement: "Import 1,000 items from abroad", statKey: "personalstats.itemsboughtabroad", threshold: 1000, category: "misc-awards-list", type: "count" },
    { name: "Trafficker", requirement: "Import 10,000 items from abroad", statKey: "personalstats.itemsboughtabroad", threshold: 10000, category: "misc-awards-list", type: "count" },
    { name: "Souvenir", requirement: "Purchase the perfect souvenir abroad", statKey: "personalstats.souvenirs_bought", threshold: 1, category: "misc-awards-list", type: "count" },
    { name: "International", requirement: "Defeat 100 people while abroad", statKey: "personalstats.attackswonabroad", threshold: 100, category: "misc-awards-list", type: "count" },

    // Defaults (Likely not trackable directly for individual player, usually for display)
    { name: "Standard Bar", requirement: "Default", statKey: "player_id", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "Philistine", requirement: "In memory of our dear friend Philistine", statKey: "player_id", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "Biccy", requirement: "In memory of our dear friend Biccy", statKey: "player_id", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "787thWarDog", requirement: "In memory of our dear friend 787thWarDog", statKey: "player_id", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "Various Country Flags", requirement: "Various", statKey: "player_id", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { name: "Various Non-Country Flags", requirement: "Default", statKey: "player_id", threshold: 1, category: "misc-awards-list", type: "boolean" },

    // Historical Notes (Not trackable by API directly for current player)
];

const allMedals = [
    // --- Combat Medals ---
    { name: "Anti Social", requirement: "Win 50 attacks", statKey: "personalstats.attackswon", threshold: 50, category: "medals-combat-list", type: "count" },
    { name: "Happy Slapper", requirement: "Win 250 attacks", statKey: "personalstats.attackswon", threshold: 250, category: "medals-combat-list", type: "count" },
    { name: "Scar Maker", requirement: "Win 500 attacks", statKey: "personalstats.attackswon", threshold: 500, category: "medals-combat-list", type: "count" },
    { name: "Going Postal", requirement: "Win 2,500 attacks", statKey: "personalstats.attackswon", threshold: 2500, category: "medals-combat-list", type: "count" },
    { name: "Somebody Call 911", requirement: "Win 10,000 attacks", statKey: "personalstats.attackswon", threshold: 10000, category: "medals-combat-list", type: "count" },
    { name: "Hired Gun", requirement: "Collect 25 bounties", statKey: "personalstats.bountiescollected", threshold: 25, category: "medals-combat-list", type: "count" },
    { name: "Bone Collector", requirement: "Collect 100 bounties", statKey: "personalstats.bountiescollected", threshold: 100, category: "medals-combat-list", type: "count" },
    { name: "The Fett", requirement: "Collect 500 bounties", statKey: "personalstats.bountiescollected", threshold: 500, category: "medals-combat-list", type: "count" },
    { name: "Boom Headshot", requirement: "Deal 500 critical hits", statKey: "personalstats.attackcriticalhits", threshold: 500, category: "medals-combat-list", type: "count" },
    { name: "Pwned in the face", requirement: "Deal 2,500 critical hits", statKey: "personalstats.attackcriticalhits", threshold: 2500, category: "medals-combat-list", type: "count" },
    { name: "Lee Harvey Oswald", requirement: "Deal 10,000 critical hits", statKey: "personalstats.attackcriticalhits", threshold: 10000, category: "medals-combat-list", type: "count" },
    { name: "Bouncer", requirement: "Win 50 defends", statKey: "personalstats.defendswon", threshold: 50, category: "medals-combat-list", type: "count" },
    { name: "Brick wall", requirement: "Win 250 defends", statKey: "personalstats.defendswon", threshold: 250, category: "medals-combat-list", type: "count" },
    { name: "Turtle", requirement: "Win 500 defends", statKey: "personalstats.defendswon", threshold: 500, category: "medals-combat-list", type: "count" },
    { name: "Solid as a Rock", requirement: "Win 2,500 defends", statKey: "personalstats.defendswon", threshold: 2500, category: "medals-combat-list", type: "count" },
    { name: "Fortress", requirement: "Win 10,000 defends", statKey: "personalstats.defendswon", threshold: 10000, category: "medals-combat-list", type: "count" },
    { name: "Ego Smashing", requirement: "50 enemies Escape from you", statKey: "personalstats.theyrunaway", threshold: 50, category: "medals-combat-list", type: "count" },
    { name: "Underestimated", requirement: "250 enemies Escape from you", statKey: "personalstats.theyrunaway", threshold: 250, category: "medals-combat-list", type: "count" },
    { name: "Run Forrest Run", requirement: "1,000 enemies Escape from you", statKey: "personalstats.theyrunaway", threshold: 1000, category: "medals-combat-list", type: "count" },
    { name: "Strike", requirement: "Win 25 consecutive fights", statKey: "personalstats.bestkillstreak", threshold: 25, category: "medals-combat-list", type: "count" },
    { name: "Barrage", requirement: "Win 50 consecutive fights", statKey: "personalstats.bestkillstreak", threshold: 50, category: "medals-combat-list", type: "count" },
    { name: "Skirmish", requirement: "Win 100 consecutive fights", statKey: "personalstats.bestkillstreak", threshold: 100, category: "medals-combat-list", type: "count" },
    { name: "Blitzkrieg", requirement: "Win 250 consecutive fights", statKey: "personalstats.bestkillstreak", threshold: 250, category: "medals-combat-list", type: "count" },
    { name: "Onslaught", requirement: "Win 500 consecutive fights", statKey: "personalstats.bestkillstreak", threshold: 500, category: "medals-combat-list", type: "count" },
    { name: "Recruit", requirement: "Earn 100 respect", statKey: "personalstats.respectforfaction", threshold: 100, category: "medals-combat-list", type: "count" },
    { name: "Associate", requirement: "Earn 500 respect", statKey: "personalstats.respectforfaction", threshold: 500, category: "medals-combat-list", type: "count" },
    { name: "Picciotto", requirement: "Earn 1,000 respect", statKey: "personalstats.respectforfaction", threshold: 1000, category: "medals-combat-list", type: "count" },
    { name: "Soldier", requirement: "Earn 2,500 respect", statKey: "personalstats.respectforfaction", threshold: 2500, category: "medals-combat-list", type: "count" },
    { name: "Capo", requirement: "Earn 5,000 respect", statKey: "personalstats.respectforfaction", threshold: 5000, category: "medals-combat-list", type: "count" },
    { name: "Contabile", requirement: "Earn 10,000 respect", statKey: "personalstats.respectforfaction", threshold: 10000, category: "medals-combat-list", type: "count" },
    { name: "Consigliere", requirement: "Earn 25,000 respect", statKey: "personalstats.respectforfaction", threshold: 25000, category: "medals-combat-list", type: "count" },
    { name: "Underboss", requirement: "Earn 50,000 respect", statKey: "personalstats.respectforfaction", threshold: 50000, category: "medals-combat-list", type: "count" },
    { name: "Boss", requirement: "Earn 75,000 respect", statKey: "personalstats.respectforfaction", threshold: 75000, category: "medals-combat-list", type: "count" },
    { name: "Boss Of All Bosses", requirement: "Earn 100,000 respect", statKey: "personalstats.respectforfaction", threshold: 100000, category: "medals-combat-list", type: "count" },
    { name: "Close escape", requirement: "Escape from 50 enemies", statKey: "personalstats.yourunaway", threshold: 50, category: "medals-combat-list", type: "count" },
    { name: "Blind Judgement", requirement: "Escape from 250 enemies", statKey: "personalstats.yourunaway", threshold: 250, category: "medals-combat-list", type: "count" },
    { name: "Overzealous", requirement: "Escape from 1,000 enemies", statKey: "personalstats.yourunaway", threshold: 1000, category: "medals-combat-list", type: "count" },

    // --- Level / Commitment Medals ---
    // Commitment
    { name: "Citizenship", requirement: "Be a donator for 30 days", statKey: "personalstats.daysbeendonator", threshold: 30, category: "medals-commitment-list", type: "count" },
    { name: "Devoted", requirement: "Be a donator for 100 days", statKey: "personalstats.daysbeendonator", threshold: 100, category: "medals-commitment-list", type: "count" },
    { name: "Diligent", requirement: "Be a donator for 250 days", statKey: "personalstats.daysbeendonator", threshold: 250, category: "medals-commitment-list", type: "count" },
    { name: "Valiant", requirement: "Be a donator for 500 days", statKey: "personalstats.daysbeendonator", threshold: 500, category: "medals-commitment-list", type: "count" },
    { name: "Patriotic", requirement: "Be a donator for 1,000 days", statKey: "personalstats.daysbeendonator", threshold: 1000, category: "medals-commitment-list", type: "count" },
    { name: "Apprentice Faction Member", requirement: "Same faction for 100 days", statKey: "personalstats.faction_loyalty_days", threshold: 100, category: "medals-commitment-list", type: "count" },
    { name: "Committed Faction Member", requirement: "Same faction for 200 days", statKey: "personalstats.faction_loyalty_days", threshold: 200, category: "medals-commitment-list", type: "count" },
    { name: "Loyal Faction Member", requirement: "Same faction for 300 days", statKey: "personalstats.faction_loyalty_days", threshold: 300, category: "medals-commitment-list", type: "count" },
    { name: "Dedicated Faction Member", requirement: "Same faction for 400 days", statKey: "personalstats.faction_loyalty_days", threshold: 400, category: "medals-commitment-list", type: "count" },
    { name: "Faithful Faction Member", requirement: "Same faction for 500 days", statKey: "personalstats.faction_loyalty_days", threshold: 500, category: "medals-commitment-list", type: "count" },
    { name: "Allegiant Faction Member", requirement: "Same faction for 600 days", statKey: "personalstats.faction_loyalty_days", threshold: 600, category: "medals-commitment-list", type: "count" },
    { name: "Devoted Faction Member", requirement: "Same faction for 700 days", statKey: "personalstats.faction_loyalty_days", threshold: 700, category: "medals-commitment-list", type: "count" },
    { name: "Dutiful Faction Member", requirement: "Same faction for 800 days", statKey: "personalstats.faction_loyalty_days", threshold: 800, category: "medals-commitment-list", type: "count" },
    { name: "Flawless Faction Member", requirement: "Same faction for 900 days", statKey: "personalstats.faction_loyalty_days", threshold: 900, category: "medals-commitment-list", type: "count" },
    { name: "Honorable Faction Member", requirement: "Same faction for 1,000 days", statKey: "personalstats.faction_loyalty_days", threshold: 1000, category: "medals-commitment-list", type: "count" },
    { name: "Silver Anniversary", requirement: "Same spouse for 50 consecutive days", statKey: "personalstats.spousetime", threshold: 4320000, category: "medals-commitment-list", type: "count_time_convert" },
    { name: "Ruby Anniversary", requirement: "Same spouse for 100 consecutive days", statKey: "personalstats.spousetime", threshold: 8640000, category: "medals-commitment-list", type: "count_time_convert" },
    { name: "Sapphire Anniversary", requirement: "Same spouse for 150 consecutive days", statKey: "personalstats.spousetime", threshold: 12960000, category: "medals-commitment-list", type: "count_time_convert" },
    { name: "Emerald Anniversary", requirement: "Same spouse for 200 consecutive days", statKey: "personalstats.spousetime", threshold: 17280000, category: "medals-commitment-list", type: "count_time_convert" },
    { name: "Gold Anniversary", requirement: "Same spouse for 250 consecutive days", statKey: "personalstats.spousetime", threshold: 21600000, category: "medals-commitment-list", type: "count_time_convert" },
    { name: "Diamond Anniversary", requirement: "Same spouse for 300 consecutive days", statKey: "personalstats.spousetime", threshold: 25920000, category: "medals-commitment-list", type: "count_time_convert" },
    { name: "Platinum Anniversary", requirement: "Same spouse for 350 consecutive days", statKey: "personalstats.spousetime", threshold: 30240000, category: "medals-commitment-list", type: "count_time_convert" },
    { name: "Double Silver Anniversary", requirement: "Same spouse for 400 consecutive days", statKey: "personalstats.spousetime", threshold: 34560000, category: "medals-commitment-list", type: "count_time_convert" },
    { name: "Double Ruby Anniversary", requirement: "Same spouse for 450 consecutive days", statKey: "personalstats.spousetime", threshold: 38880000, category: "medals-commitment-list", type: "count_time_convert" },
    { name: "Double Sapphire Anniversary", requirement: "Same spouse for 500 consecutive days", statKey: "personalstats.spousetime", threshold: 43200000, category: "medals-commitment-list", type: "count_time_convert" },
    { name: "Double Emerald Anniversary", requirement: "Same spouse for 550 consecutive days", statKey: "personalstats.spousetime", threshold: 47520000, category: "medals-commitment-list", type: "count_time_convert" },
    { name: "Double Gold Anniversary", requirement: "Same spouse for 600 consecutive days", statKey: "personalstats.spousetime", threshold: 51840000, category: "medals-commitment-list", type: "count_time_convert" },
    { name: "Double Diamond Anniversary", requirement: "Same spouse for 650 consecutive days", statKey: "personalstats.spousetime", threshold: 56160000, category: "medals-commitment-list", type: "count_time_convert" },
    { name: "Double Platinum Anniversary", requirement: "Same spouse for 700 consecutive days", statKey: "personalstats.spousetime", threshold: 60480000, category: "medals-commitment-list", type: "count_time_convert" },
    { name: "Triple Silver Anniversary", requirement: "Same spouse for 750 consecutive days", statKey: "personalstats.spousetime", threshold: 64800000, category: "medals-commitment-list", type: "count_time_convert" },
    { name: "Triple Ruby Anniversary", requirement: "Same spouse for 800 consecutive days", statKey: "personalstats.spousetime", threshold: 69120000, category: "medals-commitment-list", type: "count_time_convert" },
    { name: "Triple Sapphire Anniversary", requirement: "Same spouse for 850 consecutive days", statKey: "personalstats.spousetime", threshold: 73440000, category: "medals-commitment-list", type: "count_time_convert" },
    { name: "Triple Emerald Anniversary", requirement: "Same spouse for 900 consecutive days", statKey: "personalstats.spousetime", threshold: 77760000, category: "medals-commitment-list", type: "count_time_convert" },
    { name: "Triple Gold Anniversary", requirement: "Same spouse for 1,000 consecutive days", statKey: "personalstats.spousetime", threshold: 86400000, category: "medals-commitment-list", type: "count_time_convert" },
    { name: "Triple Diamond Anniversary", requirement: "Same spouse for 1,500 consecutive days", statKey: "personalstats.spousetime", threshold: 129600000, category: "medals-commitment-list", type: "count_time_convert" },
    { name: "Triple Platinum Anniversary", requirement: "Same spouse for 2,000 consecutive days", statKey: "personalstats.spousetime", threshold: 172800000, category: "medals-commitment-list", type: "count_time_convert" },
    // Age
    { name: "One Year of Service", requirement: "Live in Torn for One Year", statKey: "personalstats.days_old", threshold: 365, category: "medals-commitment-list", type: "count" },
    { name: "Two Years of Service", requirement: "Live in Torn for Two Years", statKey: "personalstats.days_old", threshold: 730, category: "medals-commitment-list", type: "count" },
    { name: "Three Years of Service", requirement: "Live in Torn for Three Years", statKey: "personalstats.days_old", threshold: 1095, category: "medals-commitment-list", type: "count" },
    { name: "Four Years of Service", requirement: "Live in Torn for Four Years", statKey: "personalstats.days_old", threshold: 1460, category: "medals-commitment-list", type: "count" },
    { name: "Five Years of Service", requirement: "Live in Torn for Five Years", statKey: "personalstats.days_old", threshold: 1825, category: "medals-commitment-list", type: "count" },
    { name: "Six Years of Service", requirement: "Live in Torn for Six Years", statKey: "personalstats.days_old", threshold: 2190, category: "medals-commitment-list", type: "count" },
    { name: "Seven Years of Service", requirement: "Live in Torn for Seven Years", statKey: "personalstats.days_old", threshold: 2555, category: "medals-commitment-list", type: "count" },
    { name: "Eight Years of Service", requirement: "Live in Torn for Eight Years", statKey: "personalstats.days_old", threshold: 2920, category: "medals-commitment-list", type: "count" },
    { name: "Nine Years of Service", requirement: "Live in Torn for Nine Years", statKey: "personalstats.days_old", threshold: 3285, category: "medals-commitment-list", type: "count" },
    { name: "Ten Years of Service", requirement: "Live in Torn for Ten Years", statKey: "personalstats.days_old", threshold: 3650, category: "medals-commitment-list", type: "count" },
    // Level Medals - Now combined with Commitment
    { name: "Level Five", requirement: "Reach level Five", statKey: "level", threshold: 5, category: "medals-commitment-list", type: "level" },
    { name: "Level Ten", requirement: "Reach level Ten", statKey: "level", threshold: 10, category: "medals-commitment-list", type: "level" },
    { name: "Level Fifteen", requirement: "Reach level Fifteen", statKey: "level", threshold: 15, category: "medals-commitment-list", type: "level" },
    { name: "Level Twenty", requirement: "Reach level Twenty", statKey: "level", threshold: 20, category: "medals-commitment-list", type: "level" },
    { name: "Level Twenty Five", requirement: "Reach level Twenty Five", statKey: "level", threshold: 25, category: "medals-commitment-list", type: "level" },
    { name: "Level Thirty", requirement: "Reach level Thirty", statKey: "level", threshold: 30, category: "medals-commitment-list", type: "level" },
    { name: "Level Thirty Five", requirement: "Reach level Thirty Five", statKey: "level", threshold: 35, category: "medals-commitment-list", type: "level" },
    { name: "Level Forty", requirement: "Reach level Forty", statKey: "level", threshold: 40, category: "medals-commitment-list", type: "level" },
    { name: "Level Forty Five", requirement: "Reach level Forty Five", statKey: "level", threshold: 45, category: "medals-commitment-list", type: "level" },
    { name: "Level Fifty", requirement: "Reach level Fifty", statKey: "level", threshold: 50, category: "medals-commitment-list", type: "level" },
    { name: "Level Fifty Five", requirement: "Reach level Fifty Five", statKey: "level", threshold: 55, category: "medals-commitment-list", type: "level" },
    { name: "Level Sixty", requirement: "Reach level Sixty", statKey: "level", threshold: 60, category: "medals-commitment-list", type: "level" },
    { name: "Level Sixty Five", requirement: "Reach level Sixty Five", statKey: "level", threshold: 65, category: "medals-commitment-list", type: "level" },
    { name: "Level Seventy", requirement: "Reach level Seventy", statKey: "level", threshold: 70, category: "medals-commitment-list", type: "level" },
    { name: "Level Seventy Five", requirement: "Reach level Seventy Five", statKey: "level", threshold: 75, category: "medals-commitment-list", type: "level" },
    { name: "Level Eighty", requirement: "Reach level Eighty", statKey: "level", threshold: 80, category: "medals-commitment-list", type: "level" },
    { name: "Level Eighty Five", requirement: "Reach level Eighty Five", statKey: "level", threshold: 85, category: "medals-commitment-list", type: "level" },
    { name: "Level Ninety", requirement: "Reach level Ninety", statKey: "level", threshold: 90, category: "medals-commitment-list", type: "level" },
    { name: "Level Ninety Five", requirement: "Reach level Ninety Five", statKey: "level", threshold: 95, category: "medals-commitment-list", type: "level" },
    { name: "Level One Hundred", requirement: "Reach level One Hundred", statKey: "level", threshold: 100, category: "medals-commitment-list", type: "level" },

    // --- Crimes Medals ---
    { name: "Trainee Troublemaker", requirement: "Commit 100 Criminal offenses", statKey: "personalstats.criminaloffenses", threshold: 100, category: "medals-crimes-list", type: "count" },
    { name: "Budding Bandit", requirement: "Commit 200 Criminal offenses", statKey: "personalstats.criminaloffenses", threshold: 200, category: "medals-crimes-list", type: "count" },
    { name: "Aspiring Assailant", requirement: "Commit 300 Criminal offenses", statKey: "personalstats.criminaloffenses", threshold: 300, category: "medals-crimes-list", type: "count" },
    { name: "Fledgling Felon", requirement: "Commit 500 Criminal offenses", statKey: "personalstats.criminaloffenses", threshold: 500, category: "medals-crimes-list", type: "count" },
    { name: "Freshman Fiend", requirement: "Commit 750 Criminal offenses", statKey: "personalstats.criminaloffenses", threshold: 750, category: "medals-crimes-list", type: "count" },
    { name: "Despicable Deviant", requirement: "Commit 1,000 Criminal offenses", statKey: "personalstats.criminaloffenses", threshold: 1000, category: "medals-crimes-list", type: "count" },
    { name: "Conniving Culprit", requirement: "Commit 1,500 Criminal offenses", statKey: "personalstats.criminaloffenses", threshold: 1500, category: "medals-crimes-list", type: "count" },
    { name: "Sordid Sinner", requirement: "Commit 2,000 Criminal offenses", statKey: "personalstats.criminaloffenses", threshold: 2000, category: "medals-crimes-list", type: "count" },
    { name: "Polished Perpetrator", requirement: "Commit 2,500 Criminal offenses", statKey: "personalstats.criminaloffenses", threshold: 2500, category: "medals-crimes-list", type: "count" },
    { name: "Relentless Reprobate", requirement: "Commit 3,000 Criminal offenses", statKey: "personalstats.criminaloffenses", threshold: 3000, category: "medals-crimes-list", type: "count" },
    { name: "Resolute Rogue", requirement: "Commit 4,000 Criminal offenses", statKey: "personalstats.criminaloffenses", threshold: 4000, category: "medals-crimes-list", type: "count" },
    { name: "Veteran Villain", requirement: "Commit 5,000 Criminal offenses", statKey: "personalstats.criminaloffenses", threshold: 5000, category: "medals-crimes-list", type: "count" },
    { name: "Masterful Miscreant", requirement: "Commit 6,000 Criminal offenses", statKey: "personalstats.criminaloffenses", threshold: 6000, category: "medals-crimes-list", type: "count" },
    { name: "Merciless Malefactor", requirement: "Commit 7,500 Criminal offenses", statKey: "personalstats.criminaloffenses", threshold: 7500, category: "medals-crimes-list", type: "count" },
    { name: "Legendary Lawbreaker", requirement: "Commit 10,000 Criminal offenses", statKey: "personalstats.criminaloffenses", threshold: 10000, category: "medals-crimes-list", type: "count" },
    { name: "Petty Pilferer", requirement: "Commit 100 Theft offenses", statKey: "personalstats.theft", threshold: 100, category: "medals-crimes-list", type: "count" },
    { name: "Crafty Crook", requirement: "Commit 200 Theft offenses", statKey: "personalstats.theft", threshold: 200, category: "medals-crimes-list", type: "count" },
    { name: "Nifty Nicker", requirement: "Commit 300 Theft offenses", statKey: "personalstats.theft", threshold: 300, category: "medals-crimes-list", type: "count" },
    { name: "Sneaky Snatcher", requirement: "Commit 500 Theft offenses", statKey: "personalstats.theft", threshold: 500, category: "medals-crimes-list", type: "count" },
    { name: "Brazen Booster", requirement: "Commit 750 Theft offenses", statKey: "personalstats.theft", threshold: 750, category: "medals-crimes-list", type: "count" },
    { name: "Stealthy Stealer", requirement: "Commit 1,000 Theft offenses", statKey: "personalstats.theft", threshold: 1000, category: "medals-crimes-list", type: "count" },
    { name: "Rampant Robber", requirement: "Commit 1,500 Theft offenses", statKey: "personalstats.theft", threshold: 1500, category: "medals-crimes-list", type: "count" },
    { name: "Bold Burglar", requirement: "Commit 2,000 Theft offenses", statKey: "personalstats.theft", threshold: 2000, category: "medals-crimes-list", type: "count" },
    { name: "Invisible Intruder", requirement: "Commit 2,500 Theft offenses", statKey: "personalstats.theft", threshold: 2500, category: "medals-crimes-list", type: "count" },
    { name: "Lucrative Larcenist", requirement: "Commit 3,000 Theft offenses", statKey: "personalstats.theft", threshold: 3000, category: "medals-crimes-list", type: "count" },
    { name: "Looting Luminary", requirement: "Commit 4,000 Theft offenses", statKey: "personalstats.theft", threshold: 4000, category: "medals-crimes-list", type: "count" },
    { name: "Formidable Filcher", requirement: "Commit 5,000 Theft offenses", statKey: "personalstats.theft", threshold: 5000, category: "medals-crimes-list", type: "count" },
    { name: "Sophisticated Swiper", requirement: "Commit 6,000 Theft offenses", statKey: "personalstats.theft", threshold: 6000, category: "medals-crimes-list", type: "count" },
    { name: "Notorious Nabber", requirement: "Commit 7,500 Theft offenses", statKey: "personalstats.theft", threshold: 7500, category: "medals-crimes-list", type: "count" },
    { name: "Prolific Plunderer", requirement: "Commit 10,000 Theft offenses", statKey: "personalstats.theft", threshold: 10000, category: "medals-crimes-list", type: "count" },
    { name: "Sinister Scoundrel", requirement: "Commit 100 Vandalism offenses", statKey: "personalstats.vandalism", threshold: 100, category: "medals-crimes-list", type: "count" },
    { name: "Devious Delinquent", requirement: "Commit 200 Vandalism offenses", statKey: "personalstats.vandalism", threshold: 200, category: "medals-crimes-list", type: "count" },
    { name: "Rebellious Ruffian", requirement: "Commit 300 Vandalism offenses", statKey: "personalstats.vandalism", threshold: 300, category: "medals-crimes-list", type: "count" },
    { name: "Artistic Anarchist", requirement: "Commit 500 Vandalism offenses", statKey: "personalstats.vandalism", threshold: 500, category: "medals-crimes-list", type: "count" },
    { name: "Renegade Rascal", requirement: "Commit 750 Vandalism offenses", statKey: "personalstats.vandalism", threshold: 750, category: "medals-crimes-list", type: "count" },
    { name: "Decisive Defacer", requirement: "Commit 1,000 Vandalism offenses", statKey: "personalstats.vandalism", threshold: 1000, category: "medals-crimes-list", type: "count" },
    { name: "Villainous Vandal", requirement: "Commit 1,500 Vandalism offenses", statKey: "personalstats.vandalism", threshold: 1500, category: "medals-crimes-list", type: "count" },
    { name: "Menacing Misfit", requirement: "Commit 2,000 Vandalism offenses", statKey: "personalstats.vandalism", threshold: 2000, category: "medals-crimes-list", type: "count" },
    { name: "Radical Rebel", requirement: "Commit 2,500 Vandalism offenses", statKey: "personalstats.vandalism", threshold: 2500, category: "medals-crimes-list", type: "count" },
    { name: "Urban Upsetter", requirement: "Commit 3,000 Vandalism offenses", statKey: "personalstats.vandalism", threshold: 3000, category: "medals-crimes-list", type: "count" },
    { name: "Malicious Maverick", requirement: "Commit 4,000 Vandalism offenses", statKey: "personalstats.vandalism", threshold: 4000, category: "medals-crimes-list", type: "count" },
    { name: "Reckless Renovator", requirement: "Commit 5,000 Vandalism offenses", statKey: "personalstats.vandalism", threshold: 5000, category: "medals-crimes-list", type: "count" },
    { name: "Dynamic Destructor", requirement: "Commit 6,000 Vandalism offenses", statKey: "personalstats.vandalism", threshold: 6000, category: "medals-crimes-list", type: "count" },
    { name: "Infernal Instigator", requirement: "Commit 7,500 Vandalism offenses", statKey: "personalstats.vandalism", threshold: 7500, category: "medals-crimes-list", type: "count" },
    { name: "Nefarious Nihilist", requirement: "Commit 10,000 Vandalism offenses", statKey: "personalstats.vandalism", threshold: 10000, category: "medals-crimes-list", type: "count" },
    { name: "Digital Duplicator", requirement: "Commit 100 Counterfeiting offenses", statKey: "personalstats.counterfeiting", threshold: 100, category: "medals-crimes-list", type: "count" },
    { name: "Covert Copier", requirement: "Commit 200 Counterfeiting offenses", statKey: "personalstats.counterfeiting", threshold: 200, category: "medals-crimes-list", type: "count" },
    { name: "Resourceful Replicator", requirement: "Commit 300 Counterfeiting offenses", statKey: "personalstats.counterfeiting", threshold: 300, category: "medals-crimes-list", type: "count" },
    { name: "Mimicking Maestro", statKey: "personalstats.counterfeiting", threshold: 500, category: "medals-crimes-list", type: "count" },
    { name: "Faux Fabricator", statKey: "personalstats.counterfeiting", threshold: 750, category: "medals-crimes-list", type: "count" },
    { name: "Mock Manufacturer", statKey: "personalstats.counterfeiting", threshold: 1000, category: "medals-crimes-list", type: "count" },
    { name: "Furtive Faker", statKey: "personalstats.counterfeiting", threshold: 1500, category: "medals-crimes-list", type: "count" },
    { name: "Duplicitous Designer", statKey: "personalstats.counterfeiting", threshold: 2000, category: "medals-crimes-list", type: "count" },
    { name: "Counterfeit Crafter", statKey: "personalstats.counterfeiting", threshold: 2500, category: "medals-crimes-list", type: "count" },
    { name: "Emphatic Emulator", statKey: "personalstats.counterfeiting", threshold: 3000, category: "medals-crimes-list", type: "count" },
    { name: "Meticulous Maker", statKey: "personalstats.counterfeiting", threshold: 4000, category: "medals-crimes-list", type: "count" },
    { name: "Artificial Artisan", statKey: "personalstats.counterfeiting", threshold: 5000, category: "medals-crimes-list", type: "count" },
    { name: "Impeccable Imitator", statKey: "personalstats.counterfeiting", threshold: 6000, category: "medals-crimes-list", type: "count" },
    { name: "Bogus Buccaneer", statKey: "personalstats.counterfeiting", threshold: 7500, category: "medals-crimes-list", type: "count" },
    { name: "Famed Forger", statKey: "personalstats.counterfeiting", threshold: 10000, category: "medals-crimes-list", type: "count" },
    { name: "Troublesome Trickster", statKey: "personalstats.fraud", threshold: 100, category: "medals-crimes-list", type: "count" },
    { name: "Shameless Shyster", statKey: "personalstats.fraud", threshold: 200, category: "medals-crimes-list", type: "count" },
    { name: "Greedy Grifter", statKey: "personalstats.fraud", threshold: 300, category: "medals-crimes-list", type: "count" },
    { name: "Daring Deceiver", statKey: "personalstats.fraud", threshold: 500, category: "medals-crimes-list", type: "count" },
    { name: "Provocative Persuader", statKey: "personalstats.fraud", threshold: 750, category: "medals-crimes-list", type: "count" },
    { name: "Dexterous Defrauder", statKey: "personalstats.fraud", threshold: 1000, category: "medals-crimes-list", type: "count" },
    { name: "Enterprising Enticer", statKey: "personalstats.fraud", threshold: 1500, category: "medals-crimes-list", type: "count" },
    { name: "Blackhearted Bluffer", statKey: "personalstats.fraud", threshold: 2000, category: "medals-crimes-list", type: "count" },
    { name: "Scheming Scammer", statKey: "personalstats.fraud", threshold: 2500, category: "medals-crimes-list", type: "count" },
    { name: "Swanky Swindler", statKey: "personalstats.fraud", threshold: 3000, category: "medals-crimes-list", type: "count" },
    { name: "Impressive Imposter", statKey: "personalstats.fraud", threshold: 4000, category: "medals-crimes-list", type: "count" },
    { name: "Canny Conman", statKey: "personalstats.fraud", threshold: 5000, category: "medals-crimes-list", type: "count" },
    { name: "Frenzied Fraudster", statKey: "personalstats.fraud", threshold: 6000, category: "medals-crimes-list", type: "count" },
    { name: "Bankrupting Bilker", statKey: "personalstats.fraud", threshold: 7500, category: "medals-crimes-list", type: "count" },
    { name: "Misdirection Master", statKey: "personalstats.fraud", threshold: 10000, category: "medals-crimes-list", type: "count" },
    { name: "Underworld Upstart", statKey: "personalstats.illicitservices", threshold: 100, category: "medals-crimes-list", type: "count" },
    { name: "Murky Middleman", statKey: "personalstats.illicitservices", threshold: 200, category: "medals-crimes-list", type: "count" },
    { name: "Grievous Goon", statKey: "personalstats.illicitservices", threshold: 300, category: "medals-crimes-list", type: "count" },
    { name: "Heinous Henchman", statKey: "personalstats.illicitservices", threshold: 500, category: "medals-crimes-list", type: "count" },
    { name: "Hardworking Heavy", statKey: "personalstats.illicitservices", threshold: 750, category: "medals-crimes-list", type: "count" },
    { name: "Intrepid Intermediary", statKey: "personalstats.illicitservices", threshold: 1000, category: "medals-crimes-list", type: "count" },
    { name: "Crooked Connector", statKey: "personalstats.illicitservices", threshold: 1500, category: "medals-crimes-list", type: "count" },
    { name: "Belligerent Broker", statKey: "personalstats.illicitservices", threshold: 2000, category: "medals-crimes-list", type: "count" },
    { name: "Criminal Contractor", statKey: "personalstats.illicitservices", threshold: 2500, category: "medals-crimes-list", type: "count" },
    { name: "Dark Dealmaker", statKey: "personalstats.illicitservices", threshold: 3000, category: "medals-crimes-list", type: "count" },
    { name: "Lawless Liaison", statKey: "personalstats.illicitservices", threshold: 4000, category: "medals-crimes-list", type: "count" },
    { name: "Clandestine Collaborator", statKey: "personalstats.illicitservices", threshold: 5000, category: "medals-crimes-list", type: "count" },
    { name: "Felonious Facilitator", statKey: "personalstats.illicitservices", threshold: 6000, category: "medals-crimes-list", type: "count" },
    { name: "Amoral Arbitrator", statKey: "personalstats.illicitservices", threshold: 7500, category: "medals-crimes-list", type: "count" },
    { name: "Vice Vendor", statKey: "personalstats.illicitservices", threshold: 10000, category: "medals-crimes-list", type: "count" },
    { name: "Web Wizard", statKey: "personalstats.cybercrime", threshold: 100, category: "medals-crimes-list", type: "count" },
    { name: "Digital Desperado", statKey: "personalstats.cybercrime", threshold: 200, category: "medals-crimes-list", type: "count" },
    { name: "Tech Tinkerer", statKey: "personalstats.cybercrime", threshold: 300, category: "medals-crimes-list", type: "count" },
    { name: "Virtual Virtuoso", statKey: "personalstats.cybercrime", threshold: 500, category: "medals-crimes-list", type: "count" },
    { name: "Phishing Phenom", statKey: "personalstats.cybercrime", threshold: 750, category: "medals-crimes-list", type: "count" },
    { name: "Network Ninja", statKey: "personalstats.cybercrime", threshold: 1000, category: "medals-crimes-list", type: "count" },
    { name: "Expert Exploiter", statKey: "personalstats.cybercrime", threshold: 1500, category: "medals-crimes-list", type: "count" },
    { name: "Data Dynamo", statKey: "personalstats.cybercrime", threshold: 2000, category: "medals-crimes-list", type: "count" },
    { name: "Code Commando", statKey: "personalstats.cybercrime", threshold: 2500, category: "medals-crimes-list", type: "count" },
    { name: "Online Outlaw", statKey: "personalstats.cybercrime", threshold: 3000, category: "medals-crimes-list", type: "count" },
    { name: "Malware Mogul", statKey: "personalstats.cybercrime", threshold: 4000, category: "medals-crimes-list", type: "count" },
    { name: "System Saboteur", statKey: "personalstats.cybercrime", threshold: 5000, category: "medals-crimes-list", type: "count" },
    { name: "Heinous Hacker", statKey: "personalstats.cybercrime", threshold: 6000, category: "medals-crimes-list", type: "count" },
    { name: "Backdoor Baron", statKey: "personalstats.cybercrime", threshold: 7500, category: "medals-crimes-list", type: "count" },
    { name: "Byte Boss", statKey: "personalstats.cybercrime", threshold: 10000, category: "medals-crimes-list", type: "count" },
    { name: "Budding Bully", statKey: "personalstats.extortion", threshold: 100, category: "medals-crimes-list", type: "count" },
    { name: "Novice Negotiator", statKey: "personalstats.extortion", threshold: 200, category: "medals-crimes-list", type: "count" },
    { name: "Cunning Coercer", statKey: "personalstats.extortion", threshold: 300, category: "medals-crimes-list", type: "count" },
    { name: "Professional Pressurer", statKey: "personalstats.extortion", threshold: 500, category: "medals-crimes-list", type: "count" },
    { name: "Haughty Harasser", statKey: "personalstats.extortion", threshold: 750, category: "medals-crimes-list", type: "count" },
    { name: "Calculating Coaxer", statKey: "personalstats.extortion", threshold: 1000, category: "medals-crimes-list", type: "count" },
    { name: "Exceptional Extortionist", statKey: "personalstats.extortion", threshold: 1500, category: "medals-crimes-list", type: "count" },
    { name: "Polished Persuader", statKey: "personalstats.extortion", threshold: 2000, category: "medals-crimes-list", type: "count" },
    { name: "Effective Enforcer", statKey: "personalstats.extortion", threshold: 2500, category: "medals-crimes-list", type: "count" },
    { name: "Industrious Intimidator", statKey: "personalstats.extortion", threshold: 3000, category: "medals-crimes-list", type: "count" },
    { name: "Ruthless Racketeer", statKey: "personalstats.extortion", threshold: 4000, category: "medals-crimes-list", type: "count" },
    { name: "Ominous Oppressor", statKey: "personalstats.extortion", threshold: 5000, category: "medals-crimes-list", type: "count" },
    { name: "Vindictive Victimizer", statKey: "personalstats.extortion", threshold: 6000, category: "medals-crimes-list", type: "count" },
    { name: "Master Manipulator", statKey: "personalstats.extortion", threshold: 7500, category: "medals-crimes-list", type: "count" },
    { name: "Tyrannical Terrorizer", statKey: "personalstats.extortion", threshold: 10000, category: "medals-crimes-list", type: "count" },
    { name: "Grass Grower", statKey: "personalstats.illegalproduction", threshold: 100, category: "medals-crimes-list", type: "count" },
    { name: "Dope Developer", statKey: "personalstats.illegalproduction", threshold: 200, category: "medals-crimes-list", type: "count" },
    { name: "Seedy Supplier", statKey: "personalstats.illegalproduction", threshold: 300, category: "medals-crimes-list", type: "count" },
    { name: "Blackmarket Botanist", statKey: "personalstats.illegalproduction", threshold: 500, category: "medals-crimes-list", type: "count" },
    { name: "Narcotics Nurturer", statKey: "personalstats.illegalproduction", threshold: 750, category: "medals-crimes-list", type: "count" },
    { name: "Revered Refiner", statKey: "personalstats.illegalproduction", threshold: 1000, category: "medals-crimes-list", type: "count" },
    { name: "Forbidden Fabricator", statKey: "personalstats.illegalproduction", threshold: 1500, category: "medals-crimes-list", type: "count" },
    { name: "Back-alley Builder", statKey: "personalstats.illegalproduction", threshold: 2000, category: "medals-crimes-list", type: "count" },
    { name: "Contraband Creator", statKey: "personalstats.illegalproduction", threshold: 2500, category: "medals-crimes-list", type: "count" },
    { name: "Covert Craftsman", statKey: "personalstats.illegalproduction", threshold: 3000, category: "medals-crimes-list", type: "count" },
    { name: "Illicit Innovator", statKey: "personalstats.illegalproduction", threshold: 4000, category: "medals-crimes-list", type: "count" },
    { name: "Prohibited Producer", statKey: "personalstats.illegalproduction", threshold: 5000, category: "medals-crimes-list", type: "count" },
    { name: "Workshop Wizard", statKey: "personalstats.illegalproduction", threshold: 6000, category: "medals-crimes-list", type: "count" },
    { name: "Synthetic Scientist", statKey: "personalstats.illegalproduction", threshold: 7500, category: "medals-crimes-list", type: "count" },
    { name: "Production Prodigy", statKey: "personalstats.illegalproduction", threshold: 10000, category: "medals-crimes-list", type: "count" },

    // --- Miscellaneous Medals (Includes Misc, Networth, Rank (if it were available)) ---
    // Misc
    { name: "Novice Buster", requirement: "Bust 250 people from the Torn City jail", statKey: "personalstats.peoplebusted", threshold: 250, category: "misc-awards-list", type: "count" },
    { name: "Intermediate Buster", requirement: "Bust 500 people from the Torn City jail", statKey: "personalstats.peoplebusted", threshold: 500, category: "misc-awards-list", type: "count" },
    { name: "Advanced Buster", requirement: "Bust 1,000 people from the Torn City jail", statKey: "personalstats.peoplebusted", threshold: 1000, category: "misc-awards-list", type: "count" },
    { name: "Professional Buster", requirement: "Bust 2,000 people from the Torn City jail", statKey: "personalstats.peoplebusted", threshold: 2000, category: "misc-awards-list", type: "count" },
    { name: "Expert Buster", requirement: "Bust 4,000 people from the Torn City jail", statKey: "personalstats.peoplebusted", threshold: 4000, category: "misc-awards-list", type: "count" },
    { name: "Master Buster", requirement: "Bust 6,000 people from the Torn City jail", statKey: "personalstats.peoplebusted", threshold: 6000, category: "misc-awards-list", type: "count" },
    { name: "Guru Buster", requirement: "Bust 8,000 people from the Torn City jail", statKey: "personalstats.peoplebusted", threshold: 8000, category: "misc-awards-list", type: "count" },
    { name: "Watchful", requirement: "10 items found", statKey: "personalstats.cityfinds", threshold: 10, category: "misc-awards-list", type: "count" },
    { name: "Finders Keepers", requirement: "50 items found", statKey: "personalstats.cityfinds", threshold: 50, category: "misc-awards-list", type: "count" },
    { name: "Eagle Eye", requirement: "100 items found", statKey: "personalstats.cityfinds", threshold: 100, category: "misc-awards-list", type: "count" },
    { name: "Pin Cushion", requirement: "Use 500 medical items", statKey: "personalstats.medicalitemsused", threshold: 500, category: "misc-awards-list", type: "count" },
    { name: "Painkiller Abuse", requirement: "Use 5,000 medical items", statKey: "personalstats.medicalitemsused", threshold: 5000, category: "misc-awards-list", type: "count" },
    { name: "Attention Seeker", requirement: "Use 25,000 medical items", statKey: "personalstats.medicalitemsused", threshold: 25000, category: "misc-awards-list", type: "count" },
    { name: "Frequent Flyer (Medal)", requirement: "Travel abroad 25 times", statKey: "personalstats.traveltimes", threshold: 25, category: "misc-awards-list", type: "count" },
    { name: "Jetlagged", requirement: "Travel abroad 100 times", statKey: "personalstats.traveltimes", threshold: 100, category: "misc-awards-list", type: "count" },
    { name: "Mile High Club (Medal)", requirement: "Travel abroad 500 times", statKey: "personalstats.traveltimes", threshold: 500, category: "misc-awards-list", type: "count" },

    // Networth Medals
    { name: "Apprentice", requirement: "$100,000 for 3 days", statKey: "personalstats.networth", threshold: 100000, category: "misc-awards-list", type: "count_networth_time" },
    { name: "Entrepreneur", requirement: "$250,000 for 3 days", statKey: "personalstats.networth", threshold: 250000, category: "misc-awards-list", type: "count_networth_time" },
    { name: "Executive", requirement: "$500,000 for 3 days", statKey: "personalstats.networth", threshold: 500000, category: "misc-awards-list", type: "count_networth_time" },
    { name: "Millionaire", requirement: "$1,000,000 for 3 days", statKey: "personalstats.networth", threshold: 1000000, category: "misc-awards-list", type: "count_networth_time" },
    { name: "Multimillionaire", requirement: "$2,500,000 for 7 days", statKey: "personalstats.networth", threshold: 2500000, category: "misc-awards-list", type: "count_networth_time" },
    { name: "Capitalist", requirement: "$10,000,000 for 7 days", statKey: "personalstats.networth", threshold: 10000000, category: "misc-awards-list", type: "count_networth_time" },
    { name: "Plutocrat", requirement: "$25,000,000 for 14 days", statKey: "personalstats.networth", threshold: 25000000, category: "misc-awards-list", type: "count_networth_time" },
    { name: "Aristocrat", requirement: "$100,000,000 for 14 days", statKey: "personalstats.networth", threshold: 100000000, category: "misc-awards-list", type: "count_networth_time" },
    { name: "Mogul", requirement: "$250,000,000 for 28 days", statKey: "personalstats.networth", threshold: 250000000, category: "misc-awards-list", type: "count_networth_time" },
    { name: "Billionaire", requirement: "$1,000,000,000 for 28 days", statKey: "personalstats.networth", threshold: 1000000000, category: "misc-awards-list", type: "count_networth_time" },
    { name: "Multibillionaire", requirement: "$2,500,000,000 for 56 days", statKey: "personalstats.networth", threshold: 2500000000, category: "misc-awards-list", type: "count_networth_time" },
    { name: "Baron", requirement: "$10,000,000,000 for 56 days", statKey: "personalstats.networth", threshold: 10000000000, category: "misc-awards-list", type: "count_networth_time" },
    { name: "Oligarch", requirement: "$25,000,000,000 for 112 days", statKey: "personalstats.networth", threshold: 25000000000, category: "misc-awards-list", type: "count_networth_time" },
    { name: "Tycoon", requirement: "$100,000,000,000 for 112 days", statKey: "personalstats.networth", threshold: 100000000000, category: "misc-awards-list", type: "count_networth_time" },

    // Rank Medals (will use top-level rank if available, otherwise N/A)
    { name: "Beginner", requirement: "Reach the rank of \"Beginner\"", statKey: "rank_text", threshold: "Beginner", category: "misc-awards-list", type: "rank" },
    { name: "Inexperienced", requirement: "Reach the rank of \"Inexperienced\"", statKey: "rank_text", threshold: "Inexperienced", category: "misc-awards-list", type: "rank" },
    { name: "Rookie", requirement: "Reach the rank of \"Rookie\"", statKey: "rank_text", threshold: "Rookie", category: "misc-awards-list", type: "rank" },
    { name: "Novice", requirement: "Reach the rank of \"Novice\"", statKey: "rank_text", threshold: "Novice", category: "misc-awards-list", type: "rank" },
    { name: "Below Average", requirement: "Reach the rank of \"Below Average\"", statKey: "rank_text", threshold: "Below Average", category: "misc-awards-list", type: "rank" },
    { name: "Average", requirement: "Reach the rank of \"Average\"", statKey: "rank_text", threshold: "Average", category: "misc-awards-list", type: "rank" },
    { name: "Reasonable", requirement: "Reach the rank of \"Reasonable\"", statKey: "rank_text", threshold: "Reasonable", category: "misc-awards-list", type: "rank" },
    { name: "Above Average", requirement: "Reach the rank of \"Above Average\"", statKey: "rank_text", threshold: "Above Average", category: "misc-awards-list", type: "rank" },
    { name: "Competent", requirement: "Reach the rank of \"Competent\"", statKey: "rank_text", threshold: "Competent", category: "misc-awards-list", type: "rank" },
    { name: "Highly Competent", requirement: "Reach the rank of \"Highly Competent\"", statKey: "rank_text", threshold: "Highly Competent", category: "misc-awards-list", type: "rank" },
    { name: "Veteran", requirement: "Reach the rank of \"Veteran\"", statKey: "rank_text", threshold: "Veteran", category: "misc-awards-list", type: "rank" },
    { name: "Distinguished", requirement: "Reach the rank of \"Distinguished\"", statKey: "rank_text", threshold: "Distinguished", category: "misc-awards-list", type: "rank" },
    { name: "Highly Distinguished", requirement: "Reach the rank of \"Highly Distinguished\"", statKey: "rank_text", threshold: "Highly Distinguished", category: "misc-awards-list", type: "rank" },
    { name: "Professional", requirement: "Reach the rank of \"Professional\"", statKey: "rank_text", threshold: "Professional", category: "misc-awards-list", type: "rank" },
    { name: "Star", requirement: "Reach the rank of \"Star\"", statKey: "rank_text", threshold: "Star", category: "misc-awards-list", type: "rank" },
    { name: "Master", requirement: "Reach the rank of \"Master\"", statKey: "rank_text", threshold: "Master", category: "misc-awards-list", type: "rank" },
    { name: "Outstanding", requirement: "Reach the rank of \"Outstanding\"", statKey: "rank_text", threshold: "Outstanding", category: "misc-awards-list", type: "rank" },
    { name: "Celebrity", requirement: "Reach the rank of \"Celebrity\"", statKey: "rank_text", threshold: "Celebrity", category: "misc-awards-list", type: "rank" },
    { name: "Supreme", requirement: "Reach the rank of \"Supreme\"", statKey: "rank_text", threshold: "Supreme", category: "misc-awards-list", type: "rank" },
    { name: "Idolized", requirement: "Reach the rank of \"Idolized\"", statKey: "rank_text", threshold: "Idolized", category: "misc-awards-list", type: "rank" },
    { name: "Champion", requirement: "Reach the rank of \"Champion\"", statKey: "rank_text", threshold: "Champion", category: "misc-awards-list", type: "rank" },
    { name: "Heroic", requirement: "Reach the rank of \"Heroic\"", statKey: "rank_text", threshold: "Heroic", category: "misc-awards-list", type: "rank" },
    { name: "Legendary", requirement: "Reach the rank of \"Legendary\"", statKey: "rank_text", threshold: "Legendary", category: "misc-awards-list", type: "rank" },
    { name: "Elite", requirement: "Reach the rank of \"Elite\"", statKey: "rank_text", threshold: "Elite", category: "misc-awards-list", type: "rank" },
    { name: "Invincible", requirement: "Reach the rank of \"Invincible\"", statKey: "rank_text", threshold: "Invincible", category: "misc-awards-list", type: "rank" },
];


// --- Helper Functions ---

/**
 * Shows the loading indicator.
 */
function showLoading() {
    loadingIndicator.classList.remove('js-hidden-initially');
    errorDisplay.classList.add('js-hidden-initially'); // Hide any previous errors
}

/**
 * Hides the loading indicator.
 */
function hideLoading() {
    loadingIndicator.classList.add('js-hidden-initially');
}

/**
 * Shows an error message.
 * @param {string} message - The error message to display.
 */
function showError(message) {
    errorDisplay.textContent = `Error: ${message}`;
    errorDisplay.classList.remove('js-hidden-initially');
    hideLoading();
}

/**
 * Hides the error message.
 */
function hideError() {
    errorDisplay.classList.add('js-hidden-initially');
    errorDisplay.textContent = '';
}

/**
 * Formats a number with commas.
 * @param {number} num - The number to format.
 * @returns {string} The formatted number.
 */
function formatNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) {
        return 'N/A';
    }
    return num.toLocaleString();
}

/**
 * Gets a nested property from an object using a dot-notation string.
 * E.g., getNestedProperty(playerData, "personalstats.attackswon")
 * @param {object} obj - The object to search within.
 * @param {string} path - The dot-notation path to the property.
 * @returns {*} The value of the property, or undefined if not found.
 */
function getNestedProperty(obj, path) {
    // Special handling for 'rank_text' as it's a custom derivation, not directly from API path
    if (path === "rank_text") {
        return (obj.basic && obj.basic.rank) ? obj.basic.rank : (obj.rank || 'N/A');
    }
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

/**
 * Clears all dynamic content lists.
 */
function clearAllLists() {
    honorsAttackingList.innerHTML = '';
    honorsWeaponsList.innerHTML = '';
    honorsChainingList.innerHTML = '';

    medalsCombatList.innerHTML = '';
    medalsCommitmentList.innerHTML = '';

    medalsCrimesList.innerHTML = '';

    playerStatsList.innerHTML = '';
    miscAwardsList.innerHTML = ''; // Clear the new miscellaneous awards list
    awardsProgressList.innerHTML = ''; // Clear the new Awards Progress list
}


// --- Main Data Handling Functions ---

/**
 * Fetches Torn player data directly from the Torn API.
 * This function assumes the API key is retrieved from Firestore.
 * @param {string} apiKey - The Torn API key for the current user.
 * @returns {Promise<object>} A promise that resolves with the player data.
 */
async function fetchTornDataDirectly(apiKey) {
    if (!apiKey) {
        throw new Error("No Torn API key found.");
    }

    // Torn API v2 selections: streamlined to basic and personalstats for robustness.
    const selections = "basic,personalstats";
    const tornApiUrl = `https://api.torn.com/user/?selections=${selections}&key=${apiKey}`;

    try {
        const response = await fetch(tornApiUrl);

        if (!response.ok) {
            let errorDetail = await response.text();
            try {
                const errorJson = JSON.parse(errorDetail);
                if (errorJson && errorJson.error && errorJson.error.error) {
                    errorDetail = errorJson.error.error;
                }
            } catch (e) {
                // Not JSON, use raw text
            }
            throw new Error(`Torn API error: ${response.status} - ${errorDetail}`);
        }

        const data = await response.json();

        if (data.error && data.error.error) {
            throw new Error(`Torn API error: ${data.error.error}`);
        }

        console.log('Torn API Data fetched:', data); // For debugging
        hideLoading();
        return data;

    } catch (error) {
        console.error('Error fetching Torn data:', error);
        if (error.message.includes("Invalid key") || error.message.includes("Incorrect key")) {
            showError('Invalid Torn API key. Please update your API key in your profile settings.');
        } else if (error.message.includes("Too many requests")) {
            showError('Torn API rate limit hit. Please wait a moment and refresh.');
        } else if (error.message.includes("wrongfields")) {
            showError('Torn API returned "wrongfields". This usually means a requested data field does not exist. Check console for details.');
        } else {
            showError(`Failed to load Torn data: ${error.message}.`);
        }
        return null;
    }
}

/**
 * Displays basic player information in the summary section.
 * @param {object} playerData - The player data from the Torn API.
 */
function displayPlayerSummary(playerData) {
    console.log("displayPlayerSummary: Processing playerData:", playerData);

    if (playerData) {
        playerNameSpan.textContent = playerData.name || 'N/A';
        playerLevelSpan.textContent = formatNumber(playerData.level) || 'N/A';

        const totalStats = playerData.personalstats ? playerData.personalstats.totalstats : undefined;
        playerTotalStatsSpan.textContent = totalStats !== undefined ? formatNumber(totalStats) : 'N/A';

        // Rank: Try basic.rank (standard), then top-level .rank (if flattened), otherwise N/A
        let playerRank = 'N/A';
        if (playerData.basic && playerData.basic.rank) {
            playerRank = playerData.basic.rank;
        } else if (playerData.rank) {
            playerRank = playerData.rank;
        }
        playerRankSpan.textContent = playerRank;

        const networth = playerData.personalstats ? playerData.personalstats.networth : undefined;
        playerNetworthSpan.textContent = networth !== undefined ? `$${formatNumber(networth)}` : 'N/A';

        const life = playerData.personalstats ? playerData.personalstats.life : undefined;
        if (playerLifeSpan) {
            playerLifeSpan.textContent = life !== undefined ? formatNumber(life) : 'N/A';
        }
        
        const awards = playerData.personalstats ? playerData.personalstats.awards : undefined;
        playerAwardsSpan.textContent = awards !== undefined ? formatNumber(awards) : 'N/A';


        // More granular logging for debugging specific values
        console.log(`  Name: ${playerNameSpan.textContent}`);
        console.log(`  Level: ${playerLevelSpan.textContent}`);
        console.log(`  Total Stats: ${playerTotalStatsSpan.textContent}`);
        console.log(`  Rank (after checks): ${playerRankSpan.textContent}`);
        console.log(`  Networth: ${playerNetworthSpan.textContent}`);
        console.log(`  Life: ${playerLifeSpan ? playerLifeSpan.textContent : 'N/A (span not found)'}`);
        console.log(`  Awards: ${playerAwardsSpan.textContent}`);

    } else {
        console.warn("displayPlayerSummary: playerData is missing.");
        playerNameSpan.textContent = 'N/A';
        playerLevelSpan.textContent = 'N/A';
        playerTotalStatsSpan.textContent = 'N/A';
        playerRankSpan.textContent = 'N/A';
        playerNetworthSpan.textContent = 'N/A';
        if (playerLifeSpan) {
            playerLifeSpan.textContent = 'N/A';
        }
        playerAwardsSpan.textContent = 'N/A';
    }
}

/**
 * Processes a single achievement to determine its status and progress.
 * @param {object} achievement - The achievement object from allHonors/allMedals.
 * @param {object} playerData - The full player data from Torn API.
 * @returns {object} An object containing statusIconClass, statusSymbol, progressText, isCompleted, and calculatedPercentage.
 */
function getAchievementStatus(achievement, playerData) {
    const value = getNestedProperty(playerData, achievement.statKey);
    let statusIconClass = 'not-started';
    let statusSymbol = '◎';
    let progressText = '';
    let isCompleted = false;
    let calculatedPercentage = 0;

    if (value !== undefined && value !== null) {
        if (achievement.type === 'count' || achievement.type === 'level') {
            if (value >= achievement.threshold) {
                statusIconClass = 'completed';
                statusSymbol = '✔';
                isCompleted = true;
                calculatedPercentage = 100;
            } else {
                statusIconClass = 'in-progress';
                statusSymbol = '●';
                calculatedPercentage = (value / achievement.threshold) * 100;
                progressText = ` (Progress: ${formatNumber(value)}/${formatNumber(achievement.threshold)})`;
                if (achievement.type === 'level') {
                    progressText = ` (Current Level: ${formatNumber(value)})`;
                }
            }
        } else if (achievement.type === 'boolean') {
            if (value > 0) { // Assuming 1 for true, 0 for false for a boolean stat
                statusIconClass = 'completed';
                statusSymbol = '✔';
                isCompleted = true;
                calculatedPercentage = 100;
            }
        } else if (achievement.type === 'count_complex' && achievement.name === "007") {
            const attacksWon = getNestedProperty(playerData, achievement.statKey);
            const defendsWon = getNestedProperty(playerData, achievement.checkAlso);
            const attacksThreshold = achievement.threshold;
            const defendsThreshold = achievement.thresholdAlso;

            if (attacksWon >= attacksThreshold && defendsWon >= defendsThreshold) {
                statusIconClass = 'completed'; statusSymbol = '✔'; isCompleted = true; calculatedPercentage = 100;
            } else {
                statusIconClass = 'in-progress'; statusSymbol = '●';
                const progressAttacks = (attacksWon / attacksThreshold) * 100;
                const progressDefends = (defendsWon / defendsThreshold) * 100;
                calculatedPercentage = Math.min(progressAttacks, progressDefends); // Take the lower percentage
                progressText = ` (Attacks: ${formatNumber(attacksWon)}/${formatNumber(attacksThreshold)}, Defends: ${formatNumber(defendsWon)}/${formatNumber(defendsThreshold)})`;
            }
        } else if (achievement.type === 'count_time_convert') {
            const valueInDays = value / (24 * 60 * 60); // Convert seconds to days
             if (valueInDays >= achievement.threshold) {
                statusIconClass = 'completed'; statusSymbol = '✔'; isCompleted = true; calculatedPercentage = 100;
            } else {
                statusIconClass = 'in-progress'; statusSymbol = '●';
                calculatedPercentage = (valueInDays / achievement.threshold) * 100;
                progressText = ` (Progress: ${formatNumber(valueInDays.toFixed(1))}/${formatNumber(achievement.threshold)} days)`;
            }
        } else if (achievement.type === 'rank') {
             let currentRankValue = getNestedProperty(playerData, achievement.statKey);
             if (currentRankValue === achievement.threshold) {
                 statusIconClass = 'completed'; statusSymbol = '✔'; isCompleted = true; calculatedPercentage = 100;
             } else {
                 statusIconClass = 'not-started';
             }
             progressText = ` (Current: ${currentRankValue || 'N/A'})`;
             // For ranks, closeness is harder to calculate numerically, so percentage might not be meaningful
        }
        else if (value > 0 && !isCompleted) { // Generic check for non-zero progress for other types
            statusIconClass = 'in-progress';
            statusSymbol = '●';
            progressText = ` (Current: ${formatNumber(value)})`;
            // For general 'count' where threshold isn't clear, just show current value
            calculatedPercentage = 1; // Indicate some progress but not quantifiable
        }
    }

    return { statusIconClass, statusSymbol, progressText, isCompleted, calculatedPercentage };
}


/**
 * Updates the display for Honors and Medals based on player data.
 * @param {object} playerData - The player data from the Torn API.
 */
function updateAchievementsDisplay(playerData) {
    clearAllLists(); // Clear previous content

    const achievementLists = {
        'honors-attacking-list': honorsAttackingList,
        'honors-weapons-list': honorsWeaponsList,
        'honors-chaining-list': honorsChainingList,

        'medals-combat-list': medalsCombatList,
        'medals-commitment-list': medalsCommitmentList,

        'medals-crimes-list': medalsCrimesList,
        'misc-awards-list': miscAwardsList, // Add the miscellaneous awards list
    };

    // Process all achievements and collect their statuses for sorting later
    const allAchievementsWithStatus = [];

    const processAchievements = (achievements) => {
        achievements.forEach(achievement => {
            const { statusIconClass, statusSymbol, progressText, isCompleted, calculatedPercentage } = getAchievementStatus(achievement, playerData);
            
            // Add to the general lists
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <span class="merit-status-icon ${statusIconClass}">${statusSymbol}</span>
                <span class="merit-details">
                    <span class="merit-name">${achievement.name}</span> -
                    <span class="merit-requirement">${achievement.requirement}</span>
                    <span class="merit-progress">${progressText}</span>
                </span>
            `;
            if (achievementLists[achievement.category]) {
                achievementLists[achievement.category].appendChild(listItem);
            } else {
                console.warn(`Category list not found for: ${achievement.category}. Check HTML ID or allHonors/allMedals category assignment.`);
            }

            // Also add to the list for Awards Progress tab if not completed
            if (!isCompleted) {
                allAchievementsWithStatus.push({
                    achievement,
                    statusIconClass,
                    statusSymbol,
                    progressText,
                    calculatedPercentage // Use this for sorting
                });
            }
        });
    };

    processAchievements(allHonors);
    processAchievements(allMedals);

    // Populate the Awards Progress tab after all other lists are processed
    populateAwardsProgressTab(allAchievementsWithStatus);
}

/**
 * Populates the Awards Progress tab with in-progress achievements, sorted by closeness.
 * @param {Array<object>} achievementsInPrgoress - Array of in-progress achievements from updateAchievementsDisplay.
 */
function populateAwardsProgressTab(achievementsInPrgoress) {
    awardsProgressList.innerHTML = ''; // Clear previous content

    if (achievementsInPrgoress.length === 0) {
        awardsProgressList.innerHTML = '<li>No awards currently in progress. Start working on some!</li>';
        return;
    }

    // Sort achievements: Closest to 100% completion first
    achievementsInPrgoress.sort((a, b) => b.calculatedPercentage - a.calculatedPercentage);

    achievementsInPrgoress.forEach(item => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <span class="merit-status-icon ${item.statusIconClass}">${item.statusSymbol}</span>
            <span class="merit-details">
                <span class="merit-name">${item.achievement.name}</span> -
                <span class="merit-requirement">${item.achievement.requirement}</span>
                <span class="merit-progress">${item.progressText || ''} (${item.calculatedPercentage.toFixed(1)}% complete)</span>
            </span>
        `;
        awardsProgressList.appendChild(listItem);
    });
}


/**
 * Populates the Player Stats Overview tab.
 * @param {object} playerData - The player data from the Torn API.
 */
function populatePlayerStats(playerData) {
    const statsContainer = document.getElementById('player-stats-list');
    statsContainer.innerHTML = ''; // Clear previous stats

    if (!playerData || !playerData.personalstats) {
        statsContainer.innerHTML = '<li>No detailed stats available.</li>';
        return;
    }

    const statsMapping = {
        'Attacks Won': 'personalstats.attackswon',
        'Defends Won': 'personalstats.defendswon',
        'Crimes Committed (Total)': 'personalstats.criminaloffenses',
        'Items Found': 'personalstats.cityfinds',
        'Medical Items Used': 'personalstats.medicalitemsused',
        'Times Hospitalized': 'personalstats.hospital',
        'Times Jailed': 'personalstats.jailed',
        'Travels Made': 'personalstats.traveltimes',
        'Bounties Collected': 'personalstats.bountiescollected',
        'Busted People from Jail': 'personalstats.peoplebusted',
        'Revives Given': 'personalstats.revives',
        'Max Chain Hits (Personal)': 'personalstats.max_chain',
        'Total Damage Dealt': 'personalstats.attackdamage',
        'Total Critical Hits': 'personalstats.attackcriticalhits',
        'Total Respect Earned': 'personalstats.respectforfaction',
        'Networth': 'personalstats.networth',
        'Strength': 'personalstats.strength',
        'Defense': 'personalstats.defense',
        'Speed': 'personalstats.speed',
        'Dexterity': 'personalstats.dexterity',
        'Life': 'personalstats.life',
        'Level': 'level', // Path is direct from playerData
        'Rank': (playerData.basic && playerData.basic.rank) ? 'basic.rank' : 'rank' // Path for rank, conditional check
    };

    for (const [displayName, statPath] of Object.entries(statsMapping)) {
        let value;
        // Special handling for 'Rank' as its path might be conditional
        if (displayName === 'Rank') {
            value = (playerData.basic && playerData.basic.rank) ? playerData.basic.rank : playerData.rank;
        } else if (typeof statPath === 'string') {
             value = getNestedProperty(playerData, statPath);
        } else {
            value = 'N/A'; // Fallback for unexpected statPath type
        }

        const li = document.createElement('li');
        const spanId = `stat-${displayName.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}`;
        li.innerHTML = `<strong>${displayName}:</strong> <span id="${spanId}">${typeof value === 'number' ? formatNumber(value) : (value || 'N/A')}</span>`;
        statsContainer.appendChild(li);
    }
    // Add total awards tracked after the loop
    const totalAwardsLi = document.createElement('li');
    totalAwardsLi.innerHTML = `<strong>Total Awards Tracked:</strong> <span id="total-awards-tracked">${formatNumber(allHonors.length + allMedals.length)}</span>`;
    statsContainer.appendChild(totalAwardsLi);
}


// --- Tab Switching Logic ---

/**
 * Handles switching between tabs.
 * @param {string} tabId - The ID of the tab to activate (e.g., 'honors-tab').
 */
function switchTab(tabId) {
    // Deactivate all tab buttons and content panes
    tabsContainer.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    tabContents.forEach(pane => {
        pane.classList.remove('active');
        pane.style.display = 'none'; // Directly set display to none
    });

    // Activate the clicked tab button and its content pane
    const activeButton = tabsContainer.querySelector(`[data-tab="${tabId.replace('-tab', '')}"]`);
    const activePane = document.getElementById(tabId);

    if (activeButton) {
        activeButton.classList.add('active');
    }
    if (activePane) {
        activePane.style.display = 'flex'; // Directly set display to flex for active pane
        activePane.classList.add('active'); // Add active class if your CSS uses it for styling beyond just display
    }
}

// Event listener for tab buttons
tabsContainer.addEventListener('click', (event) => {
    const targetButton = event.target.closest('.tab-button');
    if (targetButton) {
        const tabName = targetButton.dataset.tab;
        switchTab(`${tabName}-tab`);
    }
});


// --- Initialization Function ---

/**
 * Initializes the Merits page, fetches data, and updates UI.
 */
async function initializeMeritsPage() {
    hideError();
    showLoading(); // Show loading initially

    // Listen for Firebase authentication state changes
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            console.log("User is logged in:", user.uid);
            const db = firebase.firestore();
            try {
                const userDocRef = db.collection('userProfiles').doc(user.uid);
                const doc = await userDocRef.get();

                if (doc.exists && doc.data() && doc.data().tornApiKey) {
                    const tornApiKey = doc.data().tornApiKey;
                    console.log("Torn API Key retrieved from Firestore.");

                    const playerData = await fetchTornDataDirectly(tornApiKey);
                    if (playerData) {
                        displayPlayerSummary(playerData);
                        updateAchievementsDisplay(playerData); // This also calls populateAwardsProgressTab internally
                        populatePlayerStats(playerData);

                        // Ensure Honors tab is active on initial load
                        switchTab('honors-tab'); 
                    } else {
                        console.log("Player data could not be fetched by fetchTornDataDirectly (error already displayed).");
                    }
                } else {
                    hideLoading();
                    showError('No Torn API key found for your account. Please set it in your profile settings.');
                    console.warn("tornApiKey field is missing in user's Firestore document or document does not exist.");
                }
            } catch (firestoreError) {
                console.error("Error fetching API key from Firestore:", firestoreError);
                hideLoading();
                if (firestoreError.code === 'permission-denied') {
                     showError('Permission denied to access your data. Please check Firebase Security Rules.');
                } else {
                     showError('Failed to retrieve your API key. Please check your internet connection or try again later.');
                }
            }
        } else {
            console.log("No user logged in. Redirecting or prompting login.");
            hideLoading();
            showError('Please log in to view your Torn Honors & Medals.');
        }
    });
}

// Run initialization when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeMeritsPage);