
const Discord = require('discord.js');
const ReactionMenu = require('discord.js-reaction-menu');
const FuzzySet = require('fuzzyset.js');
const intersection = require('lodash.intersection');
const compact = require('lodash.compact');

const { ASSET_URL, weaponHash, getEmoji, updatePresence, sendMessage, getAliases } = require('../shared');

let itemSet = new FuzzySet();
let itemSearchSet = new FuzzySet();
const itemHash = {};

const addItem = (item) => {
  itemSet.add(item.name);
  itemHash[`${item.name}.${item.cat}`] = item;

  const itemId = item.name.split(' ').map(s => s.substring(0, 3)).join('');
  itemHash[`${itemId}.${item.cat}`] = item;

  itemSearchSet.add(`${itemId} ${item.subtype === 'all' ? 'accessory' : item.subtype}`);
  itemSearchSet.add(`${itemId} ${item.obtained}`);

  item.factors.forEach(fact => {
    itemSearchSet.add(`${itemId} ${fact.desc}`);

    getAliases(fact.desc).forEach(alias => itemSearchSet.add(`${itemId} ${alias}`));

    if(fact.element) {
      itemSearchSet.add(`${itemId} ${fact.element}`);
    }

    if(fact.slayer) {
      itemSearchSet.add(`${itemId} ${fact.slayer}`);
    }
  });
};

const buildEmbedForItem = (itemData, exactMatch, args, desc) => {
  return new Discord.RichEmbed()
    .setAuthor(`${itemData.name} [${itemData.cat.toUpperCase()}]`, `${ASSET_URL}/icons/menu/menu-${itemData.subtype}.png`)
    .setDescription(desc ? (itemData.notes || 'No notes entered.').substring(0, 2048) : '')
    .setThumbnail(`${ASSET_URL}/items/${itemData.subtype === 'all' ? 'accessory' : itemData.subtype}/${itemData.picture}.png`)
    .setTitle('See it on Anamnesiac!')
    .setURL(`https://anamnesiac.seiyria.com/items?region=${itemData.cat}&item=${encodeURI(itemData.name)}`)
    .setFooter(exactMatch ? '' : `Sorry, I could not find an exact match for "${args}". This'll have to do, 'kay?`)
    .addField('About', `${getEmoji(`sbrRarity${itemData.star}`)} ${itemData.subtype === 'all' ? 'Accessory' : weaponHash[itemData.subtype]}`)
    .addField('Factors', itemData.factors.map(x => {
      return `- ${x.desc} ${x.lb ? getEmoji(`sbrWeapon${x.lb}`) : ''} ${x.element ? getEmoji(`sbrEl${x.element}`) : ''} ${x.slayer ? getEmoji(`sbrType${x.slayer}`) : ''}`;
    }).join('\n'))
    .addField('Obtained From', itemData.obtained);
};

const item = (client, msg, args, { region, desc }) => {
  const ref = itemSet.get(args);
  if(!ref) {
    msg.reply(`Sorry, there isn't anything like "${args}" in my item database. Check out how to add it with \`?contribute\`!`);
    return {};
  }

  const itemData = itemHash[`${ref[0][1]}.${region}`];
  if(!itemData) {
    msg.reply(`Sorry, there isn't anything like "${args}" in my item database in region "${region.toUpperCase()}". Check out how to add it with \`?contribute\`!`);
    return {};
  }

  const embed = buildEmbedForItem(itemData, ref[0][0] === 1, args, desc);

  updatePresence(client, itemData.name);

  sendMessage(msg, { embed });
};

const itemd = (client, msg, args, opts) => {
  opts.desc = true;
  item(client, msg, args, opts);
};

const items = (client, msg, args, { region }) => {
  const allResults = [];

  const terms = args.split(',').map(x => x.trim());

  terms.forEach(term => {
    const res = itemSearchSet.get(term, null, 0.1);
    allResults.push(res.map(x => itemHash[`${x[1].split(' ')[0]}.${region}`]));
  });

  const allExistingResults = compact(intersection(...allResults));

  const mappedDesc = allExistingResults.slice(0, 10).map((item, i) => {
    return `\`${('000' + (i + 1)).slice(-2)}.\` ${getEmoji(`sbrRarity${item.star}`)} ${getEmoji(`sbrItem${item.subtype === 'all' ? 'Accessory' : item.subtype.slice(0, 1).toUpperCase() + item.subtype.slice(1)}`)} [${item.name}](https://anamnesiac.seiyria.com/items?region=${item.cat}&item=${encodeURI(item.name)})`;
  });

  const searchEmbed = new Discord.RichEmbed()
    .setTitle(`[${region.toUpperCase()}] Item search results for: ${terms.join(', ')}`)
    .setDescription(allExistingResults.length > 0 ? mappedDesc : 'No search results found.');

  const reactions = allExistingResults.length > 0 ? { first: '⏪', back: '◀', next: '▶' } : {};

  new ReactionMenu.menu(
    msg.channel,
    msg.author.id,
    [searchEmbed, ...(allExistingResults.map(i => buildEmbedForItem(i, true, '', false)).slice(0, 10))],
    120000,
    reactions
  );

};

const itemReset = () => {
  itemSet = new FuzzySet();
  itemSearchSet = new FuzzySet();
};

module.exports = { item, itemd, items, addItem, itemReset };