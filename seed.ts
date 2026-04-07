import bcrypt from 'bcryptjs';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './src/db/schema';

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function seed() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  await db.insert(schema.users).values({
    name: 'Admin',
    email: 'admin@amooracouture.com',
    password: hashedPassword,
  }).onConflictDoNothing();

  // Create default settings
  await db.insert(schema.settings).values({
    id: 'default',
    name: 'Amoora Couture',
    address: 'Jl. Kaliurang, Tambakan, Sinduharjo, Kec. Sleman, Kabupaten Sleman, DIY 55581',
    phone: '0813-9201-3855',
    email: 'hello@amooracouture.com',
    signerName: 'Amoora Admin',
    defaultNotes: 'Pembayaran dapat ditransfer ke rekening BCA 1234567890 a.n Amoora Couture. Terima kasih atas kepercayaan Anda.',
  }).onConflictDoNothing();

  // Sample products
  const sampleProducts = [
    { name: 'Gamis Syari Premium', description: 'Gamis syari bahan premium, nyaman dipakai sehari-hari', price: 185000, unit: 'pcs' },
    { name: 'Hijab Instan', description: 'Hijab instan dengan bahan adem dan lembut', price: 45000, unit: 'pcs' },
    { name: 'Khimar Pet', description: 'Khimar pet antem, bahan ceruti babydoll', price: 65000, unit: 'pcs' },
    { name: 'Abaya Hitam', description: 'Abaya hitam simpel dan elegan', price: 250000, unit: 'pcs' },
  ];

  for (const p of sampleProducts) {
    await db.insert(schema.products).values(p).onConflictDoNothing();
  }

  console.log('✅ Seed completed!');
  await client.end();
}

seed().catch(console.error);
