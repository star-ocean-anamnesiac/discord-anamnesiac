
const Discord = require('discord.js');
const FuzzySet = require('fuzzyset.js');

const { ASSET_URL, getEmoji, updatePresence, sendMessage, getRedditFooter, flatUniqPakt } = require('../shared');

let guideSet = new FuzzySet();
const getGuideSet = () => guideSet;
const guideHash = {};

const getGuide = (msg, args, region) => {

  const ref = getGuideSet().get(args);
  if(!ref) {
    msg.reply(`Sorry, there isn't anything like "${args}" in my guide database. Check out how to add it with \`?contribute\`!`);
    return;
  }

  const guideData = guideHash[`${ref[0][1]}.${region}`];
  if(!guideData) {
    msg.reply(`Sorry, there isn't anything like "${args}" in my guide database in region "${region.toUpperCase()}". Check out how to add it with \`?contribute\`!`);
    return;
  }

  return { ref, guideData };
};

const guide = (client, msg, args, { region, desc }) => {

  const { ref, guideData } = getGuide(msg, args, region);
  if(!guideData) return;

  const embed = new Discord.RichEmbed()
    .setAuthor(`${guideData.name} [${guideData.cat.toUpperCase()}]`, `${ASSET_URL}/icons/enemytypes/type-${guideData.race.toLowerCase()}.png`)
    .setDescription(desc ? (guideData.desc || 'No notes entered.').substring(0, 2048) : '')
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
      return `- ${x.plain}`;
    }).join('\n') : 'Nothing.')
    .addField('Resistances', guideData.resistances ? guideData.resistances.map(x => {
      if(x.element) return `- ${getEmoji(`sbrEl${x.element}`)} ${x.element} (${x.percentWeakness}%)`;
      if(x.status) return `- ${getEmoji(`sbrDebuff${x.status}`)} ${x.status} (${x.vuln})`;
      return `- ${x.plain}`;
    }).join('\n') : 'Nothing.');

  updatePresence(client, guideData.name);

  sendMessage(msg, { embed });
};

const guided = (client, msg, args, opts) => {
  opts.desc = true;
  guide(client, msg, args, opts);
};

const guideq = (client, msg, args, { region }) => {
  const guides = Object.keys(guideHash).map(x => guideHash[x]).filter(x => x.cat === region);
  const embed = new Discord.RichEmbed()
    .setAuthor(`[${region.toUpperCase()}] Boss Stats (${guides.length})`);

  const allWeaknesses = flatUniqPakt(guides.map(x => x.weaknesses ? x.weaknesses.map(x => x.element) : []));
  embed.addField('Weaknesses', Object.keys(allWeaknesses).map(x => {
    return `${getEmoji(`sbrEl${x}`)} ${x} (${allWeaknesses[x]})`;
  }), true);

  const allResists = flatUniqPakt(guides.map(x => x.resistances ? x.resistances.map(x => x.element) : []));
  embed.addField('Resistances', Object.keys(allResists).map(x => {
    return `${getEmoji(`sbrEl${x}`)} ${x} (${allResists[x]})`;
  }), true);

  const allRaces = flatUniqPakt(guides.map(x => x.race));
  embed.addField('Races', Object.keys(allRaces).map(x => {
    return `${getEmoji(`sbrType${x}`)} ${x} (${allRaces[x]})`;
  }), true);

  sendMessage(msg, { embed });
};

const guideMD = (args, { region }) => {
  const { ref, guideData } = getGuide(null, args, region);
  if(!guideData) return;

  const str = `
## ${guideData.name} [${region.toUpperCase()}]

^[Anamnesiac](https://anamnesiac.seiyria.com/boss-guides?region=${guideData.cat}&guide=${encodeURI(guideData.name).split(')').join('%29')})

Race: ${guideData.race}

### Recommendations

${guideData.recommendations 
? guideData.recommendations.map(x => `- ${x.plain || x.unit}`).join('\n') 
: 'Nothing.'}

### Inflicts

${guideData.statusInflictions 
? guideData.statusInflictions.map(x => `- ${x}`).join('\n') 
: 'Nothing.'}

### Weaknesses

${guideData.weaknesses 
? guideData.weaknesses.map(x => {
  if(x.element) return `- ${x.element} (${x.percentWeakness}%)`;
  if(x.status) return `- ${x.status} (${x.vuln})`;
  return `- ${x.plain}`;
}).join('\n') 
: 'Nothing.'}

### Resistances

${guideData.resistances 
? guideData.resistances.map(x => {
  if(x.element) return `- ${x.element} (${x.percentWeakness}%)`;
  if(x.status) return `- ${x.status} (${x.vuln})`;
  return `- ${x.plain}`;
}).join('\n') 
: 'Nothing.'}
`;

  return str + getRedditFooter();
}

const guideReset = () => guideSet = new FuzzySet();

module.exports = { guide, guided, guideq, guideMD, getGuideSet, guideHash, guideReset };