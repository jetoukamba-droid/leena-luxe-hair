const ADMIN_EMAIL = "tlinvestmentproperties@gmail.com";
const ADMIN_TEMPORARY_PASSWORD = "LeenaLuxe@2026!";
const USERS_KEY = "leena-luxe-users";
const SESSION_KEY = "leena-luxe-admin-session";

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const hashCredential = (value) => {
  let hash = 2166136261;
  const input = String(value);
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `llh_${(hash >>> 0).toString(16)}`;
};

const readUsers = (storage = window.localStorage) => {
  try {
    const users = JSON.parse(storage.getItem(USERS_KEY));
    return Array.isArray(users) ? users : [];
  } catch {
    return [];
  }
};

const writeUsers = (users, storage = window.localStorage) => {
  storage.setItem(USERS_KEY, JSON.stringify(users));
};

export const ensureDefaultAdminAccount = (storage = window.localStorage) => {
  const users = readUsers(storage);
  const adminEmail = normalizeEmail(ADMIN_EMAIL);
  const existingIndex = users.findIndex((user) => normalizeEmail(user.email) === adminEmail);
  const adminRecord = {
    id: "admin-leena-luxe-owner",
    email: adminEmail,
    role: "admin",
    permissions: ["*"],
    passwordHash: hashCredential(ADMIN_TEMPORARY_PASSWORD),
    createdBy: "system",
  };

  if (existingIndex >= 0) {
    const existing = users[existingIndex];
    users[existingIndex] = {
      ...existing,
      email: adminEmail,
      role: "admin",
      permissions: Array.isArray(existing.permissions) && existing.permissions.includes("*") ? existing.permissions : ["*"],
      passwordHash: existing.passwordHash || adminRecord.passwordHash,
    };
    writeUsers(users, storage);
    return users[existingIndex];
  }

  writeUsers([...users, adminRecord], storage);
  return adminRecord;
};

export const verifyAdminCredentials = (email, password, storage = window.localStorage) => {
  ensureDefaultAdminAccount(storage);
  const users = readUsers(storage);
  const user = users.find((item) => normalizeEmail(item.email) === normalizeEmail(email));
  const isValid = Boolean(
    user &&
      user.role === "admin" &&
      Array.isArray(user.permissions) &&
      user.permissions.includes("*") &&
      user.passwordHash === hashCredential(password)
  );

  if (!isValid) return null;

  const session = {
    userId: user.id,
    email: user.email,
    role: user.role,
    permissions: user.permissions,
    authenticatedAt: new Date().toISOString(),
  };
  storage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
};

export const getAdminSession = (storage = window.localStorage) => {
  try {
    return JSON.parse(storage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
};

export const clearAdminSession = (storage = window.localStorage) => {
  storage.removeItem(SESSION_KEY);
};