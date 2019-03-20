
const Discord = require('discord.js');
const FuzzySet = require('fuzzyset.js');

const { ASSET_URL, weaponHash, getEmoji, updatePresence, sendMessage } = require('../shared');

let itemSet = new FuzzySet();
const itemHash = {};

const item = (client, msg, args, { region, desc }) => {
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
    .setThumbnail(`${ASSET_URL}/items/${itemData.subtype === 'all' ? 'accessory' : itemData.subtype}/${itemData.picture}.png`)
    .setTitle('See it on Anamnesiac!')
    .setURL(`https://anamnesiac.seiyria.com/items?region=${itemData.cat}&item=${encodeURI(itemData.name)}`)
    .setFooter(ref[0][0] === 1 ? '' : `Sorry, I could not find an exact match for "${args}". This'll have to do, 'kay?`)
    .addField('About', `${getEmoji(`sbrRarity${itemData.star}`)} ${itemData.subtype === 'all' ? 'Accessory' : weaponHash[itemData.subtype]}`)
    .addField('Factors', itemData.factors.map(x => {
      return `* ${x.desc} ${x.lb ? getEmoji(`sbrWeapon${x.lb}`) : ''} ${x.element ? getEmoji(`sbrEl${x.element}`) : ''} ${x.slayer ? getEmoji(`sbrType${x.slayer}`) : ''}`;
    }).join('\n'))
    .addField('Obtained From', itemData.obtained);

  updatePresence(client, itemData.name);

  sendMessage(msg, { embed });
};

const itemd = (client, msg, args, opts) => {
  opts.desc = true;
  item(client, msg, args, opts);
};

const itemReset = () => itemSet = new FuzzySet();

module.exports = { item, itemd, itemSet, itemHash, itemReset };