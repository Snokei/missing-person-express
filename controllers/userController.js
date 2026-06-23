const bcrypt = require("bcryptjs");
const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");

exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.findAll();
  res.json({
    success: true,
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
    where: { phone },
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

exports.updateFcmToken = asyncHandler(async (req, res) => {
  const { user_id, fcm_token } = req.body;
  const trimmedToken = typeof fcm_token === "string" ? fcm_token.trim() : "";

  if (!user_id || !trimmedToken) {
    return res.status(400).json({
      success: false,
      message: "user_id and fcm_token are required",
    });
  }

  if (trimmedToken.length < 100) {
    return res.status(400).json({
      success: false,
      message:
        "Invalid FCM token. Use the real device token from your mobile app (usually 150+ characters).",
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
    fcm_token: trimmedToken,
  });

  res.json({
    success: true,
    message: "FCM token updated successfully",
  });
});
