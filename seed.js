import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { User } from './src/models/User.js';
import { Resource } from './src/models/Resource.js';
import { Incident } from './src/models/Incident.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/resq_dev');
    console.log('Connected to MongoDB.');

    // Clear db
    await Promise.all([
      User.deleteMany({}),
      Resource.deleteMany({}),
      Incident.deleteMany({})
    ]);
    console.log('Cleared existing data.');

    // Create Users
    const passwordHash = await bcrypt.hash('password123', 12);
    
    const admin = await User.create({ name: 'Admin User', email: 'admin@resq.local', passwordHash, role: 'admin' });
    const operator = await User.create({ name: 'Field Operator', email: 'operator@resq.local', passwordHash, role: 'operator' });
    const user = await User.create({ name: 'Standard User', email: 'user@resq.local', passwordHash, role: 'user' });
    
    console.log('Created users (password123).');

    // Create Resources
    await Resource.create([
      { name: 'First Aid Kit (Large)', category: 'Medical supplies', totalQuantity: 50, availableQuantity: 50, unit: 'kits', storageLocation: 'Warehouse A', updatedBy: admin._id },
      { name: 'Bottled Water (Pallet)', category: 'Food and water', totalQuantity: 200, availableQuantity: 200, unit: 'pallets', storageLocation: 'Warehouse B', updatedBy: admin._id },
      { name: 'Heavy Excavator', category: 'Rescue equipment', totalQuantity: 3, availableQuantity: 3, unit: 'vehicles', storageLocation: 'Depot 1', updatedBy: admin._id }
    ]);
    
    console.log('Created resources.');

    // Create Incidents
    await Incident.create({
      title: 'Major Flooding in Downtown',
      description: 'Water levels rising rapidly, multiple people stranded.',
      category: 'Flood',
      severity: 'critical',
      locationName: 'Downtown Metro Station',
      peopleAffected: 45,
      requiredResources: [{ category: 'Rescue equipment', quantity: 2 }],
      reportedBy: operator._id
    });

    console.log('Created incidents.');

    console.log('Seeding complete! You can login with admin@resq.local / password123');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
