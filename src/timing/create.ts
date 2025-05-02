import { prisma } from '@/lib/prisma';
import { Author, Post } from './mongoose';
import mongoose from 'mongoose';
import { setupMongoose } from './mongoose';
import { run } from './runner';

const NUM_POSTS = 10;

export interface AbstractOperations {
  readonly name: string;
  setupData(): Promise<void>;
  runQuery(): Promise<number>;
  cleanup(): Promise<void>;
}

class PrismaCreateOperations implements AbstractOperations {
  public readonly name: string = 'Prisma';
  protected authorId: string | null = null;

  async setupData(): Promise<void> {
    try {
      const author = await prisma.author.create({
        data: {
          name: 'Test Author',
          email: `test.author${Math.random()}@example.com`,
          bio: 'Bio for test author',
        },
      });
      this.authorId = author.id;
    } catch (error) {
      console.error('Error setting up Prisma data:', error);
      throw error;
    }
  }

  async runQuery(): Promise<number> {
    if (!this.authorId) {
      throw new Error('Author not initialized. Call setupData first.');
    }

    try {
      const start = performance.now();
      await prisma.post.create({
        data: {
          title: 'Test Post',
          content:
            'This is a test post with sufficient content to meet minimum requirements...',
          published: true,
          authorId: this.authorId,
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

class PrismaCreateManyOperations extends PrismaCreateOperations {
  public readonly name = 'Prisma (createMany)';

  async runQuery(): Promise<number> {
    const start = performance.now();
    await prisma.post.createMany({
      data: [
        {
          title: 'Test Post',
          content:
            'This is a test post with sufficient content to meet minimum requirements...',
          published: true,
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          authorId: this.authorId!,
        },
      ],
    });
    return performance.now() - start;
  }
}

class MongooseOperations implements AbstractOperations {
  public readonly name = 'Mongoose';
  private authorId: string | null = null;

  async setupData(): Promise<void> {
    try {
      await setupMongoose(process.env.MONGOOSE_MONGO_URL);
      const author = await Author.create({
        name: 'Test Author',
        email: 'test.author@example.com',
        bio: 'Bio for test author',
      });
      this.authorId = author._id.toString();
    } catch (error) {
      console.error('Error setting up Mongoose data:', error);
      throw error;
    }
  }

  async runQuery(): Promise<number> {
    if (!this.authorId) {
      throw new Error('Author not initialized. Call setupData first.');
    }

    try {
      const start = performance.now();
      await Post.create({
        title: 'Test Post',
        content:
          'This is a test post with sufficient content to meet minimum requirements...',
        published: true,
        author: this.authorId,
      });
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
  run([
    new PrismaCreateOperations(),
    new PrismaCreateManyOperations(),
    new MongooseOperations(),
  ]).catch(console.error);
}
