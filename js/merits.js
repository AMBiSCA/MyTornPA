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


const allHonors = [
    { id: 1, name: "Kill Streaker 1", requirement: "Achieve a 10 kill streak", category: "honors-attacking-list" },
    { id: 2, name: "Kill Streaker 2", requirement: "Achieve a 100 kill streak", category: "honors-attacking-list" },
    { id: 3, name: "Kill Streaker 3", requirement: "Achieve a 500 kill streak", category: "honors-attacking-list" },
    { id: 4, name: "Wham!", requirement: "Deal over 100,000 total damage", category: "honors-attacking-list" },
    { id: 5, name: "Bam!", requirement: "Deal over 1,000,000 total damage", category: "honors-attacking-list" },
    { id: 6, name: "Boom!", requirement: "Deal over 10,000,000 total damage", category: "honors-attacking-list" },
    { id: 7, name: "Kapow!", requirement: "Deal over 100,000,000 total damage", category: "honors-attacking-list" },
    { id: 8, name: "Devastation", requirement: "Deal at least 5,000 damage in a single hit", category: "honors-attacking-list" },
    { id: 9, name: "Obliteration", requirement: "Deal at least 10,000 damage in a single hit", category: "honors-attacking-list" },
    { id: 10, name: "Annihilation", requirement: "Deal at least 15,000 damage in a single hit", category: "honors-attacking-list" },
    { id: 11, name: "Flatline", requirement: "Achieve a one hit kill", category: "honors-attacking-list" },
    { id: 12, name: "Pressure Point", requirement: "Achieve 100 One Hit kills", category: "honors-attacking-list" },
    { id: 13, name: "Sidekick", requirement: "Assist in 250 attacks", category: "honors-attacking-list" },
    { id: 14, name: "Double Dragon", requirement: "Assist in a single attack", category: "honors-attacking-list" },
    { id: 15, name: "Precision", requirement: "Achieve 25 critical hits", category: "honors-attacking-list" },
    { id: 16, name: "50cal", requirement: "Achieve 1,000 Critical Hits", category: "honors-attacking-list" },
    { id: 17, name: "Domino Effect", requirement: "Beat someone wearing this honor", category: "honors-attacking-list" },
    { id: 18, name: "Bounty Hunter", requirement: "Collect 250 bounties", category: "honors-attacking-list" },
    { id: 19, name: "Dead Or Alive", requirement: "Earn $10,000,000 from bounty hunting", category: "honors-attacking-list" },
    { id: 20, name: "Spray And Pray", requirement: "Fire 1,000 rounds", category: "honors-attacking-list" },
    { id: 21, name: "Two Halves Make A Hole", requirement: "Fire 10,000 rounds", category: "honors-attacking-list" },
    { id: 22, name: "Lead Salad", requirement: "Fire 100,000 rounds", category: "honors-attacking-list" },
    { id: 23, name: "Peppered", requirement: "Fire 1,000,000 rounds", category: "honors-attacking-list" },
    { id: 24, name: "Blood Money", requirement: "Make $1,000,000 from a single mugging", category: "honors-attacking-list" },
    { id: 25, name: "Deadlock", requirement: "Stalemate 100 times", category: "honors-attacking-list" },
    { id: 26, name: "Yoink", requirement: "Successfully mug someone who just mugged someone else", category: "honors-attacking-list" },
    { id: 27, name: "007", requirement: "Win 1,000 attacks and 1,000 defends", category: "honors-attacking-list" },
    { id: 28, name: "Self Defense", requirement: "Win 50 Defends", category: "honors-attacking-list" },
    { id: 29, name: "Night Walker", requirement: "Win 100 stealthed attacks", category: "honors-attacking-list" },
    { id: 30, name: "Guardian Angel", requirement: "Defeat someone while they are attacking someone else", category: "honors-attacking-list" },
    { id: 31, name: "Semper Fortis", requirement: "Defeat someone who has more battle stats than you in a solo attack", category: "honors-attacking-list" },
    { id: 32, name: "Manu Forti", requirement: "Defeat someone who has at least double your battle stats in a solo attack", category: "honors-attacking-list" },
    { id: 33, name: "Vae Victis", requirement: "Defeat someone who has five times more battlestats than you in a solo attack", category: "honors-attacking-list" },
    { id: 34, name: "Survivalist", requirement: "Win an attack with only 1% life remaining", category: "honors-attacking-list" },
    { id: 35, name: "Fury", requirement: "Achieve 10,000 hits.", category: "honors-attacking-list" },
    { id: 36, name: "Boss Fight", requirement: "Participate in the defeat of Lootable NPC's.", category: "honors-attacking-list" },
    { id: 37, name: "1337", requirement: "Deal exactly 1,337 damage to an opponent in a single hit", category: "honors-attacking-list" },
    { id: 38, name: "Going Postal", requirement: "Defeat a company co-worker", category: "honors-attacking-list" },
    { id: 39, name: "Friendly Fire", requirement: "Defeat a fellow faction member", category: "honors-attacking-list" },
    { id: 40, name: "Church Mouse", requirement: "Be mugged for $1", category: "honors-attacking-list" },
    { id: 41, name: "Phoenix", requirement: "Defeat someone after losing to them within 10 minutes", category: "honors-attacking-list" },
    { id: 42, name: "Giant Slayer", requirement: "Receive loot from a defeated NPC", category: "honors-attacking-list" },
    { id: 43, name: "Bare", requirement: "Win 250 unarmored attacks or defends", category: "honors-attacking-list" },
    { id: 44, name: "Vengeance", requirement: "Successfully perform a faction retaliation hit", category: "honors-attacking-list" },
    { id: 45, name: "Invictus", requirement: "Successfully defend against someone who has at least double your battle stats", category: "honors-attacking-list" },
    { id: 46, name: "Finale", requirement: "Defeat someone on the 25th turn of an attack", category: "honors-attacking-list" },
    { id: 47, name: "Deadly Duo", requirement: "Defeat someone with your spouse", category: "honors-attacking-list" },
    { id: 48, name: "Lovestruck", requirement: "Defeat a married couple", category: "honors-attacking-list" },
    { id: 49, name: "Hands Solo", requirement: "Defeat someone using only your fists on May 4th", category: "honors-attacking-list" },
    { id: 50, name: "Triple Tap", requirement: "Achieve three headshots in a row", category: "honors-attacking-list" },
    { id: 51, name: "Chainer 1", requirement: "Participate in a 10 length chain", category: "honors-chaining-list" },
    { id: 52, name: "Chainer 2", requirement: "Participate in a 100 length chain", category: "honors-chaining-list" },
    { id: 53, name: "Chainer 3", requirement: "Participate in a 1,000 length chain", category: "honors-chaining-list" },
    { id: 54, name: "Chainer 4", requirement: "Participate in a 10,000 length chain", category: "honors-chaining-list" },
    { id: 55, name: "Chainer 5", requirement: "Participate in a 100,000 length chain", category: "honors-chaining-list" },
    { id: 56, name: "Carnage", requirement: "Make a single hit that earns your faction 10 or more respect", category: "honors-chaining-list" },
    { id: 57, name: "Massacre", requirement: "Make a single hit that earns your faction 100 or more respect", category: "honors-chaining-list" },
    { id: 58, name: "Genocide", requirement: "Make a single hit that earns your faction 1,000 or more respect", category: "honors-chaining-list" },
    { id: 59, name: "Chain Saver", requirement: "Save a 100+ chain 10 seconds before it breaks", category: "honors-chaining-list" },
    { id: 60, name: "Strongest Link", requirement: "Make 100 hits in a single chain", category: "honors-chaining-list" },
    { id: 61, name: "2800 Ft/S", requirement: "Achieve 100 finishing hits with rifles", category: "honors-weapons-list" },
    { id: 62, name: "Act of Faith", requirement: "Achieve 100 finishing hits with SMGs", category: "honors-weapons-list" },
    { id: 63, name: "Axe Wound", requirement: "Achieve 100 finishing hits with clubbing weapons", category: "honors-weapons-list" },
    { id: 64, name: "Cartridge Packer", requirement: "Achieve 100 finishing hits with shotguns", category: "honors-weapons-list" },
    { id: 65, name: "Lend A Hand", requirement: "Achieve 100 finishing hits with machine guns", category: "honors-weapons-list" },
    { id: 66, name: "Slasher", requirement: "Achieve 100 finishing hits with slashing weapons", category: "honors-weapons-list" },
    { id: 67, name: "The Stabbist", requirement: "Achieve 100 finishing hits with piercing weapons", category: "honors-weapons-list" },
    { id: 68, name: "Yours Says Replica...", requirement: "Achieve 100 finishing hits with pistols", category: "honors-weapons-list" },
    { id: 69, name: "Unarmed", requirement: "Achieve 100 fists or kick finishing hits", category: "honors-weapons-list" },
    { id: 70, name: "Stumped", requirement: "Achieve 100 finishing hits with heavy artillery", category: "honors-weapons-list" },
    { id: 71, name: "Machinist", requirement: "Achieve 100 finishing hits with mechanical weapons", category: "honors-weapons-list" },
    { id: 72, name: "Pin Puller", requirement: "Achieve 100 finishing hits with temporary weapons", category: "honors-weapons-list" },
    { id: 73, name: "Leonidas", requirement: "Achieve a finishing hit with Kick", category: "honors-weapons-list" },
    { id: 74, name: "Modded", requirement: "Equip two high-tier mods to a weapon", category: "honors-weapons-list" },
    { id: 75, name: "Specialist", requirement: "Achieve 100% EXP on 25 different weapons", category: "honors-weapons-list" },
    { id: 76, name: "Riddled", requirement: "Defeat an opponent after hitting at least 10 different body parts in a single attack", category: "honors-weapons-list" },
    { id: 77, name: "War Machine", requirement: "Achieve 1,000 finishing hits in every category", category: "honors-weapons-list" },
    { id: 78, name: "Surplus", requirement: "Use 100 rounds of special ammunition", category: "honors-weapons-list" },
    { id: 79, name: "Bandolier", requirement: "User 1,000 rounds of special ammunition", category: "honors-weapons-list" },
    { id: 80, name: "Quartermaster", requirement: "Use 10,000 rounds of special ammunition", category: "honors-weapons-list" },
    { id: 81, name: "Maimed", requirement: "Use 2,500 Hollow Point rounds", category: "honors-weapons-list" },
    { id: 82, name: "Dragon's Breath", requirement: "Use a 12 Gauge Incendiary round", category: "honors-weapons-list" },
    { id: 83, name: "Marked", requirement: "Use 2,500 Tracer rounds", category: "honors-weapons-list" },
    { id: 84, name: "Scorched", requirement: "Use 2,500 Incendiary rounds", category: "honors-weapons-list" },
    { id: 85, name: "Penetrated", requirement: "Use 2,500 Piercing rounds", category: "honors-weapons-list" },
    { id: 86, name: "Mod Boss", requirement: "Own at least 20 weapon mods", category: "honors-weapons-list" },
    { id: 87, name: "Gone Fishing", requirement: "Be defeated by a Trout", category: "honors-weapons-list" },
    { id: 135, name: "Woodland Camo", requirement: "5 Attacks Won", category: "misc-awards-list" },
    { id: 136, name: "Desert Storm Camo", requirement: "20 Attacks Won", category: "misc-awards-list" },
    { id: 137, name: "Urban Camo", requirement: "50 Attacks Won", category: "misc-awards-list" },
    { id: 138, name: "Arctic Camo", requirement: "100 Attacks Won", category: "misc-awards-list" },
    { id: 139, name: "Fall Camo", requirement: "250 Attacks Won", category: "misc-awards-list" },
    { id: 140, name: "Yellow Camo", requirement: "500 Attacks Won", category: "misc-awards-list" },
    { id: 141, name: "Digital Camo", requirement: "1,000 Attacks Won", category: "misc-awards-list" },
    { id: 142, name: "Red Camo", requirement: "2,000 Attacks Won", category: "misc-awards-list" },
    { id: 143, name: "Blue Camo", requirement: "3,000 Attacks Won", category: "misc-awards-list" },
    { id: 144, name: "Orange Camo", requirement: "4,000 Attacks Won", category: "misc-awards-list" },
    { id: 145, name: "Pink Camo", requirement: "5,000 Attacks Won", category: "misc-awards-list" },
    { id: 146, name: "Zebra Skin", requirement: "50 Hunting Skill", category: "misc-awards-list" },
    { id: 147, name: "Leopard Skin", requirement: "75 Hunting Skill", category: "misc-awards-list" },
    { id: 148, name: "Tiger Skin", requirement: "100 Hunting Skill", category: "misc-awards-list" },
    { id: 149, name: "Lucky Break", requirement: "Win the daily, weekly or monthly Lottery jackpot", category: "misc-awards-list" },
    { id: 150, name: "Jackpot", requirement: "Win the Slot Machine jackpot", category: "misc-awards-list" },
    { id: 151, name: "Poker King", requirement: "Reach a Poker score of 10 million", category: "misc-awards-list" },
    { id: 152, name: "Spinner", requirement: "Do 1,000 spins of the Roulette wheel", category: "misc-awards-list" },
    { id: 153, name: "Highs And Lows", requirement: "Achieve a win streak of 25 in High-Low", category: "misc-awards-list" },
    { id: 154, name: "One In Six", requirement: "Win 50 games of Foot Russian Roulette", category: "misc-awards-list" },
    { id: 155, name: "Daddy's New Shoes", requirement: "Win $100,000,000 in a single game of Russian Roulette", category: "misc-awards-list" },
    { id: 156, name: "Foot Soldier", requirement: "Beat 10 unique opponents in Russian Roulette", category: "misc-awards-list" },
    { id: 157, name: "Twenty-One", requirement: "Win a Natural, Six Card Charlie, Double Down and Insurance on Blackjack", category: "misc-awards-list" },
    { id: 158, name: "Awesome", requirement: "Win while spinning the Wheel of Awesome", category: "misc-awards-list" },
    { id: 159, name: "Mediocre", requirement: "Win while spinning the Wheel of Mediocrity", category: "misc-awards-list" },
    { id: 160, name: "Lame", requirement: "Win while spinning the Wheel of Lame", category: "misc-awards-list" },
    { id: 161, name: "Discovery", requirement: "Be in a faction which starts making a dirty bomb", category: "misc-awards-list" },
    { id: 162, name: "RDD", requirement: "Use a dirty bomb", category: "misc-awards-list" },
    { id: 163, name: "Slow Bomb", requirement: "Use a dirty bomb", category: "misc-awards-list" },
    { id: 164, name: "Spaced Out", requirement: "Overdose on Cannabis", category: "misc-awards-list" },
    { id: 165, name: "Who's Frank?", requirement: "Use 50 Cannabis", category: "misc-awards-list" },
    { id: 166, name: "I Think I See Dead People", requirement: "Use 50 Shrooms", category: "misc-awards-list" },
    { id: 167, name: "Party Animal", requirement: "Use 50 Ecstasy", category: "misc-awards-list" },
    { id: 168, name: "Acid Dream", requirement: "Use 50 LSD", category: "misc-awards-list" },
    { id: 169, name: "Painkiller", requirement: "Use 50 Vicodin", category: "misc-awards-list" },
    { id: 170, name: "Horse Tranquilizer", requirement: "Use 50 Ketamine", category: "misc-awards-list" },
    { id: 171, name: "The Fields Of Opium", requirement: "Use 50 Opium", category: "misc-awards-list" },
    { id: 172, name: "Crank It Up", requirement: "Use 50 Speed", category: "misc-awards-list" },
    { id: 173, name: "Angel Dust", requirement: "Use 50 PCP", category: "misc-awards-list" },
    { id: 174, name: "Free Energy", requirement: "Use 50 Xanax", category: "misc-awards-list" },
    { id: 217, name: "Pious", requirement: "Donate a total of $100,000 to the church", category: "misc-awards-list" },
    { id: 218, name: "Saintly", requirement: "Donate a total of $1,000,000 to the church", category: "misc-awards-list" },
    { id: 219, name: "Forgiven", requirement: "Be truly forgiven for all of your sins", category: "misc-awards-list" },
    { id: 220, name: "Devout", requirement: "Donate a total of $100,000,000 to the church", category: "misc-awards-list" },
    { id: 221, name: "Sacrificial", requirement: "Donate $1,000,000,000 to the church", category: "misc-awards-list" },
    { id: 222, name: "Repeat Offender", requirement: "Go to jail 250 times", category: "misc-awards-list" },
    { id: 223, name: "Bar Breaker", requirement: "Bust 1,000 players out of jail", category: "misc-awards-list" },
    { id: 224, name: "Aiding And Abetting", requirement: "Bust 2,500 players out of jail", category: "misc-awards-list" },
    { id: 225, name: "Don't Drop It", requirement: "Bust 10,000 players out of jail", category: "misc-awards-list" },
    { id: 226, name: "Freedom Isn't Free", requirement: "Bail 500 players out of jail", category: "misc-awards-list" },
    { id: 227, name: "Booboo", requirement: "Go to hospital 250 times", category: "misc-awards-list" },
    { id: 228, name: "Magical Veins", requirement: "Use 5,000 medical items", category: "misc-awards-list" },
    { id: 229, name: "Florence Nightingale", requirement: "Revive 500 players", category: "misc-awards-list" },
    { id: 230, name: "Second Chance", requirement: "Revive 1,000 players", category: "misc-awards-list" },
    { id: 231, name: "Vampire", requirement: "Random chance upon using a blood bag", category: "misc-awards-list" },
    { id: 232, name: "Clotted", requirement: "Hospitalize yourself by using the wrong blood bag or drinking some Ipecac Syrup.", category: "misc-awards-list" },
    { id: 233, name: "Transfusion", requirement: "Fill 250 blood bags", category: "misc-awards-list" },
    { id: 234, name: "Anaemic", requirement: "Fill 1,000 blood bags", category: "misc-awards-list" },
    { id: 235, name: "Miracle Worker", requirement: "Revive 10 people in 10 minutes", category: "misc-awards-list" },
    { id: 236, name: "Resurrection", requirement: "Revive someone you've just defeated", category: "misc-awards-list" },
    { id: 237, name: "Crucifixion", requirement: "Defeat someone you've just revived", category: "misc-awards-list" },
    { id: 238, name: "Welcome", requirement: "Be online everyday for 100 days", category: "misc-awards-list" },
    { id: 239, name: "Couch Potato", requirement: "Reach 1,000 hours of Time Played on Torn", category: "misc-awards-list" },
    { id: 240, name: "Fascination", requirement: "Stay married for 250 days", category: "misc-awards-list" },
    { id: 241, name: "Chasm", requirement: "Stay married for 750 days", category: "misc-awards-list" },
    { id: 242, name: "Stairway To Heaven", requirement: "Stay married for 1,500 days", category: "misc-awards-list" },
    { id: 243, name: "Alcoholic", requirement: "Drink 500 bottles of alcohol", category: "misc-awards-list" },
    { id: 244, name: "Sodaholic", requirement: "Drink 500 cans of energy drinks", category: "misc-awards-list" },
    { id: 245, name: "Diabetic", requirement: "Eat 500 bags of candy", category: "misc-awards-list" },
    { id: 246, name: "Optimist", requirement: "Find 1,000 items in dump", category: "misc-awards-list" },
    { id: 247, name: "Lavish", requirement: "Dump an item with a current market value of at least $1,000,000", category: "misc-awards-list" },
    { id: 248, name: "Bibliophile", requirement: "Read 10 books", category: "misc-awards-list" },
    { id: 249, name: "Worth It", requirement: "Use a stat enhancer", category: "misc-awards-list" },
    { id: 250, name: "Eco Friendly", requirement: "Trash 5,000 items", category: "misc-awards-list" },
    { id: 251, name: "Stinker", requirement: "Successfully prank someone with Stink Bombs", category: "misc-awards-list" },
    { id: 252, name: "Wipeout", requirement: "Successfully prank someone with Toilet Paper", category: "misc-awards-list" },
    { id: 253, name: "Bargain Hunter", requirement: "Win 10 auctions", category: "misc-awards-list" },
    { id: 254, name: "Foul Play", requirement: "Successfully prank someone with Dog Poop", category: "misc-awards-list" },
    { id: 255, name: "I'm Watching You", requirement: "Find 50 items in the city", category: "misc-awards-list" },
    { id: 256, name: "Middleman", requirement: "Have 100 different customers buy from your bazaar", category: "misc-awards-list" },
    { id: 257, name: "Collector", requirement: "Maintain an impressive display case of collectible items", category: "misc-awards-list" },
    { id: 258, name: "Radaway", requirement: "Use a Neumune Tablet to reduce radiation poisoning", category: "misc-awards-list" },
    { id: 259, name: "Energize", requirement: "Use 250 Energy Refills", category: "misc-awards-list" },
    { id: 260, name: "You've Got Some Nerve", requirement: "Use 250 Nerve Refills", category: "misc-awards-list" },
    { id: 261, name: "Compulsive", requirement: "Use 250 Casino Refills", category: "misc-awards-list" },
    { id: 262, name: "Seeker", requirement: "Reach 250 awards (honors and medals)", category: "misc-awards-list" },
    { id: 263, name: "Silicon Valley", requirement: "Code 100 viruses", category: "misc-awards-list" },
    { id: 264, name: "The Affronted", requirement: "Irritate all job interviewers", category: "misc-awards-list" },
    { id: 265, name: "Energetic", requirement: "Achieve the maximum of 1,000 energy", category: "misc-awards-list" },
    { id: 266, name: "Ecstatic", requirement: "Achieve the maximum of 99,999 happiness", category: "misc-awards-list" },
    { id: 267, name: "Christmas in Torn", requirement: "Login on Christmas Day", category: "misc-awards-list" },
    { id: 268, name: "Trick or Treat", requirement: "Login on Halloween", category: "misc-awards-list" },
    { id: 269, name: "Torniversary", requirement: "Login on November 15th", category: "misc-awards-list" },
    { id: 270, name: "Buffed", requirement: "Achieve 50 personal perks", category: "misc-awards-list" },
    { id: 271, name: "Web of Perks", requirement: "Achieve 100 personal perks", category: "misc-awards-list" },
    { id: 272, name: "OP", requirement: "Achieve 150 personal perks", category: "misc-awards-list" },
    { id: 273, name: "10-stack", requirement: "Increase a merit upgrade to its maximum", category: "misc-awards-list" },
    { id: 274, name: "Decorated", requirement: "Achieve 100 total awards", category: "misc-awards-list" },
    { id: 275, name: "Honored", requirement: "Achieve 500 total awards", category: "misc-awards-list" },
    { id: 276, name: "Time Traveller", requirement: "Survive a Torn City rollback", category: "misc-awards-list" },
    { id: 277, name: "Fresh Start", requirement: "Reset your merits", category: "misc-awards-list" },
    { id: 278, name: "Tornication", requirement: "Login on Valentine's Day", category: "misc-awards-list" },
    { id: 279, name: "Resolution", requirement: "Login on New Year's Day", category: "misc-awards-list" },
    { id: 280, name: "Leaderboard", requirement: "Achieve top 250 in one of the personal Hall of Fame leaderboards", category: "misc-awards-list" },
    { id: 281, name: "RNG", requirement: "Who knows?", category: "misc-awards-list" },
    { id: 282, name: "Historian", requirement: "Read a chronicle", category: "misc-awards-list" },
    { id: 283, name: "NiceNiceIntern", requirement: "100 job points used", category: "misc-awards-list" },
    { id: 284, name: "Stuck In a Rut", requirement: "1,000 job points used", category: "misc-awards-list" },
    { id: 285, name: "Overtime", requirement: "10,000 job points used", category: "misc-awards-list" },
    { id: 286, name: "Journalist", requirement: "Have an article published", category: "misc-awards-list" },
    { id: 287, name: "Velutinous", requirement: "Have a comic published", category: "misc-awards-list" },
    { id: 288, name: "Luxury Real Estate", requirement: "Own a Private Island with a Airstrip", category: "misc-awards-list" },
    { id: 289, name: "The High Life", requirement: "Own a Private Island with a Yacht", category: "misc-awards-list" },
    { id: 290, name: "Landlord", requirement: "Lease one of your properties to someone.", category: "misc-awards-list" },
    { id: 291, name: "Protege", requirement: "Complete the mission introduction: Duke", category: "misc-awards-list" },
    { id: 292, name: "Mercenary", requirement: "Complete 1,000 mission contracts", category: "misc-awards-list" },
    { id: 293, name: "Task Master", requirement: "Earn 10,000 mission credits", category: "misc-awards-list" },
    { id: 294, name: "Driving Elite", requirement: "Reach Class A", category: "misc-awards-list" },
    { id: 295, name: "Redline", requirement: "250 wins in the same car", category: "misc-awards-list" },
    { id: 296, name: "Motorhead", requirement: "Achieve a driver skill of 10", category: "misc-awards-list" },
    { id: 297, name: "Wrecked", requirement: "Crash during a race", category: "misc-awards-list" },
    { id: 298, name: "Checkered Past", requirement: "Win 100 races", category: "misc-awards-list" },
    { id: 299, name: "On Track", requirement: "Earn 2,500 Racing Points", category: "misc-awards-list" },
    { id: 300, name: "Two's Company", requirement: "Refer 1 player who reaches level 10", category: "misc-awards-list" },
    { id: 301, name: "Three's A Crowd", requirement: "Refer 2 players who reach level 10", category: "misc-awards-list" },
    { id: 302, name: "Social Butterfly", requirement: "Refer 3 players who reach level 10", category: "misc-awards-list" },
    { id: 303, name: "Pyramid Scheme", requirement: "Have one of your referrals refer another player who goes on to reach level 10", category: "misc-awards-list" },
    // ... This continues for all honors
];


