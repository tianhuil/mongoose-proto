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

// Type definitions for our models
export type AuthorType = z.infer<typeof ZAuthor>;
export type PostType = z.infer<typeof ZPost>;
export type PopulatedPostType = Omit<PostType, 'author'> & {
  author: AuthorType;
};

// Author functions
export const createAuthor = (authorData: Omit<AuthorType, 'createdAt'>) =>
  Author.create(authorData);

// Post functions
export const createPost = (
  postData: Omit<PostType, 'createdAt' | 'updatedAt'>,
) => Post.create({ ...postData, updatedAt: new Date() });

export const updatePost = (
  postId: string,
  updateData: Partial<Omit<PostType, 'author' | 'createdAt'>>,
) =>
  Post.findByIdAndUpdate(
    postId,
    { ...updateData, updatedAt: new Date() },
    { new: true },
  ).populate({ path: 'author', select: '-__v' });

export const getPost = (postId: string) =>
  Post.findById(postId).populate({ path: 'author', select: '-__v' });

export const listPosts = (filter: Partial<PostType> = {}) =>
  Post.find(filter)
    .sort({ createdAt: -1 })
    .populate({ path: 'author', select: '-__v' })
    .select('-__v');

// Demo/test code
const runDemo = async () => {
  try {
    // Connect to MongoDB
    const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/blog';
    await mongoose.connect(mongoUrl);
    console.log('Connected to MongoDB');

    // Create an author
    const author = await createAuthor({
      name: 'Jane Doe',
      email: 'jane@example.com',
      bio: 'Full-stack developer and tech writer',
    });
    console.log('\nCreated Author:', author);

    // Create three posts
    const posts = await Promise.all([
      createPost({
        title: 'Getting Started with TypeScript',
        content:
          'TypeScript is a powerful superset of JavaScript that adds static typing...',
        author: author._id,
        published: true,
      }),
      createPost({
        title: 'Functional Programming Basics',
        content:
          'Learn about immutability, pure functions, and functional programming patterns...',
        author: author._id,
        published: true,
      }),
      createPost({
        title: 'Draft: Advanced TypeScript',
        content:
          'Deep dive into TypeScript generics, conditional types, and more...',
        author: author._id,
        published: false,
      }),
    ]);
    console.log('\nCreated Posts:', posts);

    // List all posts with author details
    const allPosts = await listPosts();
    console.log('\nAll Posts with Author Details:');
    console.log(JSON.stringify(allPosts, null, 2));

    // List only published posts
    const publishedPosts = await listPosts({ published: true });
    console.log('\nPublished Posts Count:', publishedPosts.length);

    // Clean up collections
    await Promise.all([Author.deleteMany({}), Post.deleteMany({})]);
    console.log('\nCleared all collections');
  } catch (error) {
    console.error('Error in demo:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

// Run the demo if this file is being executed directly
if (require.main === module) {
  runDemo().catch(console.error);
}
