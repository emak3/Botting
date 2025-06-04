import { startDiscordClient } from './discord/client.mjs';
import { initLogger } from './utils/logger.mjs';

// ロガーの初期化
const log = initLogger();

async function startBot() {
    try {
        log.info('ボットを起動しています...');

        // Discordクライアントを起動
        const client = await startDiscordClient();

    } catch (error) {
        log.error('ボットの起動に失敗しました:', error);
        process.exit(1);
    }
}

// ボットを起動
startBot();