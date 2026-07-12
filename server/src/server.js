require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const User = require('./models/User');
const Vehicle = require('./models/Vehicle');

const PORT = process.env.PORT || 5000;

const seedDemoData = async () => {
  try {
    const demoUsers = [
      { name: 'Alex', email: 'alex@transitops.com', password: 'test1234', role: 'FleetManager' },
      { name: 'Driver One', email: 'driver1@transitops.com', password: 'test1234', role: 'Driver' },
    ];

    for (const userData of demoUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        existingUser.name = userData.name;
        existingUser.role = userData.role;
        existingUser.password = userData.password;
        await existingUser.save();
      } else {
        await User.create(userData);
      }
    }

    const existingVehicle = await Vehicle.findOne({ registrationNumber: 'VAN-05' });
    if (!existingVehicle) {
      await Vehicle.create({
        registrationNumber: 'VAN-05',
        name: 'Mercedes Sprinter',
        type: 'Van',
        maxLoadCapacity: 1200,
        acquisitionCost: 54000,
        status: 'Available',
        region: 'North',
      });
    }

    console.log('✅ Demo users and vehicle ready');
  } catch (error) {
    console.error('❌ Demo data seeding failed:', error.message);
  }
};

const startServer = async () => {
  await connectDB();
  await seedDemoData();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
};

startServer();