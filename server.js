const app = require('./app');
const { sequelize } = require('./models');

const port = process.env.PORT || 3000;

sequelize
  .sync({ alter: true })
  .then(() => {
    console.log('✅ Database connected and models synced');
    app.listen(port, () => {
      console.log(`🚀 Server is flying on http://localhost:${port}`);
    });
  })
  .catch((err) => console.error('❌ Database sync error:', err));
