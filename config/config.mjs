const config = {
  // Discord設定
  "token": process.env.TOKEN,
  "clientId": process.env.CLIENT_ID,
};

/**
 * @returns {Object}
 */
export function getConfig() {
  return config;
}