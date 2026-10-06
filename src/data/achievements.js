// Achievements unlock automatically. Kinds:
//   stat:     a counter in the stats table reaches `threshold`
//   level:    player level reaches `level`
//   networth: net worth reaches `networth`
//   prestige: prestige count reaches `prestige`
//   special:  granted directly by code (e.g. the OG badge for v1 players)

const ACHIEVEMENTS = {
    og: { name: 'OG', emoji: '🎖️', description: 'Played Project 1B before v2 existed.', special: true, reward: 0 },

    first_shift: { name: 'First Paycheck', emoji: '👔', description: 'Work your first shift.', stat: 'work', threshold: 1, reward: 500 },
    workaholic: { name: 'Workaholic', emoji: '💼', description: 'Work 250 shifts.', stat: 'work', threshold: 250, reward: 25_000 },
    career_legend: { name: 'Career Legend', emoji: '🏅', description: 'Work 1,000 shifts.', stat: 'work', threshold: 1_000, reward: 150_000 },

    angler: { name: 'Angler', emoji: '🎣', description: 'Catch 100 fish.', stat: 'fish_catch', threshold: 100, reward: 5_000 },
    sea_legend: { name: 'Sea Legend', emoji: '🐋', description: 'Catch 1,000 fish.', stat: 'fish_catch', threshold: 1_000, reward: 60_000 },
    miner: { name: 'Miner', emoji: '⛏️', description: 'Mine 200 ores.', stat: 'mine_catch', threshold: 200, reward: 6_000 },
    deep_core: { name: 'Deep Core', emoji: '🌋', description: 'Mine 2,000 ores.', stat: 'mine_catch', threshold: 2_000, reward: 70_000 },
    archaeologist: { name: 'Archaeologist', emoji: '🦖', description: 'Dig up 150 things.', stat: 'dig_catch', threshold: 150, reward: 6_000 },
    crafter: { name: 'Crafter', emoji: '⚒️', description: 'Craft 25 items.', stat: 'craft', threshold: 25, reward: 10_000 },
    lucky_find: { name: 'Lucky Find', emoji: '🍀', description: 'Find a legendary item.', stat: 'legendary_find', threshold: 1, reward: 10_000 },
    mythic_find: { name: 'Mythbuster', emoji: '🔴', description: 'Find a mythic item.', stat: 'mythic_find', threshold: 1, reward: 50_000 },
    treasure_hunter: { name: 'Treasure Hunter', emoji: '🏴‍☠️', description: 'Claim 10 treasure drops in chat.', stat: 'drop_claim', threshold: 10, reward: 20_000 },

    high_roller: { name: 'High Roller', emoji: '🎰', description: 'Wager $1,000,000 in total at the casino.', stat: 'gamble_wagered', threshold: 1_000_000, reward: 25_000 },
    house_wins: { name: 'The House Always Wins', emoji: '💸', description: 'Lose 100 casino games.', stat: 'gamble_loss', threshold: 100, reward: 5_000 },

    generous: { name: 'Generous', emoji: '🤝', description: 'Send $100,000 to other players.', stat: 'pay_sent', threshold: 100_000, reward: 10_000 },
    robin_hood: { name: 'Robin Hood', emoji: '🦹', description: 'Pull off 10 robberies.', stat: 'rob_success', threshold: 10, reward: 15_000 },
    caught: { name: 'Caught Red-Handed', emoji: '🚔', description: 'Get caught robbing someone.', stat: 'rob_fail', threshold: 1, reward: 1_000 },
    heister: { name: 'Ocean\'s Eleven', emoji: '💰', description: 'Survive a successful heist.', stat: 'heist_success', threshold: 1, reward: 20_000 },

    devoted: { name: 'Devoted', emoji: '📅', description: 'Reach a 30-day daily streak.', stat: 'daily_streak', threshold: 30, reward: 50_000 },
    questing: { name: 'Quest Master', emoji: '🎯', description: 'Complete 50 daily quests.', stat: 'quest_complete', threshold: 50, reward: 40_000 },
    investor: { name: 'Wolf of Discord Street', emoji: '📊', description: 'Make 100 stock trades.', stat: 'stock_trade', threshold: 100, reward: 30_000 },
    landlord: { name: 'Landlord', emoji: '🏘️', description: 'Own 3 different businesses.', stat: 'business_count', threshold: 3, reward: 25_000 },
    tycoon: { name: 'Tycoon', emoji: '🏙️', description: 'Own every business.', stat: 'business_count', threshold: 8, reward: 1_000_000 },

    level_10: { name: 'Getting Started', emoji: '🔟', description: 'Reach level 10.', level: 10, reward: 10_000 },
    level_25: { name: 'Seasoned', emoji: '⭐', description: 'Reach level 25.', level: 25, reward: 75_000 },
    level_50: { name: 'Veteran', emoji: '🌟', description: 'Reach level 50.', level: 50, reward: 500_000 },

    millionaire: { name: 'Millionaire', emoji: '💵', description: 'Reach a net worth of $1,000,000.', networth: 1_000_000, reward: 0 },
    ten_million: { name: 'Multi-Millionaire', emoji: '💰', description: 'Reach a net worth of $10,000,000.', networth: 10_000_000, reward: 0 },
    hundred_million: { name: 'Fat Cat', emoji: '🤑', description: 'Reach a net worth of $100,000,000.', networth: 100_000_000, reward: 0 },
    billionaire: { name: 'Project 1B', emoji: '🏆', description: 'Reach a net worth of $1,000,000,000.', networth: 1_000_000_000, reward: 0 },
    prestige_1: { name: 'Born Again', emoji: '♾️', description: 'Prestige for the first time.', prestige: 1, reward: 0 },
};

for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) achievement.id = id;

module.exports = { ACHIEVEMENTS };
