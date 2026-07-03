const bcrypt = require("bcryptjs");
const asyncHandler = require("../middleware/asyncHandler");
const User = require("../models/User");

exports.forgotPassword = asyncHandler(async (req, res) => {
  const { phone, newPassword } = req.body;

  if (!phone || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Please provide phone number and new password",
    });
  }

  // Find user by phone
  const user = await User.findOne({ where: { phone } });

  // Always return success to avoid leaking which phones are registered
  if (!user) {
    return res.status(200).json({
      success: true,
      message: "If that phone number exists, password has been updated.",
    });
  }

  // Hash the new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  // Update password
  user.password = hashedPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password reset successfully",
  });
});
