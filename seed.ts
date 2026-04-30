import 'dotenv/config';
import bcrypt from 'bcryptjs';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

async function seed() {
  console.log('Seeding...');

  // Create default user
  const hash = await bcrypt.hash('admin123', 10);
  await sql`
    INSERT INTO users (name, email, password)
    VALUES ('Amoora Admin', 'admin@amooracouture.com', ${hash})
    ON CONFLICT (email) DO NOTHING
  `;
  console.log('✅ User created: admin@amooracouture.com / admin123');

  // Create default settings
  await sql`
    INSERT INTO settings (id, name, address, phone, email, signer_name, default_notes)
    VALUES (
      '00000000-0000-0000-0000-000000000001',
      'Amoora Couture',
      'Jl. Kaliurang, Tambakan, Sinduharjo, Kec. Sleman, Kabupaten Sleman, DIY 55581',
      '0813-9201-3855',
      'hello@amooracouture.com',
      'Amoora Admin',
      'Pembayaran dapat ditransfer ke rekening BCA 1234567890 a.n Amoora Couture.'
    )
    ON CONFLICT (id) DO NOTHING
  `;
  console.log('✅ Settings created');

  await sql.end();
  console.log('Done!');
}

seed().catch(console.error);
