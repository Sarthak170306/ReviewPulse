require('dotenv').config();
const pool = require('./config/db');

async function addCodeContentColumn() {
  console.log('--- Altering projects table to support code_content TEXT ---');
  
  const checkQuery = `
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'code_content';
  `;

  const alterQuery = 'ALTER TABLE projects ADD COLUMN code_content TEXT;';

  try {
    const checkRes = await pool.query(checkQuery);
    if (checkRes.rows.length > 0) {
      console.log('Column "code_content" already exists in table "projects".');
    } else {
      console.log('Adding column "code_content" to table "projects"...');
      await pool.query(alterQuery);
      console.log('Success: column "code_content" added.');
    }
  } catch (err) {
    console.error('Error during database update:', err.message);
  } finally {
    await pool.end();
  }
}

addCodeContentColumn();