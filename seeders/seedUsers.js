const bcrypt = require("bcryptjs");
const { User, Role } = require("../models");

const defaultUsers = [
  {
    first_name: "Super",
    last_name: "Admin",
    email: "superadmin@missingpersons.com",
    phone: "0000000000",
    password: "Admin@123",
    role_name: "ADMIN",
    is_active: true,
  },
];

async function seedUsers() {
  const count = await User.count();
  if (count === 0) {
    const adminRole = await Role.findOne({ where: { name: "ADMIN" } });
    if (!adminRole) {
      console.log("⚠️  ADMIN role not found, skipping user seed");
      return;
    }

    for (const userData of defaultUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      await User.create({
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        phone: userData.phone,
        password: hashedPassword,
        role_id: adminRole.id,
        is_active: userData.is_active,
      });
    }
    console.log("✅ Default users seeded successfully");
  } else {
    console.log("ℹ️  Users already exist, skipping seed");
  }
}

module.exports = { seedUsers, defaultUsers };