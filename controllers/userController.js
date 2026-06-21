const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');

exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.findAll();
  res.json({
    success: true,
    data: users
  });
});

exports.createPoliceman = asyncHandler(async (req, res) => {
  const { firstName, lastName } = req.body;

  const user = await User.create({
    first_name: firstName,
    last_name: lastName
  });

  res.status(201).json({
    success: true,
    message: 'Policeman added successfully!',
    data: user
  });
});
