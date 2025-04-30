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

interface PaginationResult {
  items: BlogType[];
  nextCursor: string | null;
  previousCursor: string | null;
  hasPrevious: boolean;
  hasNext: boolean;
}

export const listBlogsWithCursor = async (
  cursor: string | null = null,
  limit = 2,
): Promise<PaginationResult> => {
  // @ts-expect-error: paginate is added by the plugin
  const result = await Blog.paginate({
    query: {},
    limit,
    sortAscending: false,
    paginatedField: 'createdAt',
    sortField: '_id',
    next: cursor || undefined,
  });

  return {
    items: result.results as BlogType[],
    nextCursor: result.next || null,
    previousCursor: result.previous || null,
    hasPrevious: result.hasPrevious,
    hasNext: result.hasNext,
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

    do {
      const { items, nextCursor, hasNext } =
        await listBlogsWithCursor(currentCursor);
      console.log(`\nPage ${pageNum} (2 items per page):`);
      console.log(
        JSON.stringify(
          items.map((post) => ({
            title: post.title,
            createdAt: post.createdAt,
            _id: post._id,
          })),
          null,
          2,
        ),
      );

      currentCursor = nextCursor;
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
