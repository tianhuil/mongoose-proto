import { z } from 'zod';
import { extendZod, zodSchema } from '@zodyac/zod-mongoose';
import mongoose from 'mongoose';
import { mongoosePlugin } from 'mongo-cursor-pagination';

extendZod(z);

// Add pagination plugin to mongoose
mongoose.plugin(mongoosePlugin);

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
export type BlogType = z.infer<typeof ZBlog> & {
  _id: mongoose.Types.ObjectId;
};

// Demo/test code
const runPaginationDemo = async () => {
  try {
    // Connect to MongoDB
    const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/blog';
    await mongoose.connect(mongoUrl);
    console.log('Connected to MongoDB');

    // Create 10 blog posts with slight delays to ensure different timestamps
    for (let i = 0; i < 10; i++) {
      await Blog.create({
        title: `Blog Post ${i + 1}`,
        content: `This is the content for blog post ${i + 1}. It contains enough characters to meet the minimum requirement.`,
        tags: [`tag${i + 1}`, 'common'],
      });
      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log('\nCreated 10 Blog Posts');

    // Demonstrate cursor-based pagination
    let currentCursor: string | null = null;
    let pageNum = 1;
    const limit = 2;

    do {
      // @ts-expect-error: paginate is added by the plugin
      const { results, next, hasNext } = await Blog.paginate({
        query: {},
        limit,
        sortAscending: false,
        paginatedField: 'createdAt',
        sortField: '_id',
        next: currentCursor || undefined,
      });

      console.log(`\nPage ${pageNum} (${limit} items per page):`);
      console.log(
        JSON.stringify(
          results.map((post: BlogType) => ({
            title: post.title,
            createdAt: post.createdAt,
            _id: post._id,
          })),
          null,
          2,
        ),
      );

      currentCursor = next;
      pageNum++;
      if (!hasNext) break;
    } while (currentCursor !== null);

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
