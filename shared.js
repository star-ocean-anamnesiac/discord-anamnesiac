
const groupBy = require('lodash.groupby');
const flatten = require('lodash.flatten');

const API_URL = 'https://anamnesiac.seiyria.com/data';
const ASSET_URL = 'https://anamnesiac.seiyria.com/assets';

const emojiHash = {};
const emojiInstHash = {};
const weaponHash = {};

const getEmoji = (em) => {
  return emojiHash[em] || '';
};

const getEmojiInst = (em) => {
  return emojiInstHash[em] || '';
};

const updatePresence = (client, newPlayingWith) => {
  client.user.setPresence({ status: 'online', game: { name: `with ${newPlayingWith}` } });
};

const sendMessage = (msg, replyData) => {
  return msg.channel.send(replyData);
};

const getAliases = (str) => {
  if(!str) return [];

  str = str.toLowerCase();

  if(str.includes('surviving a lethal attack')) return ['guts'];
  if(str.includes('absorbs'))                   return ['lifesteal'];
  if(str.includes('of max hp'))                 return ['regen'];
  if(str.includes('evasion'))                   return ['agility'];
  if(str.includes('ap consumption'))            return ['ap cost'];
  if(str.includes('some ap'))                   return ['ap gen'];
  if(str.includes('hitcount'))                  return ['hitcount'];
  if(str.includes('no flinching'))              return ['anti-flinch', 'anti flinch', 'super armor'];
  if(str.includes('evasion possible'))          return ['air dodge'];

  return [];
};

const getRedditFooter = () => {
  return `
  
___
I am a bot, created by Captain /u/seiyria to help out! Concerns, questions, comments should be sent to that inbox. Want to help? [Check out our contributing guide!](https://github.com/seiyria/anamnesiac/blob/master/CONTRIBUTING.md)
  `;
};

const flatUniqPakt = (arrs) => {
  if(arrs.length === 0) return { None: 0 };
  
  const base = groupBy(flatten(arrs).filter(x => x), x => x);
  Object.keys(base).forEach(x => base[x] = base[x].length);
  return base;
};

module.exports = { API_URL, ASSET_URL, emojiHash, emojiInstHash, weaponHash, getEmoji, getEmojiInst, updatePresence, sendMessage, getAliases, getRedditFooter, flatUniqPakt };