const { Role } = require("../models");

const defaultRoles = [
  { name: "ADMIN", description: "Full system access", is_active: true },
  { name: "POLICE_OPERATOR", description: "Can manage missing person cases", is_active: true },
  { name: "FIELD_OFFICER", description: "Field operations officer", is_active: true },
  { name: "VOLUNTEER", description: "Volunteer user", is_active: true },
];

async function seedRoles() {
  const count = await Role.count();
  if (count === 0) {
    await Role.bulkCreate(defaultRoles);
    console.log("✅ Default roles seeded successfully");
  } else {
    console.log("ℹ️  Roles already exist, skipping seed");
  }
}

module.exports = { seedRoles, defaultRoles };