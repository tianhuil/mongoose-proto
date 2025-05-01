import { prisma } from './lib/prisma';

const runPrismaDemo = async () => {
  try {
    // Create an author
    const author = await prisma.author.create({
      data: {
        name: 'Jane Doe',
        email: 'jane@example.com',
        bio: 'Full-stack developer and tech writer',
      },
    });
    console.log('\nCreated Author:', author);

    // Create posts for the author
    const posts = await prisma.post.createMany({
      data: [
        {
          title: 'Getting Started with TypeScript',
          content:
            'TypeScript is a powerful superset of JavaScript that adds static typing...',
          published: true,
          authorId: author.id,
        },
        {
          title: 'Functional Programming Basics',
          content:
            'Learn about immutability, pure functions, and functional programming patterns...',
          published: true,
          authorId: author.id,
        },
        {
          title: 'Draft: Advanced TypeScript',
          content:
            'Deep dive into TypeScript generics, conditional types, and more...',
          published: false,
          authorId: author.id,
        },
      ],
    });
    console.log('\nCreated Posts:', posts);

    // Query posts with author details
    const allPosts = await prisma.post.findMany({
      include: {
        author: {
          select: {
            name: true,
            email: true,
            bio: true,
          },
        },
      },
    });
    console.log('\nAll Posts with Author Details:');
    console.log(JSON.stringify(allPosts, null, 2));

    // Count published posts
    const publishedCount = await prisma.post.count({
      where: {
        published: true,
      },
    });
    console.log('\nPublished Posts Count:', publishedCount);

    // Demonstrate pagination
    const page = 1;
    const limit = 2;
    const skip = (page - 1) * limit;

    const paginatedPosts = await prisma.post.findMany({
      take: limit,
      skip,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        author: {
          select: {
            name: true,
          },
        },
      },
    });
    console.log('\nPaginated Posts (Page 1):');
    console.log(JSON.stringify(paginatedPosts, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Clean up
    await prisma.post.deleteMany();
    await prisma.author.deleteMany();
    console.log('\nCleared all data');

    // Disconnect Prisma client
    await prisma.$disconnect();
  }
};

// Run the demo if this file is being executed directly
if (require.main === module) {
  runPrismaDemo().catch(console.error);
}
