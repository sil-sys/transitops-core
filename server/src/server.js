require('dotenv').config();

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const app = require('./app');
const connectDB = require('./config/db');
const User = require('./models/User');
const Vehicle = require('./models/Vehicle');
const Driver = require('./models/Driver');

const PORT = process.env.PORT || 5000;

const seedDemoData = async () => {
  try {
    const demoUsers = [
      { name: 'Alex', email: 'alex@transitops.com', password: 'test1234', role: 'FleetManager' },
      { name: 'Driver One', email: 'driver1@transitops.com', password: 'test1234', role: 'Driver' },
      { name: 'Safety Officer Sarah', email: 'safety@transitops.com', password: 'test1234', role: 'SafetyOfficer' },
      { name: 'Finance Analyst Fred', email: 'finance@transitops.com', password: 'test1234', role: 'FinancialAnalyst' },
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

    // Seed Drivers
    const demoDrivers = [
      {
        name: 'Driver One',
        licenseNumber: 'DL-11111',
        licenseCategory: 'Class A',
        licenseExpiryDate: new Date('2029-12-31'),
        contactNumber: '555-0101',
        safetyScore: 98,
        experience: 5,
        status: 'Available'
      },
      {
        name: 'Driver Two',
        licenseNumber: 'DL-22222',
        licenseCategory: 'Class B',
        licenseExpiryDate: new Date('2028-06-30'),
        contactNumber: '555-0102',
        safetyScore: 85,
        experience: 3,
        status: 'Available'
      },
      {
        name: 'Driver Three',
        licenseNumber: 'DL-33333',
        licenseCategory: 'Class A',
        licenseExpiryDate: new Date('2030-01-15'),
        contactNumber: '555-0103',
        safetyScore: 92,
        experience: 7,
        status: 'On Trip'
      },
      {
        name: 'Expired License Joe',
        licenseNumber: 'DL-44444',
        licenseCategory: 'Class C',
        licenseExpiryDate: new Date('2025-05-01'), // Expired!
        contactNumber: '555-0104',
        safetyScore: 90,
        experience: 12,
        status: 'Available'
      }
    ];

    for (const driverData of demoDrivers) {
      const existingDriver = await Driver.findOne({ licenseNumber: driverData.licenseNumber });
      if (existingDriver) {
        Object.assign(existingDriver, driverData);
        await existingDriver.save();
      } else {
        await Driver.create(driverData);
      }
    }

    // Seed Vehicles
    const demoVehicles = [
      {
        registrationNumber: 'VAN-05',
        name: 'Mercedes Sprinter',
        type: 'Van',
        maxLoadCapacity: 1200,
        odometer: 45000,
        acquisitionCost: 54000,
        status: 'Available',
        fuelLevel: 80,
        region: 'North',
      },
      {
        registrationNumber: 'TRK-01',
        name: 'Volvo FH16',
        type: 'Truck',
        maxLoadCapacity: 8000,
        odometer: 120000,
        acquisitionCost: 110000,
        status: 'Available',
        fuelLevel: 95,
        region: 'South',
      },
      {
        registrationNumber: 'TRK-02',
        name: 'Scania R500',
        type: 'Truck',
        maxLoadCapacity: 10000,
        odometer: 85000,
        acquisitionCost: 125000,
        status: 'On Trip',
        fuelLevel: 45,
        region: 'East',
      },
      {
        registrationNumber: 'VAN-02',
        name: 'Ford Transit',
        type: 'Van',
        maxLoadCapacity: 1500,
        odometer: 32000,
        acquisitionCost: 45000,
        status: 'In Shop',
        fuelLevel: 10,
        region: 'West',
      }
    ];

    for (const vehicleData of demoVehicles) {
      const existingVehicle = await Vehicle.findOne({ registrationNumber: vehicleData.registrationNumber });
      if (existingVehicle) {
        Object.assign(existingVehicle, vehicleData);
        await existingVehicle.save();
      } else {
        await Vehicle.create(vehicleData);
      }
    }

    console.log('✅ Demo users, drivers, and vehicles seeded successfully');
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