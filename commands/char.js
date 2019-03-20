
const Discord = require('discord.js');
const FuzzySet = require('fuzzyset.js');

const { ASSET_URL, weaponHash, getEmoji, updatePresence, sendMessage } = require('../shared');

let charSet = new FuzzySet();
const getCharSet = () => charSet;
const charHash = {};

const char = (client, msg, args, { region, desc }) => {
  const ref = getCharSet().get(args);
  if(!ref) {
    msg.reply(`Sorry, there isn't anything like "${args}" in my character database.`);
    return;
  }

  const charData = charHash[`${ref[0][1]}.${region}`];
  if(!charData) {
    msg.reply(`Sorry, there isn't anything like "${args}" in my char database in region "${region.toUpperCase()}".`);
    return;
  }

  let awk = '';
  if(charData.awakened) {
    awk = getEmoji(`sbrAwk${charData.awakened === true ? 10 : 9}`);
  }

  const embed = new Discord.RichEmbed()
    .setAuthor(`${charData.name} [${charData.cat.toUpperCase()}]`, `${ASSET_URL}/icons/charclass/class-${charData.type}.png`)
    .setDescription(desc ? charData.notes.substring(0, 2048) : '')
    .setThumbnail(`${ASSET_URL}/characters/${charData.picture}.png`)
    .setTitle('See it on Anamnesiac!')
    .setURL(`https://anamnesiac.seiyria.com/characters?region=${charData.cat}&char=${encodeURI(charData.name)}`)
    .setFooter(ref[0][0] === 1 ? '' : `Sorry, I could not find an exact match for "${args}". This'll have to do, 'kay?`);

  embed.addField('About', `${getEmoji(`sbrRarity${charData.star}`)} ${awk} ${charData.ace ? 'ACE' : ''} ${charData.limited ? 'Limited' : ''} - ${weaponHash[charData.weapon]} User`);

  charData.talents.forEach(tal => {
    embed.addField(`Talent: ${tal.name}`, tal.effects.map(x => `* ${x.desc} ${x.all ? `(All ${x.all === true ? 'Party' : x.all})` : ''}`).join('\n'));
  });

  embed.addField(`Rush: ${charData.rush.name}`, charData.rush.effects.map(x => `* ${x.desc} ${x.all ? `(All ${x.all === true ? 'Party' : x.all})` : ''}`).join('\n'))

  updatePresence(client, charData.name);

  sendMessage(msg, { embed });
};

const chard = (client, msg, args, opts) => {
  opts.desc = true;
  char(client, msg, args, opts);
};

const charReset = () => charSet = new FuzzySet();

module.exports = { char, chard, charHash, getCharSet, charReset };