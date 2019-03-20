
const Discord = require('discord.js');
const FuzzySet = require('fuzzyset.js');

const { ASSET_URL, getEmoji, updatePresence, sendMessage } = require('../shared');

let guideSet = new FuzzySet();
const getGuideSet = () => guideSet;
const guideHash = {};

const guide = (client, msg, args, { region, desc }) => {
  const ref = getGuideSet().get(args);
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
    .addField('Race', guideData.race)
    .addField('Recommendations', guideData.recommendations ? guideData.recommendations.map(x => `- ${x.plain || x.unit}`).join('\n') : 'Nothing.')
    .addField('Inflicts', guideData.statusInflictions ? guideData.statusInflictions.map(x => `- ${getEmoji(`sbrDebuff${x}`)} ${x}`).join('\n') : 'Nothing.')
    .addField('Weaknesses', guideData.weaknesses ? guideData.weaknesses.map(x => {
      if(x.element) return `- ${getEmoji(`sbrEl${x.element}`)} ${x.element} (${x.percentWeakness}%)`;
      if(x.status) return `- ${getEmoji(`sbrDebuff${x.status}`)} ${x.status} (${x.vuln})`;
      return x.plain;
    }).join('\n') : 'Nothing.')
    .addField('Resistances', guideData.resistances ? guideData.resistances.map(x => {
      if(x.element) return `- ${getEmoji(`sbrEl${x.element}`)} ${x.element} (${x.percentWeakness}%)`;
      if(x.status) return `- ${getEmoji(`sbrDebuff${x.status}`)} ${x.status} (${x.vuln})`;
      return x.plain;
    }).join('\n') : 'Nothing.');

  updatePresence(client, guideData.name);

  sendMessage(msg, { embed });
};

const guided = (client, msg, args, opts) => {
  opts.desc = true;
  guide(client, msg, args, opts);
};

const guideReset = () => guideSet = new FuzzySet();

module.exports = { guide, guided, getGuideSet, guideHash, guideReset };