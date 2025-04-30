import { z } from 'zod';
import { extendZod, zodSchema } from '@zodyac/zod-mongoose';
import mongoose from 'mongoose';

extendZod(z);

const ZUser = z.object({
  name: z.string().min(3).max(255),
  age: z.number().min(18).max(100),
  active: z.boolean().default(false),
  access: z.enum(['admin', 'user']).default('user'),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.enum(['CA', 'NY', 'TX']),
  }),
  tags: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const schema = zodSchema(ZUser);
const userModel = mongoose.model('User', schema);

const validateMongoUrl = () => {
  const url = process.env.MONGO_URL;
  if (!url) {
    throw new Error(
      'MONGO_URL environment variable is not set.\n' +
        'Please create a .env file with MONGO_URL="mongodb://localhost:27017/test"\n' +
        'Or set it to your MongoDB Atlas connection string.',
    );
  }
  return url;
};

const connectDB = async () => {
  try {
    const mongoUrl = validateMongoUrl();
    await mongoose.connect(mongoUrl);
    console.log('Connected to MongoDB');
  } catch (error) {
    if (error instanceof Error) {
      console.error('MongoDB connection error:', error.message);
      if (error.message.includes('MONGO_URL')) {
        // Environment variable error
        process.exit(1);
      }
      console.error('Please check that:');
      console.error('1. MongoDB is running (if using localhost)');
      console.error('2. Your connection string is correct');
      console.error(
        '3. Your username and password are correct (if using Atlas)',
      );
    }
    process.exit(1);
  }
};

const main = async () => {
  await connectDB();

  try {
    // Create a new user
    const newUser = await userModel.create({
      name: 'John Doe',
      age: 30,
      address: {
        street: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
      },
      tags: ['test'],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('Created user:', newUser);

    // Query users
    const users = await userModel.find({ name: { $regex: 'John' } });
    console.log('Adult users:', users);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

main().catch(console.error);
