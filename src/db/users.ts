import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string, fullName?: string, role?: 'patient' | 'doctor' | 'admin') {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        fullName: fullName || email.split('@')[0],
        role: role || 'patient',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error: any) {
    console.error('getOrCreateUser error:', error);
    // Sanitize error before bubbling
    throw new Error('Database operation failed for user record', { cause: error });
  }
}

export async function getUserByUid(uid: string) {
  try {
    const records = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return records[0] || null;
  } catch (error: any) {
    console.error('getUserByUid error:', error);
    throw new Error('Failed to retrieve user profile', { cause: error });
  }
}
