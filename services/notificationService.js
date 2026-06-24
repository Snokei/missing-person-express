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

module.exports = {
  sendNotification,
};
