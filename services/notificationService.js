const { Expo } = require("expo-server-sdk");

const expo = new Expo();

const sendNotification = async ({ token, title, body, data = {} }) => {
  if (!Expo.isExpoPushToken(token)) {
    throw new Error(`Invalid Expo push token: ${token}`);
  }

  const messages = [
    {
      to: token,
      sound: "default",
      title,
      body,
      data,
    },
  ];

  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];

  for (const chunk of chunks) {
    const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
    tickets.push(...ticketChunk);
  }

  const errors = tickets.filter((ticket) => ticket.status === "error");
  if (errors.length) {
    throw new Error(errors[0].message);
  }

  return tickets;
};

/**
 * Send a notification to multiple devices (bulk).
 * @param {string[]} tokens  - Array of valid Expo push tokens
 * @param {string}   title   - Notification title
 * @param {string}   body    - Notification body
 * @param {object}   data    - Optional extra data payload
 * @returns {{ tickets: object[], invalidTokens: string[], errors: object[] }}
 */
const sendBulkNotification = async ({ tokens, title, body, data = {} }) => {
  // Separate valid tokens from invalid ones
  const validTokens = [];
  const invalidTokens = [];

  for (const token of tokens) {
    if (Expo.isExpoPushToken(token)) {
      validTokens.push(token);
    } else {
      invalidTokens.push(token);
    }
  }

  if (validTokens.length === 0) {
    return { tickets: [], invalidTokens, errors: [] };
  }

  const messages = validTokens.map((token) => ({
    to: token,
    sound: "default",
    title,
    body,
    data,
  }));

  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];

  for (const chunk of chunks) {
    const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
    tickets.push(...ticketChunk);
  }

  const errors = tickets
    .map((ticket, i) =>
      ticket.status === "error"
        ? { token: validTokens[i], message: ticket.message, details: ticket.details }
        : null
    )
    .filter(Boolean);

  return { tickets, invalidTokens, errors };
};

module.exports = {
  sendNotification,
  sendBulkNotification,
};
