const bcrypt = require("bcryptjs");
const asyncHandler = require("../middleware/asyncHandler");
const User = require("../models/User");

exports.forgotPassword = asyncHandler(async (req, res) => {
  const { phone, newPassword } = req.body;

  // 1. Check for required fields
  if (!phone || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Please provide phone number and new password",
    });
  }

  // 2. Find user by phone (cast to string to avoid type mismatch)
  const user = await User.findOne({ where: { phone: String(phone) } });

  console.log(user, "user");

  // 3. If phone does not match, return an error
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // 4. Hash the new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  // 5. Update password and save
  user.password = hashedPassword;
  await user.save();

  // 6. Return success on match
  res.status(200).json({
    success: true,
    message: "Password reset successfully",
  });
});
