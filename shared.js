
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

  if(str.includes('surviving a lethal attack')) return ['guts'];
  if(str.includes('absorbs'))                   return ['lifesteal'];
  if(str.includes('recovers'))                  return ['regen'];
  if(str.includes('evasion'))                   return ['agility'];
  if(str.includes('ap consumption'))            return ['ap', 'ap cost'];
  if(str.includes('no flinching'))              return ['anti-flinch', 'super armor'];
  if(str.includes('evasion possible'))          return ['air dodge'];

  return [];
};

module.exports = { API_URL, ASSET_URL, emojiHash, emojiInstHash, weaponHash, getEmoji, getEmojiInst, updatePresence, sendMessage, getAliases };