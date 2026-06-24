const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const asyncHandler = require("../middleware/asyncHandler");
const User = require("../models/User");

exports.login = asyncHandler(async (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({
      success: false,
      message: "Phone number and password are required",
    });
  }

  const user = await User.findOne({
    where: { phone },
  });

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid phone number or password",
    });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: "Invalid phone number or password",
    });
  }

  const token = jwt.sign(
    {
      id: user.id,
      role: user.role_id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );
  console.log(user);

  res.status(200).json({
    success: true,
    token,
    user: {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      role: user.role_id,
      expo_push_token: user.expo_push_token,
    },
  });
});
