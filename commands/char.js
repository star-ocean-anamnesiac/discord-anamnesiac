
const Discord = require('discord.js');
const FuzzySet = require('fuzzyset.js');

const { ASSET_URL, weaponHash, getEmoji, updatePresence, sendMessage } = require('../shared');

const EMBED_COLORS = {
  attacker: 0xdd7e6b,
  defender: 0xffd966,
  healer: 0x93c47d,
  invoker: 0x8e7cc3,
  sharpshooter: 0x6d9eeb
};

let charSet = new FuzzySet();
const getCharSet = () => charSet;
const charHash = {};

const getChar = (msg, args, region) => {
  const ref = getCharSet().get(args);
  if(!ref) {
    msg.reply(`Sorry, there isn't anything like "${args}" in my character database. Check out how to add it with \`?contribute\`!`);
    return;
  }

  const charData = charHash[`${ref[0][1]}.${region}`];
  if(!charData) {
    msg.reply(`Sorry, there isn't anything like "${args}" in my char database in region "${region.toUpperCase()}". Check out how to add it with \`?contribute\`!`);
    return;
  }

  return { ref, charData };
}

const char = (client, msg, args, { region, desc }) => {
  const { ref, charData } = getChar(msg, args, region);
  if(!charData) return;

  let awk = '';
  if(charData.awakened) {
    awk = getEmoji(`sbrAwk${charData.awakened === true ? 10 : 9}`);
  }

  const embed = new Discord.RichEmbed()
    .setAuthor(`${charData.name} [${(charData.cat || 'gl').toUpperCase()}]`, `${ASSET_URL}/icons/charclass/class-${charData.type}.png`)
    .setDescription(desc ? (charData.notes || 'No notes entered.').substring(0, 2048) : '')
    .setThumbnail(`${ASSET_URL}/characters/${charData.picture}.png`)
    .setTitle('See it on Anamnesiac!')
    .setColor(EMBED_COLORS[charData.type])
    .setURL(`https://anamnesiac.seiyria.com/characters?region=${charData.cat}&char=${encodeURI(charData.name)}`)
    .setFooter(ref[0][0] === 1 ? '' : `Sorry, I could not find an exact match for "${args}". This'll have to do, 'kay?`);

  embed.addField('About', `${getEmoji(`sbrRarity${charData.star}`)} ${awk} ${charData.ace ? 'ACE' : ''} ${charData.semi ? 'Semi-' : ''}${charData.limited ? 'Limited' : ''} - ${weaponHash[charData.weapon]} User`);

  charData.talents.forEach(tal => {
    const talString = tal.shortEffects ? `- ${tal.shortEffects}` : tal.effects.map(x => `- ${x.desc} ${x.all ? `(All ${x.all === true ? 'Party' : x.all})` : ''}`).join('\n');
    embed.addField(`Talent: ${tal.name}`, talString);
  });

  const baseRushStr = `Power: ${getEmoji(`sbrEl${charData.rush.element || 'None'}`)} ${charData.rush.power}\n`;
  embed.addField(`Rush: ${charData.rush.name}`, baseRushStr + charData.rush.effects.map(x => `- ${x.desc} ${x.all ? `(All ${x.all === true ? 'Party' : x.all})` : ''}`).join('\n'))

  updatePresence(client, charData.name);

  sendMessage(msg, { embed });
};

const chard = (client, msg, args, opts) => {
  opts.desc = true;
  char(client, msg, args, opts);
};

const charc = (client, msg, args, { region }) => {
  const { charData } = getChar(msg, args, region);
  if(!charData) return;
  const imgUrl = `${ASSET_URL}/cards/${charData.picture}-${charData.awakened ? 'a-' : ''}${charData.cat}.png`;

  updatePresence(client, charData.name);

  sendMessage(msg, {
    files: [imgUrl]
  });
};

const charReset = () => charSet = new FuzzySet();

module.exports = { char, chard, charc, charHash, getCharSet, charReset };
