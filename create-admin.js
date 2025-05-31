import bcrypt from 'bcryptjs';
import { Pool, neonConfig } from '@neondatabase/serverless';
import speakeasy from 'speakeasy';
import ws from 'ws';

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

async function createAdmin() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Get admin details from command line arguments or use defaults
    const username = process.argv[2] || 'admin';
    const email = process.argv[3] || 'admin@capigrid.com';
    const password = process.argv[4] || 'SecureAdmin123!';

    console.log('Creating admin account...');
    console.log('Username:', username);
    console.log('Email:', email);

    // Hash the password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generate 2FA secret
    const twoFactorSecret = speakeasy.generateSecret({
      name: `CapiGrid Admin (${username})`,
      issuer: 'CapiGrid'
    }).base32;

    // Insert admin into database
    const query = `
      INSERT INTO admin_credentials (username, password_hash, email, two_factor_secret, is_active)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (username) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        email = EXCLUDED.email,
        two_factor_secret = EXCLUDED.two_factor_secret,
        updated_at = NOW()
      RETURNING id, username, email;
    `;

    const result = await pool.query(query, [username, passwordHash, email, twoFactorSecret, true]);
    
    console.log('\n✅ Admin account created successfully!');
    console.log('Admin ID:', result.rows[0].id);
    console.log('Username:', result.rows[0].username);
    console.log('Email:', result.rows[0].email);
    console.log('\n🔐 Login Credentials:');
    console.log('Username:', username);
    console.log('Password:', password);
    console.log('\n🔑 Two-Factor Authentication Secret:');
    console.log('Secret Key:', twoFactorSecret);
    console.log('\nTo set up 2FA:');
    console.log('1. Install Google Authenticator or similar app');
    console.log('2. Scan QR code or manually enter the secret key above');
    console.log('3. Use the 6-digit codes for login');
    console.log('\n🌐 Access the admin panel at: /admin/login');
    console.log('\n⚠️  IMPORTANT: Store these credentials securely!');

  } catch (error) {
    console.error('Error creating admin account:', error);
    if (error.code === '23505') {
      console.error('Admin with this username or email already exists.');
    }
  } finally {
    await pool.end();
  }
}

createAdmin();