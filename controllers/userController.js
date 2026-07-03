const bcrypt = require("bcryptjs");
const { Expo } = require("expo-server-sdk");
const { Op } = require("sequelize");
const User = require("../models/User");
const Role = require("../models/Role");
const asyncHandler = require("../middleware/asyncHandler");
const {
  getPaginationParams,
  getPaginationMeta,
} = require("../utils/pagination");

exports.getAllUsers = asyncHandler(async (req, res) => {
  const { page, per_page, offset } = getPaginationParams(req.query);
  const { first_name, phone, status, role } = req.query;

  // Build filter conditions
  const whereConditions = {};

  if (first_name) {
    whereConditions.first_name = {
      [Op.ilike]: `%${first_name}%`,
    };
  }

  if (phone) {
    whereConditions.phone = {
      [Op.ilike]: `%${phone}%`,
    };
  }

  if (status !== undefined) {
    whereConditions.is_active = status === "active" ? true : false;
  }

  // Prepare include for eager loading Role
  const include = [];

  if (role) {
    if (!isNaN(role)) {
      // If role is numeric, treat as role_id
      whereConditions.role_id = parseInt(role, 10);
    } else {
      // If role is text, join with Role model
      include.push({
        model: Role,
        as: "role",
        where: { name: role },
        required: true,
      });
    }
  }

  const { rows: users, count: total } = await User.findAndCountAll({
    where: whereConditions,
    include: include.length > 0 ? include : [{ model: Role, as: "role" }],
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
