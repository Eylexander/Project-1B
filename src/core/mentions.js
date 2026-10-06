// Clickable command mentions like </work:123>. Ids are cached after the commands are fetched on boot.
const ids = new Map();

function remember(commandList) {
    for (const command of commandList.values ? commandList.values() : commandList) ids.set(command.name, command.id);
}

/** "</job list:123>" when the id is known, otherwise "`/job list`". */
function cmd(name, sub = null) {
    const full = sub ? `${name} ${sub}` : name;
    const id = ids.get(name);
    return id ? `</${full}:${id}>` : `\`/${full}\``;
}

module.exports = { remember, cmd };
