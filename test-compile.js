const { execSync } = require('child_process');
try {
  execSync('npm run lint', { stdio: 'pipe' });
  console.log("Lint passed");
} catch (e) {
  console.log("Lint failed:\n", e.stdout.toString());
}
