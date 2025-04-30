import { z } from 'zod';
import { extendZod, zodSchema } from '@zodyac/zod-mongoose';
import mongoose from 'mongoose';

extendZod(z);

// Schema Definition
const ZBlog = z.object({
  title: z.string().min(3).max(255),
  content: z.string().min(10),
  tags: z.array(z.string()).default([]),
  createdAt: z.date().default(() => new Date()),
});

// Create Mongoose model
const blogSchema = zodSchema(ZBlog);
export const Blog = mongoose.model('Blog', blogSchema);

// Type definition
export type BlogType = z.infer<typeof ZBlog>;

// Blog functions
export const createBlog = (blogData: Omit<BlogType, 'createdAt'>) =>
  Blog.create(blogData);

export const listBlogsWithPagination = (page: number, limit = 2) =>
  Blog.find()
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .select('-__v');

// Demo/test code
const runPaginationDemo = async () => {
  try {
    // Connect to MongoDB
    const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/blog';
    await mongoose.connect(mongoUrl);
    console.log('Connected to MongoDB');

    // Create 10 blog posts
    const blogPosts = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        createBlog({
          title: `Blog Post ${i + 1}`,
          content: `This is the content for blog post ${i + 1}. It contains enough characters to meet the minimum requirement.`,
          tags: [`tag${i + 1}`, 'common'],
        }),
      ),
    );
    console.log('\nCreated 10 Blog Posts');

    // Demonstrate pagination
    for (let page = 1; page <= 5; page++) {
      const paginatedPosts = await listBlogsWithPagination(page, 2);
      console.log(`\nPage ${page} (2 items per page):`);
      console.log(
        JSON.stringify(
          paginatedPosts.map((post) => post.title),
          null,
          2,
        ),
      );
    }

    // Clean up collection
    await Blog.deleteMany({});
    console.log('\nCleared blog collection');
  } catch (error) {
    console.error('Error in pagination demo:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

// Run the demo if this file is being executed directly
if (require.main === module) {
  runPaginationDemo().catch(console.error);
}
