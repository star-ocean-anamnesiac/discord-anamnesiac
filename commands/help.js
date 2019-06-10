

const help = async (client, msg) => {
  msg.channel.send(`
    **Character Commands**

    * \`?char[c] <name>\` - find a character by name
    * \`?chars <query>\` - search the character database
    * \`?charq\` - print statistics about the character database
  
    **Item Commands**

    * \`?item <name>\` - find an item by name
    * \`?items <query>\` - search the item database
    * \`?itemq\` - print statistics about the item database
  
    **Boss Commands**

    * \`?boss <name>\` - find a boss by name
    * \`?bosss <query>\` - search the boss database
    * \`?bossq\` - print statistics about the boss database
    
    **Shop Commands**

    * \`?shop\` - search a shop by name

    **Other Commands**

    * \`?ahelp\` - print this message
    * \`?room <id> <message>\` - create a new room for people to join
    * \`?contribute\` - learn how to contribute to this project
  `);
};

module.exports = { help };