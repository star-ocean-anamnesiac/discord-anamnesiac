
const axios = require('axios');
const Discord = require('discord.js');

const { API_URL, weaponHash, emojiHash, emojiInstHash } = require('./shared');

const { getGuideSet, guideHash, guide, guided, guideReset } = require('./commands/guide');
const { getItemSet, itemHash, item, itemd, itemReset } = require('./commands/item');
const { getCharSet, charHash, char, chard, charReset } = require('./commands/char');

const { roomInit, room } = require('./commands/room');
const { contribute } = require('./commands/contribute');

const client = new Discord.Client();

let currentAPICommit = '';
let currentData = {};

const refreshAPI = async () => {
  guideReset();
  itemReset();
  charReset();
  
  const { allItems, allCharacters, allGuides, root } = (await axios.get(API_URL)).data;
  currentData = { allItems, allCharacters, allGuides };

  root.weapons.forEach(({ id, name }) => {
    weaponHash[id] = name;
  });

  allItems.forEach(item => {
    getItemSet().add(item.name);
    itemHash[`${item.name}.${item.cat}`] = item;
  });

  allCharacters.forEach(char => {
    const aliases = [char.name];

    const firstName = char.name.split(' ')[0];

    if(char.awakened) {
      aliases.push(`awk ${firstName}`);
      aliases.push(`a ${firstName}`);
      aliases.push(`a${firstName}`);
    }
    
    // holiday aliases
    if(char.name.includes('(')) {
      const holiday = char.name.split('(')[1].split(')')[0];
      const shortHoliday = holiday.split(' ').map(x => x.substring(0, 1)).join('');
      aliases.push(`${holiday} ${firstName}`);
      aliases.push(`${shortHoliday} ${firstName}`);
      aliases.push(`${shortHoliday}${firstName}`);

    // first name alias
    } else {
      aliases.push(firstName);
    }

    aliases.forEach(alias => {
      getCharSet().add(alias);
      charHash[`${alias}.${char.cat}`] = char;
    });
  });

  allGuides.forEach(guide => {
    getGuideSet().add(guide.name);
    guideHash[`${guide.name}.${guide.cat}`] = guide;
  });
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
  '?itemd': itemd,
  '?boss': guide,
  '?bossd': guided,
  '?char': char,
  '?chard': chard,

  '?room': room,
  '?contribute': contribute
};

const determineRegion = (msg) => {
  const chanName = msg.channel.name || '';
  if(chanName.includes('jp')) return 'jp';
  return 'gl';
};

client.on('ready', () => {
  console.log('Started up!');

  const allEmoji = client.emojis.filter(emoji => emoji.name.startsWith('sbr'));
  allEmoji.forEach(emoji => {
    emojiInstHash[emoji.name] = emoji;
    emojiHash[emoji.name] = emoji.toString();
  });

  roomInit(client);
});

client.on('message', async msg => {

  const content = msg.content;
  let region = determineRegion(msg);

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
  
  if(!commands[cmd]) return;

  await tryRefreshAPI();

  commands[cmd](client, msg, args, { cmd, region, currentData });
});

client.on('error', err => console.error(err));

const init = async () => {
  const API_TOKEN = process.env.DISCORD_TOKEN;
  client.login(API_TOKEN);
};

init();