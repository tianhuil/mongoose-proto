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

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class PrismaOperations {
  static async setupData(): Promise<void> {
    try {
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
  }

  static async runQuery(): Promise<number> {
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
  }

  static async cleanup(): Promise<void> {
    try {
      await prisma.post.deleteMany();
      await prisma.author.deleteMany();
    } catch (error) {
      console.error('Error cleaning up Prisma data:', error);
      throw error;
    }
  }

  static async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }
}

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class MongooseOperations {
  static async connect(): Promise<void> {
    const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/blog';
    await mongoose.connect(mongoUrl);
  }

  static async setupData(): Promise<void> {
    try {
      await Promise.all([
        Post.collection.createIndex({ createdAt: -1 }),
        Post.collection.createIndex({ published: 1 }),
        Author.collection.createIndex({ email: 1 }, { unique: true }),
      ]);

      const authors = await Promise.all(
        Array.from({ length: NUM_AUTHORS }, (_, i) =>
          Author.create({
            name: `Author ${i + 1}`,
            email: `author${i + 1}@example.com`,
            bio: `Bio for author ${i + 1}`,
          }),
        ),
      );

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
  }

  static async runQuery(): Promise<number> {
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
  }

  static async cleanup(): Promise<void> {
    try {
      await Post.deleteMany({});
      await Author.deleteMany({});
    } catch (error) {
      console.error('Error cleaning up Mongoose data:', error);
      throw error;
    }
  }

  static async disconnect(): Promise<void> {
    await mongoose.disconnect();
  }
}

const warmupQueries = async (): Promise<void> => {
  console.log('Warming up connections...');
  for (let i = 0; i < WARMUP_ITERATIONS; i++) {
    await PrismaOperations.runQuery();
    await MongooseOperations.runQuery();
    await delay(50);
  }
  console.log('Warmup complete');
};

const run = async (): Promise<void> => {
  try {
    await MongooseOperations.connect();
    await PrismaOperations.setupData();
    await MongooseOperations.setupData();
    console.log('Data setup complete');

    await warmupQueries();

    const prismaTiming = new TimingSamples();
    const mongooseTiming = new TimingSamples();

    for (let i = 0; i < ITERATIONS; i++) {
      console.log(`\nIteration ${i + 1}/${ITERATIONS}`);

      const prismaTime = await PrismaOperations.runQuery();
      prismaTiming.add(prismaTime);
      await delay(DELAY_MS);

      const mongooseTime = await MongooseOperations.runQuery();
      mongooseTiming.add(mongooseTime);
      await delay(DELAY_MS);
    }

    console.log('\nResults:');
    console.log('Prisma:', prismaTiming.summary);
    console.log('Mongoose:', mongooseTiming.summary);

    await PrismaOperations.cleanup();
    await MongooseOperations.cleanup();
    console.log('\nCleanup complete');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await MongooseOperations.disconnect();
    await PrismaOperations.disconnect();
    console.log('\nDisconnected from databases');
  }
};

if (require.main === module) {
  run().catch(console.error);
}
