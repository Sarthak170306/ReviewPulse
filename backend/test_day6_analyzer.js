async function runAnalyzerTests() {
  console.log('--- Starting Static Analyzer & Transaction Integration Tests ---');
  
  const userId = 'analyzer_user_test_1';
  const email = 'analyzer_test_1@codepulse.ai';

  // 1. Sync User
  console.log('\n[Step 1] Syncing test user...');
  const syncRes = await fetch('http://localhost:5000/api/users/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: userId, name: 'Analyzer Tester', email: email })
  });
  const syncData = await syncRes.json();
  console.log('Sync Status:', syncRes.status, 'User Credits:', syncData.user.credits);

  // 2. Submit Project with code violations
  console.log('\n[Step 2] Submitting project with code violations for analysis...');
  const projectRes = await fetch('http://localhost:5000/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      project_name: 'Auth Security Check',
      code_content: `
        // Test Code Snippet
        var db_password = "supersecret_password_123";
        
        function handleAuth() {
          console.log("Starting authentication process...");
          try {
            // perform logic
          } catch (e) {
            // empty catch
          }
        }
      `,
      language: 'javascript'
    })
  });

  const projectData = await projectRes.json();
  console.log('Project Status:', projectRes.status);
  console.log('Project Response:', JSON.stringify(projectData, null, 2));

  // 3. Verify user credits decremented
  console.log('\n[Step 3] Querying user profile to verify credit deduction...');
  const profileRes = await fetch(`http://localhost:5000/api/users/profile/${userId}`);
  const profileData = await profileRes.json();
  console.log('Profile Status:', profileRes.status, 'New Credits:', profileData.user.credits);
}

runAnalyzerTests();
