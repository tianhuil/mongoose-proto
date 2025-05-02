import { prisma } from '@/lib/prisma';
import { Author, Post } from './mongoose';
import mongoose from 'mongoose';
import { setupMongoose } from './mongoose';
import { run } from './runner';
import { NUM_AUTHORS, NUM_POSTS, type AbstractOperations } from './base';

export class PrismaOperations implements AbstractOperations {
  public readonly name = 'Prisma';

  async setupData(): Promise<void> {
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

  async runQuery(): Promise<number> {
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

  async cleanup(): Promise<void> {
    try {
      await prisma.post.deleteMany();
      await prisma.author.deleteMany();
      await prisma.$disconnect();
    } catch (error) {
      console.error('Error cleaning up Prisma data:', error);
      throw error;
    }
  }
}

export class MongooseOperations implements AbstractOperations {
  public readonly name = 'Mongoose';

  async setupData(): Promise<void> {
    try {
      await setupMongoose(process.env.MONGOOSE_MONGO_URL);

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

  async runQuery(): Promise<number> {
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

  async cleanup(): Promise<void> {
    try {
      await Post.deleteMany({});
      await Author.deleteMany({});
      await mongoose.disconnect();
    } catch (error) {
      console.error('Error cleaning up Mongoose data:', error);
      throw error;
    }
  }
}

if (require.main === module) {
  run([new PrismaOperations(), new MongooseOperations()]).catch(console.error);
}
