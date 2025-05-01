import { prisma } from '../lib/prisma';
import { Author, Post } from '../populate';
import mongoose from 'mongoose';
import { TimingSamples } from '../lib/stats';

const ITERATIONS = 20;
const DELAY_MS = 100;
const NUM_POSTS = 10;
const NUM_AUTHORS = 2;
const WARMUP_ITERATIONS = 3;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const setupPrismaData = async () => {
  try {
    // Create authors
    const authors = await Promise.all(
      Array.from({ length: NUM_AUTHORS }, (_, i) =>
        prisma.author.create({
          data: {
            name: `Author ${i + 1}`,
            email: `author${i + 1}@example.com`,
            bio: `Bio for author ${i + 1}`,
          },
        }),
      ),
    );

    // Create posts
    await Promise.all(
      Array.from({ length: NUM_POSTS }, (_, i) =>
        prisma.post.create({
          data: {
            title: `Post ${i + 1}`,
            content: `Content for post ${i + 1}. This is a longer content to meet minimum requirements...`,
            published: true,
            authorId: authors[i % NUM_AUTHORS].id,
          },
        }),
      ),
    );
  } catch (error) {
    console.error('Error setting up Prisma data:', error);
    throw error;
  }
};

const setupMongooseData = async () => {
  try {
    // Create indexes
    await Promise.all([
      Post.collection.createIndex({ createdAt: -1 }),
      Post.collection.createIndex({ published: 1 }),
      Author.collection.createIndex({ email: 1 }, { unique: true }),
    ]);

    // Create authors
    const authors = await Promise.all(
      Array.from({ length: NUM_AUTHORS }, (_, i) =>
        Author.create({
          name: `Author ${i + 1}`,
          email: `author${i + 1}@example.com`,
          bio: `Bio for author ${i + 1}`,
        }),
      ),
    );

    // Create posts
    await Promise.all(
      Array.from({ length: NUM_POSTS }, (_, i) =>
        Post.create({
          title: `Post ${i + 1}`,
          content: `Content for post ${i + 1}. This is a longer content to meet minimum requirements...`,
          published: true,
          author: authors[i % NUM_AUTHORS]._id,
        }),
      ),
    );
  } catch (error) {
    console.error('Error setting up Mongoose data:', error);
    throw error;
  }
};

const runPrismaQuery = async () => {
  try {
    const start = performance.now();
    await prisma.post.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            name: true,
            email: true,
            bio: true,
          },
        },
      },
      where: {
        published: true,
      },
    });
    return performance.now() - start;
  } catch (error) {
    console.error('Error in Prisma query:', error);
    throw error;
  }
};

const runMongooseQuery = async () => {
  try {
    const start = performance.now();
    await Post.find({ published: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({ path: 'author', select: 'name email bio -_id' });
    return performance.now() - start;
  } catch (error) {
    console.error('Error in Mongoose query:', error);
    throw error;
  }
};

const cleanupPrisma = async () => {
  try {
    await prisma.post.deleteMany();
    await prisma.author.deleteMany();
  } catch (error) {
    console.error('Error cleaning up Prisma data:', error);
    throw error;
  }
};

const cleanupMongoose = async () => {
  try {
    await Post.deleteMany({});
    await Author.deleteMany({});
  } catch (error) {
    console.error('Error cleaning up Mongoose data:', error);
    throw error;
  }
};

const warmupQueries = async () => {
  console.log('Warming up connections...');
  for (let i = 0; i < WARMUP_ITERATIONS; i++) {
    await runPrismaQuery();
    await runMongooseQuery();
    await delay(50); // Shorter delay for warmup
  }
  console.log('Warmup complete');
};

const runBenchmark = async () => {
  try {
    // Connect to MongoDB
    const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/blog';
    await mongoose.connect(mongoUrl);
    console.log('Connected to MongoDB');

    // Setup data
    await setupPrismaData();
    await setupMongooseData();
    console.log('Data setup complete');

    // Warm up connections
    await warmupQueries();

    const prismaTiming = new TimingSamples();
    const mongooseTiming = new TimingSamples();

    // Run interleaved queries
    for (let i = 0; i < ITERATIONS; i++) {
      console.log(`\nIteration ${i + 1}/${ITERATIONS}`);

      // Run Prisma query
      const prismaTime = await runPrismaQuery();
      prismaTiming.add(prismaTime);
      await delay(DELAY_MS);

      // Run Mongoose query
      const mongooseTime = await runMongooseQuery();
      mongooseTiming.add(mongooseTime);
      await delay(DELAY_MS);
    }

    // Report results
    console.log('\nResults:');
    console.log('Prisma:', prismaTiming.summary);
    console.log('Mongoose:', mongooseTiming.summary);

    // Cleanup
    await cleanupPrisma();
    await cleanupMongoose();
    console.log('\nCleanup complete');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    await prisma.$disconnect();
    console.log('\nDisconnected from databases');
  }
};

// Run the benchmark if this file is being executed directly
if (require.main === module) {
  runBenchmark().catch(console.error);
}
