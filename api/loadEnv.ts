import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

// Load the repo-root `.env` file. When run via npm workspaces the cwd is the
// api/ or api-mobile/ package dir, so also check the parent directory.
const candidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '..', '.env'),
];
for (const file of candidates) {
  if (fs.existsSync(file)) {
    dotenv.config({ path: file });
    break;
  }
}
