import { z } from 'zod';
import { extendZod, zId, zodSchema } from '@zodyac/zod-mongoose';
import mongoose from 'mongoose';

extendZod(z);

// Schema Definitions
const ZAuthor = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  bio: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
});

const ZPost = z.object({
  title: z.string().min(3).max(255),
  content: z.string().min(10),
  author: zId('Author'),
  published: z.boolean().default(false),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Create Mongoose models
const authorSchema = zodSchema(ZAuthor);
const postSchema = zodSchema(ZPost);

export const Author = mongoose.model('Author', authorSchema);
export const Post = mongoose.model('Post', postSchema);

// Type definitions
export type AuthorType = z.infer<typeof ZAuthor>;
export type PostType = z.infer<typeof ZPost>;
export type PopulatedPostType = Omit<PostType, 'author'> & {
  author: AuthorType;
};

export const setupMongoose = async (
  mongoUrl = 'mongodb://localhost:27017/blog',
): Promise<void> => {
  await mongoose.connect(mongoUrl);

  await Promise.all([
    Post.collection.createIndex({ createdAt: -1 }),
    Post.collection.createIndex({ published: 1 }),
    Author.collection.createIndex({ email: 1 }, { unique: true }),
  ]);
};
