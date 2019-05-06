
const Discord = require('discord.js');
const ReactionMenu = require('discord.js-reaction-menu');
const FuzzySet = require('fuzzyset.js');
const intersection = require('lodash.intersection');
const compact = require('lodash.compact');
const uniqBy = require('lodash.uniqby');

const { ASSET_URL, weaponHash, getEmoji, updatePresence, sendMessage, getAliases, getRedditFooter } = require('../shared');

const EMBED_COLORS = {
  attacker: 0xdd7e6b,
  defender: 0xffd966,
  healer: 0x93c47d,
  invoker: 0x8e7cc3,
  sharpshooter: 0x6d9eeb
};

let charSet = new FuzzySet();
let charTalentSearchSet = new FuzzySet();
let specialFindMaps = {};

const charHash = {};

const addChar = (char) => {
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
    charSet.add(alias);
    charHash[`${alias}.${char.cat}`] = char;
  });

  let charId = ('000000000' + char.name.split(' ').map(s => s.substring(0, 3)).join('')).slice(-9);
  charHash[`${charId}.${char.cat}`] = char;

  specialFindMaps[char.type] = specialFindMaps[char.type] || [];
  specialFindMaps[char.type].push(char);

  specialFindMaps[char.weapon] = specialFindMaps[char.weapon] || [];
  specialFindMaps[char.weapon].push(char.weapon);

  if(char.ace) {
    specialFindMaps.ace = specialFindMaps.ace || [];
    specialFindMaps.ace.push(char);
  }

  if(char.limited) {
    specialFindMaps.limited = specialFindMaps.limited || [];
    specialFindMaps.limited.push(char);
  }

  if(char.semi) {
    specialFindMaps.semi = specialFindMaps.semi || [];
    specialFindMaps.semi.push(char);
  }

  if(char.awakened) {
    specialFindMaps.awk = specialFindMaps.awk || [];
    specialFindMaps.awk.push(char);
  }

  char.talents.forEach(talent => {
    talent.effects.forEach(eff => {
      charTalentSearchSet.add(`${charId} ${eff.desc} ${eff.all ? (eff.all === true ? 'Party' : eff.all) : ''}`);
  
      getAliases(eff.desc).forEach(alias => charTalentSearchSet.add(`${charId} ${alias}`));
  
      if(eff.element) {
        charTalentSearchSet.add(`${charId} ${eff.element}`);
      }
  
      if(eff.slayer) {
        charTalentSearchSet.add(`${charId} ${eff.slayer}`);
      }
    });
  });
};

const buildEmbedForChar = (charData, exactMatch, args, desc) => {

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
    .setFooter(exactMatch ? '' : `Sorry, I could not find an exact match for "${args}". This'll have to do, 'kay?`);

  embed.addField('About', `${getEmoji(`sbrRarity${charData.star}`)} ${awk} ${charData.ace ? 'ACE' : ''} ${charData.semi ? 'Semi-' : ''}${charData.limited ? 'Limited' : ''} - ${weaponHash[charData.weapon]} User`);

  charData.talents.forEach(tal => {
    const talString = tal.shortEffects ? `- ${tal.shortEffects}` : tal.effects.map(x => `- ${x.desc} ${x.all ? `(${x.all === true ? 'Party' : x.all})` : ''}`).join('\n');
    embed.addField(`Talent: ${tal.name}`, talString);
  });

  const baseRushStr = `Power: ${getEmoji(`sbrEl${charData.rush.element || 'None'}`)} ${charData.rush.power}\n`;

  const rushStr = charData.rush.shortEffects ? charData.rush.shortEffects : charData.rush.effects.map(x => `- ${x.desc} ${x.all ? `(${x.all === true ? 'Party' : x.all})` : ''}`).join('\n');
  embed.addField(`Rush: ${charData.rush.name}`, baseRushStr + rushStr);

  return embed;
};

const getChar = (msg, args, region) => {
  const ref = charSet.get(args);
  if(!ref) {
    if(msg) msg.reply(`Sorry, there isn't anything like "${args}" in my character database. Check out how to add it with \`?contribute\`!`);
    return {};
  }

  const charData = charHash[`${ref[0][1]}.${region}`];
  if(!charData) {
    if(msg) msg.reply(`Sorry, there isn't anything like "${args}" in my char database in region "${region.toUpperCase()}". Check out how to add it with \`?contribute\`!`);
    return {};
  }

  return { ref, charData };
}

const char = (client, msg, args, { region, desc }) => {
  const { ref, charData } = getChar(msg, args, region);
  if(!charData) return;

  const embed = buildEmbedForChar(charData, ref[0][0] === 1, args, desc);

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
  const imgUrl = `${ASSET_URL}/cards/${charData.picture}-${charData.type}-${charData.awakened ? 'a-' : ''}${charData.cat}.png`;

  updatePresence(client, charData.name);

  sendMessage(msg, {
    files: [imgUrl]
  });
};

