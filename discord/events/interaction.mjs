import { initLogger } from '../../utils/logger.mjs';

const log = initLogger();

/**
 * @param {Interaction} interaction
 */
export async function interactionEvent(interaction) {
  try {
    
  } catch (error) {
    log.error('interactionイベント処理中にエラーが発生しました:', error);
  }
}