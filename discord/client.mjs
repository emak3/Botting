import { Client, GatewayIntentBits, Partials, ActivityType } from 'discord.js';
import { getConfig } from '../config/config.mjs';
import { initLogger } from '../utils/logger.mjs';
import { setupEvents } from './eventHandler.mjs';
import '../utils/usernameSystem.mjs';

const log = initLogger();

/**
 * Discordクライアントを設定して起動する
 * @returns {Promise<Client>}
 */
export async function startDiscordClient() {
  try {
    const client = new Client({ 
      intents: [
        ...Object.values(GatewayIntentBits),
        GatewayIntentBits.GuildWebhooks
      ], 
      allowedMentions: { parse: ["users", "roles"] }, 
      partials: [Partials.Message, Partials.Channel, Partials.Reaction] 
    });
    process.on("uncaughtException", (error) => {
      log.error('未処理の例外が発生しました:', error);
    });

    setupEvents(client);

    await client.login(getConfig().token);

    client.user.setActivity({
      name: `test`,
      type: ActivityType.Playing
    });
    
    return client;
  } catch (error) {
    log.error('Discordクライアントの起動に失敗しました:', error);
    throw error;
  }
}