const charq = (client, msg, args, { region }) => {
  const chars = uniqBy(Object.keys(charHash).map(x => charHash[x]).filter(x => x.cat === region), x => x.name);
  const embed = new Discord.RichEmbed()
    .setAuthor(`[${region.toUpperCase()}] Character Stats (${chars.length})`);

  embed.addField('By Type', `Sorted by character type`);

  const types = ['Attacker', 'Defender', 'Healer', 'Invoker', 'Sharpshooter'];
  const criteria = [
    { name: '3*',           prefix: () => 'sbrRarity3', filter: x => x.star === 3 },
    { name: '4*',           prefix: () => 'sbrRarity4', filter: x => x.star === 4 },
    { name: '5*',           prefix: () => 'sbrRarity5', filter: x => x.star === 5 },
    { name: 'Permanent',    prefix: () => 'sbrElNone', filter: x => !x.limited },
    { name: 'Limited',      prefix: () => 'sbrElNone', filter: x => x.limited },
    { name: 'Semi-Limited', prefix: () => 'sbrElNone', filter: x => x.semi },
    { name: 'Ace',          prefix: () => 'sbrElNone', filter: x => x.ace },
    { name: 'Awakened',     prefix: () => 'sbrAwk10', filter: x => x.awakened }
  ];

  types.forEach(type => {
    const allOfType = chars.filter(x => x.type === type.toLowerCase());

    const string = criteria.map(x => {
      const count = allOfType.filter(x.filter).length;
      return `${getEmoji(x.prefix())} ${x.name} (${count})`;
    });

    embed.addField(`${getEmoji(`sbrClass${type}`)} ${type} (${allOfType.length})`, string, true);
  });

  embed.addBlankField();
  embed.addField('By Weapon', `Sorted by character weapon`);

  types.forEach(type => {
    const allOfType = chars.filter(x => x.type === type.toLowerCase());

    const string = Object.keys(weaponHash).map(x => {
      const count = allOfType.filter(y => y.weapon === x).length;
      const capType = x.slice(0, 1).toUpperCase() + x.slice(1);
      return count > 0 ? `${getEmoji(`sbrItem${capType}`)} ${weaponHash[x]} (${count})` : '';
    }).filter(x => x);

    embed.addField(`${getEmoji(`sbrClass${type}`)} ${type} (${allOfType.length})`, string, true);
  });

  sendMessage(msg, { embed });
};

const chars = (client, msg, args, { region }) => {
  const allResults = [];

  const terms = args.split(',').map(x => x.trim().toLowerCase());

  terms.forEach(term => {
    let mapped = [];

    if(specialFindMaps[term]) {
      mapped = specialFindMaps[term].filter(x => x.cat === region);
      
    } else {
      const res = charTalentSearchSet.get(term, null, 0.2) || [];
      mapped = res.map(x => charHash[`${x[1].split(' ')[0]}.${region}`]);
    }

    allResults.push(mapped);
  });

  const allExistingResults = compact(intersection(...allResults));

  const mappedDesc = allExistingResults.slice(0, 10).map((char, i) => {
    return `\`${('000' + (i + 1)).slice(-2)}.\` ${getEmoji(`sbrRarity${char.star}`)} ${getEmoji(`sbrClass${char.type.slice(0, 1).toUpperCase() + char.type.slice(1)}`)} [${char.name}](https://anamnesiac.seiyria.com/characters?region=${char.cat}&char=${encodeURI(char.name).split(')').join('%29')})`;
  });

  const searchEmbed = new Discord.RichEmbed()
    .setTitle(`[${region.toUpperCase()}] Character search results for: ${terms.join(', ')}`)
    .setDescription(allExistingResults.length > 0 ? mappedDesc : 'No search results found.');

  const reactions = allExistingResults.length > 0 ? { first: '⏪', back: '◀', next: '▶' } : {};

  new ReactionMenu.menu(
    msg.channel,
    msg.author.id,
    [searchEmbed, ...(allExistingResults.map(i => buildEmbedForChar(i, true, '', false)).slice(0, 10))],
    120000,
    reactions
  );
};

const charMD = (args, { region }) => {
  const { ref, charData } = getChar(null, args, region);
  if(!charData) return;

  let awk = ''
  if(charData.awakened) awk = charData.awakened === true ? 'AWK10' : 'AWK9';

  const str = `
## ${charData.name} [${region.toUpperCase()}]

^[Anamnesiac](https://anamnesiac.seiyria.com/characters?region=${charData.cat}&char=${encodeURI(charData.name).split(')').join('%29')})

About: ${charData.star}★ ${awk} ${charData.ace ? 'ACE' : ''} ${charData.semi ? 'Semi-' : ''}${charData.limited ? 'Limited' : ''} - ${weaponHash[charData.weapon]} User

### Talents

${charData.talents.map(tal => {
  const talString = tal.shortEffects ? `- ${tal.shortEffects}` : tal.effects.map(x => `- ${x.desc} ${x.all ? `(${x.all === true ? 'Party' : x.all})` : ''}`).join('\n');
  return `${talString}\n`;
}).join('\n\n')}

### Skills

| Skill | AP Cost | Element | Power | Hits |
| ----- | -------:| ------- | ----- | ----:|
${charData.skills.map(skill => {
  return `${skill.name} | ${skill.ap} | ${skill.element || 'None'} | ${skill.power} | ${skill.maxHits}`;
}).join('\n')}

### Rush: ${charData.rush.name}

Power: ${charData.rush.power} (Element: ${charData.rush.element || 'None'})

${
  charData.rush.shortEffects 
? '- ' + charData.rush.shortEffects 
: charData.rush.effects.map(x => `- ${x.desc} ${x.all ? `(${x.all === true ? 'Party' : x.all})` : ''}`).join('\n')
}
`;

  return str + getRedditFooter();
};

const charReset = () => {
  charSet = new FuzzySet();
  charTalentSearchSet = new FuzzySet();
  specialFindMaps = {};
};

module.exports = { char, chard, charc, chars, charq, charMD, addChar, charReset };
