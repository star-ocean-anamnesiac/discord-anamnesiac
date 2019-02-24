
const FuzzySet = require('fuzzyset.js');
const axios = require('axios');
const Discord = require('discord.js');

const API_URL = 'https://anamnesiac.seiyria.com/data';
const ASSET_URL = 'https://anamnesiac.seiyria.com/assets';

const itemSet = new FuzzySet();
const charSet = new FuzzySet();
const guideSet = new FuzzySet();

const client = new Discord.Client();

let currentAPICommit = '';

const weaponHash = {};
const itemHash = {};
const charHash = {};
const guideHash = {};

const emojiHash = {};

const refreshAPI = async () => {
  const { allItems, allCharacters, allGuides, root } = (await axios.get(API_URL)).data;

  root.weapons.forEach(({ id, name }) => {
    weaponHash[id] = name;
  });

  allItems.forEach(item => {
    itemSet.add(item.name);
    itemHash[`${item.name}.${item.cat}`] = item;
  });

  allCharacters.forEach(char => {
    const aliases = [char.name];

    const firstName = char.name.split(' ')[0];
    
    // holiday aliases
    if(char.name.includes('(')) {
      const holiday = char.name.split('(')[1].split(')')[0];
      aliases.push(`${holiday} ${firstName}`);
      aliases.push(`${holiday.substring(0, 1)} ${firstName}`)

    // first name alias
    } else {
      aliases.push(firstName);
    }

    aliases.forEach(alias => {
      charSet.add(alias);
      charHash[`${alias}.${char.cat}`] = char;
    });
  });

  allGuides.forEach(guide => {
    guideSet.add(guide.name);
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

const updatePresence = (newPlayingWith) => {
  client.user.setPresence({ status: 'online', game: { name: `with ${newPlayingWith}` } });
};

const sendMessage = (msg, replyData) => {
  msg.channel.send(replyData);
};

const item = (msg, args, { region, desc }) => {
  const ref = itemSet.get(args);
  if(!ref) {
    msg.reply(`Sorry, there isn't anything like "${args}" in my item database.`);
    return;
  }

  const itemData = itemHash[`${ref[0][1]}.${region}`];
  if(!itemData) {
    msg.reply(`Sorry, there isn't anything like "${args}" in my item database in region "${region.toUpperCase()}".`);
    return;
  }

  const embed = new Discord.RichEmbed()
    .setAuthor(`${itemData.name} [${itemData.cat.toUpperCase()}]`, `${ASSET_URL}/icons/menu/menu-${itemData.subtype}.png`)
    .setDescription(desc ? itemData.notes.substring(0, 2048) : '')
    .setThumbnail(`${ASSET_URL}/items/${itemData.subtype === 'all' ? 'accessory' : itemData.subType}/${itemData.picture}.png`)
    .setTitle('See it on Anamnesiac!')
    .setURL(`https://anamnesiac.seiyria.com/items?region=${itemData.cat}&item=${encodeURI(itemData.name)}`)
    .setFooter(ref[0][0] === 1 ? '' : `Sorry, I could not find an exact match for "${args}". This'll have to do, 'kay?`)
    .addField('Factors', itemData.factors.map(x => `* ${x.desc} ${x.lb ? `[Obtained @ LB ${x.lb}]` : ''}`).join('\n'))
    .addField('Obtained From', itemData.obtained);

  updatePresence(itemData.name);

  sendMessage(msg, { embed });
};

const itemd = (msg, args, opts) => {
  opts.desc = true;
  item(msg, args, opts);
};

const char = (msg, args, { region, desc }) => {
  const ref = charSet.get(args);
  if(!ref) {
    msg.reply(`Sorry, there isn't anything like "${args}" in my character database.`);
    return;
  }

  const charData = charHash[`${ref[0][1]}.${region}`];
  if(!charData) {
    msg.reply(`Sorry, there isn't anything like "${args}" in my char database in region "${region.toUpperCase()}".`);
    return;
  }

  const embed = new Discord.RichEmbed()
    .setAuthor(`${charData.name} [${charData.cat.toUpperCase()}]`, `${ASSET_URL}/icons/charclass/class-${charData.type}.png`)
    .setDescription(desc ? charData.notes.substring(0, 2048) : '')
    .setThumbnail(`${ASSET_URL}/characters/${charData.picture}.png`)
    .setTitle('See it on Anamnesiac!')
    .setURL(`https://anamnesiac.seiyria.com/characters?region=${charData.cat}&char=${encodeURI(charData.name)}`)
    .setFooter(ref[0][0] === 1 ? '' : `Sorry, I could not find an exact match for "${args}". This'll have to do, 'kay?`);

  embed.addField('About', `${emojiHash[`sbrRarity${charData.star}`]} ${charData.ace ? 'ACE' : ''} ${charData.limited ? 'Limited' : ''} - ${weaponHash[charData.weapon]} User`);

  charData.talents.forEach(tal => {
    embed.addField(`Talent: ${tal.name}`, tal.effects.map(x => `* ${x.desc} ${x.all ? `(All ${x.all === true ? 'Party' : x.all})` : ''}`).join('\n'));
  });

  updatePresence(charData.name);

  sendMessage(msg, { embed });
};

const chard = (msg, args, opts) => {
  opts.desc = true;
  char(msg, args, opts);
};

const guide = (msg, args, { region, desc }) => {
  const ref = guideSet.get(args);
  if(!ref) {
    msg.reply(`Sorry, there isn't anything like "${args}" in my guide database.`);
    return;
  }

  const guideData = guideHash[`${ref[0][1]}.${region}`];
  if(!guideData) {
    msg.reply(`Sorry, there isn't anything like "${args}" in my guide database in region "${region.toUpperCase()}".`);
    return;
  }

  const embed = new Discord.RichEmbed()
    .setAuthor(`${guideData.name} [${guideData.cat.toUpperCase()}]`, `${ASSET_URL}/icons/enemytypes/type-${guideData.race.toLowerCase()}.png`)
    .setDescription(desc ? guideData.desc.substring(0, 2048) : '')
    .setThumbnail(`${ASSET_URL}/bosses/boss_${guideData.image}.png`)
    .setTitle('See it on Anamnesiac!')
    .setURL(`https://anamnesiac.seiyria.com/boss-guides?region=${guideData.cat}&guide=${encodeURI(guideData.name)}`)
    .setFooter(ref[0][0] === 1 ? '' : `Sorry, I could not find an exact match for "${args}". This'll have to do, 'kay?`)
    .addField('Active?', guideData.isActive ? 'Currently active.' : 'Currently inactive.')
    .addField('Recommendations', guideData.recommendations ? guideData.recommendations.map(x => `* ${x.plain || x.unit}`).join('\n') : 'Nothing.')
    .addField('Inflicts', guideData.statusInflictions ? guideData.statusInflictions.map(x => `* ${x}`).join('\n') : 'Nothing.')
    .addField('Weaknesses', guideData.weaknesses ? guideData.weaknesses.map(x => {
      if(x.element) return `* ${x.element} (${x.percentWeakness}%)`;
      if(x.status) return `* ${x.status} (${x.vuln})`;
      return x.plain;
    }).join('\n') : 'Nothing.');

  updatePresence(guideData.name);

  sendMessage(msg, { embed });
};

const guided = (msg, args, opts) => {
  opts.desc = true;
  guide(msg, args, opts);
};

const commands = {
  '?item': item,
  '?itemd': itemd,
  '?boss': guide,
  '?bossd': guided,
  '?char': char,
  '?chard': chard
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
    emojiHash[emoji.name] = emoji.toString();
  });
});

client.on('message', async msg => {

  const content = msg.content;
  let region = determineRegion(msg);

  let cmd = (content.split(' ')[0] || '').toLowerCase();
  const args = content.slice(content.indexOf(' ') + 1);

  if(cmd.includes('jp')) {
    region = 'jp';
    cmd = cmd.split('jp').join('');
  }
  
  if(!commands[cmd]) return;

  await tryRefreshAPI();

  commands[cmd](msg, args, { region });
});

client.on('error', err => console.error(err));

const init = async () => {
  const API_TOKEN = process.env.DISCORD_TOKEN;
  client.login(API_TOKEN);
};

init();