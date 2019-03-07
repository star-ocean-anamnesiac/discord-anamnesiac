
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

module.exports = { API_URL, ASSET_URL, emojiHash, emojiInstHash, weaponHash, getEmoji, getEmojiInst, updatePresence, sendMessage };