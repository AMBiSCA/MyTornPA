
const allHonors = [
    // --- Chaining Honors ---
    { id: 253, name: "Chainer 1", requirement: "Participate in a 10 length chain", statKey: "personalstats.chains", threshold: 10, category: "honors-chaining-list", type: "count" },
    { id: 255, name: "Chainer 2", requirement: "Participate in a 100 length chain", statKey: "personalstats.chains", threshold: 100, category: "honors-chaining-list", type: "count" },
    { id: 257, name: "Chainer 3", requirement: "Participate in a 1,000 length chain", statKey: "personalstats.chains", threshold: 1000, category: "honors-chaining-list", type: "count" },
    { id: 475, name: "Chainer 4", requirement: "Participate in a 10,000 length chain", statKey: "personalstats.chains", threshold: 10000, category: "honors-chaining-list", type: "count" },
    { id: 476, name: "Chainer 5", requirement: "Participate in a 100,000 length chain", statKey: "personalstats.chains", threshold: 100000, category: "honors-chaining-list", type: "count" },
    { id: 256, name: "Carnage", requirement: "Make a single hit that earns your faction 10 or more respect", statKey: "personalstats.best_chain_hit", threshold: 10, category: "honors-chaining-list", type: "count" },
    { id: 477, name: "Massacre", requirement: "Make a single hit that earns your faction 100 or more respect", statKey: "personalstats.best_chain_hit", threshold: 100, category: "honors-chaining-list", type: "count" },
    { id: 478, name: "Genocide", requirement: "Make a single hit that earns your faction 1,000 or more respect", statKey: "personalstats.best_chain_hit", threshold: 1000, category: "honors-chaining-list", type: "count" },
    { id: 916, name: "Chain Saver", requirement: "Save a 100+ chain 10 seconds before it breaks", statKey: "personalstats.chains_saved", threshold: 1, category: "honors-chaining-list", type: "count" },
    { id: 641, name: "Strongest Link", requirement: "Make 100 hits in a single chain", statKey: "personalstats.max_chain", threshold: 100, category: "honors-chaining-list", type: "count" },

    // --- Weapons Honors ---
    { id: 146, name: "2800 Ft/S", requirement: "Achieve 100 finishing hits with rifles", statKey: "personalstats.rifhits", threshold: 100, category: "honors-weapons-list", type: "count" },
    { id: 148, name: "Act of Faith", requirement: "Achieve 100 finishing hits with SMGs", statKey: "personalstats.smghits", threshold: 100, category: "honors-weapons-list", type: "count" },
    { id: 142, name: "Axe Wound", requirement: "Achieve 100 finishing hits with clubbing weapons", statKey: "personalstats.axehits", threshold: 100, category: "honors-weapons-list", type: "count" },
    { id: 147, name: "Cartridge Packer", requirement: "Achieve 100 finishing hits with shotguns", statKey: "personalstats.shohits", threshold: 100, category: "honors-weapons-list", type: "count" },
    { id: 871, name: "Leonidas", requirement: "Achieve a finishing hit with Kick", statKey: "personalstats.kickhits", threshold: 1, category: "honors-weapons-list", type: "count" },
    { id: 144, name: "Lend A Hand", requirement: "Achieve 100 finishing hits with machine guns", statKey: "personalstats.machits", threshold: 100, category: "honors-weapons-list", type: "count" },
    { id: 143, name: "Pin Puller", requirement: "Achieve 100 finishing hits with temporary weapons", statKey: "personalstats.temphits", threshold: 100, category: "honors-weapons-list", type: "count" },
    { id: 28, name: "Machinist", requirement: "Achieve 100 finishing hits with mechanical weapons", statKey: "personalstats.mechits", threshold: 100, category: "honors-weapons-list", type: "count" },
    { id: 150, name: "Slasher", requirement: "Achieve 100 finishing hits with slashing weapons", statKey: "personalstats.slahits", threshold: 100, category: "honors-weapons-list", type: "count" },
    { id: 141, name: "Stumped", requirement: "Achieve 100 finishing hits with heavy artillery", statKey: "personalstats.artihits", threshold: 100, category: "honors-weapons-list", type: "count" },
    { id: 149, name: "The Stabbist", requirement: "Achieve 100 finishing hits with piercing weapons", statKey: "personalstats.piehits", threshold: 100, category: "honors-weapons-list", type: "count" },
    { id: 145, name: "Yours Says Replica...", requirement: "Achieve 100 finishing hits with pistols", statKey: "personalstats.pishits", threshold: 100, category: "honors-weapons-list", type: "count" },
    { id: 515, name: "Unarmed", requirement: "Achieve 100 fists or kick finishing hits", statKey: "personalstats.h2hhits", threshold: 100, category: "honors-weapons-list", type: "count" },
    { id: 491, name: "Modded", requirement: "Equip two high-tier mods to a weapon", statKey: "personalstats.untrackable_modded", threshold: 1, category: "honors-weapons-list", type: "count" },
    { id: 778, name: "Specialist", requirement: "Achieve 100% EXP on 25 different weapons", statKey: "personalstats.untrackable_specialist", threshold: 25, category: "honors-weapons-list", type: "count" },
    { id: 781, name: "Riddled", requirement: "Defeat an opponent after hitting at least 10 different body parts in a single attack", statKey: "personalstats.untrackable_riddled", threshold: 1, category: "honors-weapons-list", type: "count" },
    { id: 611, name: "War Machine", requirement: "Achieve 1,000 finishing hits in every category", statKey: "personalstats.untrackable_warmachine", threshold: 1000, category: "honors-weapons-list", type: "count" },
    { id: 800, name: "Surplus", requirement: "Use 100 rounds of special ammunition", statKey: "personalstats.specialammoused", threshold: 100, category: "honors-weapons-list", type: "count" },
    { id: 793, name: "Bandolier", requirement: "Use 1,000 rounds of special ammunition", statKey: "personalstats.specialammoused", threshold: 1000, category: "honors-weapons-list", type: "count" },
    { id: 791, name: "Quartermaster", requirement: "Use 10,000 rounds of special ammunition", statKey: "personalstats.specialammoused", threshold: 10000, category: "honors-weapons-list", type: "count" },
    { id: 942, name: "Maimed", requirement: "Use 2,500 Hollow Point rounds", statKey: "personalstats.hollowammoused", threshold: 2500, category: "honors-weapons-list", type: "count" },
    { id: 951, name: "Dragon's Breath", requirement: "Use a 12 Gauge Incendiary round", statKey: "personalstats.incendiaryammoused", threshold: 1, category: "honors-weapons-list", type: "count" },
    { id: 945, name: "Marked", requirement: "Use 2,500 Tracer rounds", statKey: "personalstats.tracerammoused", threshold: 2500, category: "honors-weapons-list", type: "count" },
    { id: 944, name: "Scorched", requirement: "Use 2,500 Incendiary rounds", statKey: "personalstats.incendiaryammoused", threshold: 2500, category: "honors-weapons-list", type: "count" },
    { id: 943, name: "Penetrated", requirement: "Use 2,500 Piercing rounds", statKey: "personalstats.piercingammoused", threshold: 2500, category: "honors-weapons-list", type: "count" },
    { id: 851, name: "Mod Boss", requirement: "Own at least 20 weapon mods", statKey: "personalstats.untrackable_modboss", threshold: 20, category: "honors-weapons-list", type: "count" },
    { id: 902, name: "Gone Fishing", requirement: "Be defeated by a Trout", statKey: "personalstats.untrackable_fishing", threshold: 1, category: "honors-weapons-list", type: "boolean" },

    // --- Attacking / General Honors ---
    // CORRECTED: Kill Streaker honors now correctly check 'bestkillstreak' for accurate progress.
    { id: 15, name: "Kill Streaker 1", requirement: "Achieve a 10 kill streak", statKey: "personalstats.bestkillstreak", threshold: 10, category: "honors-attacking-list", type: "count" },
    { id: 16, name: "Kill Streaker 2", requirement: "Achieve a 100 kill streak", statKey: "personalstats.bestkillstreak", threshold: 100, category: "honors-attacking-list", type: "count" },
    { id: 17, name: "Kill Streaker 3", requirement: "Achieve a 500 kill streak", statKey: "personalstats.bestkillstreak", threshold: 500, category: "honors-attacking-list", type: "count" },
    { id: 1004, name: "Wham!", requirement: "Deal over 100,000 total damage", statKey: "personalstats.attackdamage", threshold: 100000, category: "honors-attacking-list", type: "count" },
    { id: 254, name: "Flatline", requirement: "Achieve a one hit kill", statKey: "personalstats.onehitkills", threshold: 1, category: "honors-attacking-list", type: "count" },
    { id: 490, name: "Sidekick", requirement: "Assist in 250 attacks", statKey: "personalstats.attacksassisted", threshold: 250, category: "honors-attacking-list", type: "count" },
    { id: 20, name: "Precision", requirement: "Achieve 25 critical hits", statKey: "personalstats.attackcriticalhits", threshold: 25, category: "honors-attacking-list", type: "count" },
    { id: 227, name: "50 Cal", requirement: "Achieve 1,000 Critical Hits", statKey: "personalstats.attackcriticalhits", threshold: 1000, category: "honors-attacking-list", type: "count" },
    { id: 230, name: "Domino Effect", requirement: "Beat someone wearing this honor", statKey: "personalstats.untrackable_domino", threshold: 1, category: "honors-attacking-list", type: "count" },
    { id: 232, name: "Bounty Hunter", requirement: "Collect 250 bounties", statKey: "personalstats.bountiescollected", threshold: 250, category: "honors-attacking-list", type: "count" },
    { id: 236, name: "Dead Or Alive", requirement: "Earn $10,000,000 from bounty hunting", statKey: "personalstats.totalbountyreward", threshold: 10000000, category: "honors-attacking-list", type: "count" },
    { id: 140, name: "Spray And Pray", requirement: "Fire 1,000 rounds", statKey: "personalstats.roundsfired", threshold: 1000, category: "honors-attacking-list", type: "count" },
    { id: 151, name: "Two Halves Make A Hole", requirement: "Fire 10,000 rounds", statKey: "personalstats.roundsfired", threshold: 10000, category: "honors-attacking-list", type: "count" },
    { id: 247, name: "Blood Money", requirement: "Make $1,000,000 from a single mugging", statKey: "personalstats.largestmug", threshold: 1000000, category: "honors-attacking-list", type: "count" },
    { id: 270, name: "Deadlock", requirement: "Stalemate 100 times", statKey: "personalstats.defendstalemated", threshold: 100, category: "honors-attacking-list", type: "count" },
    { id: 1001, name: "Boom!", requirement: "Deal over 10,000,000 total damage", statKey: "personalstats.attackdamage", threshold: 10000000, category: "honors-attacking-list", type: "count" },
    { id: 955, name: "Yoink", requirement: "Successfully mug someone who just mugged someone else", statKey: "personalstats.untrackable_yoink", threshold: 1, category: "honors-attacking-list", type: "count" },
    { id: 228, name: "007", requirement: "Win 1,000 attacks and 1,000 defends", statKey: "personalstats.attackswon", threshold: 1000, category: "honors-attacking-list", type: "count_complex", checkAlso: "personalstats.defendswon", thresholdAlso: 1000 },
    { id: 22, name: "Self Defense", requirement: "Win 50 Defends", statKey: "personalstats.defendswon", threshold: 50, category: "honors-attacking-list", type: "count" },
    { id: 27, name: "Night Walker", requirement: "Win 100 stealthed attacks", statKey: "personalstats.attacksstealthed", threshold: 100, category: "honors-attacking-list", type: "count" },
    { id: 615, name: "Guardian Angel", requirement: "Defeat someone while they are attacking someone else", statKey: "personalstats.untrackable_guardian", threshold: 1, category: "honors-attacking-list", type: "count" },
    { id: 481, name: "Semper Fortis", requirement: "Defeat someone who has more battle stats than you in a solo attack", statKey: "personalstats.untrackable_semper", threshold: 1, category: "honors-attacking-list", type: "count" },
    { id: 627, name: "Manu Forti", requirement: "Defeat someone who has at least double your battle stats in a solo attack", statKey: "personalstats.untrackable_manu", threshold: 1, category: "honors-attacking-list", type: "count" },
    { id: 631, name: "Vae Victis", requirement: "Defeat someone who has five times more battlestats than you in a solo attack", statKey: "personalstats.untrackable_vae", threshold: 1, category: "honors-attacking-list", type: "count" },
    { id: 500, name: "Survivalist", requirement: "Win an attack with only 1% life remaining", statKey: "personalstats.untrackable_survivalist", threshold: 1, category: "honors-attacking-list", type: "count" },
    { id: 1002, name: "Bam!", requirement: "Deal over 1,000,000 total damage", statKey: "personalstats.attackdamage", threshold: 1000000, category: "honors-attacking-list", type: "count" },
    { id: 639, name: "Double Dragon", requirement: "Assist in a single attack", statKey: "personalstats.attacksassisted", threshold: 1, category: "honors-attacking-list", type: "count" },
    { id: 517, name: "Pressure Point", requirement: "Achieve 100 One Hit kills", statKey: "personalstats.onehitkills", threshold: 100, category: "honors-attacking-list", type: "count" },
    { id: 601, name: "Fury", requirement: "Achieve 10,000 hits.", statKey: "personalstats.attackhits", threshold: 10000, category: "honors-attacking-list", type: "count" },
    { id: 665, name: "Boss Fight", requirement: "Participate in the defeat of Lootable NPC's.", statKey: "personalstats.untrackable_bossfight", threshold: 1, category: "honors-attacking-list", type: "count" },
    { id: 608, name: "1337", requirement: "Deal exactly 1,337 damage to an opponent in a single hit", statKey: "personalstats.untrackable_1337", threshold: 1, category: "honors-attacking-list", type: "count" },
    { id: 896, name: "Going Postal", requirement: "Defeat a company co-worker", statKey: "personalstats.untrackable_postal", threshold: 1, category: "honors-attacking-list", type: "count" },
    { id: 605, name: "Friendly Fire", requirement: "Defeat a fellow faction member", statKey: "personalstats.untrackable_friendlyfire", threshold: 1, category: "honors-attacking-list", type: "count" },
    { id: 739, name: "Church Mouse", requirement: "Be mugged for $1", statKey: "personalstats.untrackable_churchmouse", threshold: 1, category: "honors-attacking-list", type: "count" },
    { id: 317, name: "Phoenix", requirement: "Defeat someone after losing to them within 10 minutes", statKey: "personalstats.untrackable_phoenix", threshold: 1, category: "honors-attacking-list", type: "count" },
    { id: 740, name: "Devastation", requirement: "Deal at least 5,000 damage in a single hit", statKey: "personalstats.bestdamage", threshold: 5000, category: "honors-attacking-list", type: "count" },
    { id: 741, name: "Obliteration", requirement: "Deal at least 10,000 damage in a single hit", statKey: "personalstats.bestdamage", threshold: 10000, category: "honors-attacking-list", type: "count" },
    { id: 786, name: "Annihilation", requirement: "Deal at least 15,000 damage in a single hit", statKey: "personalstats.bestdamage", threshold: 15000, category: "honors-attacking-list", type: "count" },
    { id: 1003, name: "Kapow!", requirement: "Deal over 100,000,000 total damage", statKey: "personalstats.attackdamage", threshold: 100000000, category: "honors-attacking-list", type: "count" },
    { id: 670, name: "Giant Slayer", requirement: "Receive loot from a defeated NPC", statKey: "personalstats.untrackable_giantslayer", threshold: 1, category: "honors-attacking-list", type: "count" },
    { id: 763, name: "Bare", requirement: "Win 250 unarmored attacks or defends", statKey: "personalstats.unarmoredwon", threshold: 250, category: "misc-awards-list", type: "count" },
    { id: 488, name: "Vengeance", requirement: "Successfully perform a faction retaliation hit", statKey: "personalstats.retals", threshold: 1, category: "honors-attacking-list", type: "count" },
    { id: 719, name: "Invictus", requirement: "Successfully defend against someone who has at least double your battle stats", statKey: "personalstats.untrackable_invictus", threshold: 1, category: "honors-attacking-list", type: "count" },
    { id: 834, name: "Lead Salad", requirement: "Fire 100,000 rounds", statKey: "personalstats.roundsfired", threshold: 100000, category: "honors-attacking-list", type: "count" },
    { id: 836, name: "Peppered", requirement: "Fire 1,000,000 rounds", statKey: "personalstats.roundsfired", threshold: 1000000, category: "honors-attacking-list", type: "count" },
    { id: 828, name: "Finale", requirement: "Defeat someone on the 25th turn of an attack", statKey: "personalstats.untrackable_finale", threshold: 1, category: "honors-attacking-list", type: "count" },
    { id: 827, name: "Deadly Duo", requirement: "Defeat someone with your spouse", statKey: "personalstats.untrackable_duo", threshold: 1, category: "honors-attacking-list", type: "count" },
    { id: 838, name: "Lovestruck", requirement: "Defeat a married couple", statKey: "personalstats.untrackable_lovestruck", threshold: 1, category: "honors-attacking-list", type: "count" },
    { id: 843, name: "Hands Solo", requirement: "Defeat someone using only your fists on May 4th", statKey: "personalstats.untrackable_solo", threshold: 1, category: "honors-attacking-list", type: "count" },
    { id: 414, name: "Triple Tap", requirement: "Achieve three headshots in a row", statKey: "personalstats.untrackable_tripletap", threshold: 1, category: "honors-attacking-list", type: "count" },

    // Camo
    { id: 39, name: "Woodland Camo", requirement: "5 Attacks Won", statKey: "personalstats.attackswon", threshold: 5, category: "misc-awards-list", type: "count" },
    { id: 40, name: "Desert Camo", requirement: "20 Attacks Won", statKey: "personalstats.attackswon", threshold: 20, category: "misc-awards-list", type: "count" },
    { id: 41, name: "Urban Camo", requirement: "50 Attacks Won", statKey: "personalstats.attackswon", threshold: 50, category: "misc-awards-list", type: "count" },
    { id: 42, name: "Arctic Camo", requirement: "100 Attacks Won", statKey: "personalstats.attackswon", threshold: 100, category: "misc-awards-list", type: "count" },
    { id: 43, name: "Fall Camo", requirement: "250 Attacks Won", statKey: "personalstats.attackswon", threshold: 250, category: "misc-awards-list", type: "count" },
    { id: 44, name: "Yellow Camo", requirement: "500 Attacks Won", statKey: "personalstats.attackswon", threshold: 500, category: "misc-awards-list", type: "count" },
    { id: 45, name: "Digital Camo", requirement: "1,000 Attacks Won", statKey: "personalstats.attackswon", threshold: 1000, category: "misc-awards-list", type: "count" },
    { id: 46, name: "Red Camo", requirement: "2,000 Attacks Won", statKey: "personalstats.attackswon", threshold: 2000, category: "misc-awards-list", type: "count" },
    { id: 47, name: "Blue Camo", requirement: "3,000 Attacks Won", statKey: "personalstats.attackswon", threshold: 3000, category: "misc-awards-list", type: "count" },
    { id: 48, name: "Orange Camo", requirement: "4,000 Attacks Won", statKey: "personalstats.attackswon", threshold: 4000, category: "misc-awards-list", type: "count" },
    { id: 49, name: "Pink Camo", requirement: "5,000 Attacks Won", statKey: "personalstats.attackswon", threshold: 5000, category: "misc-awards-list", type: "count" },
    { id: 50, name: "Zebra Skin", requirement: "50 Hunting Skill", statKey: "personalstats.huntingskill", threshold: 50, category: "misc-awards-list", type: "count" },
    { id: 51, name: "Leopard Skin", requirement: "75 Hunting Skill", statKey: "personalstats.huntingskill", threshold: 75, category: "misc-awards-list", type: "count" },
    { id: 52, name: "Tiger Skin", requirement: "100 Hunting Skill", statKey: "personalstats.huntingskill", threshold: 100, category: "misc-awards-list", type: "count" },

    // Casino
    { id: 276, name: "Lucky Break", requirement: "Win the daily, weekly or monthly Lottery jackpot", statKey: "personalstats.untrackable_lottery", threshold: 1, category: "misc-awards-list", type: "count" },
    { id: 275, name: "Jackpot", requirement: "Win the Slot Machine jackpot", statKey: "personalstats.untrackable_jackpot", threshold: 1, category: "misc-awards-list", type: "count" },
    { id: 237, name: "Poker King", requirement: "Reach a Poker score of 10 million", statKey: "personalstats.untrackable_poker", threshold: 10000000, category: "misc-awards-list", type: "count" },
    { id: 269, name: "Spinner", requirement: "Do 1,000 spins of the Roulette wheel", statKey: "personalstats.roulettewheelspins", threshold: 1000, category: "misc-awards-list", type: "count" },
    { id: 326, name: "Highs And Lows", requirement: "Achieve a win streak of 25 in High-Low", statKey: "personalstats.highlowwins", threshold: 25, category: "misc-awards-list", type: "count" },
    { id: 327, name: "One In Six", requirement: "Win 50 games of Foot Russian Roulette", statKey: "personalstats.roulettefootwins", threshold: 50, category: "misc-awards-list", type: "count" },
    { id: 513, name: "Daddy's New Shoes", requirement: "Win $100,000,000 in a single game of Russian Roulette", statKey: "personalstats.untrackable_roulette", threshold: 100000000, category: "misc-awards-list", type: "count" },
    { id: 519, name: "Foot Soldier", requirement: "Beat 10 unique opponents in Russian Roulette", statKey: "personalstats.untrackable_footsoldier", threshold: 10, category: "misc-awards-list", type: "count" },
    { id: 338, name: "Twenty-One", requirement: "Win a Natural, Six Card Charlie, Double Down and Insurance on Blackjack", statKey: "personalstats.untrackable_twentyone", threshold: 4, category: "misc-awards-list", type: "count" },
    { id: 427, name: "Awesome", requirement: "Win while spinning the Wheel of Awesome", statKey: "personalstats.untrackable_awesome", threshold: 1, category: "misc-awards-list", type: "count" },
    { id: 437, name: "Mediocre", requirement: "Win while spinning the Wheel of Mediocrity", statKey: "personalstats.untrackable_mediocre", threshold: 1, category: "misc-awards-list", type: "count" },
    { id: 431, name: "Lame", requirement: "Win while spinning the Wheel of Lame", statKey: "personalstats.untrackable_lame", threshold: 1, category: "misc-awards-list", type: "count" },

    // Dirty Bombs
    { id: 231, name: "Discovery", requirement: "Be in a faction which starts making a dirty bomb", statKey: "personalstats.untrackable_discovery", threshold: 1, category: "misc-awards-list", type: "count" },
    { id: 156, name: "RDD", requirement: "Use a dirty bomb", statKey: "personalstats.dirtybombsused", threshold: 1, category: "misc-awards-list", type: "count" },
    { id: 14, name: "Slow Bomb", requirement: "Use a dirty bomb", statKey: "personalstats.dirtybombsused", threshold: 1, category: "misc-awards-list", type: "count" },

    // Drugs
    { id: 26, name: "Spaced Out", requirement: "Overdose on Cannabis", statKey: "personalstats.overdosed_cannabis", threshold: 1, category: "misc-awards-list", type: "count" },
    { id: 29, name: "Who's Frank?", requirement: "Use 50 Cannabis", statKey: "personalstats.cantaken", threshold: 50, category: "misc-awards-list", type: "count" },
    { id: 34, name: "I See Dead People", requirement: "Use 50 Shrooms", statKey: "personalstats.shrtaken", threshold: 50, category: "misc-awards-list", type: "count" },
    { id: 30, name: "Party Animal", requirement: "Use 50 Ecstasy", statKey: "personalstats.exttaken", threshold: 50, category: "misc-awards-list", type: "count" },
    { id: 32, name: "Acid Dream", requirement: "Use 50 LSD", statKey: "personalstats.lsdtaken", threshold: 50, category: "misc-awards-list", type: "count" },
    { id: 38, name: "Painkiller", requirement: "Use 50 Vicodin", statKey: "personalstats.victaken", threshold: 50, category: "misc-awards-list", type: "count" },
    { id: 31, name: "Horse Tranquilizer", requirement: "Use 50 Ketamine", statKey: "personalstats.kettaken", threshold: 50, category: "misc-awards-list", type: "count" },
    { id: 33, name: "The Fields Of Opium", requirement: "Use 50 Opium", statKey: "personalstats.opitaken", threshold: 50, category: "misc-awards-list", type: "count" },
    { id: 35, name: "Crank It Up", requirement: "Use 50 Speed", statKey: "personalstats.spetaken", threshold: 50, category: "misc-awards-list", type: "count" },
    { id: 36, name: "Angel Dust", requirement: "Use 50 PCP", statKey: "personalstats.pcptaken", threshold: 50, category: "misc-awards-list", type: "count" },
    { id: 37, name: "Free Energy", requirement: "Use 50 Xanax", statKey: "personalstats.xantaken", threshold: 50, category: "misc-awards-list", type: "count" },

    // Education
    { id: 53, name: "Biology Bachelor", requirement: "Complete all Biology courses", statKey: "personalstats.untrackable_biology", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { id: 54, name: "Business Bachelor", requirement: "Complete all Business Management courses", statKey: "personalstats.untrackable_business", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { id: 55, name: "Combat Bachelor", requirement: "Complete all Combat Training courses", statKey: "personalstats.untrackable_combat", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { id: 56, name: "ICT Bachelor", requirement: "Complete all Computer Science courses", statKey: "personalstats.untrackable_ict", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { id: 58, name: "General Bachelor", requirement: "Complete all General Studies courses", statKey: "personalstats.untrackable_general", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { id: 59, name: "Fitness Bachelor", requirement: "Complete all Health & Fitness courses", statKey: "personalstats.untrackable_fitness", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { id: 60, name: "History Bachelor", requirement: "Complete all History courses", statKey: "personalstats.untrackable_history", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { id: 61, name: "Law Bachelor", requirement: "Complete all Law courses", statKey: "personalstats.untrackable_law", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { id: 62, name: "Mathematics Bachelor", requirement: "Complete all Maths courses", statKey: "personalstats.untrackable_maths", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { id: 63, name: "Psychology Bachelor", requirement: "Complete all Psychology courses", statKey: "personalstats.untrackable_psychology", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { id: 57, name: "Defense Bachelor", requirement: "Complete all Self Defence courses", statKey: "personalstats.untrackable_defense", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { id: 64, name: "Sports Bachelor", requirement: "Complete all Sports Science courses", statKey: "personalstats.untrackable_sports", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { id: 533, name: "Tough", requirement: "Attain 100,000 manual labour", statKey: "personalstats.manuallabor", threshold: 100000, category: "misc-awards-list", type: "count" },
    { id: 530, name: "Talented", requirement: "Attain 100,000 intelligence", statKey: "personalstats.intelligence", threshold: 100000, category: "misc-awards-list", type: "count" },
    { id: 525, name: "Tireless", requirement: "Attain 100,000 endurance", statKey: "personalstats.endurance", threshold: 100000, category: "misc-awards-list", type: "count" },
    { id: 653, name: "Smart Alec", requirement: "Complete 10 Education courses", statKey: "personalstats.total_courses_taken", threshold: 10, category: "misc-awards-list", type: "count" },
    { id: 659, name: "Clever Dick", requirement: "Complete 25 Education courses", statKey: "personalstats.total_courses_taken", threshold: 25, category: "misc-awards-list", type: "count" },
    { id: 651, name: "Wise Guy", requirement: "Complete 50 Education courses", statKey: "personalstats.total_courses_taken", threshold: 50, category: "misc-awards-list", type: "count" },
    { id: 656, name: "Whiz Kid", requirement: "Complete 100 Education courses", statKey: "personalstats.total_courses_taken", threshold: 100, category: "misc-awards-list", type: "count" },
    { id: 844, name: "Worker Bee", requirement: "Achieve 10,000 in any working stat", statKey: "personalstats.untrackable_workerbee", threshold: 10000, category: "misc-awards-list", type: "count" },

    // Gyms & Stats
    { id: 233, name: "Bronze Belt", requirement: "Own all lightweight gym memberships", statKey: "personalstats.untrackable_bronze", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { id: 234, name: "Silver Belt", requirement: "Own all middleweight gym memberships", statKey: "personalstats.untrackable_silver", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { id: 235, name: "Gold Belt", requirement: "Own all heavyweight gym memberships", statKey: "personalstats.untrackable_gold", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { id: 243, name: "Abaddon", requirement: "Gain 1,000,000 Strength", statKey: "personalstats.strength", threshold: 1000000, category: "misc-awards-list", type: "count" },
    { id: 240, name: "Behemoth", requirement: "Gain 1,000,000 Defense", statKey: "personalstats.defense", threshold: 1000000, category: "misc-awards-list", type: "count" },
    { id: 241, name: "Draco", requirement: "Gain 1,000,000 Dexterity", statKey: "personalstats.dexterity", threshold: 1000000, category: "misc-awards-list", type: "count" },
    { id: 242, name: "Supersonic", requirement: "Gain 1,000,000 Speed", statKey: "personalstats.speed", threshold: 1000000, category: "misc-awards-list", type: "count" },
    { id: 643, name: "Powerhouse", requirement: "Gain 10,000,000 Strength", statKey: "personalstats.strength", threshold: 10000000, category: "misc-awards-list", type: "count" },
    { id: 505, name: "Turbocharged", requirement: "Gain 10,000,000 Speed", statKey: "personalstats.speed", threshold: 10000000, category: "misc-awards-list", type: "count" },
    { id: 635, name: "Freerunner", requirement: "Gain 10,000,000 Dexterity", statKey: "personalstats.dexterity", threshold: 10000000, category: "misc-awards-list", type: "count" },
    { id: 497, name: "Reinforced", requirement: "Gain 10,000,000 Defense", statKey: "personalstats.defense", threshold: 10000000, category: "misc-awards-list", type: "count" },
    { id: 646, name: "Mighty Roar", requirement: "Gain 100,000,000 Strength", statKey: "personalstats.strength", threshold: 100000000, category: "misc-awards-list", type: "count" },
    { id: 506, name: "Lightspeed", requirement: "Gain 100,000,000 Speed", statKey: "personalstats.speed", threshold: 100000000, category: "misc-awards-list", type: "count" },
    { id: 640, name: "Bulletproof", requirement: "Gain 100,000,000 Defense", statKey: "personalstats.defense", threshold: 100000000, category: "misc-awards-list", type: "count" },
    { id: 629, name: "Alpinist", requirement: "Gain 100,000,000 Dexterity", statKey: "personalstats.dexterity", threshold: 100000000, category: "misc-awards-list", type: "count" },
    { id: 647, name: "Well Built", requirement: "Gain 1,000,000,000 Strength", statKey: "personalstats.strength", threshold: 1000000000, category: "misc-awards-list", type: "count" },
    { id: 550, name: "Arrowshot", requirement: "Gain 1,000,000,000 Speed", statKey: "personalstats.speed", threshold: 1000000000, category: "misc-awards-list", type: "count" },
    { id: 638, name: "Funambulist", requirement: "Gain 1,000,000,000 Dexterity", statKey: "personalstats.dexterity", threshold: 1000000000, category: "misc-awards-list", type: "count" },
    { id: 498, name: "Shielded", requirement: "Gain 1,000,000,000 Defense", statKey: "personalstats.defense", threshold: 1000000000, category: "misc-awards-list", type: "count" },

    // Money & Trading
    { id: 12, name: "Pocket Money", requirement: "Make an investment in the city bank", statKey: "personalstats.invested", threshold: 1, category: "misc-awards-list", type: "count" },
    { id: 10, name: "Green, Green Grass", requirement: "Make an investment in the city bank of over $1,000,000,000", statKey: "personalstats.invested", threshold: 1000000000, category: "misc-awards-list", type: "count" },
    { id: 3, name: "Moneybags", requirement: "Invest $100,000,000 in the stock market", statKey: "personalstats.moneyinvested", threshold: 100000000, category: "misc-awards-list", type: "count" },
    { id: 19, name: "Stock Analyst", requirement: "Achieve excellent success in the stock market", statKey: "personalstats.untrackable_analyst", threshold: 1, category: "misc-awards-list", type: "count" },
    { id: 546, name: "Dividend", requirement: "Receive 100 stock payouts", statKey: "personalstats.stockpayouts", threshold: 100, category: "misc-awards-list", type: "count" },
    { id: 869, name: "Monopoly", requirement: "Own every stock benefit at the same time", statKey: "personalstats.untrackable_monopoly", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { id: 544, name: "City Slicker", requirement: "Make a profit of $10,000,000 in a single Stock Market sale", statKey: "personalstats.stockprofits", threshold: 10000000, category: "misc-awards-list", type: "count" },
    { id: 548, name: "Tendies", requirement: "Make a profit of $100,000,000 in a single Stock Market sale", statKey: "personalstats.stockprofits", threshold: 100000000, category: "misc-awards-list", type: "count" },
    { id: 1007, name: "Stonks", requirement: "Make a loss of $100,000,000 in a single Stock Market sale", statKey: "personalstats.stocklosses", threshold: 100000000, category: "misc-awards-list", type: "count" },
    { id: 1005, name: "Bullish", requirement: "Achieve $1,000,000,000 in total profits in the Stock Market", statKey: "personalstats.stocknetprofits", threshold: 1000000000, category: "misc-awards-list", type: "count" },
    { id: 1006, name: "Bearish", requirement: "Achieve $1,000,000,000 in total losses in the Stock Market", statKey: "personalstats.untrackable_bearish", threshold: 1000000000, category: "misc-awards-list", type: "count" },
    { id: 545, name: "Diamond Hands", requirement: "Make a profit of $1,000,000,000 in a single Stock Market sale", statKey: "personalstats.stockprofits", threshold: 1000000000, category: "misc-awards-list", type: "count" },
    { id: 8, name: "Loan Shark", requirement: "Achieve a high credit score with Duke the Loan Shark.", statKey: "personalstats.untrackable_loanshark", threshold: 1, category: "misc-awards-list", type: "count" },
    { id: 268, name: "Wholesaler", requirement: "Sell 1,000 points in Points Market", statKey: "personalstats.pointssold", threshold: 1000, category: "misc-awards-list", type: "count" },

    // Church
    { id: 520, name: "Pious", requirement: "Donate a total of $100,000 to the church", statKey: "personalstats.donated", threshold: 100000, category: "misc-awards-list", type: "count" },
    { id: 521, name: "Saintly", requirement: "Donate a total of $1,000,000 to the church", statKey: "personalstats.donated", threshold: 1000000, category: "misc-awards-list", type: "count" },
    { id: 316, name: "Forgiven", requirement: "Be truly forgiven for all of your sins", statKey: "personalstats.untrackable_forgiven", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { id: 523, name: "Devout", requirement: "Donate a total of $100,000,000 to the church", statKey: "personalstats.donated", threshold: 100000000, category: "misc-awards-list", type: "count" },
    { id: 522, name: "Sacrificial", requirement: "Donate $1,000,000,000 to the church", statKey: "personalstats.donated", threshold: 1000000000, category: "misc-awards-list", type: "count" },

    // Jail & Hospital
    { id: 906, name: "Repeat Offender", requirement: "Go to jail 250 times", statKey: "personalstats.jailed", threshold: 250, category: "misc-awards-list", type: "count" },
    { id: 248, name: "Bar Breaker", requirement: "Bust 1,000 players out of jail", statKey: "personalstats.peoplebusted", threshold: 1000, category: "misc-awards-list", type: "count" },
    { id: 249, name: "Aiding And Abetting", requirement: "Bust 2,500 players out of jail", statKey: "personalstats.peoplebusted", threshold: 2500, category: "misc-awards-list", type: "count" },
    { id: 250, name: "Don't Drop It", requirement: "Bust 10,000 players out of jail", statKey: "personalstats.peoplebusted", threshold: 10000, category: "misc-awards-list", type: "count" },
    { id: 252, name: "Freedom Isn't Free", requirement: "Bail 500 players out of jail", statKey: "personalstats.bailed", threshold: 500, category: "misc-awards-list", type: "count" },
    { id: 903, name: "Booboo", requirement: "Go to hospital 250 times", statKey: "personalstats.hospital", threshold: 250, category: "misc-awards-list", type: "count" },
    { id: 7, name: "Magical Veins", requirement: "Use 5,000 medical items", statKey: "personalstats.medicalitemsused", threshold: 5000, category: "misc-awards-list", type: "count" },
    { id: 23, name: "Florence Nightingale", requirement: "Revive 500 players", statKey: "personalstats.revives", threshold: 500, category: "misc-awards-list", type: "count" },
    { id: 267, name: "Second Chance", requirement: "Revive 1,000 players", statKey: "personalstats.revives", threshold: 1000, category: "misc-awards-list", type: "count" },
    { id: 406, name: "Vampire", requirement: "Random chance upon using a blood bag", statKey: "personalstats.untrackable_vampire", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { id: 367, name: "Clotted", requirement: "Hospitalize yourself by using the wrong blood bag or drinking some Ipecac Syrup.", statKey: "personalstats.untrackable_clotted", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { id: 418, name: "Transfusion", requirement: "Fill 250 blood bags", statKey: "personalstats.blood", threshold: 250, category: "misc-awards-list", type: "count" },
    { id: 398, name: "Anaemic", requirement: "Fill 1,000 blood bags", statKey: "personalstats.blood", threshold: 1000, category: "misc-awards-list", type: "count" },
    { id: 322, name: "Miracle Worker", requirement: "Revive 10 people in 10 minutes", statKey: "personalstats.untrackable_miracle", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { id: 870, name: "Resurrection", requirement: "Revive someone you've just defeated", statKey: "personalstats.untrackable_resurrection", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { id: 863, name: "Crucifixion", requirement: "Defeat someone you've just revived", statKey: "personalstats.untrackable_crucifixion", threshold: 1, category: "misc-awards-list", type: "boolean" },

    // Commitment
    { id: 873, name: "Welcome", requirement: "Be online everyday for 100 days", statKey: "personalstats.logins", threshold: 100, category: "misc-awards-list", type: "count" },
    { id: 245, name: "Couch Potato", requirement: "Reach 1,000 hours of Time Played on Torn", statKey: "personalstats.useractivity", threshold: 3600000, category: "misc-awards-list", type: "count" },
    { id: 163, name: "Fascination", requirement: "Stay married for 250 days", statKey: "personalstats.married", threshold: 21600000, category: "misc-awards-list", type: "count_time_convert" },
    { id: 162, name: "Chasm", requirement: "Stay married for 750 days", statKey: "personalstats.married", threshold: 64800000, category: "misc-awards-list", type: "count_time_convert" },
    { id: 166, name: "Stairway To Heaven", requirement: "Stay married for 1,500 days", statKey: "personalstats.married", threshold: 129600000, category: "misc-awards-list", type: "count_time_convert" },

    // Items
    { id: 534, name: "Alcoholic", requirement: "Drink 500 bottles of alcohol", statKey: "personalstats.alcoholused", threshold: 500, category: "misc-awards-list", type: "count" },
    { id: 538, name: "Sodaholic", requirement: "Drink 500 cans of energy drinks", statKey: "personalstats.energydrinkused", threshold: 500, category: "misc-awards-list", type: "count" },
    { id: 537, name: "Diabetic", requirement: "Eat 500 bags of candy", statKey: "personalstats.candyused", threshold: 500, category: "misc-awards-list", type: "count" },
    { id: 238, name: "Optimist", requirement: "Find 1,000 items in dump", statKey: "personalstats.dumpfinds", threshold: 1000, category: "misc-awards-list", type: "count" },
    { id: 743, name: "Lavish", requirement: "Dump an item with a current market value of at least $1,000,000", statKey: "personalstats.untrackable_lavish", threshold: 1000000, category: "misc-awards-list", type: "count" },
    { id: 539, name: "Bibliophile", requirement: "Read 10 books", statKey: "personalstats.booksread", threshold: 10, category: "misc-awards-list", type: "count" },
    { id: 527, name: "Worth It", requirement: "Use a stat enhancer", statKey: "personalstats.statenhancersused", threshold: 1, category: "misc-awards-list", type: "count" },
    { id: 271, name: "Eco Friendly", requirement: "Trash 5,000 items", statKey: "personalstats.itemsdumped", threshold: 5000, category: "misc-awards-list", type: "count" },
    { id: 678, name: "Stinker", requirement: "Successfully prank someone with Stink Bombs", statKey: "personalstats.untrackable_stinker", threshold: 1, category: "misc-awards-list", type: "count" },
    { id: 716, name: "Wipeout", requirement: "Successfully prank someone with Toilet Paper", statKey: "personalstats.untrackable_wipeout", threshold: 1, category: "misc-awards-list", type: "count" },
    { id: 273, name: "Bargain Hunter", requirement: "Win 10 auctions", statKey: "personalstats.auctionswon", threshold: 10, category: "misc-awards-list", type: "count" },
    { id: 717, name: "Foul Play", requirement: "Successfully prank someone with Dog Poop", statKey: "personalstats.untrackable_foulplay", threshold: 1, category: "misc-awards-list", type: "count" },
    { id: 1, name: "I'm Watching You", requirement: "Find 50 items in the city", statKey: "personalstats.cityfinds", threshold: 50, category: "misc-awards-list", type: "count" },
    { id: 239, name: "Middleman", requirement: "Have 100 different customers buy from your bazaar", statKey: "personalstats.bazaarcustomers", threshold: 100, category: "misc-awards-list", type: "count" },
    // CORRECTED: "Collector" is subjective and untrackable, so its statKey is now specific.
    { id: 699, name: "Collector", requirement: "Maintain an impressive display case of collectible items", statKey: "personalstats.untrackable_collector", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { id: 882, name: "Radaway", requirement: "Use a Neumune Tablet to reduce radiation poisoning", statKey: "personalstats.untrackable_radaway", threshold: 1, category: "misc-awards-list", type: "count" },

    // Miscellaneous
    // CORRECTED: "Energize" now correctly points to energy refills, not nerve refills.
    { id: 266, name: "Energize", requirement: "Use 250 Energy Refills", statKey: "personalstats.energyrefills", threshold: 250, category: "misc-awards-list", type: "count" },
    { id: 566, name: "You've Got Some Nerve", requirement: "Use 250 Nerve Refills", statKey: "personalstats.nerverefills", threshold: 250, category: "misc-awards-list", type: "count" },
    { id: 334, name: "Compulsive", requirement: "Use 250 Casino Refills", statKey: "personalstats.tokenrefills", threshold: 250, category: "misc-awards-list", type: "count" },
    { id: 229, name: "Seeker", requirement: "Reach 250 awards (honors and medals)", statKey: "personalstats.awards", threshold: 250, category: "misc-awards-list", type: "count" },
    { id: 216, name: "Silicon Valley", requirement: "Code 100 viruses", statKey: "personalstats.virusescoded", threshold: 100, category: "misc-awards-list", type: "count" },
    { id: 220, name: "The Affronted", requirement: "Irritate all job interviewers", statKey: "personalstats.untrackable_affronted", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { id: 395, name: "Energetic", requirement: "Achieve the maximum of 1,000 energy", statKey: "personalstats.untrackable_energetic", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { id: 380, name: "Ecstatic", requirement: "Achieve the maximum of 99,999 happiness", statKey: "personalstats.untrackable_ecstatic", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { id: 309, name: "Christmas in Torn", requirement: "Login on Christmas Day", statKey: "personalstats.untrackable_christmas", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { id: 443, name: "Trick or Treat", requirement: "Login on Halloween", statKey: "personalstats.untrackable_halloween", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { id: 459, name: "Torniversary", requirement: "Login on November 15th", statKey: "personalstats.untrackable_torniversary", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { id: 607, name: "Buffed", requirement: "Achieve 50 personal perks", statKey: "personalstats.untrackable_buffed", threshold: 50, category: "misc-awards-list", type: "count" },
    { id: 244, name: "Web Of Perks", requirement: "Achieve 100 personal perks", statKey: "personalstats.untrackable_webofperks", threshold: 100, category: "misc-awards-list", type: "count" },
    { id: 620, name: "OP", requirement: "Achieve 150 personal perks", statKey: "personalstats.untrackable_op", threshold: 150, category: "misc-awards-list", type: "count" },
    { id: 617, name: "10-Stack", requirement: "Increase a merit upgrade to its maximum", statKey: "personalstats.untrackable_10stack", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { id: 606, name: "Decorated", requirement: "Achieve 100 total awards", statKey: "personalstats.awards", threshold: 100, category: "misc-awards-list", type: "count" },
    { id: 614, name: "Honored", requirement: "Achieve 500 total awards", statKey: "personalstats.awards", threshold: 500, category: "misc-awards-list", type: "count" },
    { id: 312, name: "Time Traveller", requirement: "Survive a Torn City rollback", statKey: "personalstats.untrackable_timetraveler", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { id: 288, name: "Fresh Start", requirement: "Reset your merits", statKey: "personalstats.meritsreset", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { id: 731, name: "Tornication", requirement: "Login on Valentine's Day", statKey: "personalstats.untrackable_tornication", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { id: 114077, name: "Resolution", requirement: "Login on New Year's Day", statKey: "personalstats.untrackable_resolution", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { id: 700, name: "Leaderboard", requirement: "Achieve top 250 in one of the personal Hall of Fame leaderboards", statKey: "personalstats.untrackable_leaderboard", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { id: 839, name: "RNG", requirement: "Who knows?", statKey: "personalstats.untrackable_rng", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { id: 845, name: "Historian", requirement: "Read a chronicle", statKey: "personalstats.untrackable_historian", threshold: 1, category: "misc-awards-list", type: "count" },
    // CORRECTED: "Nice" honor (69 kill streak) now points to 'bestkillstreak'.
    { id: 888, name: "Nice", requirement: "Achieve a 69 kill streak", statKey: "personalstats.bestkillstreak", threshold: 69, category: "honors-attacking-list", type: "count" },
    { id: 164, name: "Stuck In a Rut", requirement: "1,000 job points used", statKey: "personalstats.jobpointsused", threshold: 1000, category: "misc-awards-list", type: "count" },
    { id: 742, name: "Overtime", requirement: "10,000 job points used", statKey: "personalstats.jobpointsused", threshold: 10000, category: "misc-awards-list", type: "count" },

    // Newspaper
    { id: 5, name: "Journalist", requirement: "Have an article published", statKey: "personalstats.untrackable_journalist", threshold: 1, category: "misc-awards-list", type: "count" },
    { id: 167, name: "Velutinous", requirement: "Have a comic published", statKey: "personalstats.untrackable_velutinous", threshold: 1, category: "misc-awards-list", type: "count" },

    // Properties
    // CORRECTED: Property honors are untrackable and now have specific statKeys.
    { id: 9, name: "Luxury Real Estate", requirement: "Own a Private Island with a Airstrip", statKey: "personalstats.untrackable_luxury", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { id: 258, name: "High Life", requirement: "Own a Private Island with a Yacht", statKey: "personalstats.untrackable_highlife", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { id: 860, name: "Landlord", requirement: "Lease one of your properties to someone.", statKey: "personalstats.untrackable_landlord", threshold: 1, category: "misc-awards-list", type: "count" },

    // Missions
    { id: 371, name: "Protege", requirement: "Complete the mission introduction: Duke", statKey: "personalstats.missionscompleted", threshold: 1, category: "misc-awards-list", type: "count" },
    { id: 664, name: "Mercenary", requirement: "Complete 1,000 mission contracts", statKey: "personalstats.contractscompleted", threshold: 1000, category: "misc-awards-list", type: "count" },
    { id: 636, name: "Task Master", requirement: "Earn 10,000 mission credits", statKey: "personalstats.missioncreditsearned", threshold: 10000, category: "misc-awards-list", type: "count" },

    // Racing
    { id: 21, name: "Driving Elite", requirement: "Reach Class A", statKey: "personalstats.untrackable_elite", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { id: 274, name: "Redline", requirement: "250 wins in the same car", statKey: "personalstats.untrackable_redline", threshold: 250, category: "misc-awards-list", type: "count" },
    { id: 572, name: "Motorhead", requirement: "Achieve a driver skill of 10", statKey: "personalstats.racingskill", threshold: 10, category: "misc-awards-list", type: "count" },
    { id: 734, name: "Wrecked", requirement: "Crash during a race", statKey: "personalstats.racecrashes", threshold: 1, category: "misc-awards-list", type: "count" },
    { id: 571, name: "Checkered Past", requirement: "Win 100 races", statKey: "personalstats.raceswon", threshold: 100, category: "misc-awards-list", type: "count" },
    { id: 581, name: "On Track", requirement: "Earn 2,500 Racing Points", statKey: "personalstats.racingpointsearned", threshold: 2500, category: "misc-awards-list", type: "count" },

    // Recruit Citizens
    { id: 217, name: "Two's Company", requirement: "Refer 1 player who reaches level 10", statKey: "personalstats.referrals", threshold: 1, category: "misc-awards-list", type: "count" },
    { id: 218, name: "Three's A Crowd", requirement: "Refer 2 players who reach level 10", statKey: "personalstats.referrals", threshold: 2, category: "misc-awards-list", type: "count" },
    { id: 219, name: "Social Butterfly", requirement: "Refer 3 players who reaches level 10", statKey: "personalstats.referrals", threshold: 3, category: "misc-awards-list", type: "count" },
    { id: 246, name: "Pyramid Scheme", requirement: "Have one of your referrals refer another player who goes on to reach level 10", statKey: "personalstats.untrackable_pyramid", threshold: 1, category: "misc-awards-list", type: "boolean" },

    // Competitions, Token Shop & Points Building
    { id: 213, name: "Allure", requirement: "Make an entry for Mr/Miss Torn", statKey: "personalstats.untrackable_allure", threshold: 1, category: "misc-awards-list", type: "count" },
    { id: 222, name: "Good Friday", requirement: "Exchange all eggs for a gold one in the Easter Egg hunt competition", statKey: "personalstats.untrackable_goodfriday", threshold: 1, category: "misc-awards-list", type: "boolean" },
    { id: 221, name: "KIA", requirement: "Collect 50 dog tags in the Dog Tags competition (must be holding 50 tags at once)", statKey: "personalstats.untrackable_kia", threshold: 50, category: "misc-awards-list", type: "count" },
    { id: 277, name: "Departure", requirement: "Collect 250 dog tags in the Dog Tags competition (must be holding 250 tags at once)", statKey: "personalstats.untrackable_departure", threshold: 250, category: "misc-awards-list", type: "count" },
    { id: 212, name: "Mission Accomplished", requirement: "Finish the Elimination competition with your team 1st, 2nd or 3rd.", statKey: "personalstats.untrackable_missionaccomplished", threshold: 3, category: "misc-awards-list", type: "count_less_equal" },
    { id: 226, name: "Purple Heart", requirement: "Make 50 attacks against enemy team members in the Elimination competition.", statKey: "personalstats.untrackable_purpleheart", threshold: 50, category: "misc-awards-list", type: "count" },
    { id: 5999, name: "Supremacy", requirement: "Finish the Elimination competition within the top 5% of attacking players in your team.", statKey: "personalstats.untrackable_supremacy", threshold: 5, category: "misc-awards-list", type: "count_less_equal" },
    { id: 279, name: "Domination", requirement: "Finish the Elimination competition with your team in 1st place.", statKey: "personalstats.untrackable_domination", threshold: 1, category: "misc-awards-list", type: "count" },
    { id: 330, name: "Champion", requirement: "Win a community event", statKey: "personalstats.untrackable_champion", threshold: 1, category: "misc-awards-list", type: "count" },
    { id: 969, name: "Phantastic", requirement: "Upgrade your Halloween Basket to Frightful Trick or Treat", statKey: "personalstats.untrackable_phantastic", threshold: 1, category: "misc-awards-list", type: "count" },
    { id: 964, name: "Something Humerus", requirement: "Upgrade your Halloween Basket to Terrifying Trick or Treat", statKey: "personalstats.untrackable_humerus", threshold: 2, category: "misc-awards-list", type: "count" },
    { id: 966, name: "Oh My Gourd!", requirement: "Upgrade your Halloween Basket to Nightmarish Trick or Treat", statKey: "personalstats.untrackable_gourd", threshold: 3, category: "misc-awards-list", type: "count" },

    // Token Shop
    { id: 283, name: "Globule", requirement: "Purchased for 3 tokens from the Token Shop or for 500 points from the Points Building", statKey: "personalstats.untrackable_token", threshold: 3, category: "misc-awards-list", type: "count" },
    { id: 308, name: "Retro", requirement: "Purchased for 4 tokens from the Token Shop or for 500 points from the Points Building", statKey: "personalstats.untrackable_token", threshold: 4, category: "misc-awards-list", type: "count" },
    { id: 298, name: "Acute", requirement: "Purchased for 4 tokens from the Token Shop or for 500 points from the Points Building", statKey: "personalstats.untrackable_token", threshold: 4, category: "misc-awards-list", type: "count" },
    { id: 313, name: "Serenity", requirement: "Purchased for 5 tokens from the Token Shop or for 600 points from the Points Building", statKey: "personalstats.untrackable_token", threshold: 5, category: "misc-awards-list", type: "count" },
    { id: 223, name: "The Socialist", requirement: "Purchased for 5 tokens from the Token Shop or for 600 points from the Points Building", statKey: "personalstats.untrackable_token", threshold: 5, category: "misc-awards-list", type: "count" },
    { id: 214, name: "Jack Of All Trades", requirement: "Purchased for 5 tokens from the Token Shop or for 600 points from the Points Building", statKey: "personalstats.untrackable_token", threshold: 5, category: "misc-awards-list", type: "count" },
    { id: 318, name: "Futurity", requirement: "Purchased for 6 tokens from the Token Shop or for 700 points from the Points Building", statKey: "personalstats.untrackable_token", threshold: 6, category: "misc-awards-list", type: "count" },
    { id: 297, name: "Constellations", requirement: "Purchased for 7 tokens from the Token Shop or for 700 points from the Points Building", statKey: "personalstats.untrackable_token", threshold: 7, category: "misc-awards-list", type: "count" },
    { id: 281, name: "Parallel", requirement: "Purchased for 8 tokens from the Token Shop or for 700 points from the Points Building", statKey: "personalstats.untrackable_token", threshold: 8, category: "misc-awards-list", type: "count" },
    { id: 215, name: "Labyrinth", requirement: "Purchased for 9 tokens from the Token Shop or for 700 points from the Points Building", statKey: "personalstats.untrackable_token", threshold: 9, category: "misc-awards-list", type: "count" },
    { id: 315, name: "Glimmer", requirement: "Purchased for 10 tokens from the Token Shop or for 800 points from the Points Building", statKey: "personalstats.untrackable_token", threshold: 10, category: "misc-awards-list", type: "count" },
    { id: 224, name: "Proven Capacity", requirement: "Purchased for 10 tokens from the Token Shop or for 800 points from the Points Building", statKey: "personalstats.untrackable_token", threshold: 10, category: "misc-awards-list", type: "count" },
    { id: 225, name: "Master Of One", requirement: "Purchased for 10 tokens from the Token Shop or for 800 points from the Points Building", statKey: "personalstats.untrackable_token", threshold: 10, category: "misc-awards-list", type: "count" },
    { id: 278, name: "Globally Effective", requirement: "Purchased for 10 tokens from the Token Shop or for 800 points from the Points Building", statKey: "personalstats.untrackable_token", threshold: 10, category: "misc-awards-list", type: "count" },
    { id: 321, name: "Supernova", requirement: "Purchased for 12 tokens from the Token Shop or for 900 points from the Points Building", statKey: "personalstats.untrackable_token", threshold: 12, category: "misc-awards-list", type: "count" },
    { id: 294, name: "Pepperoni", requirement: "Purchased for 13 tokens from the Token Shop or for 900 points from the Points Building", statKey: "personalstats.untrackable_token", threshold: 13, category: "misc-awards-list", type: "count" },
    { id: 284, name: "Electric Dream", requirement: "Purchased for 15 tokens from the Token Shop or for 1000 points from the Points Building", statKey: "personalstats.untrackable_token", threshold: 15, category: "misc-awards-list", type: "count" },
    { id: 306, name: "Resistance", requirement: "Purchased for 15 tokens from the Token Shop or for 1000 points from the Points Building", statKey: "personalstats.untrackable_token", threshold: 15, category: "misc-awards-list", type: "count" },
    { id: 311, name: "Brainz", requirement: "Purchased for 20 tokens from the Token Shop or for 1300 points from the Points Building", statKey: "personalstats.untrackable_token", threshold: 20, category: "misc-awards-list", type: "count" },
    { id: 263, name: "Survivor", requirement: "Purchased for 25 tokens from the Token Shop or for 1500 points from the Points Building", statKey: "personalstats.untrackable_token", threshold: 25, category: "misc-awards-list", type: "count" },
    { id: 730, name: "Backdrop", requirement: "Unlock a backdrop from the Token Shop", statKey: "personalstats.untrackable_token", threshold: 1, category: "misc-awards-list", type: "count" },
    { id: 729, name: "Hairy", requirement: "Unlock a hairstyle from the Token Shop", statKey: "personalstats.untrackable_token", threshold: 1, category: "misc-awards-list", type: "count" },

    // Travel
    { id: 11, name: "Mile High Club", requirement: "Travel 100 times", statKey: "personalstats.travel", threshold: 100, category: "misc-awards-list", type: "count" },
    { id: 165, name: "There And Back Again", requirement: "Travel 1,000 times", statKey: "personalstats.travel", threshold: 1000, category: "misc-awards-list", type: "count" },
    { id: 131, name: "Cascado", requirement: "Travel to Mexico 50 times", statKey: "personalstats.travelmx", threshold: 50, category: "misc-awards-list", type: "count" },
    { id: 139, name: "Toronto", requirement: "Travel to Canada 50 times", statKey: "personalstats.travelca", threshold: 50, category: "misc-awards-list", type: "count" },
    { id: 272, name: "Shark Bait", requirement: "Travel to Cayman Islands 50 times", statKey: "personalstats.travelcy", threshold: 50, category: "misc-awards-list", type: "count" },
    { id: 133, name: "Hula", requirement: "Travel to Hawaii 50 times", statKey: "personalstats.travelhw", threshold: 50, category: "misc-awards-list", type: "count" },
    { id: 135, name: "British Pride", requirement: "Travel to England 50 times", statKey: "personalstats.traveluk", threshold: 50, category: "misc-awards-list", type: "count" },
    { id: 137, name: "Like The Celebs", requirement: "Travel to Switzerland 50 times", statKey: "personalstats.travelch", threshold: 50, category: "misc-awards-list", type: "count" },
    { id: 130, name: "Maradona", requirement: "Travel to Argentina 50 times", statKey: "personalstats.travelar", threshold: 50, category: "misc-awards-list", type: "count" },
    { id: 134, name: "The Rising Sun", requirement: "Travel to Japan 50 times", statKey: "personalstats.traveljp", threshold: 50, category: "misc-awards-list", type: "count" },
    { id: 138, name: "Year Of The Dragon", requirement: "Travel to China 50 times", statKey: "personalstats.travelcn", threshold: 50, category: "misc-awards-list", type: "count" },
    { id: 132, name: "Land Of Promise", requirement: "Travel to Dubai 50 times", statKey: "personalstats.travelua", threshold: 50, category: "misc-awards-list", type: "count" },
    { id: 136, name: "Cape Town", requirement: "Travel to South Africa 50 times", statKey: "personalstats.travelza", threshold: 50, category: "misc-awards-list", type: "count" },
    { id: 549, name: "Tourist", requirement: "Spend 7 days in the air", statKey: "personalstats.traveltime", threshold: 604800, category: "misc-awards-list", type: "count" },
    { id: 567, name: "Frequent Flyer", requirement: "Spend 31 days in the air", statKey: "personalstats.traveltime", threshold: 2678400, category: "misc-awards-list", type: "count" },
    { id: 557, name: "Globetrotter", requirement: "Spend 365 days in the air", statKey: "personalstats.traveltime", threshold: 31536000, category: "misc-awards-list", type: "count" },
    { id: 541, name: "Mule", requirement: "Import 100 items from abroad", statKey: "personalstats.itemsboughtabroad", threshold: 100, category: "misc-awards-list", type: "count" },
    { id: 542, name: "Smuggler", requirement: "Import 1,000 items from abroad", statKey: "personalstats.itemsboughtabroad", threshold: 1000, category: "misc-awards-list", type: "count" },
    { id: 543, name: "Trafficker", requirement: "Import 10,000 items from abroad", statKey: "personalstats.itemsboughtabroad", threshold: 10000, category: "misc-awards-list", type: "count" },
    { id: 853, name: "Souvenir", requirement: "Purchase the perfect souvenir abroad", statKey: "personalstats.untrackable_souvenir", threshold: 1, category: "misc-awards-list", type: "count" },
    { id: 846, name: "International", requirement: "Defeat 100 people while abroad", statKey: "personalstats.attackswonabroad", threshold: 100, category: "misc-awards-list", type: "count" },
];

const allMedals = [
    // --- Combat Medals ---
    { id: 174, name: "Anti Social", requirement: "Win 50 attacks", statKey: "personalstats.attackswon", threshold: 50, category: "medals-combat-list", type: "count" },
    { id: 175, name: "Happy Slapper", requirement: "Win 250 attacks", statKey: "personalstats.attackswon", threshold: 250, category: "medals-combat-list", type: "count" },
    { id: 176, name: "Scar Maker", requirement: "Win 500 attacks", statKey: "personalstats.attackswon", threshold: 500, category: "medals-combat-list", type: "count" },
    { id: 205, name: "Finders Keepers", requirement: "Win 2,500 attacks", statKey: "personalstats.attackswon", threshold: 2500, category: "medals-combat-list", type: "count" }, // Name changed to match map
    { id: 178, name: "Somebody Call 911", requirement: "Win 10,000 attacks", statKey: "personalstats.attackswon", threshold: 10000, category: "medals-combat-list", type: "count" },
    { id: 201, name: "Hired Gun", requirement: "Collect 25 bounties", statKey: "personalstats.bountiescollected", threshold: 25, category: "medals-combat-list", type: "count" },
    { id: 202, name: "Bone Collector", requirement: "Collect 100 bounties", statKey: "personalstats.bountiescollected", threshold: 100, category: "medals-combat-list", type: "count" },
    { id: 203, name: "The Fett", requirement: "Collect 500 bounties", statKey: "personalstats.bountiescollected", threshold: 500, category: "medals-combat-list", type: "count" },
    { id: 195, name: "Boom Headshot", requirement: "Deal 500 critical hits", statKey: "personalstats.attackcriticalhits", threshold: 500, category: "medals-combat-list", type: "count" },
    { id: 196, name: "Pwned in the face", requirement: "Deal 2,500 critical hits", statKey: "personalstats.attackcriticalhits", threshold: 2500, category: "medals-combat-list", type: "count" },
    { id: 197, name: "Lee Harvey Oswald", requirement: "Deal 10,000 critical hits", statKey: "personalstats.attackcriticalhits", threshold: 10000, category: "medals-combat-list", type: "count" },
    { id: 179, name: "Bouncer", requirement: "Win 50 defends", statKey: "personalstats.defendswon", threshold: 50, category: "medals-combat-list", type: "count" },
    { id: 180, name: "Brick wall", requirement: "Win 250 defends", statKey: "personalstats.defendswon", threshold: 250, category: "medals-combat-list", type: "count" },
    { id: 181, name: "Turtle", requirement: "Win 500 defends", statKey: "personalstats.defendswon", threshold: 500, category: "medals-combat-list", type: "count" },
    { id: 182, name: "Solid as a Rock", requirement: "Win 2,500 defends", statKey: "personalstats.defendswon", threshold: 2500, category: "medals-combat-list", type: "count" },
    { id: 183, name: "Fortress", requirement: "Win 10,000 defends", statKey: "personalstats.defendswon", threshold: 10000, category: "medals-combat-list", type: "count" },
    { id: 187, name: "Ego Smashing", requirement: "50 enemies Escape from you", statKey: "personalstats.theyrunaway", threshold: 50, category: "medals-combat-list", type: "count" },
    { id: 188, name: "Underestimated", requirement: "250 enemies Escape from you", statKey: "personalstats.theyrunaway", threshold: 250, category: "medals-combat-list", type: "count" },
    { id: 189, name: "Run Forrest Run", requirement: "1,000 enemies Escape from you", statKey: "personalstats.theyrunaway", threshold: 1000, category: "medals-combat-list", type: "count" },
    { id: 190, name: "Strike", requirement: "Win 25 consecutive fights", statKey: "personalstats.bestkillstreak", threshold: 25, category: "medals-combat-list", type: "count" },
    { id: 191, name: "Barrage", requirement: "Win 50 consecutive fights", statKey: "personalstats.bestkillstreak", threshold: 50, category: "medals-combat-list", type: "count" },
    { id: 192, name: "Skirmish", requirement: "Win 100 consecutive fights", statKey: "personalstats.bestkillstreak", threshold: 100, category: "medals-combat-list", type: "count" },
    { id: 193, name: "Blitzkrieg", requirement: "Win 250 consecutive fights", statKey: "personalstats.bestkillstreak", threshold: 250, category: "medals-combat-list", type: "count" },
    { id: 194, name: "Onslaught", requirement: "Win 500 consecutive fights", statKey: "personalstats.bestkillstreak", threshold: 500, category: "medals-combat-list", type: "count" },
    { id: 215, name: "Recruit", requirement: "Earn 100 respect", statKey: "personalstats.respectforfaction", threshold: 100, category: "medals-combat-list", type: "count" },
    { id: 216, name: "Associate", requirement: "Earn 500 respect", statKey: "personalstats.respectforfaction", threshold: 500, category: "medals-combat-list", type: "count" },
    { id: 217, name: "Picciotto", requirement: "Earn 1,000 respect", statKey: "personalstats.respectforfaction", threshold: 1000, category: "medals-combat-list", type: "count" },
    { id: 218, name: "Soldier", requirement: "Earn 2,500 respect", statKey: "personalstats.respectforfaction", threshold: 2500, category: "medals-combat-list", type: "count" },
    { id: 219, name: "Capo", requirement: "Earn 5,000 respect", statKey: "personalstats.respectforfaction", threshold: 5000, category: "medals-combat-list", type: "count" },
    { id: 220, name: "Contabile", requirement: "Earn 10,000 respect", statKey: "personalstats.respectforfaction", threshold: 10000, category: "medals-combat-list", type: "count" },
    { id: 221, name: "Consigliere", requirement: "Earn 25,000 respect", statKey: "personalstats.respectforfaction", threshold: 25000, category: "medals-combat-list", type: "count" },
    { id: 222, name: "Underboss", requirement: "Earn 50,000 respect", statKey: "personalstats.respectforfaction", threshold: 50000, category: "medals-combat-list", type: "count" },
    { id: 223, name: "Boss", requirement: "Earn 75,000 respect", statKey: "personalstats.respectforfaction", threshold: 75000, category: "medals-combat-list", type: "count" },
    { id: 224, name: "Boss Of All Bosses", requirement: "Earn 100,000 respect", statKey: "personalstats.respectforfaction", threshold: 100000, category: "medals-combat-list", type: "count" },
    { id: 184, name: "Close Escape", requirement: "Escape from 50 enemies", statKey: "personalstats.yourunaway", threshold: 50, category: "medals-combat-list", type: "count" },
    { id: 185, name: "Blind Judgement", requirement: "Escape from 250 enemies", statKey: "personalstats.yourunaway", threshold: 250, category: "medals-combat-list", type: "count" },
    { id: 186, name: "Overzealous", requirement: "Escape from 1,000 enemies", statKey: "personalstats.yourunaway", threshold: 1000, category: "medals-combat-list", type: "count" },

    // --- Level / Commitment Medals ---
    // Commitment
    { id: 210, name: "Citizenship", requirement: "Be a donator for 30 days", statKey: "personalstats.daysbeendonator", threshold: 30, category: "medals-commitment-list", type: "count" },
    { id: 211, name: "Devoted", requirement: "Be a donator for 100 days", statKey: "personalstats.daysbeendonator", threshold: 100, category: "medals-commitment-list", type: "count" },
    { id: 212, name: "Diligent", requirement: "Be a donator for 250 days", statKey: "personalstats.daysbeendonator", threshold: 250, category: "medals-commitment-list", type: "count" },
    { id: 213, name: "Valiant", requirement: "Be a donator for 500 days", statKey: "personalstats.daysbeendonator", threshold: 500, category: "medals-commitment-list", type: "count" },
    { id: 214, name: "Patriotic", requirement: "Be a donator for 1,000 days", statKey: "personalstats.daysbeendonator", threshold: 1000, category: "medals-commitment-list", type: "count" },
    { id: 26, name: "Apprentice Faction Member", requirement: "Same faction for 100 days", statKey: "personalstats.faction_loyalty_days", threshold: 100, category: "medals-commitment-list", type: "count" },
    { id: 27, name: "Committed Faction Member", requirement: "Same faction for 200 days", statKey: "personalstats.faction_loyalty_days", threshold: 200, category: "medals-commitment-list", type: "count" },
    { id: 28, name: "Loyal Faction Member", requirement: "Same faction for 300 days", statKey: "personalstats.faction_loyalty_days", threshold: 300, category: "medals-commitment-list", type: "count" },
    { id: 29, name: "Dedicated Faction Member", requirement: "Same faction for 400 days", statKey: "personalstats.faction_loyalty_days", threshold: 400, category: "medals-commitment-list", type: "count" },
    { id: 108, name: "Faithful Faction Member", requirement: "Same faction for 500 days", statKey: "personalstats.faction_loyalty_days", threshold: 500, category: "medals-commitment-list", type: "count" },
    { id: 109, name: "Allegiant Faction Member", requirement: "Same faction for 600 days", statKey: "personalstats.faction_loyalty_days", threshold: 600, category: "medals-commitment-list", type: "count" },
    { id: 148, name: "Devoted Faction Member", requirement: "Same faction for 700 days", statKey: "personalstats.faction_loyalty_days", threshold: 700, category: "medals-commitment-list", type: "count" },
    { id: 149, name: "Dutiful Faction Member", requirement: "Same faction for 800 days", statKey: "personalstats.faction_loyalty_days", threshold: 800, category: "medals-commitment-list", type: "count" },
    { id: 150, name: "Flawless Faction Member", requirement: "Same faction for 900 days", statKey: "personalstats.faction_loyalty_days", threshold: 900, category: "medals-commitment-list", type: "count" },
    { id: 151, name: "Honorable Faction Member", requirement: "Same faction for 1,000 days", statKey: "personalstats.faction_loyalty_days", threshold: 1000, category: "medals-commitment-list", type: "count" },
    { id: 74, name: "Silver Anniversary", requirement: "Same spouse for 50 consecutive days", statKey: "personalstats.spousetime", threshold: 4320000, category: "medals-commitment-list", type: "count_time_convert" },
    { id: 75, name: "Ruby Anniversary", requirement: "Same spouse for 100 consecutive days", statKey: "personalstats.spousetime", threshold: 8640000, category: "medals-commitment-list", type: "count_time_convert" },
    { id: 76, name: "Sapphire Anniversary", requirement: "Same spouse for 150 consecutive days", statKey: "personalstats.spousetime", threshold: 12960000, category: "medals-commitment-list", type: "count_time_convert" },
    { id: 77, name: "Emerald Anniversary", requirement: "Same spouse for 200 consecutive days", statKey: "personalstats.spousetime", threshold: 17280000, category: "medals-commitment-list", type: "count_time_convert" },
    { id: 78, name: "Gold Anniversary", requirement: "Same spouse for 250 consecutive days", statKey: "personalstats.spousetime", threshold: 21600000, category: "medals-commitment-list", type: "count_time_convert" },
    { id: 79, name: "Diamond Anniversary", requirement: "Same spouse for 300 consecutive days", statKey: "personalstats.spousetime", threshold: 25920000, category: "medals-commitment-list", type: "count_time_convert" },
    { id: 80, name: "Platinum Anniversary", requirement: "Same spouse for 350 consecutive days", statKey: "personalstats.spousetime", threshold: 30240000, category: "medals-commitment-list", type: "count_time_convert" },
    { id: 110, name: "Double Silver Anniversary", requirement: "Same spouse for 400 consecutive days", statKey: "personalstats.spousetime", threshold: 34560000, category: "medals-commitment-list", type: "count_time_convert" },
    { id: 111, name: "Double Ruby Anniversary", requirement: "Same spouse for 450 consecutive days", statKey: "personalstats.spousetime", threshold: 38880000, category: "medals-commitment-list", type: "count_time_convert" },
    { id: 112, name: "Double Sapphire Anniversary", requirement: "Same spouse for 500 consecutive days", statKey: "personalstats.spousetime", threshold: 43200000, category: "medals-commitment-list", type: "count_time_convert" },
    { id: 113, name: "Double Emerald Anniversary", requirement: "Same spouse for 550 consecutive days", statKey: "personalstats.spousetime", threshold: 47520000, category: "medals-commitment-list", type: "count_time_convert" },
    { id: 114, name: "Double Gold Anniversary", requirement: "Same spouse for 600 consecutive days", statKey: "personalstats.spousetime", threshold: 51840000, category: "medals-commitment-list", type: "count_time_convert" },
    { id: 115, name: "Double Diamond Anniversary", requirement: "Same spouse for 650 consecutive days", statKey: "personalstats.spousetime", threshold: 56160000, category: "medals-commitment-list", type: "count_time_convert" },
    { id: 116, name: "Double Platinum Anniversary", requirement: "Same spouse for 700 consecutive days", statKey: "personalstats.spousetime", threshold: 60480000, category: "medals-commitment-list", type: "count_time_convert" },
    { id: 156, name: "Triple Silver Anniversary", requirement: "Same spouse for 750 consecutive days", statKey: "personalstats.spousetime", threshold: 64800000, category: "medals-commitment-list", type: "count_time_convert" },
    { id: 157, name: "Triple Ruby Anniversary", requirement: "Same spouse for 800 consecutive days", statKey: "personalstats.spousetime", threshold: 69120000, category: "medals-commitment-list", type: "count_time_convert" },
    { id: 158, name: "Triple Sapphire Anniversary", requirement: "Same spouse for 850 consecutive days", statKey: "personalstats.spousetime", threshold: 73440000, category: "medals-commitment-list", type: "count_time_convert" },
    { id: 159, name: "Triple Emerald Anniversary", requirement: "Same spouse for 900 consecutive days", statKey: "personalstats.spousetime", threshold: 77760000, category: "medals-commitment-list", type: "count_time_convert" },
    { id: 160, name: "Triple Gold Anniversary", requirement: "Same spouse for 1,000 consecutive days", statKey: "personalstats.spousetime", threshold: 86400000, category: "medals-commitment-list", type: "count_time_convert" },
    { id: 161, name: "Triple Diamond Anniversary", requirement: "Same spouse for 1,500 consecutive days", statKey: "personalstats.spousetime", threshold: 129600000, category: "medals-commitment-list", type: "count_time_convert" },
    { id: 162, name: "Triple Platinum Anniversary", requirement: "Same spouse for 2,000 consecutive days", statKey: "personalstats.spousetime", threshold: 172800000, category: "medals-commitment-list", type: "count_time_convert" },
    // Age
    { id: 225, name: "One Year of Service", requirement: "Live in Torn for One Year", statKey: "personalstats.days_old", threshold: 365, category: "medals-commitment-list", type: "count" },
    { id: 226, name: "Two Years of Service", requirement: "Live in Torn for Two Years", statKey: "personalstats.days_old", threshold: 730, category: "medals-commitment-list", type: "count" },
    { id: 227, name: "Three Years of Service", requirement: "Live in Torn for Three Years", statKey: "personalstats.days_old", threshold: 1095, category: "medals-commitment-list", type: "count" },
    { id: 228, name: "Four Years of Service", requirement: "Live in Torn for Four Years", statKey: "personalstats.days_old", threshold: 1460, category: "medals-commitment-list", type: "count" },
    { id: 229, name: "Five Years of Service", requirement: "Live in Torn for Five Years", statKey: "personalstats.days_old", threshold: 1825, category: "medals-commitment-list", type: "count" },
    { id: 230, name: "Six Years of Service", requirement: "Live in Torn for Six Years", statKey: "personalstats.days_old", threshold: 2190, category: "medals-commitment-list", type: "count" },
    { id: 231, name: "Seven Years of Service", requirement: "Live in Torn for Seven Years", statKey: "personalstats.days_old", threshold: 2555, category: "medals-commitment-list", type: "count" },
    { id: 232, name: "Eight Years of Service", requirement: "Live in Torn for Eight Years", statKey: "personalstats.days_old", threshold: 2920, category: "medals-commitment-list", type: "count" },
    { id: 234, name: "Nine Years of Service", requirement: "Live in Torn for Nine Years", statKey: "personalstats.days_old", threshold: 3285, category: "medals-commitment-list", type: "count" },
    { id: 235, name: "Ten Years of Service", requirement: "Live in Torn for Ten Years", statKey: "personalstats.days_old", threshold: 3650, category: "medals-commitment-list", type: "count" },
    // Level Medals - Now combined with Commitment
    { id: 34, name: "Level Five", requirement: "Reach level Five", statKey: "level", threshold: 5, category: "medals-commitment-list", type: "level" },
    { id: 35, name: "Level Ten", requirement: "Reach level Ten", statKey: "level", threshold: 10, category: "medals-commitment-list", type: "level" },
    { id: 36, name: "Level Fifteen", requirement: "Reach level Fifteen", statKey: "level", threshold: 15, category: "medals-commitment-list", type: "level" },
    { id: 37, name: "Level Twenty", requirement: "Reach level Twenty", statKey: "level", threshold: 20, category: "medals-commitment-list", type: "level" },
    { id: 38, name: "Level Twenty Five", requirement: "Reach level Twenty Five", statKey: "level", threshold: 25, category: "medals-commitment-list", type: "level" },
    { id: 39, name: "Level Thirty", requirement: "Reach level Thirty", statKey: "level", threshold: 30, category: "medals-commitment-list", type: "level" },
    { id: 40, name: "Level Thirty Five", requirement: "Reach level Thirty Five", statKey: "level", threshold: 35, category: "medals-commitment-list", type: "level" },
    { id: 41, name: "Level Forty", requirement: "Reach level Forty", statKey: "level", threshold: 40, category: "medals-commitment-list", type: "level" },
    { id: 42, name: "Level Forty Five", requirement: "Reach level Forty Five", statKey: "level", threshold: 45, category: "medals-commitment-list", type: "level" },
    { id: 43, name: "Level Fifty", requirement: "Reach level Fifty", statKey: "level", threshold: 50, category: "medals-commitment-list", type: "level" },
    { id: 44, name: "Level Fifty Five", requirement: "Reach level Fifty Five", statKey: "level", threshold: 55, category: "medals-commitment-list", type: "level" },
    { id: 45, name: "Level Sixty", requirement: "Reach level Sixty", statKey: "level", threshold: 60, category: "medals-commitment-list", type: "level" },
    { id: 46, name: "Level Sixty Five", requirement: "Reach level Sixty Five", statKey: "level", threshold: 65, category: "medals-commitment-list", type: "level" },
    { id: 47, name: "Level Seventy", requirement: "Reach level Seventy", statKey: "level", threshold: 70, category: "medals-commitment-list", type: "level" },
    { id: 48, name: "Level Seventy Five", requirement: "Reach level Seventy Five", statKey: "level", threshold: 75, category: "medals-commitment-list", type: "level" },
    { id: 49, name: "Level Eighty", requirement: "Reach level Eighty", statKey: "level", threshold: 80, category: "medals-commitment-list", type: "level" },
    { id: 50, name: "Level Eighty Five", requirement: "Reach level Eighty Five", statKey: "level", threshold: 85, category: "medals-commitment-list", type: "level" },
    { id: 51, name: "Level Ninety", requirement: "Reach level Ninety", statKey: "level", threshold: 90, category: "medals-commitment-list", type: "level" },
    { id: 52, name: "Level Ninety Five", requirement: "Reach level Ninety Five", statKey: "level", threshold: 95, category: "medals-commitment-list", type: "level" },
    { id: 53, name: "Level One Hundred", requirement: "Reach level One Hundred", statKey: "level", threshold: 100, category: "medals-commitment-list", type: "level" },

    // --- Crimes Medals ---
    { id: 242, name: "Trainee Troublemaker", requirement: "Commit 100 Criminal offenses", statKey: "personalstats.criminaloffenses", threshold: 100, category: "medals-crimes-list", type: "count" },
    { id: 243, name: "Budding Bandit", requirement: "Commit 200 Criminal offenses", statKey: "personalstats.criminaloffenses", threshold: 200, category: "medals-crimes-list", type: "count" },
    { id: 244, name: "Aspiring Assailant", requirement: "Commit 300 Criminal offenses", statKey: "personalstats.criminaloffenses", threshold: 300, category: "medals-crimes-list", type: "count" },
    { id: 245, name: "Fledgling Felon", requirement: "Commit 500 Criminal offenses", statKey: "personalstats.criminaloffenses", threshold: 500, category: "medals-crimes-list", type: "count" },
    { id: 246, name: "Freshman Fiend", requirement: "Commit 750 Criminal offenses", statKey: "personalstats.criminaloffenses", threshold: 750, category: "medals-crimes-list", type: "count" },
    { id: 247, name: "Despicable Deviant", requirement: "Commit 1,000 Criminal offenses", statKey: "personalstats.criminaloffenses", threshold: 1000, category: "medals-crimes-list", type: "count" },
    { id: 248, name: "Conniving Culprit", requirement: "Commit 1,500 Criminal offenses", statKey: "personalstats.criminaloffenses", threshold: 1500, category: "medals-crimes-list", type: "count" },
    { id: 249, name: "Sordid Sinner", requirement: "Commit 2,000 Criminal offenses", statKey: "personalstats.criminaloffenses", threshold: 2000, category: "medals-crimes-list", type: "count" },
    { id: 250, name: "Polished Perpetrator", requirement: "Commit 2,500 Criminal offenses", statKey: "personalstats.criminaloffenses", threshold: 2500, category: "medals-crimes-list", type: "count" },
    { id: 251, name: "Relentless Reprobate", requirement: "Commit 3,000 Criminal offenses", statKey: "personalstats.criminaloffenses", threshold: 3000, category: "medals-crimes-list", type: "count" },
    { id: 252, name: "Resolute Rogue", requirement: "Commit 4,000 Criminal offenses", statKey: "personalstats.criminaloffenses", threshold: 4000, category: "medals-crimes-list", type: "count" },
    { id: 253, name: "Veteran Villain", requirement: "Commit 5,000 Criminal offenses", statKey: "personalstats.criminaloffenses", threshold: 5000, category: "medals-crimes-list", type: "count" },
    { id: 254, name: "Masterful Miscreant", statKey: "personalstats.criminaloffenses", threshold: 6000, category: "medals-crimes-list", type: "count" },
    { id: 255, name: "Merciless Malefactor", statKey: "personalstats.criminaloffenses", threshold: 7500, category: "medals-crimes-list", type: "count" },
    { id: 256, name: "Legendary Lawbreaker", statKey: "personalstats.criminaloffenses", threshold: 10000, category: "medals-crimes-list", type: "count" },
    { id: 272, name: "Petty Pilferer", requirement: "Commit 100 Theft offenses", statKey: "personalstats.theft", threshold: 100, category: "medals-crimes-list", type: "count" },
    { id: 273, name: "Crafty Crook", requirement: "Commit 200 Theft offenses", statKey: "personalstats.theft", threshold: 200, category: "medals-crimes-list", type: "count" },
    { id: 274, name: "Nifty Nicker", requirement: "Commit 300 Theft offenses", statKey: "personalstats.theft", threshold: 300, category: "medals-crimes-list", type: "count" },
    { id: 275, name: "Sneaky Snatcher", requirement: "Commit 500 Theft offenses", statKey: "personalstats.theft", threshold: 500, category: "medals-crimes-list", type: "count" },
    { id: 276, name: "Brazen Booster", statKey: "personalstats.theft", threshold: 750, category: "medals-crimes-list", type: "count" },
    { id: 277, name: "Stealthy Stealer", statKey: "personalstats.theft", threshold: 1000, category: "medals-crimes-list", type: "count" },
    { id: 278, name: "Rampant Robber", statKey: "personalstats.theft", threshold: 1500, category: "medals-crimes-list", type: "count" },
    { id: 279, name: "Bold Burglar", statKey: "personalstats.theft", threshold: 2000, category: "medals-crimes-list", type: "count" },
    { id: 280, name: "Invisible Intruder", statKey: "personalstats.theft", threshold: 2500, category: "medals-crimes-list", type: "count" },
    { id: 281, name: "Lucrative Larcenist", statKey: "personalstats.theft", threshold: 3000, category: "medals-crimes-list", type: "count" },
    { id: 282, name: "Looting Luminary", statKey: "personalstats.theft", threshold: 4000, category: "medals-crimes-list", type: "count" },
    { id: 283, name: "Formidable Filcher", statKey: "personalstats.theft", threshold: 5000, category: "medals-crimes-list", type: "count" },
    { id: 284, name: "Sophisticated Swiper", statKey: "personalstats.theft", threshold: 6000, category: "medals-crimes-list", type: "count" },
    { id: 285, name: "Notorious Nabber", statKey: "personalstats.theft", threshold: 7500, category: "medals-crimes-list", type: "count" },
    { id: 286, name: "Prolific Plunderer", statKey: "personalstats.theft", threshold: 10000, category: "medals-crimes-list", type: "count" },
    { id: 257, name: "Sinister Scoundrel", requirement: "Commit 100 Vandalism offenses", statKey: "personalstats.vandalism", threshold: 100, category: "medals-crimes-list", type: "count" },
    { id: 258, name: "Devious Delinquent", requirement: "Commit 200 Vandalism offenses", statKey: "personalstats.vandalism", threshold: 200, category: "medals-crimes-list", type: "count" },
    { id: 259, name: "Rebellious Ruffian", requirement: "Commit 300 Vandalism offenses", statKey: "personalstats.vandalism", threshold: 300, category: "medals-crimes-list", type: "count" },
    { id: 260, name: "Artistic Anarchist", statKey: "personalstats.vandalism", threshold: 500, category: "medals-crimes-list", type: "count" },
    { id: 261, name: "Renegade Rascal", statKey: "personalstats.vandalism", threshold: 750, category: "medals-crimes-list", type: "count" },
    { id: 262, name: "Decisive Defacer", statKey: "personalstats.vandalism", threshold: 1000, category: "medals-crimes-list", type: "count" },
    { id: 263, name: "Villainous Vandal", statKey: "personalstats.vandalism", threshold: 1500, category: "medals-crimes-list", type: "count" },
    { id: 264, name: "Menacing Misfit", statKey: "personalstats.vandalism", threshold: 2000, category: "medals-crimes-list", type: "count" },
    { id: 265, name: "Radical Rebel", statKey: "personalstats.vandalism", threshold: 2500, category: "medals-crimes-list", type: "count" },
    { id: 266, name: "Urban Upsetter", statKey: "personalstats.vandalism", threshold: 3000, category: "medals-crimes-list", type: "count" },
    { id: 267, name: "Malicious Maverick", statKey: "personalstats.vandalism", threshold: 4000, category: "medals-crimes-list", type: "count" },
    { id: 268, name: "Reckless Renovator", statKey: "personalstats.vandalism", threshold: 5000, category: "medals-crimes-list", type: "count" },
    { id: 269, name: "Dynamic Destructor", statKey: "personalstats.vandalism", threshold: 6000, category: "medals-crimes-list", type: "count" },
    { id: 270, name: "Infernal Instigator", statKey: "personalstats.vandalism", threshold: 7500, category: "medals-crimes-list", type: "count" },
    { id: 271, name: "Nefarious Nihilist", statKey: "personalstats.vandalism", threshold: 10000, category: "medals-crimes-list", type: "count" },
    { id: 287, name: "Digital Duplicator", requirement: "Commit 100 Counterfeiting offenses", statKey: "personalstats.counterfeiting", threshold: 100, category: "medals-crimes-list", type: "count" },
    { id: 288, name: "Covert Copier", requirement: "Commit 200 Counterfeiting offenses", statKey: "personalstats.counterfeiting", threshold: 200, category: "medals-crimes-list", type: "count" },
    { id: 289, name: "Resourceful Replicator", requirement: "Commit 300 Counterfeiting offenses", statKey: "personalstats.counterfeiting", threshold: 300, category: "medals-crimes-list", type: "count" },
    { id: 290, name: "Mimicking Maestro", statKey: "personalstats.counterfeiting", threshold: 500, category: "medals-crimes-list", type: "count" },
    { id: 291, name: "Faux Fabricator", statKey: "personalstats.counterfeiting", threshold: 750, category: "medals-crimes-list", type: "count" },
    { id: 292, name: "Mock Manufacturer", statKey: "personalstats.counterfeiting", threshold: 1000, category: "medals-crimes-list", type: "count" },
    { id: 293, name: "Furtive Faker", statKey: "personalstats.counterfeiting", threshold: 1500, category: "medals-crimes-list", type: "count" },
    { id: 294, name: "Duplicitous Designer", statKey: "personalstats.counterfeiting", threshold: 2000, category: "medals-crimes-list", type: "count" },
    { id: 295, name: "Counterfeit Crafter", statKey: "personalstats.counterfeiting", threshold: 2500, category: "medals-crimes-list", type: "count" },
    { id: 296, name: "Emphatic Emulator", statKey: "personalstats.counterfeiting", threshold: 3000, category: "medals-crimes-list", type: "count" },
    { id: 297, name: "Meticulous Maker", statKey: "personalstats.counterfeiting", threshold: 4000, category: "medals-crimes-list", type: "count" },
    { id: 298, name: "Artificial Artisan", statKey: "personalstats.counterfeiting", threshold: 5000, category: "medals-crimes-list", type: "count" },
    { id: 299, name: "Impeccable Imitator", statKey: "personalstats.counterfeiting", threshold: 6000, category: "medals-crimes-list", type: "count" },
    { id: 300, name: "Bogus Buccaneer", statKey: "personalstats.counterfeiting", threshold: 7500, category: "medals-crimes-list", type: "count" },
    { id: 301, name: "Famed Forger", statKey: "personalstats.counterfeiting", threshold: 10000, category: "medals-crimes-list", type: "count" },
    { id: 302, name: "Troublesome Trickster", statKey: "personalstats.fraud", threshold: 100, category: "medals-crimes-list", type: "count" },
    { id: 303, name: "Shameless Shyster", statKey: "personalstats.fraud", threshold: 200, category: "medals-crimes-list", type: "count" },
    { id: 304, name: "Greedy Grifter", statKey: "personalstats.fraud", threshold: 300, category: "medals-crimes-list", type: "count" },
    { id: 305, name: "Daring Deceiver", statKey: "personalstats.fraud", threshold: 500, category: "medals-crimes-list", type: "count" },
    { id: 306, name: "Provocative Persuader", statKey: "personalstats.fraud", threshold: 750, category: "medals-crimes-list", type: "count" },
    { id: 307, name: "Dexterous Defrauder", statKey: "personalstats.fraud", threshold: 1000, category: "medals-crimes-list", type: "count" },
    { id: 308, name: "Enterprising Enticer", statKey: "personalstats.fraud", threshold: 1500, category: "medals-crimes-list", type: "count" },
    { id: 309, name: "Blackhearted Bluffer", statKey: "personalstats.fraud", threshold: 2000, category: "medals-crimes-list", type: "count" },
    { id: 310, name: "Scheming Scammer", statKey: "personalstats.fraud", threshold: 2500, category: "medals-crimes-list", type: "count" },
    { id: 311, name: "Swanky Swindler", statKey: "personalstats.fraud", threshold: 3000, category: "medals-crimes-list", type: "count" },
    { id: 312, name: "Impressive Imposter", statKey: "personalstats.fraud", threshold: 4000, category: "medals-crimes-list", type: "count" },
    { id: 313, name: "Canny Conman", statKey: "personalstats.fraud", threshold: 5000, category: "medals-crimes-list", type: "count" },
    { id: 314, name: "Frenzied Fraudster", statKey: "personalstats.fraud", threshold: 6000, category: "medals-crimes-list", type: "count" },
    { id: 315, name: "Bankrupting Bilker", statKey: "personalstats.fraud", threshold: 7500, category: "medals-crimes-list", type: "count" },
    { id: 316, name: "Misdirection Master", statKey: "personalstats.fraud", threshold: 10000, category: "medals-crimes-list", type: "count" },
    { id: 317, name: "Underworld Upstart", statKey: "personalstats.illicitservices", threshold: 100, category: "medals-crimes-list", type: "count" },
    { id: 318, name: "Murky Middleman", statKey: "personalstats.illicitservices", threshold: 200, category: "medals-crimes-list", type: "count" },
    { id: 319, name: "Grievous Goon", statKey: "personalstats.illicitservices", threshold: 300, category: "medals-crimes-list", type: "count" },
    { id: 320, name: "Heinous Henchman", statKey: "personalstats.illicitservices", threshold: 500, category: "medals-crimes-list", type: "count" },
    { id: 321, name: "Hardworking Heavy", statKey: "personalstats.illicitservices", threshold: 750, category: "medals-crimes-list", type: "count" },
    { id: 322, name: "Intrepid Intermediary", statKey: "personalstats.illicitservices", threshold: 1000, category: "medals-crimes-list", type: "count" },
    { id: 323, name: "Crooked Connector", statKey: "personalstats.illicitservices", threshold: 1500, category: "medals-crimes-list", type: "count" },
    { id: 324, name: "Belligerent Broker", statKey: "personalstats.illicitservices", threshold: 2000, category: "medals-crimes-list", type: "count" },
    { id: 325, name: "Criminal Contractor", statKey: "personalstats.illicitservices", threshold: 2500, category: "medals-crimes-list", type: "count" },
    { id: 326, name: "Dark Dealmaker", statKey: "personalstats.illicitservices", threshold: 3000, category: "medals-crimes-list", type: "count" },
    { id: 327, name: "Lawless Liaison", statKey: "personalstats.illicitservices", threshold: 4000, category: "medals-crimes-list", type: "count" },
    { id: 328, name: "Clandestine Collaborator", statKey: "personalstats.illicitservices", threshold: 5000, category: "medals-crimes-list", type: "count" },
    { id: 329, name: "Felonious Facilitator", statKey: "personalstats.illicitservices", threshold: 6000, category: "medals-crimes-list", type: "count" },
    { id: 330, name: "Amoral Arbitrator", statKey: "personalstats.illicitservices", threshold: 7500, category: "medals-crimes-list", type: "count" },
    { id: 331, name: "Vice Vendor", statKey: "personalstats.illicitservices", threshold: 10000, category: "medals-crimes-list", type: "count" },
    { id: 332, name: "Web Wizard", statKey: "personalstats.cybercrime", threshold: 100, category: "medals-crimes-list", type: "count" },
    { id: 333, name: "Digital Desperado", statKey: "personalstats.cybercrime", threshold: 200, category: "medals-crimes-list", type: "count" },
    { id: 334, name: "Tech Tinkerer", statKey: "personalstats.cybercrime", threshold: 300, category: "medals-crimes-list", type: "count" },
    { id: 335, name: "Virtual Virtuoso", statKey: "personalstats.cybercrime", threshold: 500, category: "medals-crimes-list", type: "count" },
    { id: 336, name: "Phishing Phenom", statKey: "personalstats.cybercrime", threshold: 750, category: "medals-crimes-list", type: "count" },
    { id: 337, name: "Network Ninja", statKey: "personalstats.cybercrime", threshold: 1000, category: "medals-crimes-list", type: "count" },
    { id: 338, name: "Expert Exploiter", statKey: "personalstats.cybercrime", threshold: 1500, category: "medals-crimes-list", type: "count" },
    { id: 339, name: "Data Dynamo", statKey: "personalstats.cybercrime", threshold: 2000, category: "medals-crimes-list", type: "count" },
    { id: 340, name: "Code Commando", statKey: "personalstats.cybercrime", threshold: 2500, category: "medals-crimes-list", type: "count" },
    { id: 341, name: "Online Outlaw", statKey: "personalstats.cybercrime", threshold: 3000, category: "medals-crimes-list", type: "count" },
    { id: 342, name: "Malware Mogul", statKey: "personalstats.cybercrime", threshold: 4000, category: "medals-crimes-list", type: "count" },
    { id: 343, name: "System Saboteur", statKey: "personalstats.cybercrime", threshold: 5000, category: "medals-crimes-list", type: "count" },
    { id: 344, name: "Heinous Hacker", statKey: "personalstats.cybercrime", threshold: 6000, category: "medals-crimes-list", type: "count" },
    { id: 345, name: "Backdoor Baron", statKey: "personalstats.cybercrime", threshold: 7500, category: "medals-crimes-list", type: "count" },
    { id: 346, name: "Byte Boss", statKey: "personalstats.cybercrime", threshold: 10000, category: "medals-crimes-list", type: "count" },
    { id: 347, name: "Budding Bully", statKey: "personalstats.extortion", threshold: 100, category: "medals-crimes-list", type: "count" },
    { id: 348, name: "Novice Negotiator", statKey: "personalstats.extortion", threshold: 200, category: "medals-crimes-list", type: "count" },
    { id: 349, name: "Cunning Coercer", statKey: "personalstats.extortion", threshold: 300, category: "medals-crimes-list", type: "count" },
    { id: 350, name: "Professional Pressurer", statKey: "personalstats.extortion", threshold: 500, category: "medals-crimes-list", type: "count" },
    { id: 351, name: "Haughty Harasser", statKey: "personalstats.extortion", threshold: 750, category: "medals-crimes-list", type: "count" },
    { id: 352, name: "Calculating Coaxer", statKey: "personalstats.extortion", threshold: 1000, category: "medals-crimes-list", type: "count" },
    { id: 353, name: "Exceptional Extortionist", statKey: "personalstats.extortion", threshold: 1500, category: "medals-crimes-list", type: "count" },
    { id: 354, name: "Polished Persuader", statKey: "personalstats.extortion", threshold: 2000, category: "medals-crimes-list", type: "count" },
    { id: 355, name: "Effective Enforcer", statKey: "personalstats.extortion", threshold: 2500, category: "medals-crimes-list", type: "count" },
    { id: 356, name: "Industrious Intimidator", statKey: "personalstats.extortion", threshold: 3000, category: "medals-crimes-list", type: "count" },
    { id: 357, name: "Ruthless Racketeer", statKey: "personalstats.extortion", threshold: 4000, category: "medals-crimes-list", type: "count" },
    { id: 358, name: "Ominous Oppressor", statKey: "personalstats.extortion", threshold: 5000, category: "medals-crimes-list", type: "count" },
    { id: 359, name: "Vindictive Victimizer", statKey: "personalstats.extortion", threshold: 6000, category: "medals-crimes-list", type: "count" },
    { id: 360, name: "Master Manipulator", statKey: "personalstats.extortion", threshold: 7500, category: "medals-crimes-list", type: "count" },
    { id: 361, name: "Tyrannical Terrorizer", statKey: "personalstats.extortion", threshold: 10000, category: "medals-crimes-list", type: "count" },
    { id: 362, name: "Grass Grower", statKey: "personalstats.illegalproduction", threshold: 100, category: "medals-crimes-list", type: "count" },
    { id: 363, name: "Dope Developer", statKey: "personalstats.illegalproduction", threshold: 200, category: "medals-crimes-list", type: "count" },
    { id: 364, name: "Seedy Supplier", statKey: "personalstats.illegalproduction", threshold: 300, category: "medals-crimes-list", type: "count" },
    { id: 365, name: "Blackmarket Botanist", statKey: "personalstats.illegalproduction", threshold: 500, category: "medals-crimes-list", type: "count" },
    { id: 366, name: "Narcotics Nurturer", statKey: "personalstats.illegalproduction", threshold: 750, category: "medals-crimes-list", type: "count" },
    { id: 367, name: "Revered Refiner", statKey: "personalstats.illegalproduction", threshold: 1000, category: "medals-crimes-list", type: "count" },
    { id: 368, name: "Forbidden Fabricator", statKey: "personalstats.illegalproduction", threshold: 1500, category: "medals-crimes-list", type: "count" },
    { id: 369, name: "Back-alley Builder", statKey: "personalstats.illegalproduction", threshold: 2000, category: "medals-crimes-list", type: "count" },
    { id: 370, name: "Contraband Creator", statKey: "personalstats.illegalproduction", threshold: 2500, category: "medals-crimes-list", type: "count" },
    { id: 371, name: "Covert Craftsman", statKey: "personalstats.illegalproduction", threshold: 3000, category: "medals-crimes-list", type: "count" },
    { id: 372, name: "Illicit Innovator", statKey: "personalstats.illegalproduction", threshold: 4000, category: "medals-crimes-list", type: "count" },
    { id: 373, name: "Prohibited Producer", statKey: "personalstats.illegalproduction", threshold: 5000, category: "medals-crimes-list", type: "count" },
    { id: 374, name: "Workshop Wizard", statKey: "personalstats.illegalproduction", threshold: 6000, category: "medals-crimes-list", type: "count" },
    { id: 375, name: "Synthetic Scientist", statKey: "personalstats.illegalproduction", threshold: 7500, category: "medals-crimes-list", type: "count" },
    { id: 376, name: "Production Prodigy", statKey: "personalstats.illegalproduction", threshold: 10000, category: "medals-crimes-list", type: "count" },

    { id: 89, name: "Apprentice", requirement: "$100,000 for 3 days", statKey: "personalstats.networth", threshold: 100000, category: "misc-awards-list", type: "count_networth_time" },
    { id: 90, name: "Entrepreneur", requirement: "$250,000 for 3 days", statKey: "personalstats.networth", threshold: 250000, category: "misc-awards-list", type: "count_networth_time" },
    { id: 91, name: "Executive", requirement: "$500,000 for 3 days", statKey: "personalstats.networth", threshold: 500000, category: "misc-awards-list", type: "count_networth_time" },
    { id: 92, name: "Millionaire", requirement: "$1,000,000 for 3 days", statKey: "personalstats.networth", threshold: 1000000, category: "misc-awards-list", type: "count_networth_time" },
    { id: 93, name: "Multimillionaire", requirement: "$2,500,000 for 7 days", statKey: "personalstats.networth", threshold: 2500000, category: "misc-awards-list", type: "count_networth_time" },
    { id: 94, name: "Capitalist", requirement: "$10,000,000 for 7 days", statKey: "personalstats.networth", threshold: 10000000, category: "misc-awards-list", type: "count_networth_time" },
    { id: 95, name: "Plutocrat", requirement: "$25,000,000 for 14 days", statKey: "personalstats.networth", threshold: 25000000, category: "misc-awards-list", type: "count_networth_time" },
    { id: 96, name: "Aristocrat", requirement: "$100,000,000 for 14 days", statKey: "personalstats.networth", threshold: 100000000, category: "misc-awards-list", type: "count_networth_time" },
    { id: 236, name: "Mogul", requirement: "$250,000,000 for 28 days", statKey: "personalstats.networth", threshold: 250000000, category: "misc-awards-list", type: "count_networth_time" },
    { id: 237, name: "Billionaire", requirement: "$1,000,000,000 for 28 days", statKey: "personalstats.networth", threshold: 1000000000, category: "misc-awards-list", type: "count_networth_time" },
    { id: 238, name: "Multibillionaire", requirement: "$2,500,000,000 for 56 days", statKey: "personalstats.networth", threshold: 2500000000, category: "misc-awards-list", type: "count_networth_time" },
    { id: 239, name: "Baron", requirement: "$10,000,000,000 for 56 days", statKey: "personalstats.networth", threshold: 10000000000, category: "misc-awards-list", type: "count_networth_time" },
    { id: 240, name: "Oligarch", requirement: "$25,000,000,000 for 112 days", statKey: "personalstats.networth", threshold: 25000000000, category: "misc-awards-list", type: "count_networth_time" },
    { id: 241, name: "Tycoon", requirement: "$100,000,000,000 for 112 days", statKey: "personalstats.networth", threshold: 100000000000, category: "misc-awards-list", type: "count_networth_time" },
];


// --- Other Merits.js code (keep unchanged) ---
// DOM Elements
const loadingIndicator = document.getElementById('loading-indicator');
const errorDisplay = document.getElementById('error-display');
const playerNameSpan = document.getElementById('player-name');
const playerLevelSpan = document.getElementById('player-level');
const playerTotalStatsSpan = document.getElementById('player-total-stats');
const playerNetworthSpan = document.getElementById('player-networth');
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


// --- Helper Functions (keep unchanged) ---

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
    // ADDED 'medals' AND 'honors' selections to fetch the awarded IDs directly.
    const selections = "basic,personalstats,medals,honors"; 
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

function displayPlayerSummary(playerData) {
    console.log("displayPlayerSummary: Processing playerData:", playerData);

    if (playerData) {
        playerNameSpan.textContent = playerData.name || 'N/A';
        playerLevelSpan.textContent = formatNumber(playerData.level) || 'N/A';

        const totalStats = playerData.personalstats ? playerData.personalstats.totalstats : undefined;
        playerTotalStatsSpan.textContent = totalStats !== undefined ? formatNumber(totalStats) : 'N/A';

        const networth = playerData.personalstats ? playerData.personalstats.networth : undefined;
        playerNetworthSpan.textContent = networth !== undefined ? `$${formatNumber(networth)}` : 'N/A';
        
        const awards = playerData.personalstats ? playerData.personalstats.awards : undefined;
        playerAwardsSpan.textContent = awards !== undefined ? formatNumber(awards) : 'N/A';


        // More granular logging for debugging specific values
        console.log(`  Name: ${playerNameSpan.textContent}`);
        console.log(`  Level: ${playerLevelSpan.textContent}`);
        console.log(`  Total Stats: ${playerTotalStatsSpan.textContent}`);
        console.log(`  Networth: ${playerNetworthSpan.textContent}`);
        console.log(`  Awards: ${playerAwardsSpan.textContent}`);

    } else {
        console.warn("displayPlayerSummary: playerData is missing.");
        playerNameSpan.textContent = 'N/A';
        playerLevelSpan.textContent = 'N/A';
        playerTotalStatsSpan.textContent = 'N/A';
        playerNetworthSpan.textContent = 'N/A';
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
                statusSymbol = '';
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
                statusIconClass = 'in-progress'; statusSymbol = '';
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
                statusIconClass = 'in-progress'; statusSymbol = '';
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
            statusSymbol = '';
            progressText = ` (Current: ${formatNumber(value)})`;
            // For general 'count' where threshold isn't clear, just show current value
            calculatedPercentage = 1; // Indicate some progress but not quantifiable
        }
    }

    return { statusIconClass, statusSymbol, progressText, isCompleted, calculatedPercentage };
}


// --- merits.js (UPDATED updateAchievementsDisplay function - Single Tick) ---

// ... (keep all code above this function as it is) ...

/**
 * Updates the display for Honors and Medals based on player data.
 * Displays a single, integrated tick for awarded items, replacing progress symbols.
 * @param {object} playerData - The full player data from the Torn API.
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

    // Extract user's awarded IDs from the API response
    const userOwnedHonorsIds = new Set(playerData.honors_awarded || []); 
    const userOwnedMedalsIds = new Set(playerData.medals_awarded || []);


    const allAchievementsWithStatus = []; // Used for Awards Progress tab

    const processAndDisplay = (achievement, type) => {
        const { statusIconClass, statusSymbol, progressText, isCompleted, calculatedPercentage } = getAchievementStatus(achievement, playerData);
        
        const listItem = document.createElement('li');
        listItem.classList.add('achievement-item'); 

        // Add data-id and data-type attributes (essential for any future external lookup/styling)
        listItem.dataset.id = achievement.id; 
        listItem.dataset.type = type; 

        // Determine if the award is owned by the API response
        let isAwardedByApi = false;
        if (type === 'honor' && userOwnedHonorsIds.has(achievement.id)) {
            isAwardedByApi = true;
        } else if (type === 'medal' && userOwnedMedalsIds.has(achievement.id)) {
            isAwardedByApi = true;
        }

        // --- MODIFIED LOGIC: Show Font Awesome tick IF AWARDED, else show progress symbol ---
        let finalDisplayIconHtml = ''; // Will contain the HTML for the icon/symbol
        let finalIconClass = statusIconClass; // Keep original progress class by default

        if (isAwardedByApi) {
            finalDisplayIconHtml = '<i class="fas fa-check"></i>'; // Font Awesome checkmark icon
            finalIconClass = 'completed'; // Force to 'completed' color (green)
            listItem.classList.add('awarded-by-api'); // Keep for overall row styling
        } else {
            finalDisplayIconHtml = statusSymbol;
            // finalIconClass remains statusIconClass
        }
        // --- END MODIFIED LOGIC ---


        listItem.innerHTML = `
            <span class="merit-status-icon ${finalIconClass}">${finalDisplayIconHtml}</span>
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

        // Add to the Awards Progress tab if not completed by stat threshold
        if (!isCompleted) { // Use original isCompleted, not affected by isAwardedByApi
            allAchievementsWithStatus.push({
                achievement,
                statusIconClass, // Use original statusIconClass for progress tab
                statusSymbol,    // Use original statusSymbol for progress tab
                progressText,
                calculatedPercentage
            });
        }
    };

    // Process all honors and medals. Pass 'honor' or 'medal' type to the helper.
    allHonors.forEach(ach => processAndDisplay(ach, 'honor'));
    allMedals.forEach(ach => processAndDisplay(ach, 'medal'));

    // Populate the Awards Progress tab after all other lists are processed
    populateAwardsProgressTab(allAchievementsWithStatus);
}

// ... (The separate applyAwardedTicks function should be completely removed from your file) ...

// ... (keep all code below this function as it is) ...






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
            value = 'N/A';
        }

        const li = document.createElement('li');
        const spanId = `stat-${displayName.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}`;
li.innerHTML = `<span class="stat-label"><strong>${displayName}:</strong></span><span class="stat-value" id="${spanId}">${typeof value === 'number' ? formatNumber(value) : (value || 'N/A')}</span>`;
        statsContainer.appendChild(li);
    }

    const totalAwardsLi = document.createElement('li');
    totalAwardsLi.innerHTML = `<strong>Total Awards Tracked:</strong> <span id="total-awards-tracked">${formatNumber(allHonors.length + allMedals.length)}</span>`;
    statsContainer.appendChild(totalAwardsLi);
}

function switchTab(tabId) {

    tabsContainer.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    tabContents.forEach(pane => {
        pane.classList.remove('active');
        pane.style.display = 'none'; // Directly set display to none
    });

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


// --- Initialization Function (Modified to fetch specific awarded IDs) ---

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
                        populatePlayerStats(playerData)
						


                        
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

// --- START: Desktop-Only Device Blocker ---
function initializeDeviceBlocker() {
    // This function will only run once
    if (document.getElementById('device-blocker')) {
        return;
    }

    // 1. --- Define the Button Styles ---
    const buttonStyles = {
        backgroundColor: '#007bff',
        color: 'black',
        padding: '8px 15px',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontWeight: 'bold',
        marginTop: '20px',
        textDecoration: 'none',
        fontSize: '16px'
    };

    // 2. --- Create the Blocker Elements ---
    const blocker = document.createElement('div');
    blocker.id = 'device-blocker';

    const contentWrapper = document.createElement('div');
    
    const heading = document.createElement('h2');
    heading.textContent = 'Desktop View Required';

    const paragraph = document.createElement('p');
    paragraph.textContent = 'For the best experience, this tool is designed for desktop computers. Please switch to a larger device.';

    const homeButton = document.createElement('a');
    homeButton.href = 'home.html';
    homeButton.textContent = 'Return to Home';
    
    // Apply the styles from your object to the button
    Object.assign(homeButton.style, buttonStyles);
    
    // Add a simple hover effect
    homeButton.addEventListener('mouseover', () => homeButton.style.backgroundColor = '#0056b3');
    homeButton.addEventListener('mouseout', () => homeButton.style.backgroundColor = '#007bff');

    // Put all the content together
    contentWrapper.appendChild(heading);
    contentWrapper.appendChild(paragraph);
    contentWrapper.appendChild(homeButton);
    blocker.appendChild(contentWrapper);
    document.body.appendChild(blocker);

    // 3. --- Add CSS for the Blocker Overlay ---
    const style = document.createElement('style');
    style.textContent = `
        #device-blocker {
            display: none; /* Hidden by default */
            flex-direction: column;
            justify-content: center;
            align-items: center;
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background-color: #222;
            color: #eee;
            text-align: center;
            z-index: 99999;
            padding: 20px;
            box-sizing: border-box;
        }
        /* --- NEW STYLE ADDED FOR THE HEADING --- */
        #device-blocker h2 {
            color: #00a8ff; /* This makes the heading text blue */
        }
        /* Hide main content when blocker is active */
        body.blocked-device #mainHomepageContent,
        body.blocked-device header,
        body.blocked-device footer {
            display: none !important;
        }
    `;
    document.head.appendChild(style);

    // 4. --- Logic to Show/Hide the Blocker ---
    function checkScreenSize() {
        // Blocks any screen 1024px wide or smaller
        if (window.innerWidth <= 1024) {
            blocker.style.display = 'flex';
            document.body.classList.add('blocked-device');
        } else {
            blocker.style.display = 'none';
            document.body.classList.remove('blocked-device');
        }
    }

    // 5. --- Run the Blocker ---
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
}

// Call the function to set everything up
initializeDeviceBlocker();
// --- END: Desktop-Only Device Blocker ---