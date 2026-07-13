const pool = require('./config/db');

async function alterCredits() {
  console.log('--- Altering User Credits default values to 150 ---');
  
  const alterQuery = 'ALTER TABLE users ALTER COLUMN credits SET DEFAULT 150;';
  const updateQuery = 'UPDATE users SET credits = 150;';

  try {
    console.log('[1/2] Altering credits default constraint in table "users"...');
    await pool.query(alterQuery);
    console.log('Success: Default constraint updated.');

    console.log('[2/2] Updating existing user records to 150 credits...');
    const res = await pool.query(updateQuery);
    console.log(`Success: Updated ${res.rowCount} user rows.`);
  } catch (err) {
    console.error('Error during database update:', err.message);
  } finally {
    await pool.end();
  }
}

alterCredits();
