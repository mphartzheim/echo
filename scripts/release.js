// release.js
import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const packageJsonPath = path.join(rootDir, 'package.json');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to prompt for input
const prompt = (question) => new Promise((resolve) => rl.question(question, resolve));

// Helper function to run a command and return stdout
const run = (cmd, options = {}) => {
  console.log(`> ${cmd}`);
  return execSync(cmd, { encoding: 'utf-8', stdio: 'inherit', ...options });
};

async function release() {
  try {
    // Check for uncommitted changes
    try {
      execSync('git diff-index --quiet HEAD --', { stdio: 'ignore' });
    } catch (e) {
      console.error('❌ You have uncommitted changes. Please commit or stash them before releasing.');
      process.exit(1);
    }

    // Get current version
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    const currentVersion = packageJson.version;
    console.log(`Current version: ${currentVersion}`);

    // Ask for release type
    const releaseType = await prompt('Release type (patch/minor/major): ');
    if (!['patch', 'minor', 'major'].includes(releaseType)) {
      console.error('❌ Invalid release type. Must be patch, minor, or major.');
      process.exit(1);
    }

    // Bump version based on release type
    console.log(`\nBumping ${releaseType} version...`);
    run(`node scripts/bump-version.js ${releaseType}`);

    // Read updated version
    const updatedPackageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    const newVersion = updatedPackageJson.version;

    // Update changelog
    console.log('\nUpdating changelog...');
    run('npm run changelog');

    // Git operations
    console.log('\nCommitting changes...');
    run(`git add package.json CHANGELOG.md`);
    run(`git commit -m "chore: release v${newVersion}"`);
    
    console.log('\nCreating git tag...');
    run(`git tag -a v${newVersion} -m "Release v${newVersion}"`);

    // Build the application for all platforms
    console.log('\nBuilding application...');
    const buildTarget = await prompt('Build for which platforms? (all/win/linux): ');
    
    switch (buildTarget.toLowerCase()) {
      case 'all':
        run('npm run build:all');
        break;
      case 'win':
        run('npm run build:win');
        break;
      case 'linux':
        run('npm run build:linux');
        break;
      default:
        console.log('Invalid option, building for all platforms');
        run('npm run build:all');
    }

    // Push changes and tags
    const shouldPush = await prompt('\nPush changes and tags to remote? (y/n): ');
    if (shouldPush.toLowerCase() === 'y') {
      console.log('\nPushing changes and tags...');
      run('git push');
      run('git push --tags');
      
      console.log(`\n✅ Release v${newVersion} completed successfully!`);
      console.log(`Build artifacts are available in the dist/ directory.`);
    } else {
      console.log(`\n✅ Release v${newVersion} completed locally.`);
      console.log('Remember to push your changes when ready:');
      console.log('  git push && git push --tags');
      console.log(`Build artifacts are available in the dist/ directory.`);
    }
    
  } catch (error) {
    console.error('Error during release process:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

release();