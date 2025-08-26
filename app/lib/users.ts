import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

export type StoredUser = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
};

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

async function ensureUsersFile() {
  try {
    await fs.mkdir(path.dirname(USERS_FILE), { recursive: true });
    await fs.access(USERS_FILE);
  } catch {
    await fs.writeFile(USERS_FILE, JSON.stringify([]), 'utf8');
  }
}

export async function readUsers(): Promise<StoredUser[]> {
  await ensureUsersFile();
  const text = await fs.readFile(USERS_FILE, 'utf8');
  try {
    const users = JSON.parse(text);
    return Array.isArray(users) ? users : [];
  } catch {
    return [];
  }
}

export async function writeUsers(users: StoredUser[]) {
  await ensureUsersFile();
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

export async function findUserByEmail(email: string): Promise<StoredUser | undefined> {
  const users = await readUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export async function createUser(name: string, email: string, password: string): Promise<StoredUser> {
  const users = await readUsers();
  const exists = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) throw new Error('Email already registered');

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = await scryptAsync(password, salt, 64);

  const user: StoredUser = {
    id: crypto.randomUUID(),
    email,
    name,
    passwordHash,
    salt,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  await writeUsers(users);
  return user;
}

export async function verifyPassword(user: StoredUser, password: string): Promise<boolean> {
  const hash = await scryptAsync(password, user.salt, 64);
  return timingSafeEqual(hash, user.passwordHash);
}

function scryptAsync(password: string, salt: string, keylen: number): Promise<string> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keylen, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(derivedKey.toString('hex'));
    });
  });
}

function timingSafeEqual(aHex: string, bHex: string) {
  const a = Buffer.from(aHex, 'hex');
  const b = Buffer.from(bHex, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
