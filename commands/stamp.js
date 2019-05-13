
const Discord = require('discord.js');
const FuzzySet = require('fuzzyset.js');

const { sendMessage } = require('../shared');

let stampSet = new FuzzySet();
const stampHash = {};

const getStampSet = () => stampSet;

const addStamp = (stamp) => {
  const allAliases = stamp.keywords;

  allAliases.forEach(alias => {
    getStampSet().add(alias);
    stampHash[`${alias}.${stamp.cat}`] = stamp;
  });
};

const getStamp = (msg, args, region) => {
  const ref = getStampSet().get(args);
  if(!ref) {
    if(msg) msg.reply(`Sorry, there isn't anything like "${args}" in my stamp database. Check out how to add it with \`?contribute\`!`);
    return {};
  }

  const stampData = stampHash[`${ref[0][1]}.${region}`];
  if(!stampData) {
    if(msg) msg.reply(`Sorry, there isn't anything like "${args}" in my stamp database in region "${region.toUpperCase()}". Check out how to add it with \`?contribute\`!`);
    return {};
  }

  return { ref, stampData };
};

const stamp = (client, msg, args, { region }) => {

  const { stampData } = getStamp(msg, args, region);
  if(!stampData) return;

  sendMessage(msg, { file: `https://anamnesiac.seiyria.com/assets/stamps/${stampData.cat}/${stampData.image}.png` });
};

const stampReset = () => {
  stampSet = new FuzzySet();
};

module.exports = { stamp, addStamp, stampReset };