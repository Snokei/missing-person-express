const app = require("./app");
const { sequelize } = require("./models");
const { seedRoles } = require("./seeders/seedRoles");
const { seedUsers } = require("./seeders/seedUsers");

const port = process.env.PORT || 3000;

sequelize
  .sync()
  // .sync({ force: true })
  .then(async () => {
    console.log("✅ Database connected and models synced");
    await seedRoles();
    await seedUsers();
    app.listen(port, () => {
      console.log(`🚀 Server is flying on http://localhost:${port}`);
    });
  })
  .catch((err) => console.error("❌ Database sync error:", err));
