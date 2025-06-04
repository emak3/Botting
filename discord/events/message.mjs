import { initLogger } from '../../utils/logger.mjs';

const log = initLogger();

/**
 * @param {Message} message
 */
export async function messageEvent(message) {
  try {
    if (message.author.bot) return;
  } catch (error) {
    log.error('messageイベント処理中にエラーが発生しました:', error);
  }
}