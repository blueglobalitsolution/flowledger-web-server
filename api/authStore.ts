import { DatabaseSync } from 'node:sqlite';
import { dirname, join, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';
import type { AuthUser, UserRole } from '@shared/types';

const moduleDir = dirname(resolve(process.argv[1] ?? '.'));
const dataDir = join(moduleDir, '..', 'data');
mkdirSync(dataDir, { recursive: true });

class AuthStore {
  private db: DatabaseSync;

  constructor() {
    this.db = new DatabaseSync(join(dataDir, 'auth.db'));
    this.init();
  }

  private init() {
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      
      CREATE TABLE IF NOT EXISTS users (
        email TEXT PRIMARY KEY,
        id TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        tenantName TEXT NOT NULL,
        twoFactorEnabled INTEGER NOT NULL,
        biometricRegistered INTEGER NOT NULL,
        plan TEXT NOT NULL
      );
    `);

    // Seed default admin account if table is empty
    const countRow = this.db.prepare(`SELECT COUNT(*) as count FROM users`).get() as { count: number };
    if (countRow.count === 0) {
      this.createUser({
        email: 'mehul@flowledger.app',
        id: 'usr-001',
        name: 'Mehul Solanki',
        role: 'superadmin',
        tenantName: 'FlowLedger SaaS Infrastructure',
        twoFactorEnabled: true,
        biometricRegistered: true,
        plan: 'Super Admin Root Access'
      });
      console.log('[AUTH DB] Seeded default superadmin account.');
    }
  }

  public getUserByEmail(email: string): AuthUser | null {
    const row = this.db.prepare(`SELECT * FROM users WHERE email = ?`).get(email.toLowerCase()) as any;
    if (!row) return null;

    return {
      email: row.email,
      id: row.id,
      name: row.name,
      role: row.role as UserRole,
      tenantName: row.tenantName,
      twoFactorEnabled: row.twoFactorEnabled === 1,
      biometricRegistered: row.biometricRegistered === 1,
      plan: row.plan
    };
  }

  public createUser(user: AuthUser): void {
    const stmt = this.db.prepare(`
      INSERT INTO users (email, id, name, role, tenantName, twoFactorEnabled, biometricRegistered, plan)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      user.email.toLowerCase(),
      user.id,
      user.name,
      user.role,
      user.tenantName,
      user.twoFactorEnabled ? 1 : 0,
      user.biometricRegistered ? 1 : 0,
      user.plan
    );
  }
}

// Export a singleton instance
export const authStore = new AuthStore();
