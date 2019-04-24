
const Discord = require('discord.js');
const FuzzySet = require('fuzzyset.js');

const { ASSET_URL, getEmoji, updatePresence, sendMessage, getRedditFooter } = require('../shared');

let shopSet = new FuzzySet();
const shopHash = {};

const addShop = (shop) => {
  const allAliases = [shop.name, ...(shop.aliases || [])];

  allAliases.forEach(alias => {
    shopSet.add(alias);
    shopHash[`${alias}.${shop.cat}`] = shop;
  });
};

const buildEmbedForShop = (shopData, exactMatch, args) => {
  return new Discord.RichEmbed()
    .setAuthor(`${shopData.name} [${shopData.cat.toUpperCase()}]`, `${ASSET_URL}/icons/shop/shop-${shopData.icon}.png`)
    .setFooter(exactMatch ? '' : `Sorry, I could not find an exact match for "${args}". This'll have to do, 'kay?`)
    .addField('Currency', shopData.currency)
    .addField('Total Cost', shopData.items.reduce((prev, item) => {
      if(!item.stock) return 0;
      return prev + (item.stock * item.cost);
    }, 0).toLocaleString())
    .addField('Items', shopData.items.map(item => {
      const emoji = item.type.includes('-') ? item.type.split('-').join('') : 'Item' + item.type.substring(0, 1).toUpperCase() + item.type.substring(1);
      return `- ${getEmoji(`sbr${emoji}`)} ${item.name} (Cost: ${item.cost.toLocaleString()}, Stock: ${item.stock || '∞'})`
    }).join('\n'));
};

const getShop = (msg, args, region) => {
  const ref = shopSet.get(args);
  if(!ref) {
    if(msg) msg.reply(`Sorry, there isn't anything like "${args}" in my shop database. Check out how to add it with \`?contribute\`!`);
    return {};
  }

  const shopData = shopHash[`${ref[0][1]}.${region}`];
  if(!shopData) {
    if(msg) msg.reply(`Sorry, there isn't anything like "${args}" in my shop database in region "${region.toUpperCase()}". Check out how to add it with \`?contribute\`!`);
    return {};
  }

  return { ref, shopData };
};

const shop = (client, msg, args, { region }) => {

  const { ref, shopData } = getShop(msg, args, region);
  if(!shopData) return;

  const embed = buildEmbedForShop(shopData, ref[0][0] === 1, args);

  updatePresence(client, shopData.currency);

  sendMessage(msg, { embed });
};

const shopMD = (args, { region }) => {
  const { ref, shopData } = getShop(null, args, region);
  if(!shopData) return;

  const str = `
## ${shopData.name} [${region.toUpperCase()}]

Currency: ${shopData.currency}

Clear Cost: ${
  shopData.items.reduce((prev, item) => {
    if(!item.stock) return 0;
    return prev + (item.stock * item.cost);
  }, 0).toLocaleString()
}

### Items

Item | Stock | Cost |
---- | -----:| ----:|
${shopData.items.map(item => {
  return `${item.name} | ${item.stock || '∞'} | ${item.cost.toLocaleString()}`;
}).join('\n')}
`;

  return str + getRedditFooter();
};

const shopReset = () => {
  shopSet = new FuzzySet();
};

module.exports = { shop, shopMD, addShop, shopReset };