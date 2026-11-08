import 'dotenv/config';
import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();


const catalog: Record<string, [string, string, number][]> = {
  Shoes: [
    ['Classic Sneakers', 'Comfortable everyday sneakers', 2500000],
    ['Running Shoes', 'Lightweight shoes built for running', 3200000],
    ['Leather Loafers', 'Smooth leather slip-on loafers', 4000000],
    ['Canvas Slip-Ons', 'Easy casual canvas shoes', 1500000],
    ['Ankle Boots', 'Sturdy boots for any weather', 5500000],
    ['Cushioned Sandals', 'Soft sandals for everyday wear', 1200000],
  ],
  Phones: [
    ['Smartphone X Pro', '128GB storage, 6.5 inch display', 18000000],
    ['Smartphone Lite', 'Affordable phone with long battery life', 9500000],
    ['Wireless Earbuds', 'Bluetooth earbuds with charging case', 2800000],
    ['Shockproof Phone Case', 'Protective case for everyday drops', 350000],
    ['Fast Charger 30W', 'Quick charge wall adapter', 600000],
    ['Power Bank 20000mAh', 'Portable charger for long days', 1800000],
  ],
  Clothing: [
    ['Cotton T-Shirt', 'Soft 100% cotton t-shirt', 800000],
    ['Pullover Hoodie', 'Warm fleece hoodie', 1850000],
    ['Slim Fit Jeans', 'Stretch denim jeans', 2200000],
    ['Summer Dress', 'Light and breezy summer dress', 2600000],
    ['Jogger Pants', 'Comfortable joggers for any day', 1400000],
    ['Denim Jacket', 'Classic denim jacket', 3500000],
  ],
  Accessories: [
    ['Wrist Watch', 'Water-resistant analog watch', 4500000],
    ['Everyday Backpack', 'Spacious backpack with laptop pocket', 2200000],
    ['Sunglasses', 'UV protection sunglasses', 1000000],
    ['Leather Belt', 'Genuine leather belt', 900000],
    ['Baseball Cap', 'Adjustable cotton cap', 500000],
    ['Crossbody Bag', 'Compact bag for daily essentials', 2000000],
  ],
  Electronics: [
    ['Bluetooth Speaker', 'Portable speaker with deep bass', 3000000],
    ['Laptop Stand', 'Adjustable aluminium laptop stand', 1200000],
    ['Wireless Mouse', 'Quiet and precise wireless mouse', 800000],
    ['Mechanical Keyboard', 'Tactile keyboard with backlight', 3800000],
    ['Smart Watch', 'Fitness tracking and notifications', 6500000],
    ['HD Webcam', '1080p webcam for calls and streaming', 2400000],
  ],
  'Home & Kitchen': [
    ['Non-stick Frying Pan', 'Easy-clean 28cm frying pan', 1500000],
    ['Electric Kettle', 'Fast boiling 1.7 litre kettle', 1800000],
    ['Blender', 'Powerful blender for smoothies', 3200000],
    ['Bedsheet Set', 'Soft cotton bedsheet set', 2500000],
    ['Table Lamp', 'Warm light desk lamp', 1300000],
    ['Storage Basket Set', 'Set of three woven baskets', 1100000],
  ],
  'Books': [
    ['The Great Gatsby', 'F. Scott Fitzgerald', 1500000],
    ['To Kill a Mockingbird', 'Harper Lee', 1200000],
    ['1984', 'George Orwell', 1000000],
    ['Pride and Prejudice', 'Jane Austen', 800000],
    ['The Catcher in the Rye', 'J.D. Salinger', 600000],
    ['The Hobbit', 'J.R.R. Tolkien', 700000],
  ],
  'Movies': [
    ['The Godfather', 'Francis Ford Coppola', 1500000],
    ['The Dark Knight', 'Christopher Nolan', 1200000],
    ['The Lord of the Rings: The Return of the King', 'Peter Jackson', 1000000],
    ['The Matrix', 'The Wachowski Brothers', 800000],
    ['The Silence of the Lambs', 'Jonathan Demme', 600000],
  ],
  'Music': [
    ['The Beatles - The Beatles', 'The Beatles', 1500000],
    ['The Rolling Stones - The Rolling Stones', 'The Rolling Stones', 1200000],
    ['The Who - Who\'s Next', 'The Who', 1000000],
    ['Pink Floyd - The Dark Side of the Moon', 'Pink Floyd', 800000],
    ['Queen - A Night at the Opera', 'Queen', 600000],
  ],
  'Games': [
    ['The Witcher 3: Wild Hunt', 'CD Projekt Red', 1500000],
    ['The Last of Us', 'Naughty Dog', 1200000],
    ['The Elder Scrolls V: Skyrim', 'Bethesda Game Studios', 1000000],
    ['The Legend of Zelda: Breath of the Wild', 'Nintendo', 800000],
    ['The Sims 4', 'Electronic Arts', 600000],
  ],
  'Art': [
    ['The Starry Night', 'Vincent van Gogh', 1500000],
    ['The Scream', 'Edvard Munch', 1200000],
    ['The Persistence of Memory', 'Salvador Dali', 1000000],
    ['The Last Supper', 'Leonardo da Vinci', 800000],
    ['The Mona Lisa', 'Leonardo da Vinci', 600000],
  ],
};

async function main() {
  const categoryIds: Record<string, string> = {};

  for (const name of Object.keys(catalog)) {
    let category = await prisma.category.findUnique({ where: { name } });
    if (!category) {
      category = await prisma.category.create({ data: { name } });
      console.log(`Category created: ${name}`);
    }
    categoryIds[name] = category.id;
  }

 
  const existing = await prisma.product.findMany({ select: { name: true } });
  const existingNames = new Set(existing.map((product) => product.name));

  const newProducts: {
    name: string;
    description: string;
    price: number;
    stock: number;
    imageUrl: string;
    categoryId: string;
  }[] = [];

  for (const [categoryName, items] of Object.entries(catalog)) {
    for (const [name, description, price] of items) {
      if (existingNames.has(name)) {
        continue;
      }

      newProducts.push({
        name,
        description,
        price,
        stock: Math.floor(Math.random() * 50) + 10,
        imageUrl: `https://picsum.photos/seed/${encodeURIComponent(name)}/600/600`,
        categoryId: categoryIds[categoryName],
      });
    }
  }


  if (newProducts.length > 0) {
    await prisma.product.createMany({ data: newProducts });
  }

  console.log(`Products created: ${newProducts.length}`);
  console.log('Seeding finished');
}

main()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });