import { z } from 'zod';
import { extendZod, zodSchema } from '@zodyac/zod-mongoose';
import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

extendZod(z);

// Schema Definition
const ZBlog = z.object({
  title: z.string().min(3).max(255),
  content: z.string().min(10),
  tags: z.array(z.string()).default([]),
  createdAt: z.date().default(() => new Date()),
});

// Type definition
export type BlogType = z.infer<typeof ZBlog> & {
  _id: mongoose.Types.ObjectId;
};

// Create Mongoose model
const blogSchema = zodSchema(ZBlog);
blogSchema.plugin(mongoosePaginate);

export const BlogModel = mongoose.model<
  z.infer<typeof ZBlog>,
  mongoose.PaginateModel<z.infer<typeof ZBlog>>
>('Blog', blogSchema);

// Demo/test code
const runPaginationDemo = async () => {
  try {
    // Connect to MongoDB
    const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/blog';
    await mongoose.connect(mongoUrl);
    console.log('Connected to MongoDB');

    // Create 10 blog posts with slight delays to ensure different timestamps
    for (let i = 0; i < 10; i++) {
      await BlogModel.create({
        title: `Blog Post ${i + 1}`,
        content: `This is the content for blog post ${i + 1}. It contains enough characters to meet the minimum requirement.`,
        tags: [`tag${i + 1}`, 'common'],
      });
      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log('\nCreated 10 Blog Posts');

    // Demonstrate pagination
    const limit = 2;
    let page = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      const options = {
        page,
        limit,
        sort: { createdAt: -1, _id: 1 },
        select: 'title createdAt _id',
        lean: true,
      };

      const result = await BlogModel.paginate({}, options);

      console.log(`\nPage ${page} (${limit} items per page):`);
      console.log(JSON.stringify(result.docs, null, 2));

      hasNextPage = result.hasNextPage;
      page++;
    }

    // Clean up collection
    await BlogModel.deleteMany({});
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
