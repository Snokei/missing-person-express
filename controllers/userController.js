const bcrypt = require("bcryptjs");
const { Expo } = require("expo-server-sdk");
const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");
const {
  getPaginationParams,
  getPaginationMeta,
} = require("../utils/pagination");

exports.getAllUsers = asyncHandler(async (req, res) => {
  const { page, per_page, offset } = getPaginationParams(req.query);

  const { rows: users, count: total } = await User.findAndCountAll({
    limit: per_page,
    offset,
  });

  res.json({
    success: true,
    meta: getPaginationMeta(total, page, per_page),
    data: users,
  });
});

exports.createUser = asyncHandler(async (req, res) => {
  const { first_name, last_name, email, phone, password, role_id } = req.body;

  // Check email
  const existingEmail = await User.findOne({
    where: { email },
  });

  if (existingEmail) {
    return res.status(400).json({
      success: false,
      message: "Email already exists",
    });
  }

  // Check phone
  const existingPhone = await User.findOne({
    where: { phone: String(phone) },
  });

  if (existingPhone) {
    return res.status(400).json({
      success: false,
      message: "Phone number already exists",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    first_name,
    last_name,
    email,
    phone,
    password: hashedPassword,
    role_id,
  });

  res.status(201).json({
    success: true,
    message: "User created successfully",
    data: user,
  });
});

exports.updateExpoPushToken = asyncHandler(async (req, res) => {
  const { user_id, expo_push_token } = req.body;
  const trimmedToken =
    typeof expo_push_token === "string" ? expo_push_token.trim() : "";

  if (!user_id || !trimmedToken) {
    return res.status(400).json({
      success: false,
      message: "user_id and expo_push_token are required",
    });
  }

  if (!Expo.isExpoPushToken(trimmedToken)) {
    return res.status(400).json({
      success: false,
      message:
        "Invalid Expo push token. Expected format: ExponentPushToken[...]",
    });
  }

  const user = await User.findByPk(user_id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  await user.update({
    expo_push_token: trimmedToken,
  });

  res.json({
    success: true,
    message: "Expo push token updated successfully",
  });
});
