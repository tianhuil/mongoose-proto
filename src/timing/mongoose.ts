import { z } from 'zod';
import { extendZod, zId, zodSchema } from '@zodyac/zod-mongoose';
import mongoose from 'mongoose';

extendZod(z);

// Schema Definitions
const ZAuthor = z.object({
  name: z.string(),
  email: z.string().email(),
  bio: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
});

const ZPost = z.object({
  title: z.string(),
  content: z.string(),
  author: zId('Author'),
  published: z.boolean().default(false),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Create Mongoose models
const authorSchema = zodSchema(ZAuthor);
const postSchema = zodSchema(ZPost);

// Add virtual posts field to Author
authorSchema.virtual('posts', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'author',
});

export const Author = mongoose.model('Author', authorSchema);
export const Post = mongoose.model('Post', postSchema);

// Type definitions
export type AuthorType = z.infer<typeof ZAuthor> & {
  posts?: PostType[];
};
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
