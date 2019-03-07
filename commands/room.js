
const { getEmojiInst, getEmoji } = require('../shared');

let classes = ['Attacker', 'Defender', 'Healer', 'Invoker', 'Sharpshooter'];

const roomInit = (client) => {
  classes = classes.map(x => ({ name: x, emojiStr: getEmoji(`sbrClass${x}`), emoji: getEmojiInst(`sbrClass${x}`) }));

  const reactMod = (reaction) => {
    if(reaction.message.author.id !== client.user.id) return;

    const { message } = reaction;
    const { content, reactions } = message;

    let users = [];

    reactions.forEach(react => {
      react.users.forEach(user => {
        if(user.bot) return;

        const userRef = `<@${user.id}>`;
        const emojiRef = `<:${react.emoji.name}:${react.emoji.id}>`;
        users.push({ userRef, emojiRef });
      });
    });

    users.length = 4;

    const newContent = content.split('\n')[0];
    const contentMembers = `Members: ${users.map(x => `${x.emojiRef} ${x.userRef}`).join(', ')}`;

    message.edit(`${newContent}\n${contentMembers}`);
  };

  client.on('messageReactionAdd', reactMod);
  client.on('messageReactionRemove', reactMod);
};

const room = async (client, msg, args) => {
  const [id, ...message] = args.split(' ');
  if(!id || id === '?room') return msg.reply('You need to specify a room ID!');

  const myMsg = await msg.reply(`created a room - ID: ${id} - ${message && message.length ? message.join(' ') : 'Join me!'}\nMembers: None`);
  for(em of classes) {
    await myMsg.react(em.emoji);
  }
};

module.exports = { roomInit, room };