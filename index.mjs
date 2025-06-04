import { Client, Partials, GatewayIntentBits } from "discord.js";
import { getConfig } from './config/config.mjs';
import { initLogger } from './utils/logger.mjs';
const log = initLogger();
import { readdirSync } from "node:fs";
import './utils/usernameSystem.mjs';
const client = new Client({ intents: Object.values(GatewayIntentBits), allowedMentions: { parse: ["users", "roles"] }, partials: [Partials.Message, Partials.Channel, Partials.Reaction] });

client.commands = new Map();
client.interactions = [];
client.messages = [];
client.modals = [];
client.buttons = [];
client.menus = [];

process.on("uncaughtException", (error) => {
    console.error(error);
});

// ファイルの動的インポートを使用
for (const file of readdirSync("./discord/events").filter((file) =>
    file.endsWith(".mjs"),
)) {
    const eventModule = await import(`./discord/events/${file}`);
    const event = eventModule.default;
    if (event.once) {
        client.once(event.name, async (...args) => await event.execute(...args));
    }
    else {
        client.on(event.name, async (...args) => await event.execute(...args));
    }
}

for (const file of readdirSync("./discord/commands").filter((file) =>
    file.endsWith(".mjs"),
)) {
    const commandModule = await import(`./discord/commands/${file}`);
    const command = commandModule.default;
    client.commands.set(command.command.name, command);
}

for (const file of readdirSync("./discord/interactions").filter((file) =>
    file.endsWith(".mjs"),
)) {
    const interactionModule = await import(`./discord/interactions/${file}`);
    const interaction = interactionModule.default;
    client.interactions.push(interaction);
}

for (const file of readdirSync("./discord/interactions/modal").filter((file) =>
    file.endsWith(".mjs"),
)) {
    const modalModule = await import(`./discord/interactions/modal/${file}`);
    const modal = modalModule.default;
    client.modals.push(modal);
}

for (const file of readdirSync("./discord/interactions/button").filter((file) =>
    file.endsWith(".mjs"),
)) {
    const buttonModule = await import(`./discord/interactions/button/${file}`);
    const button = buttonModule.default;
    client.buttons.push(button);
}

for (const file of readdirSync("./discord/interactions/menu").filter((file) =>
    file.endsWith(".mjs"),
)) {
    const menuModule = await import(`./discord/interactions/menu/${file}`);
    const menu = menuModule.default;
    client.menus.push(menu);
}

for (const file of readdirSync("./discord/messages").filter((file) =>
    file.endsWith(".mjs"),
)) {
    const messageModule = await import(`./discord/messages/${file}`);
    const message = messageModule.default;
    client.messages.push(message);
}

client.login(getConfig().token).then(() => log.info(getConfig()));