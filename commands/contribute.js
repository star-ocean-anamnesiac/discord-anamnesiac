

const contribute = async (client, msg) => {
  msg.channel.send(`Interested in contributing to the Anamnesiac project? We can always use the help! Primarily, we need help adding and updating data in both the GL and JP regions - keeping it all updated weekly is a big task! We try to maintain boss guides, item and character information. But, anything helps - that includes typo fixes or quick number changes. If you're interested in helping out, check out this guide: https://github.com/seiyria/anamnesiac/blob/master/CONTRIBUTING.md`);
};

module.exports = { contribute };