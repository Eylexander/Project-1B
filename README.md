# Project 1B

<div align="center">

**The race to $1,000,000,000.**

A Discord economy game that started in 2018 as a first JavaScript project.

[![GitHub license](https://img.shields.io/github/license/Eylexander/Project-1B.svg)](https://github.com/Eylexander/Project-1B/blob/main/LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

</div>

Everyone starts with $500 and a dream. Work shifts, fish, mine, trade on the Discord Street exchange, build a business empire, try your luck at the casino or rob your friends. The first player to a **$1 billion net worth** completes Project 1B and can **prestige**: start over with a permanent income bonus and a 🏆 1B Trophy.

## What's in the game

| | |
|---|---|
| 💼 **Jobs** | 10 careers (Barista → Designer → Ingénieur → … → Astronaut) with automatic promotions. Every `/work` shift is a quick button mini-game: answer right for a bonus. |
| ⚡ **Energy** | The v1 *mana*, reborn. Work and gathering cost energy, which refills 1 per minute. Coffee and energy drinks top it up. |
| 🎣 **Gathering** | `/fish`, `/mine`, `/dig` with loot tables from junk to mythic, tools that wear out, and crafted tier-2 tools for better finds. |
| ⚒️ **Crafting** | Smelt ores into bars, cook Bouillabaisse, forge a Royal Crown. |
| 🏢 **Businesses** | Idle income from a Lemonade Stand up to a Space Agency, with 10 upgrade levels each. Collect before the 12-hour storage fills. |
| 📈 **Stocks** | 10 fictional companies (Patate Corp, Banques Suisses, Astley Records, 1B Coin…) with prices that move every 5 minutes, breaking news and portfolios. |
| 🏪 **Player market** | List items for other players. Fees and taxes drain money out of the economy. |
| 🏦 **Bank** | Robbers can't touch it, and it pays 0.5% interest a day up to your capacity. |
| 🎰 **Casino** | Coinflip, slots, roulette and blackjack, with level-based max bets. |
| 🦹 **Crime** | `/rob` other players (padlocks and lockpicks matter) or plan a `/heist` that the whole channel can join. `/passive` opts out. |
| 🎟️ **Lottery** | One jackpot for the whole bot, drawn daily at 19:00 UTC. |
| 🎯 **Progression** | Daily quests, 32 achievements, streaks, leaderboards (global or per server), `/flex` comparisons. |
| 🚀 **Road to 1B** | Net worth is recorded daily: `/journey` charts your progress and forecasts when you'll hit the billion. Every Monday a Forbes list of the richest players and biggest climbers is posted. |
| 🏝️ **Treasure drops** | Chests wash up in active chats; the first click wins. |
| ✨ **Golden Hour** | Random global events that double work pay. |

Players from v1 keep their level, money (moved to the bank) and job, and get the 🎖️ **OG** badge.

## Setup

Requires Node.js 18.17+ (22 LTS recommended).

```sh
git clone https://github.com/Eylexander/Project-1B.git
cd Project-1B
npm install
cp settings.json.example settings.json   # then fill it in
npm start
```

`settings.json`:

| Key | What it is |
|---|---|
| `token` | Bot token (or set the `DISCORD_TOKEN` environment variable) |
| `admin` | Your Discord user id: unlocks `/admin` |
| `devserver` | The server id used for testing. Slash commands are synced there on boot. |
| `weathertoken` | OpenWeatherMap key for `/weather` (optional) |
| `newsapi` | NewsAPI key for `/news` (optional) |
| `deployOnStart` | `guild` (default: sync to the dev server on boot), `global`, or `off` |

The bot needs the **Message Content** intent enabled in the Developer Portal (chat rewards, treasure drops and trigger words use it).

### Slash commands

On boot the bot syncs its commands to `devserver` when they changed. To publish everywhere:

```sh
npm run deploy:global      # public commands everywhere, /admin only on the dev server
npm run deploy             # dev server only
node src/core/deploy.js clear-global   # remove all global commands
```

Global commands can take a few minutes to appear. If the same commands are registered both globally and on the dev server, they show up twice there.

## Commands

Run `/help` in Discord for the full, clickable list. Highlights:

- **Economy:** `/profile` `/balance` `/daily` `/weekly` `/bank` `/pay` `/leaderboard` `/flex` `/transactions`
- **Work & gathering:** `/work` `/job` `/fish` `/mine` `/dig`
- **Items:** `/shop` `/buy` `/sell` `/use` `/inventory` `/craft` `/item`
- **Finance:** `/stocks` `/business` `/market` `/lottery`
- **Casino:** `/coinflip` `/slots` `/roulette` `/blackjack`
- **Crime:** `/rob` `/heist` `/passive`
- **Progression:** `/quests` `/achievements` `/journey` `/prestige`
- **Server:** `/economy` `/config` (Manage Server)
- **Utility:** `/help` `/ping` `/botinfo` `/serverinfo` `/userinfo` `/weather` `/crypto` `/news` `/meme` `/emoji` `/rickroll` `/suggest` `/clear`
- **Owner:** `/admin` (money, items, events, bans, trigger words, deploy)

## Server settings

`/config` (needs Manage Server) toggles per server:

- 💬 chat rewards (on by default)
- 🏝️ treasure drops, optionally limited to one channel (off by default, on in the dev server)
- 📣 an announcement channel for lottery winners, Golden Hours, big market news, prestiges and the weekly Forbes list
- 💙 the suicide-prevention helpline message (on by default)
- 🥔 the v1 "fun replies" to trigger words (off by default, on in the dev server)

## How it's built

```
index.js              entry point (kept at the root for pm2)
src/
  bot.js              client, events, login
  config.js           settings.json + environment
  core/               registry, interaction router, deploy, scheduler, logger
  db/                 SQLite connection, migrations, v1 import
  data/               game content: items, jobs, businesses, stocks, quests, achievements
  game/               game rules, no Discord code (economy, jobs, stocks, casino...)
  ui/                 Components V2 cards, pagination, confirmations
  commands/<category>/ one file per slash command
  components/         persistent buttons (treasure drops)
  events/             ready, interactionCreate, messageCreate, guildCreate
test/                 node:test suites and a fake Discord harness
```

- **One database**, `database/project1b.sqlite` (better-sqlite3, WAL). Schema changes are append-only migrations in `src/db/migrations.js`.
- **Every dollar is in the ledger.** All money moves through `game/economy.js` (`credit` / `debit`), which can never overdraw and records a row in `transactions`. `/transactions` and `/economy` read from it.
- **Balancing lives in `src/data/`.** Prices, pay, loot odds and business incomes are plain numbers; change them without touching any logic.
- **UI** uses Discord's Components V2 (containers, sections, buttons, selects, modals) through the small `Card` helper in `src/ui/card.js`.
- **Charts** (`/stocks view`, `/journey`) are drawn with the optional `@napi-rs/canvas`. If it can't be installed, those commands fall back to text sparklines.

### Tests

```sh
npm test
```

Unit tests cover the game rules (money can't go negative, energy regen, promotions, stock simulation over a month, slots RTP, robberies, prestige...). The command tests run all 52 slash commands through the real router against a fake Discord and check every message against Discord's Components V2 limits.

## Privacy

v1 logged every message's content to disk. v2 doesn't: it logs commands and errors only. The old `logs/` and `database/devtools/logs.sqlite` files are still on disk from v1; delete them if you don't need them.

## Contributing

MIT licensed. Pull requests welcome. Questions? Open an issue or [contact me on Discord](https://discord.com/users/344526513577918477).
