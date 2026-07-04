const { sequelize } = require("../models");
const { Notification, NotificationRecipient, User, Role } = require("../models");
const { Op } = require("sequelize");
const {
  sendNotification,
  sendBulkNotification: sendExpoBulkNotification,
} = require("./notificationService");
const {
  BULK_TARGET_TYPES,
} = require("../utils/notificationConstants");

/**
 * Send a single notification to one user.
 * 1. Validate user
 * 2. Create notification record
 * 3. Create one notification_recipient
 * 4. Send Expo push (if token exists)
 * 5. Return result
 */
const sendSingleNotification = async ({
  userId,
  title,
  message,
  type,
  priority = "NORMAL",
  data = {},
  createdBy = null,
}) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error(`User with ID ${userId} not found`);
  }

  const result = await sequelize.transaction(async (transaction) => {
    // 1. Create the notification record
    const notification = await Notification.create(
      {
        title,
        message,
        type,
        priority,
        data,
        created_by: createdBy,
      },
      { transaction }
    );

    // 2. Create the recipient record
    const recipient = await NotificationRecipient.create(
      {
        notification_id: notification.id,
        user_id: userId,
      },
      { transaction }
    );

    return { notification, recipient };
  });

  // 3. Send Expo push notification (fire and forget - don't fail if push fails)
  let pushResult = null;
  if (user.expo_push_token) {
    try {
      pushResult = await sendNotification({
        token: user.expo_push_token,
        title,
        body: message,
        data: { notificationId: result.notification.id, ...data },
      });
    } catch (pushError) {
      // Push failure should not affect database notification
      console.error("Expo push failed for single notification:", pushError.message);
    }
  }

  return {
    notification: result.notification,
    recipient: result.recipient,
    pushResult,
  };
};

/**
 * Send bulk notification with multiple target types.
 * Supports: ALL, USERS (specific user IDs), ROLE (specific roles)
 */
const sendBulkNotification = async ({
  title,
  message,
  type = "SYSTEM",
  priority = "NORMAL",
  data = {},
  target = BULK_TARGET_TYPES.ALL,
  userIds = [],
  roles = [],
  createdBy = null,
}) => {
  // 1. Find target users based on target type
  let targetUsers = [];

  if (target === BULK_TARGET_TYPES.ALL) {
    targetUsers = await User.findAll({
      where: { is_active: true },
      attributes: ["id", "expo_push_token"],
    });
  } else if (target === BULK_TARGET_TYPES.USERS) {
    if (!userIds || userIds.length === 0) {
      throw new Error("user_ids are required when target is USERS");
    }
    targetUsers = await User.findAll({
      where: {
        id: { [Op.in]: userIds },
        is_active: true,
      },
      attributes: ["id", "expo_push_token"],
    });
  } else if (target === BULK_TARGET_TYPES.ROLE) {
    if (!roles || roles.length === 0) {
      throw new Error("roles are required when target is ROLE");
    }
    targetUsers = await User.findAll({
      include: [
        {
          model: Role,
          as: "role",
          where: {
            name: { [Op.in]: roles },
          },
          attributes: [],
        },
      ],
      where: { is_active: true },
      attributes: ["id", "expo_push_token"],
    });
  } else {
    throw new Error(`Invalid target type: ${target}`);
  }

  if (targetUsers.length === 0) {
    return {
      notification: null,
      recipientCount: 0,
      pushResult: { tickets: [], invalidTokens: [], errors: [] },
    };
  }

  // 2. Create ONE notification record + recipients in a transaction
  const result = await sequelize.transaction(async (transaction) => {
    // Create the single notification record
    const notification = await Notification.create(
      {
        title,
        message,
        type,
        priority,
        data,
        created_by: createdBy,
      },
      { transaction }
    );

    // Bulk create all recipient records
    const recipientData = targetUsers.map((user) => ({
      notification_id: notification.id,
      user_id: user.id,
    }));

    const recipients = await NotificationRecipient.bulkCreate(recipientData, {
      transaction,
    });

    return { notification, recipients, userCount: targetUsers.length };
  });

  // 3. Send Expo push notifications (fire and forget)
  let pushResult = { tickets: [], invalidTokens: [], errors: [] };
  const tokens = targetUsers
    .map((u) => u.expo_push_token)
    .filter((token) => token !== null);

  if (tokens.length > 0) {
    try {
      pushResult = await sendExpoBulkNotification({
        tokens,
        title,
        body: message,
        data: { notificationId: result.notification.id, ...data },
      });
    } catch (pushError) {
      console.error("Expo bulk push failed:", pushError.message);
    }
  }

  return {
    notification: result.notification,
    recipientCount: result.userCount,
    pushResult,
  };
};

/**
 * Get paginated notifications for the current user.
 */
const getUserNotifications = async ({ userId, page, perPage, offset }) => {
  const { count, rows } = await NotificationRecipient.findAndCountAll({
    where: {
      user_id: userId,
      deleted_at: null,
    },
    include: [
      {
        model: Notification,
        as: "notification",
        required: true,
      },
    ],
    order: [[{ model: Notification, as: "notification" }, "created_at", "DESC"]],
    limit: perPage,
    offset,
    distinct: true,
  });

  // Format the response to match React Native DBNotification interface
  const notifications = rows.map((recipient) => ({
    id: recipient.id,
    notification_id: recipient.notification_id,
    is_read: recipient.is_read,
    read_at: recipient.read_at,
    deleted_at: recipient.deleted_at,
    created_at: recipient.created_at,
    notification: {
      id: recipient.notification.id,
      title: recipient.notification.title,
      message: recipient.notification.message,
      type: recipient.notification.type,
      priority: recipient.notification.priority,
      data: recipient.notification.data,
      created_by: recipient.notification.created_by,
      created_at: recipient.notification.created_at,
      updated_at: recipient.notification.updated_at,
    },
  }));

  return {
    total: count,
    notifications,
  };
};

/**
 * Get unread notification count for a user.
 */
const getUnreadCount = async (userId) => {
  const count = await NotificationRecipient.count({
    where: {
      user_id: userId,
      is_read: false,
      deleted_at: null,
    },
  });
  return count;
};

/**
 * Mark a single notification as read for a user.
 */
const markAsRead = async ({ notificationId, userId }) => {
  const recipient = await NotificationRecipient.findOne({
    where: {
      notification_id: notificationId,
      user_id: userId,
      deleted_at: null,
    },
  });

  if (!recipient) {
    return null;
  }

  recipient.is_read = true;
  recipient.read_at = new Date();
  await recipient.save();

  return recipient;
};

/**
 * Mark all notifications as read for a user.
 */
const markAllAsRead = async (userId) => {
  const [updatedCount] = await NotificationRecipient.update(
    {
      is_read: true,
      read_at: new Date(),
    },
    {
      where: {
        user_id: userId,
        is_read: false,
        deleted_at: null,
      },
    }
  );

  return updatedCount;
};

/**
 * Soft delete a notification for a user (recipient only).
 */
const softDeleteNotification = async ({ notificationId, userId }) => {
  const recipient = await NotificationRecipient.findOne({
    where: {
      notification_id: notificationId,
      user_id: userId,
      deleted_at: null,
    },
  });

  if (!recipient) {
    return null;
  }

  recipient.deleted_at = new Date();
  await recipient.save();

  return recipient;
};

module.exports = {
  sendSingleNotification,
  sendBulkNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  softDeleteNotification,
};