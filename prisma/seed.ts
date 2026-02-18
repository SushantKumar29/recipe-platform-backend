import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seeding...');

  console.log('Clearing existing data...');
  await prisma.comment.deleteMany({});
  await prisma.rating.deleteMany({});
  await prisma.recipe.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('✅ Existing data cleared');

  console.log('Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: 'John Doe',
        email: 'john@example.com',
        password: hashedPassword,
        image: 'https://randomuser.me/api/portraits/men/1.jpg',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: hashedPassword,
        image: 'https://randomuser.me/api/portraits/women/1.jpg',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Mike Johnson',
        email: 'mike@example.com',
        password: hashedPassword,
        image: 'https://randomuser.me/api/portraits/men/2.jpg',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Sarah Wilson',
        email: 'sarah@example.com',
        password: hashedPassword,
        image: 'https://randomuser.me/api/portraits/women/2.jpg',
      },
    }),
    prisma.user.create({
      data: {
        name: 'David Brown',
        email: 'david@example.com',
        password: hashedPassword,
        image: 'https://randomuser.me/api/portraits/men/3.jpg',
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  console.log('Creating recipes...');

  const recipes = await Promise.all([
    prisma.recipe.create({
      data: {
        title: 'Classic Margherita Pizza',
        ingredients: [
          'Pizza dough',
          'Tomato sauce',
          'Fresh mozzarella',
          'Fresh basil leaves',
          'Olive oil',
          'Salt',
        ],
        steps: [
          'Preheat oven to 450°F (230°C)',
          'Roll out the pizza dough',
          'Spread tomato sauce evenly',
          'Add sliced mozzarella',
          'Bake for 12-15 minutes',
          'Top with fresh basil and olive oil',
        ],
        preparationTime: 30,
        imageUrl: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca',
        imagePublicId: 'recipes/margherita-pizza',
        authorId: users[0].id,
        isPublished: true,
      },
    }),
    prisma.recipe.create({
      data: {
        title: 'Chocolate Chip Cookies',
        ingredients: [
          '2 1/4 cups all-purpose flour',
          '1 tsp baking soda',
          '1 tsp salt',
          '1 cup butter',
          '3/4 cup sugar',
          '3/4 cup brown sugar',
          '2 eggs',
          '2 cups chocolate chips',
        ],
        steps: [
          'Preheat oven to 375°F',
          'Mix dry ingredients',
          'Cream butter and sugars',
          'Add eggs and vanilla',
          'Combine with dry ingredients',
          'Fold in chocolate chips',
          'Bake for 10-12 minutes',
        ],
        preparationTime: 45,
        imageUrl: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e',
        imagePublicId: 'recipes/chocolate-cookies',
        authorId: users[0].id,
        isPublished: true,
      },
    }),

    prisma.recipe.create({
      data: {
        title: 'Creamy Garlic Pasta',
        ingredients: [
          'Pasta',
          'Olive oil',
          'Garlic cloves',
          'Heavy cream',
          'Parmesan cheese',
          'Parsley',
          'Salt and pepper',
        ],
        steps: [
          'Cook pasta according to package',
          'Sauté minced garlic in olive oil',
          'Add heavy cream and simmer',
          'Stir in parmesan cheese',
          'Combine with pasta',
          'Garnish with parsley',
        ],
        preparationTime: 25,
        imageUrl: 'https://images.unsplash.com/photo-1645112411342-4665a10d3e8c',
        imagePublicId: 'recipes/garlic-pasta',
        authorId: users[1].id,
        isPublished: true,
      },
    }),
    prisma.recipe.create({
      data: {
        title: 'Beef Stir Fry',
        ingredients: [
          'Beef sirloin',
          'Broccoli',
          'Carrots',
          'Bell peppers',
          'Soy sauce',
          'Ginger',
          'Garlic',
          'Sesame oil',
        ],
        steps: [
          'Slice beef thinly',
          'Marinate in soy sauce and ginger',
          'Stir fry vegetables',
          'Add beef and cook',
          'Combine all ingredients',
          'Serve hot',
        ],
        preparationTime: 35,
        imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19',
        imagePublicId: 'recipes/beef-stirfry',
        authorId: users[1].id,
        isPublished: true,
      },
    }),

    prisma.recipe.create({
      data: {
        title: 'Vegetable Curry',
        ingredients: [
          'Coconut milk',
          'Curry paste',
          'Potatoes',
          'Carrots',
          'Onion',
          'Bell peppers',
          'Peas',
          'Rice',
        ],
        steps: [
          'Sauté onions and curry paste',
          'Add coconut milk',
          'Add vegetables and simmer',
          'Cook until vegetables are tender',
          'Serve with rice',
        ],
        preparationTime: 50,
        imageUrl: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd',
        imagePublicId: 'recipes/veg-curry',
        authorId: users[2].id,
        isPublished: true,
      },
    }),
    prisma.recipe.create({
      data: {
        title: 'Caesar Salad',
        ingredients: [
          'Romaine lettuce',
          'Chicken breast',
          'Croutons',
          'Parmesan cheese',
          'Caesar dressing',
        ],
        steps: [
          'Grill chicken and slice',
          'Chop romaine lettuce',
          'Toss with dressing',
          'Top with chicken and croutons',
          'Sprinkle with parmesan',
        ],
        preparationTime: 20,
        imageUrl: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9',
        imagePublicId: 'recipes/caesar-salad',
        authorId: users[2].id,
        isPublished: true,
      },
    }),

    prisma.recipe.create({
      data: {
        title: 'Blueberry Pancakes',
        ingredients: [
          'Flour',
          'Baking powder',
          'Sugar',
          'Salt',
          'Eggs',
          'Milk',
          'Butter',
          'Blueberries',
        ],
        steps: [
          'Mix dry ingredients',
          'Add wet ingredients and mix',
          'Fold in blueberries',
          'Cook on griddle until golden',
          'Serve with maple syrup',
        ],
        preparationTime: 20,
        imageUrl: 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759',
        imagePublicId: 'recipes/pancakes',
        authorId: users[3].id,
        isPublished: true,
      },
    }),
    prisma.recipe.create({
      data: {
        title: 'Mushroom Risotto',
        ingredients: [
          'Arborio rice',
          'Mushrooms',
          'Onion',
          'White wine',
          'Vegetable broth',
          'Parmesan',
          'Butter',
        ],
        steps: [
          'Sauté onions and mushrooms',
          'Add rice and toast',
          'Add wine and reduce',
          'Add broth gradually',
          'Stir until creamy',
          'Add parmesan and butter',
        ],
        preparationTime: 60,
        imageUrl: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371',
        imagePublicId: 'recipes/risotto',
        authorId: users[3].id,
        isPublished: true,
      },
    }),

    prisma.recipe.create({
      data: {
        title: 'Grilled Salmon',
        ingredients: ['Salmon fillets', 'Lemon', 'Dill', 'Garlic', 'Olive oil', 'Salt and pepper'],
        steps: [
          'Marinate salmon with herbs',
          'Preheat grill',
          'Grill 4-5 minutes per side',
          'Serve with lemon wedges',
        ],
        preparationTime: 25,
        imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2',
        imagePublicId: 'recipes/grilled-salmon',
        authorId: users[4].id,
        isPublished: true,
      },
    }),
    prisma.recipe.create({
      data: {
        title: 'Tiramisu',
        ingredients: ['Ladyfingers', 'Espresso', 'Mascarpone', 'Eggs', 'Sugar', 'Cocoa powder'],
        steps: [
          'Make coffee and let cool',
          'Whisk egg yolks with sugar',
          'Add mascarpone',
          'Dip ladyfingers in coffee',
          'Layer and chill',
          'Dust with cocoa',
        ],
        preparationTime: 180,
        imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9',
        imagePublicId: 'recipes/tiramisu',
        authorId: users[4].id,
        isPublished: true,
      },
    }),
  ]);

  console.log(`✅ Created ${recipes.length} recipes`);

  console.log('Creating ratings...');
  const ratings = [];
  const usedUserPairs = new Set();

  for (let i = 0; i < recipes.length; i++) {
    const recipe = recipes[i];
    const numRatings = Math.floor(Math.random() * 3) + 2;
    let ratingsAdded = 0;
    let attempts = 0;
    const maxAttempts = 20;

    while (ratingsAdded < numRatings && attempts < maxAttempts) {
      attempts++;

      let userIndex;
      do {
        userIndex = Math.floor(Math.random() * users.length);
      } while (users[userIndex].id === recipe.authorId);

      const userRecipeKey = `${users[userIndex].id}-${recipe.id}`;

      if (usedUserPairs.has(userRecipeKey)) {
        continue;
      }

      usedUserPairs.add(userRecipeKey);

      const rating = await prisma.rating.create({
        data: {
          value: Math.floor(Math.random() * 3) + 3,
          authorId: users[userIndex].id,
          recipeId: recipe.id,
        },
      });
      ratings.push(rating);
      ratingsAdded++;
    }
  }

  console.log(`✅ Created ${ratings.length} ratings`);

  console.log('Creating comments...');
  const comments = [];

  const commentTemplates = [
    'This recipe is amazing!',
    'I made this for dinner and everyone loved it.',
    'Easy to follow instructions.',
    'Will definitely make this again.',
    'Added my own twist, turned out great!',
    'Perfect for beginners.',
    'My family requests this all the time.',
    'So delicious and flavorful.',
    'Quick and easy weeknight meal.',
    'Better than restaurant quality!',
    'The instructions were perfect.',
    'I added extra garlic, highly recommend!',
  ];

  for (let i = 0; i < recipes.length; i++) {
    const recipe = recipes[i];

    const numComments = Math.floor(Math.random() * 3) + 1;

    for (let j = 0; j < numComments; j++) {
      const userIndex = Math.floor(Math.random() * users.length);
      const commentIndex = Math.floor(Math.random() * commentTemplates.length);

      const comment = await prisma.comment.create({
        data: {
          content: commentTemplates[commentIndex],
          authorId: users[userIndex].id,
          recipeId: recipe.id,
        },
      });
      comments.push(comment);
    }
  }

  console.log(`✅ Created ${comments.length} comments`);

  console.log('\n📊 Seeding Summary:');
  console.log(`- Users: ${users.length}`);
  console.log(`- Recipes: ${recipes.length}`);
  console.log(`- Ratings: ${ratings.length}`);
  console.log(`- Comments: ${comments.length}`);
  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
