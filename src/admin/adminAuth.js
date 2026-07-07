const ADMIN_EMAILS = ["tlinvestmentproperties@gmail.com", "leenaluxehair@gmail.com"];
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
  const adminRecords = ADMIN_EMAILS.map((email, index) => ({
    id: index === 0 ? "admin-leena-luxe-owner" : `admin-leena-luxe-${index + 1}`,
    email: normalizeEmail(email),
    role: "admin",
    permissions: ["*"],
    passwordHash: hashCredential(ADMIN_TEMPORARY_PASSWORD),
    createdBy: "system",
  }));

  adminRecords.forEach((adminRecord) => {
    const existingIndex = users.findIndex((user) => normalizeEmail(user.email) === adminRecord.email);

    if (existingIndex >= 0) {
      const existing = users[existingIndex];
      users[existingIndex] = {
        ...existing,
        email: adminRecord.email,
        role: "admin",
        permissions: Array.isArray(existing.permissions) && existing.permissions.includes("*") ? existing.permissions : ["*"],
        passwordHash: adminRecord.passwordHash,
      };
      return;
    }

    users.push(adminRecord);
  });

  writeUsers(users, storage);
  return adminRecords;
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
