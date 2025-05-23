// This script uses the pg command-line tool to directly execute SQL commands
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create a temporary SQL file
const sqlFilePath = path.join(__dirname, 'temp-fix.sql');
const sqlContent = `
-- Add user 1 as owner of team 1
INSERT INTO team_members (team_id, user_id, role, is_owner)
VALUES (1, 1, 'Owner', true)
ON CONFLICT (team_id, user_id) DO UPDATE 
SET role = 'Owner', is_owner = true;

-- Verify the result
SELECT * FROM team_members WHERE team_id = 1;
`;

fs.writeFileSync(sqlFilePath, sqlContent);

// Use this info from your setup
const DB_USER = 'your_db_user';  // Replace with your DB username
const DB_NAME = 'your_db_name';  // Replace with your DB name
const DB_HOST = 'your_db_host';  // Replace with your DB host

// Execute the SQL file (you'll be prompted for a password)
const command = `psql -U ${DB_USER} -h ${DB_HOST} -d ${DB_NAME} -f ${sqlFilePath}`;

exec(command, (error, stdout, stderr) => {
  // Clean up the temporary file
  fs.unlinkSync(sqlFilePath);
  
  if (error) {
    return;
  }
  
  if (stderr) {
  }
  
  console.log('Team ownership fix complete!');
}); 