require("../config/firebase");

const { getApps } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");

if (!getApps().length) {
  throw new Error("Firebase is not initialized");
}

const messaging = getMessaging();

const sendNotification = async ({ token, title, body }) => {
  const response = await messaging.send({
    token,
    notification: {
      title,
      body,
    },
  });

  return response;
};

module.exports = {
  sendNotification,
};