const allMedals = [
    { id: 1, name: "Anti Social", requirement: "Win 50 attacks", category: "medals-combat-list" },
    { id: 2, name: "Happy Slapper", requirement: "Win 250 attacks", category: "medals-combat-list" },
    { id: 3, name: "Scar Maker", requirement: "Win 500 attacks", category: "medals-combat-list" },
    { id: 4, name: "Tooth and Nail", requirement: "Win 1,250 attacks", category: "medals-combat-list" },
    { id: 5, name: "Heart Breaker", requirement: "Win 5,000 attacks", category: "medals-combat-list" },
    { id: 6, name: "Going Postal", requirement: "Win 2,500 attacks", category: "medals-combat-list" },
    { id: 7, name: "Somebody Call 911", requirement: "Win 10,000 attacks", category: "medals-combat-list" },
    { id: 8, name: "Hired Gun", requirement: "Collect 25 bounties", category: "medals-combat-list" },
    { id: 9, name: "Bone Collector", requirement: "Collect 100 bounties", category: "medals-combat-list" },
    { id: 10, name: "The Fett", requirement: "Collect 500 bounties", category: "medals-combat-list" },
    { id: 11, name: "Boom Headshot", requirement: "Deal 500 critical hits", category: "medals-combat-list" },
    { id: 12, name: "Pwned in the face", requirement: "Deal 2,500 critical hits", category: "medals-combat-list" },
    { id: 13, name: "Lee Harvey Oswald", requirement: "Deal 10,000 critical hits", category: "medals-combat-list" },
    { id: 14, name: "Bouncer", requirement: "Win 50 defends", category: "medals-combat-list" },
    { id: 15, name: "Brick wall", requirement: "Win 250 defends", category: "medals-combat-list" },
    { id: 16, name: "Turtle", requirement: "Win 500 defends", category: "medals-combat-list" },
    { id: 17, name: "Solid as a Rock", requirement: "Win 2,500 defends", category: "medals-combat-list" },
    { id: 18, name: "Fortress", requirement: "Win 10,000 defends", category: "medals-combat-list" },
    { id: 19, name: "Ego Smashing", requirement: "50 enemies Escape from you", category: "medals-combat-list" },
    { id: 20, name: "Underestimated", requirement: "250 enemies Escape from you", category: "medals-combat-list" },
    { id: 21, name: "Run Forrest Run", requirement: "1,000 enemies Escape from you", category: "medals-combat-list" },
    { id: 22, name: "Strike", requirement: "Win 25 consecutive fights", category: "medals-combat-list" },
    { id: 23, name: "Barrage", requirement: "Win 50 consecutive fights", category: "medals-combat-list" },
    { id: 24, name: "Skirmish", requirement: "Win 100 consecutive fights", category: "medals-combat-list" },
    { id: 25, name: "Blitzkrieg", requirement: "Win 250 consecutive fights", category: "medals-combat-list" },
    { id: 26, name: "Onslaught", requirement: "Win 500 consecutive fights", category: "medals-combat-list" },
    { id: 27, name: "Recruit", requirement: "Earn 100 respect", category: "medals-combat-list" },
    { id: 28, name: "Associate", requirement: "Earn 500 respect", category: "medals-combat-list" },
    { id: 29, name: "Picciotto", requirement: "Earn 1,000 respect", category: "medals-combat-list" },
    { id: 30, name: "Soldier", requirement: "Earn 2,500 respect", category: "medals-combat-list" },
    { id: 31, name: "Capo", requirement: "Earn 5,000 respect", category: "medals-combat-list" },
    { id: 32, name: "Contabile", requirement: "Earn 10,000 respect", category: "medals-combat-list" },
    { id: 33, name: "Consigliere", requirement: "Earn 25,000 respect", category: "medals-combat-list" },
    { id: 34, name: "Underboss", requirement: "Earn 50,000 respect", category: "medals-combat-list" },
    { id: 35, name: "Boss", requirement: "Earn 75,000 respect", category: "medals-combat-list" },
    { id: 36, name: "Boss Of All Bosses", requirement: "Earn 100,000 respect", category: "medals-combat-list" },
    { id: 37, name: "Close escape", requirement: "Escape from 50 enemies", category: "medals-combat-list" },
    { id: 38, name: "Blind Judgement", requirement: "Escape from 250 enemies", category: "medals-combat-list" },
    { id: 39, name: "Overzealous", requirement: "Escape from 1,000 enemies", category: "medals-combat-list" },
    { id: 40, name: "Level Five", requirement: "Reach level Five", category: "medals-commitment-list" },
    { id: 41, name: "Level Ten", requirement: "Reach level Ten", category: "medals-commitment-list" },
    { id: 42, name: "Level Fifteen", requirement: "Reach level Fifteen", category: "medals-commitment-list" },
    { id: 43, name: "Level Twenty", requirement: "Reach level Twenty", category: "medals-commitment-list" },
    { id: 44, name: "Level Twenty Five", requirement: "Reach level Twenty Five", category: "medals-commitment-list" },
    { id: 45, name: "Level Thirty", requirement: "Reach level Thirty", category: "medals-commitment-list" },
    { id: 46, name: "Level Thirty Five", requirement: "Reach level Thirty Five", category: "medals-commitment-list" },
    { id: 47, name: "Level Forty", requirement: "Reach level Forty", category: "medals-commitment-list" },
    { id: 48, name: "Level Forty Five", requirement: "Reach level Forty Five", category: "medals-commitment-list" },
    { id: 49, name: "Level Fifty", requirement: "Reach level Fifty", category: "medals-commitment-list" },
    { id: 50, name: "Level Fifty Five", requirement: "Reach level Fifty Five", category: "medals-commitment-list" },
    { id: 51, name: "Level Sixty", requirement: "Reach level Sixty", category: "medals-commitment-list" },
    { id: 52, name: "Level Sixty Five", requirement: "Reach level Sixty Five", category: "medals-commitment-list" },
    { id: 53, name: "Level Seventy", requirement: "Reach level Seventy", category: "medals-commitment-list" },
    { id: 54, name: "Level Seventy Five", requirement: "Reach level Seventy Five", category: "medals-commitment-list" },
    { id: 55, name: "Level Eighty", requirement: "Reach level Eighty", category: "medals-commitment-list" },
    { id: 56, name: "Level Eighty Five", requirement: "Reach level Eighty Five", category: "medals-commitment-list" },
    { id: 57, name: "Level Ninety", requirement: "Reach level Ninety", category: "medals-commitment-list" },
    { id: 58, name: "Level Ninety Five", requirement: "Reach level Ninety Five", category: "medals-commitment-list" },
    { id: 59, name: "Level One Hundred", requirement: "Reach level One Hundred", category: "medals-commitment-list" },
    { id: 60, name: "One Year of Service", requirement: "Live in Torn for One Year", category: "medals-commitment-list" },
    { id: 61, name: "Two Years of Service", requirement: "Live in Torn for Two Years", category: "medals-commitment-list" },
    { id: 62, name: "Three Years of Service", requirement: "Live in Torn for Three Years", category: "medals-commitment-list" },
    { id: 63, name: "Four Years of Service", requirement: "Live in Torn for Four Years", category: "medals-commitment-list" },
    { id: 64, name: "Five Years of Service", requirement: "Live in Torn for Five Years", category: "medals-commitment-list" },
    { id: 65, name: "Six Years of Service", requirement: "Live in Torn for Six Years", category: "medals-commitment-list" },
    { id: 66, name: "Seven Years of Service", requirement: "Live in Torn for Seven Years", category: "medals-commitment-list" },
    { id: 67, name: "Eight Years of Service", requirement: "Live in Torn for Eight Years", category: "medals-commitment-list" },
    { id: 68, name: "Nine Years of Service", requirement: "Live in Torn for Nine Years", category: "medals-commitment-list" },
    { id: 69, name: "Ten Years of Service", requirement: "Live in Torn for Ten Years", category: "medals-commitment-list" },
    { id: 70, name: "Citizenship", requirement: "Be a donator for 30 days", category: "medals-commitment-list" },
    { id: 71, name: "Devoted", requirement: "Be a donator for 100 days", category: "medals-commitment-list" },
    { id: 72, name: "Diligent", requirement: "Be a donator for 250 days", category: "medals-commitment-list" },
    { id: 73, name: "Valiant", requirement: "Be a donator for 500 days", category: "medals-commitment-list" },
    { id: 74, name: "Patriotic", requirement: "Be a donator for 1,000 days", category: "medals-commitment-list" },
    { id: 75, name: "Apprentice Faction Member", requirement: "Same faction for 100 days", category: "medals-commitment-list" },
    { id: 76, name: "Committed Faction Member", requirement: "Same faction for 200 days", category: "medals-commitment-list" },
    { id: 77, name: "Loyal Faction Member", requirement: "Same faction for 300 days", category: "medals-commitment-list" },
    { id: 78, name: "Dedicated Faction Member", requirement: "Same faction for 400 days", category: "medals-commitment-list" },
    { id: 79, name: "Faithful Faction Member", requirement: "Same faction for 500 days", category: "medals-commitment-list" },
    { id: 80, name: "Allegiant Faction Member", requirement: "Same faction for 600 days", category: "medals-commitment-list" },
    { id: 81, name: "Devoted Faction Member", requirement: "Same faction for 700 days", category: "medals-commitment-list" },
    { id: 82, name: "Dutiful Faction Member", requirement: "Same faction for 800 days", category: "medals-commitment-list" },
    { id: 83, name: "Flawless Faction Member", requirement: "Same faction for 900 days", category: "medals-commitment-list" },
    { id: 84, name: "Honorable Faction Member", requirement: "Same faction for 1,000 days", category: "medals-commitment-list" },
    { id: 85, name: "Silver Anniversary", requirement: "Same spouse for 50 consecutive days", category: "medals-commitment-list" },
    { id: 86, name: "Ruby Anniversary", requirement: "Same spouse for 100 consecutive days", category: "medals-commitment-list" },
    { id: 87, name: "Sapphire Anniversary", requirement: "Same spouse for 150 consecutive days", category: "medals-commitment-list" },
    { id: 88, name: "Emerald Anniversary", requirement: "Same spouse for 200 consecutive days", category: "medals-commitment-list" },
    { id: 89, name: "Gold Anniversary", requirement: "Same spouse for 250 consecutive days", category: "medals-commitment-list" },
    { id: 90, name: "Diamond Anniversary", requirement: "Same spouse for 300 consecutive days", category: "medals-commitment-list" },
    { id: 91, name: "Platinum Anniversary", requirement: "Same spouse for 350 consecutive days", category: "medals-commitment-list" },
    { id: 92, name: "Double Silver Anniversary", requirement: "Same spouse for 400 consecutive days", category: "medals-commitment-list" },
    { id: 93, name: "Double Ruby Anniversary", requirement: "Same spouse for 450 consecutive days", category: "medals-commitment-list" },
    { id: 94, name: "Double Sapphire Anniversary", requirement: "Same spouse for 500 consecutive days", category: "medals-commitment-list" },
    { id: 95, name: "Double Emerald Anniversary", requirement: "Same spouse for 550 consecutive days", category: "medals-commitment-list" },
    { id: 96, name: "Double Gold Anniversary", requirement: "Same spouse for 600 consecutive days", category: "medals-commitment-list" },
    { id: 97, name: "Double Diamond Anniversary", requirement: "Same spouse for 650 consecutive days", category: "medals-commitment-list" },
    { id: 98, name: "Double Platinum Anniversary", requirement: "Same spouse for 700 consecutive days", category: "medals-commitment-list" },
    { id: 99, name: "Triple Silver Anniversary", requirement: "Same spouse for 750 consecutive days", category: "medals-commitment-list" },
    { id: 100, name: "Triple Ruby Anniversary", requirement: "Same spouse for 800 consecutive days", category: "medals-commitment-list" },
    { id: 101, name: "Triple Sapphire Anniversary", requirement: "Same spouse for 850 consecutive days", category: "medals-commitment-list" },
    { id: 102, name: "Triple Emerald Anniversary", requirement: "Same spouse for 900 consecutive days", category: "medals-commitment-list" },
    { id: 103, name: "Triple Gold Anniversary", requirement: "Same spouse for 1,000 consecutive days", category: "medals-commitment-list" },
    { id: 104, name: "Triple Diamond Anniversary", requirement: "Same spouse for 1,500 consecutive days", category: "medals-commitment-list" },
    { id: 105, name: "Triple Platinum Anniversary", requirement: "Same spouse for 2,000 consecutive days", category: "medals-commitment-list" },
    { id: 106, name: "Beginner", requirement: "Reach the rank of \"Beginner\"", category: "medals-commitment-list" },
    { id: 107, name: "Inexperienced", requirement: "Reach the rank of \"Inexperienced\"", category: "medals-commitment-list" },
    { id: 108, name: "Rookie", requirement: "Reach the rank of \"Rookie\"", category: "medals-commitment-list" },
    { id: 109, name: "Novice", requirement: "Reach the rank of \"Novice\"", category: "medals-commitment-list" },
    { id: 110, name: "Below Average", requirement: "Reach the rank of \"Below Average\"", category: "medals-commitment-list" },
    { id: 111, name: "Average", requirement: "Reach the rank of \"Average\"", category: "medals-commitment-list" },
    { id: 112, name: "Reasonable", requirement: "Reach the rank of \"Reasonable\"", category: "medals-commitment-list" },
    { id: 113, name: "Above Average", requirement: "Reach the rank of \"Above Average\"", category: "medals-commitment-list" },
    { id: 114, name: "Competent", requirement: "Reach the rank of \"Competent\"", category: "medals-commitment-list" },
    { id: 115, name: "Highly Competent", requirement: "Reach the rank of \"Highly Competent\"", category: "medals-commitment-list" },
    { id: 116, name: "Veteran", requirement: "Reach the rank of \"Veteran\"", category: "medals-commitment-list" },
    { id: 117, name: "Distinguished", requirement: "Reach the rank of \"Distinguished\"", category: "medals-commitment-list" },
    { id: 118, name: "Highly Distinguished", requirement: "Reach the rank of \"Highly Distinguished\"", category: "medals-commitment-list" },
    { id: 119, name: "Professional", requirement: "Reach the rank of \"Professional\"", category: "medals-commitment-list" },
    { id: 120, name: "Star", requirement: "Reach the rank of \"Star\"", category: "medals-commitment-list" },
    { id: 121, name: "Master", requirement: "Reach the rank of \"Master\"", category: "medals-commitment-list" },
    { id: 122, name: "Outstanding", requirement: "Reach the rank of \"Outstanding\"", category: "medals-commitment-list" },
    { id: 123, name: "Celebrity", requirement: "Reach the rank of \"Celebrity\"", category: "medals-commitment-list" },
    { id: 124, name: "Supreme", requirement: "Reach the rank of \"Supreme\"", category: "medals-commitment-list" },
    { id: 125, name: "Idolized", requirement: "Reach the rank of \"Idolized\"", category: "medals-commitment-list" },
    { id: 126, name: "Champion", requirement: "Reach the rank of \"Champion\"", category: "medals-commitment-list" },
    { id: 127, name: "Heroic", requirement: "Reach the rank of \"Heroic\"", category: "medals-commitment-list" },
    { id: 128, name: "Legendary", requirement: "Reach the rank of \"Legendary\"", category: "medals-commitment-list" },
    { id: 129, name: "Elite", requirement: "Reach the rank of \"Elite\"", category: "medals-commitment-list" },
    { id: 130, name: "Invincible", requirement: "Reach the rank of \"Invincible\"", category: "medals-commitment-list" },
    { id: 131, name: "Trainee Troublemaker", requirement: "Commit 100 Criminal offenses", category: "medals-crimes-list" },
    { id: 132, name: "Budding Bandit", requirement: "Commit 200 Criminal offenses", category: "medals-crimes-list" },
    { id: 133, name: "Aspiring Assailant", requirement: "Commit 300 Criminal offenses", category: "medals-crimes-list" },
    { id: 134, name: "Fledgling Felon", requirement: "Commit 500 Criminal offenses", category: "medals-crimes-list" },
    { id: 135, name: "Freshman Fiend", requirement: "Commit 750 Criminal offenses", category: "medals-crimes-list" },
    { id: 136, name: "Despicable Deviant", requirement: "Commit 1,000 Criminal offenses", category: "medals-crimes-list" },
    { id: 137, name: "Conniving Culprit", requirement: "Commit 1,500 Criminal offenses", category: "medals-crimes-list" },
    { id: 138, name: "Sordid Sinner", requirement: "Commit 2,000 Criminal offenses", category: "medals-crimes-list" },
    { id: 139, name: "Polished Perpetrator", requirement: "Commit 2,500 Criminal offenses", category: "medals-crimes-list" },
    { id: 140, name: "Relentless Reprobate", requirement: "Commit 3,000 Criminal offenses", category: "medals-crimes-list" },
    { id: 141, name: "Resolute Rogue", requirement: "Commit 4,000 Criminal offenses", category: "medals-crimes-list" },
    { id: 142, name: "Veteran Villain", requirement: "Commit 5,000 Criminal offenses", category: "medals-crimes-list" },
    { id: 143, name: "Masterful Miscreant", requirement: "Commit 6,000 Criminal offenses", category: "medals-crimes-list" },
    { id: 144, name: "Merciless Malefactor", requirement: "Commit 7,500 Criminal offenses", category: "medals-crimes-list" },
    { id: 145, name: "Legendary Lawbreaker", requirement: "Commit 10,000 Criminal offenses", category: "medals-crimes-list" },
    { id: 146, name: "Petty Pilferer", requirement: "Commit 100 Theft offenses", category: "medals-crimes-list" },
    { id: 147, name: "Crafty Crook", requirement: "Commit 200 Theft offenses", category: "medals-crimes-list" },
    { id: 148, name: "Nifty Nicker", requirement: "Commit 300 Theft offenses", category: "medals-crimes-list" },
    { id: 149, name: "Sneaky Snatcher", requirement: "Commit 500 Theft offenses", category: "medals-crimes-list" },
    { id: 150, name: "Brazen Booster", requirement: "Commit 750 Theft offenses", category: "medals-crimes-list" },
    { id: 151, name: "Stealthy Stealer", requirement: "Commit 1,000 Theft offenses", category: "medals-crimes-list" },
    { id: 152, name: "Rampant Robber", requirement: "Commit 1,500 Theft offenses", category: "medals-crimes-list" },
    { id: 153, name: "Bold Burglar", requirement: "Commit 2,000 Theft offenses", category: "medals-crimes-list" },
    { id: 154, name: "Invisible Intruder", requirement: "Commit 2,500 Theft offenses", category: "medals-crimes-list" },
    { id: 155, name: "Lucrative Larcenist", requirement: "Commit 3,000 Theft offenses", category: "medals-crimes-list" },
    { id: 156, name: "Looting Luminary", requirement: "Commit 4,000 Theft offenses", category: "medals-crimes-list" },
    { id: 157, name: "Formidable Filcher", requirement: "Commit 5,000 Theft offenses", category: "medals-crimes-list" },
    { id: 158, name: "Sophisticated Swiper", requirement: "Commit 6,000 Theft offenses", category: "medals-crimes-list" },
    { id: 159, name: "Notorious Nabber", requirement: "Commit 7,500 Theft offenses", category: "medals-crimes-list" },
    { id: 160, name: "Prolific Plunderer", requirement: "Commit 10,000 Theft offenses", category: "medals-crimes-list" },
    { id: 161, name: "Sinister Scoundrel", requirement: "Commit 100 Vandalism offenses", category: "medals-crimes-list" },
    { id: 162, name: "Devious Delinquent", requirement: "Commit 200 Vandalism offenses", category: "medals-crimes-list" },
    { id: 163, name: "Rebellious Ruffian", requirement: "Commit 300 Vandalism offenses", category: "medals-crimes-list" },
    { id: 164, name: "Artistic Anarchist", requirement: "Commit 500 Vandalism offenses", category: "medals-crimes-list" },
    { id: 165, name: "Renegade Rascal", requirement: "Commit 750 Vandalism offenses", category: "medals-crimes-list" },
    { id: 166, name: "Decisive Defacer", requirement: "Commit 1,000 Vandalism offenses", category: "medals-crimes-list" },
    { id: 167, name: "Villainous Vandal", requirement: "Commit 1,500 Vandalism offenses", category: "medals-crimes-list" },
    { id: 168, name: "Menacing Misfit", requirement: "Commit 2,000 Vandalism offenses", category: "medals-crimes-list" },
    { id: 169, name: "Radical Rebel", requirement: "Commit 2,500 Vandalism offenses", category: "medals-crimes-list" },
    { id: 170, name: "Urban Upsetter", requirement: "Commit 3,000 Vandalism offenses", category: "medals-crimes-list" },
    { id: 171, name: "Malicious Maverick", requirement: "Commit 4,000 Vandalism offenses", category: "medals-crimes-list" },
    { id: 172, name: "Reckless Renovator", requirement: "Commit 5,000 Vandalism offenses", category: "medals-crimes-list" },
    { id: 173, name: "Dynamic Destructor", requirement: "Commit 6,000 Vandalism offenses", category: "medals-crimes-list" },
    { id: 174, name: "Infernal Instigator", requirement: "Commit 7,500 Vandalism offenses", category: "medals-crimes-list" },
    { id: 175, name: "Nefarious Nihilist", requirement: "Commit 10,000 Vandalism offenses", category: "medals-crimes-list" },
    { id: 176, name: "Digital Duplicator", requirement: "Commit 100 Counterfeiting offenses", category: "medals-crimes-list" },
    { id: 177, name: "Covert Copier", requirement: "Commit 200 Counterfeiting offenses", category: "medals-crimes-list" },
    { id: 178, name: "Resourceful Replicator", requirement: "Commit 300 Counterfeiting offenses", category: "medals-crimes-list" },
    { id: 179, name: "Mimicking Maestro", requirement: "Commit 500 Counterfeiting offenses", category: "medals-crimes-list" },
    { id: 180, name: "Faux Fabricator", requirement: "Commit 750 Counterfeiting offenses", category: "medals-crimes-list" },
    { id: 181, name: "Mock Manufacturer", requirement: "Commit 1,000 Counterfeiting offenses", category: "medals-crimes-list" },
    { id: 182, name: "Furtive Faker", requirement: "Commit 1,500 Counterfeiting offenses", category: "medals-crimes-list" },
    { id: 183, name: "Duplicitous Designer", requirement: "Commit 2,000 Counterfeiting offenses", category: "medals-crimes-list" },
    { id: 184, name: "Counterfeit Crafter", requirement: "Commit 2,500 Counterfeiting offenses", category: "medals-crimes-list" },
    { id: 185, name: "Emphatic Emulator", requirement: "Commit 3,000 Counterfeiting offenses", category: "medals-crimes-list" },
    { id: 186, name: "Meticulous Maker", requirement: "Commit 4,000 Counterfeiting offenses", category: "medals-crimes-list" },
    { id: 187, name: "Artificial Artisan", requirement: "Commit 5,000 Counterfeiting offenses", category: "medals-crimes-list" },
    { id: 188, name: "Impeccable Imitator", requirement: "Commit 6,000 Counterfeiting offenses", category: "medals-crimes-list" },
    { id: 189, name: "Bogus Buccaneer", requirement: "Commit 7,500 Counterfeiting offenses", category: "medals-crimes-list" },
    { id: 190, name: "Famed Forger", requirement: "Commit 10,000 Counterfeiting offenses", category: "medals-crimes-list" },
    { id: 191, name: "Troublesome Trickster", requirement: "Commit 100 Fraud offenses", category: "medals-crimes-list" },
    { id: 192, name: "Shameless Shyster", requirement: "Commit 200 Fraud offenses", category: "medals-crimes-list" },
    { id: 193, name: "Greedy Grifter", requirement: "Commit 300 Fraud offenses", category: "medals-crimes-list" },
    { id: 194, name: "Daring Deceiver", requirement: "Commit 500 Fraud offenses", category: "medals-crimes-list" },
    { id: 195, name: "Provocative Persuader", requirement: "Commit 750 Fraud offenses", category: "medals-crimes-list" },
    { id: 196, name: "Dexterous Defrauder", requirement: "Commit 1,000 Fraud offenses", category: "medals-crimes-list" },
    { id: 197, name: "Enterprising Enticer", requirement: "Commit 1,500 Fraud offenses", category: "medals-crimes-list" },
    { id: 198, name: "Blackhearted Bluffer", requirement: "Commit 2,000 Fraud offenses", category: "medals-crimes-list" },
    { id: 199, name: "Scheming Scammer", requirement: "Commit 2,500 Fraud offenses", category: "medals-crimes-list" },
    { id: 200, name: "Swanky Swindler", requirement: "Commit 3,000 Fraud offenses", category: "medals-crimes-list" },
    { id: 201, name: "Impressive Imposter", requirement: "Commit 4,000 Fraud offenses", category: "medals-crimes-list" },
    { id: 202, name: "Canny Conman", requirement: "Commit 5,000 Fraud offenses", category: "medals-crimes-list" },
    { id: 203, name: "Frenzied Fraudster", requirement: "Commit 6,000 Fraud offenses", category: "medals-crimes-list" },
    { id: 204, name: "Bankrupting Bilker", requirement: "Commit 7,500 Fraud offenses", category: "medals-crimes-list" },
    { id: 205, name: "Misdirection Master", requirement: "Commit 10,000 Fraud offenses", category: "medals-crimes-list" },
    { id: 206, name: "Underworld Upstart", requirement: "Commit 100 Illicit services offenses", category: "medals-crimes-list" },
    { id: 207, name: "Murky Middleman", requirement: "Commit 200 Illicit services offenses", category: "medals-crimes-list" },
    { id: 208, name: "Grievous Goon", requirement: "Commit 300 Illicit services offenses", category: "medals-crimes-list" },
    { id: 209, name: "Heinous Henchman", requirement: "Commit 500 Illicit services offenses", category: "medals-crimes-list" },
    { id: 210, name: "Hardworking Heavy", requirement: "Commit 750 Illicit services offenses", category: "medals-crimes-list" },
    { id: 211, name: "Intrepid Intermediary", requirement: "Commit 1,000 Illicit services offenses", category: "medals-crimes-list" },
    { id: 212, name: "Crooked Connector", requirement: "Commit 1,500 Illicit services offenses", category: "medals-crimes-list" },
    { id: 213, name: "Belligerent Broker", requirement: "Commit 2,000 Illicit services offenses", category: "medals-crimes-list" },
    { id: 214, name: "Criminal Contractor", requirement: "Commit 2,500 Illicit services offenses", category: "medals-crimes-list" },
    { id: 215, name: "Dark Dealmaker", requirement: "Commit 3,000 Illicit services offenses", category: "medals-crimes-list" },
    { id: 216, name: "Lawless Liaison", requirement: "Commit 4,000 Illicit services offenses", category: "medals-crimes-list" },
    { id: 217, name: "Clandestine Collaborator", requirement: "Commit 5,000 Illicit services offenses", category: "medals-crimes-list" },
    { id: 218, name: "Felonious Facilitator", requirement: "Commit 6,000 Illicit services offenses", category: "medals-crimes-list" },
    { id: 219, name: "Amoral Arbitrator", requirement: "Commit 7,500 Illicit services offenses", category: "medals-crimes-list" },
    { id: 220, name: "Vice Vendor", requirement: "Commit 10,000 Illicit services offenses", category: "medals-crimes-list" },
    { id: 221, name: "Web Wizard", requirement: "Commit 100 Cybercrime offenses", category: "medals-crimes-list" },
    { id: 222, name: "Digital Desperado", requirement: "Commit 200 Cybercrime offenses", category: "medals-crimes-list" },
    { id: 223, name: "Tech Tinkerer", requirement: "Commit 300 Cybercrime offenses", category: "medals-crimes-list" },
    { id: 224, name: "Virtual Virtuoso", requirement: "Commit 500 Cybercrime offenses", category: "medals-crimes-list" },
    { id: 225, name: "Phishing Phenom", requirement: "Commit 750 Cybercrime offenses", category: "medals-crimes-list" },
    { id: 226, name: "Network Ninja", requirement: "Commit 1,000 Cybercrime offenses", category: "medals-crimes-list" },
    { id: 227, name: "Expert Exploiter", requirement: "Commit 1,500 Cybercrime offenses", category: "medals-crimes-list" },
    { id: 228, name: "Data Dynamo", requirement: "Commit 2,000 Cybercrime offenses", category: "medals-crimes-list" },
    { id: 229, name: "Code Commando", requirement: "Commit 2,500 Cybercrime offenses", category: "medals-crimes-list" },
    { id: 230, name: "Online Outlaw", requirement: "Commit 3,000 Cybercrime offenses", category: "medals-crimes-list" },
    { id: 231, name: "Malware Mogul", requirement: "Commit 4,000 Cybercrime offenses", category: "medals-crimes-list" },
    { id: 232, name: "System Saboteur", requirement: "Commit 5,000 Cybercrime offenses", category: "medals-crimes-list" },
    { id: 233, name: "Heinous Hacker", requirement: "Commit 6,000 Cybercrime offenses", category: "medals-crimes-list" },
    { id: 234, name: "Backdoor Baron", requirement: "Commit 7,500 Cybercrime offenses", category: "medals-crimes-list" },
    { id: 235, name: "Byte Boss", requirement: "Commit 10,000 Cybercrime offenses", category: "medals-crimes-list" },
    { id: 236, name: "Budding Bully", requirement: "Commit 100 Extortion offenses", category: "medals-crimes-list" },
    { id: 237, name: "Novice Negotiator", requirement: "Commit 200 Extortion offenses", category: "medals-crimes-list" },
    { id: 238, name: "Cunning Coercer", requirement: "Commit 300 Extortion offenses", category: "medals-crimes-list" },
    { id: 239, name: "Professional Pressurer", requirement: "Commit 500 Extortion offenses", category: "medals-crimes-list" },
    { id: 240, name: "Haughty Harasser", requirement: "Commit 750 Extortion offenses", category: "medals-crimes-list" },
    { id: 241, name: "Calculating Coaxer", requirement: "Commit 1,000 Extortion offenses", category: "medals-crimes-list" },
    { id: 242, name: "Exceptional Extortionist", requirement: "Commit 1,500 Extortion offenses", category: "medals-crimes-list" },
    { id: 243, name: "Polished Persuader", requirement: "Commit 2,000 Extortion offenses", category: "medals-crimes-list" },
    { id: 244, name: "Effective Enforcer", requirement: "Commit 2,500 Extortion offenses", category: "medals-crimes-list" },
    { id: 245, name: "Industrious Intimidator", requirement: "Commit 3,000 Extortion offenses", category: "medals-crimes-list" },
    { id: 246, name: "Ruthless Racketeer", requirement: "Commit 4,000 Extortion offenses", category: "medals-crimes-list" },
    { id: 247, name: "Ominous Oppressor", requirement: "Commit 5,000 Extortion offenses", category: "medals-crimes-list" },
    { id: 248, name: "Vindictive Victimizer", requirement: "Commit 6,000 Extortion offenses", category: "medals-crimes-list" },
    { id: 249, name: "Master Manipulator", requirement: "Commit 7,500 Extortion offenses", category: "medals-crimes-list" },
    { id: 250, name: "Tyrannical Terrorizer", requirement: "Commit 10,000 Extortion offenses", category: "medals-crimes-list" },
    { id: 251, name: "Grass Grower", requirement: "Commit 100 Illegal production offenses", category: "medals-crimes-list" },
    { id: 252, name: "Dope Developer", requirement: "Commit 200 Illegal production offenses", category: "medals-crimes-list" },
    { id: 253, name: "Seedy Supplier", requirement: "Commit 300 Illegal production offenses", category: "medals-crimes-list" },
    { id: 254, name: "Blackmarket Botanist", requirement: "Commit 500 Illegal production offenses", category: "medals-crimes-list" },
    { id: 255, name: "Narcotics Nurturer", requirement: "Commit 750 Illegal production offenses", category: "medals-crimes-list" },
    { id: 256, name: "Revered Refiner", requirement: "Commit 1,000 Illegal production offenses", category: "medals-crimes-list" },
    { id: 257, name: "Forbidden Fabricator", requirement: "Commit 1,500 Illegal production offenses", category: "medals-crimes-list" },
    { id: 258, name: "Back-alley Builder", requirement: "Commit 2,000 Illegal production offenses", category: "medals-crimes-list" },
    { id: 259, name: "Contraband Creator", requirement: "Commit 2,500 Illegal production offenses", category: "medals-crimes-list" },
    { id: 260, name: "Covert Craftsman", requirement: "Commit 3,000 Illegal production offenses", category: "medals-crimes-list" },
    { id: 261, name: "Illicit Innovator", requirement: "Commit 4,000 Illegal production offenses", category: "medals-crimes-list" },
    { id: 262, name: "Prohibited Producer", requirement: "Commit 5,000 Illegal production offenses", category: "medals-crimes-list" },
    { id: 263, name: "Workshop Wizard", requirement: "Commit 6,000 Illegal production offenses", category: "medals-crimes-list" },
    { id: 264, name: "Synthetic Scientist", requirement: "Commit 7,500 Illegal production offenses", category: "medals-crimes-list" },
    { id: 265, name: "Production Prodigy", requirement: "Commit 10,000 Illegal production offenses", category: "medals-crimes-list" },
    { id: 266, name: "Novice Buster", requirement: "Bust 250 people from the Torn City jail", category: "misc-awards-list" },
    { id: 267, name: "Intermediate Buster", requirement: "Bust 500 people from the Torn City jail", category: "misc-awards-list" },
    { id: 268, name: "Advanced Buster", requirement: "Bust 1,000 people from the Torn City jail", category: "misc-awards-list" },
    { id: 269, name: "Professional Buster", requirement: "Bust 2,000 people from the Torn City jail", category: "misc-awards-list" },
    { id: 270, name: "Expert Buster", requirement: "Bust 4,000 people from the Torn City jail", category: "misc-awards-list" },
    { id: 271, name: "Master Buster", requirement: "Bust 6,000 people from the Torn City jail", category: "misc-awards-list" },
    { id: 272, name: "Guru Buster", requirement: "Bust 8,000 people from the Torn City jail", category: "misc-awards-list" },
    { id: 273, name: "Watchful", requirement: "10 items found", category: "misc-awards-list" },
    { id: 274, name: "Finders Keepers", requirement: "50 items found", category: "misc-awards-list" },
    { id: 275, name: "Eagle Eye", requirement: "100 items found", category: "misc-awards-list" },
    { id: 276, name: "Pin Cushion", requirement: "Use 500 medical items", category: "misc-awards-list" },
    { id: 277, name: "Painkiller Abuse", requirement: "Use 5,000 medical items", category: "misc-awards-list" },
    { id: 278, name: "Attention Seeker", requirement: "Use 25,000 medical items", category: "misc-awards-list" },
    { id: 279, name: "Frequent Flyer", requirement: "Travel abroad 25 times", category: "misc-awards-list" },
    { id: 280, name: "Jetlagged", requirement: "Travel abroad 100 times", category: "misc-awards-list" },
    { id: 281, name: "Mile High Club", requirement: "Travel abroad 500 times", category: "misc-awards-list" },
    { id: 282, name: "Apprentice", requirement: "$100,000 for 3 days", category: "misc-awards-list" },
    { id: 283, name: "Entrepreneur", requirement: "$250,000 for 3 days", category: "misc-awards-list" },
    { id: 284, name: "Executive", requirement: "$500,000 for 3 days", category: "misc-awards-list" },
    { id: 285, name: "Millionaire", requirement: "$1,000,000 for 3 days", category: "misc-awards-list" },
    { id: 286, name: "Multimillionaire", requirement: "$2,500,000 for 7 days", category: "misc-awards-list" },
    { id: 287, name: "Capitalist", requirement: "$10,000,000 for 7 days", category: "misc-awards-list" },
    { id: 288, name: "Plutocrat", requirement: "$25,000,000 for 14 days", category: "misc-awards-list" },
    { id: 289, name: "Aristocrat", requirement: "$100,000,000 for 14 days", category: "misc-awards-list" },
    { id: 290, name: "Mogul", requirement: "$250,000,000 for 28 days", category: "misc-awards-list" },
    { id: 291, name: "Billionaire", requirement: "$1,000,000,000 for 28 days", category: "misc-awards-list" },
    { id: 292, name: "Multibillionaire", requirement: "$2,500,000,000 for 56 days", category: "misc-awards-list" },
    { id: 293, name: "Baron", requirement: "$10,000,000,000 for 56 days", category: "misc-awards-list" },
    { id: 294, name: "Oligarch", requirement: "$25,000,000,000 for 112 days", category: "misc-awards-list" },
    { id: 295, name: "Tycoon", requirement: "$100,000,000,000 for 112 days", category: "misc-awards-list" }
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