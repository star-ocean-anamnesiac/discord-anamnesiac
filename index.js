const axios = require('axios');
const ua = require('universal-analytics');
const Discord = require('discord.js');
const Snoowrap = require('snoowrap');
const { CommentStream } = require('snoostorm');
const { API_URL, weaponHash, emojiHash, emojiInstHash, aliasLightning } = require('./shared');

const { addGuide, guide, guideq, guides, guideMD, guideReset } = require('./commands/guide');
const { addItem, item, itemq, items, itemMD, itemReset } = require('./commands/item');
const { addChar, char, charc, chars, charq, charp, charMD, charReset } = require('./commands/char');
const { addShop, shop, shopMD, shopReset } = require('./commands/shop');
const { addStamp, stamp, stampReset } = require('./commands/stamp');

const { roomInit, room } = require('./commands/room');
const { contribute } = require('./commands/contribute');
const { help } = require('./commands/help');

const visitor = process.env.GA_UID ? ua(process.env.GA_UID, 'DISCORD_BOT', { strictCidFormat: false }) : null;
const client = new Discord.Client();


let currentAPICommit = '';
let currentData = {};

const sendUAEvent = (event, search) => {
  if(!visitor) return;

  visitor.event(event, search).send();
};

const refreshAPI = async () => {
  guideReset();
  itemReset();
  charReset();
  shopReset();
  stampReset();

  const { allItems, allCharacters, allGuides, allShops, allStamps, root } = (await axios.get(API_URL)).data;
  currentData = { allItems, allCharacters, allGuides, allShops, allStamps };
  root.weapons.forEach(({ id, name }) => {
    weaponHash[id] = name;
  });

  allItems.forEach(item => {
    // change all the lightning to thunder
    addItem(aliasLightning(item));
  });

  allCharacters.forEach(char => {
    addChar(char);
  });

  allGuides.forEach(guide => {
    addGuide(guide);
  });

  allShops.forEach(shop => {
    addShop(shop);
  });

  allStamps.forEach(stamp => {
    addStamp(stamp);
  })
};

const tryRefreshAPI = async () => {
  const res = await axios.head(API_URL);
  const commit = res.headers['x-commit'];
  if(commit !== currentAPICommit) {
    currentAPICommit = commit;
    await refreshAPI();
  }
};

const commands = {
  '?item': item,
  // '?itemd': itemd,
  '?items': items,
  '?itemq': itemq,

  '?boss': guide,
  // '?bossd': guided,
  '?bossq': guideq,
  '?bosss': guides,

  '?char': char,
  // '?chard': chard,
  '?charc': charc,
  '?chars': chars,
  '?charq': charq,
  '?aprefix': charp,

  '?shop': shop,

  '?stamp': stamp,

  '?room': room,
  '?contribute': contribute,
  '?bot': help,
  '?ahelp': help,
  '?anamnesiac': help
};

const determineRegion = (msg) => {
  const chanName = msg.channel.name || '';
  if(chanName.includes('jp')) return 'jp';
  return 'jp';
};

const parseCommandArgsRegion = (content, msg = null) => {
  let region = msg ? determineRegion(msg) : 'jp';

  let cmd = (content.split(' ')[0] || '').toLowerCase().trim();
  const args = content.slice(content.indexOf(' ') + 1);

  if(cmd.includes('jp')) {
    region = 'jp';
    cmd = cmd.split('jp').join('');
  }

  if(cmd.includes('gl')) {
    region = 'gl';
    cmd = cmd.split('gl').join('');
  }

  return { region, cmd, args };
};

client.on('ready', () => {
  console.log('Discord connected!');

  const allEmoji = client.emojis.filter(emoji => emoji.name.startsWith('sbr'));
  allEmoji.forEach(emoji => {
    emojiInstHash[emoji.name] = emoji;
    emojiHash[emoji.name] = emoji.toString();
  });
  roomInit(client);
});

client.on('message', async msg => {

  const content = msg.content;
  const { cmd, region, args } = parseCommandArgsRegion(content, msg);
  if(!commands[cmd]) return;

  await tryRefreshAPI();
  sendUAEvent('Discord', cmd);

  commands[cmd](client, msg, args, { cmd, region, currentData });
});

client.on('error', err => console.error(err));

const initReddit = () => {
  console.log('Reddit connected!');

  const client = new Snoowrap({
    userAgent: 'discord-anamnesiac v1.x.x',
    clientId: process.env.REDDIT_APP,
    clientSecret: process.env.REDDIT_SECRET,
    username: process.env.REDDIT_USERNAME,
    password: process.env.REDDIT_PASSWORD
  });

  client.config({ requestDelay: 5000 });

  const subreddit = process.env.NODE_ENV === 'production' ? 'soanamnesis' : 'testingground4bots';

  // /1000 because reddits API doesn't use millis
  const BOT_START = Date.now() / 1000;

  const getRedditArgs = (msg) => {
    return msg.split('/u/anamnesiacbot')[1].trim().split('\n')[0];
  };

  const canSummon = (msg) => {
    return msg && msg.toLowerCase().includes('/u/anamnesiacbot');
  };

  const redditCommands = {
    char: charMD,
    item: itemMD,
    shop: shopMD,
    boss: guideMD
  };

  const comments = new CommentStream(client, { subreddit, limit: 10, pollTime: 10000 });
  comments.on('item', async (item) => {
    if(item.created_utc < BOT_START) return;
    if(!canSummon(item.body)) return;

    const { cmd, region, args } = parseCommandArgsRegion(getRedditArgs(item.body));
    if(!redditCommands[cmd]) return;
    sendUAEvent('Reddit', cmd);

    await tryRefreshAPI();

    const sendString = redditCommands[cmd](args, { region });
    if(sendString) {
      try {
        await item.reply(sendString);
      } catch(e) {
        console.error(e);
      }
    }
  });
};

const init = async () => {
  const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
  if(DISCORD_TOKEN) {
    client.login(DISCORD_TOKEN);
  }

  const REDDIT_USERNAME = process.env.REDDIT_USERNAME;
  if(REDDIT_USERNAME) {
    initReddit();
  }

};

init();
