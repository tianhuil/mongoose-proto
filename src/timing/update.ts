import { prisma } from '@/lib/prisma';
import { Author, Post } from './lib/mongoose';
import mongoose from 'mongoose';
import { setupMongoose } from './lib/mongoose';
import { run } from './lib/run';
import type { AbstractOperations } from './lib/base';

class PrismaUpdateOperations implements AbstractOperations {
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
      await prisma.author.update({
        where: {
          id: this.authorId,
        },
        data: {
          bio: `Updated bio ${Math.random()}`,
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
      await prisma.author.deleteMany();
      await prisma.$disconnect();
    } catch (error) {
      console.error('Error cleaning up Prisma data:', error);
      throw error;
    }
  }
}

class PrismaUpdateManyOperations extends PrismaUpdateOperations {
  public readonly name = 'Prisma (updateMany)';

  async runQuery(): Promise<number> {
    if (!this.authorId) {
      throw new Error('Author not initialized. Call setupData first.');
    }

    try {
      const start = performance.now();
      await prisma.author.updateMany({
        where: {
          id: this.authorId,
        },
        data: {
          bio: `Updated bio ${Math.random()}`,
        },
      });
      return performance.now() - start;
    } catch (error) {
      console.error('Error in Prisma query:', error);
      throw error;
    }
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
        email: `test.author${Math.random()}@example.com`,
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
      await Author.updateOne(
        { _id: this.authorId },
        { bio: `Updated bio ${Math.random()}` },
      );
      return performance.now() - start;
    } catch (error) {
      console.error('Error in Mongoose query:', error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    try {
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
    new PrismaUpdateOperations(),
    new PrismaUpdateManyOperations(),
    new MongooseOperations(),
  ]).catch(console.error);
}
