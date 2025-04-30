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

interface PaginationResult {
  items: BlogType[];
  nextCursor: string | null;
}

// Blog functions
export const createBlog = (blogData: Omit<BlogType, 'createdAt'>) =>
  Blog.create(blogData);

export const listBlogsWithCursor = async (
  cursor: string | null = null,
  limit = 2,
): Promise<PaginationResult> => {
  const query = cursor
    ? {
        createdAt: { $lt: new Date(cursor) },
      }
    : {};

  const items = await Blog.find(query)
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .select('-__v')
    .lean();

  const hasMore = items.length > limit;
  const paginatedItems = hasMore ? items.slice(0, -1) : items;

  return {
    items: paginatedItems,
    nextCursor: hasMore
      ? items[items.length - 2].createdAt.toISOString()
      : null,
  };
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
      await createBlog({
        title: `Blog Post ${i + 1}`,
        content: `This is the content for blog post ${i + 1}. It contains enough characters to meet the minimum requirement.`,
        tags: [`tag${i + 1}`, 'common'],
      });
      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(
      '\nCreated %d Blog Posts',
      (await listBlogsWithCursor(null, 10)).items.length,
    );

    // Demonstrate cursor-based pagination
    let currentCursor: string | null = null;
    let pageNum = 1;

    do {
      const { items, nextCursor } = await listBlogsWithCursor(currentCursor);
      console.log(`\nPage ${pageNum} (2 items per page):`);
      console.log(
        JSON.stringify(
          items.map((post) => post.title),
          null,
          2,
        ),
      );

      currentCursor = nextCursor;
      pageNum++;
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
