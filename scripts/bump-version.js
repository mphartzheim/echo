// bump-version.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJsonPath = path.join(__dirname, '..', 'package.json');

async function bumpVersion() {
  try {
    // Read the package.json file
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    const currentVersion = packageJson.version;
    
    // Parse version components
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    
    // Get arguments
    const args = process.argv.slice(2);
    const bumpType = args[0] || 'patch'; // Default to patch
    
    let newVersion;
    switch (bumpType) {
      case 'major':
        newVersion = `${major + 1}.0.0`;
        break;
      case 'minor':
        newVersion = `${major}.${minor + 1}.0`;
        break;
      case 'patch':
      default:
        newVersion = `${major}.${minor}.${patch + 1}`;
        break;
    }
    
    console.log(`Bumping version: ${currentVersion} → ${newVersion}`);
    
    // Update the version in package.json
    packageJson.version = newVersion;
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    
    console.log('✅ Version updated successfully!');
    console.log(`Run 'npm run changelog' to update the changelog.`);
    
    return newVersion;
  } catch (error) {
    console.error('Error bumping version:', error);
    process.exit(1);
  }
}

bumpVersion();