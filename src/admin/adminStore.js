import { products as demoProducts } from "../data/products.js";

export const ADMIN_PRODUCTS_KEY = "leena-luxe-admin-products";
export const ADMIN_SETTINGS_KEY = "leena-luxe-settings";

const defaultSettings = {
  storeName: "Leena Luxe Hair",
  contactEmail: "hello@leenaluxehair.com",
  phone: "(404) 555-0198",
  whatsapp: "",
  announcement: "Luxury hair extensions that turn heads.",
  freeShippingAmount: 250,
};

export const placeholderOrders = [
  {
    orderNumber: "LLH-1001",
    customerName: "Maya Reed",
    email: "maya@example.com",
    items: "Brazilian Body Wave Bundle Set, Lace Melt Spray",
    status: "Processing",
    total: 243,
    date: "2026-07-01",
  },
  {
    orderNumber: "LLH-1002",
    customerName: "Danielle King",
    email: "danielle@example.com",
    items: "HD Lace Glueless Body Wave Wig",
    status: "Fulfilled",
    total: 389,
    date: "2026-06-29",
  },
  {
    orderNumber: "LLH-1003",
    customerName: "Ari Simone",
    email: "ari@example.com",
    items: "Raw Straight 6x6 Closure",
    status: "Pending",
    total: 142,
    date: "2026-06-27",
  },
];

export const placeholderCustomers = [
  { id: "CUS-001", name: "Maya Reed", email: "maya@example.com", orders: 2, totalSpent: 462, joined: "2026-05-18" },
  { id: "CUS-002", name: "Danielle King", email: "danielle@example.com", orders: 1, totalSpent: 389, joined: "2026-06-12" },
  { id: "CUS-003", name: "Ari Simone", email: "ari@example.com", orders: 3, totalSpent: 612, joined: "2026-04-30" },
];

const normalizeProduct = (product) => ({
  ...product,
  active: product.active !== false,
  inventoryQuantity:
    product.inventoryQuantity ?? (String(product.inventory || "").toLowerCase().includes("low") ? 3 : 24),
  photos: Array.isArray(product.photos) ? product.photos : [],
});

export const readAdminProducts = (storage = window.localStorage) => {
  try {
    const saved = JSON.parse(storage.getItem(ADMIN_PRODUCTS_KEY));
    if (Array.isArray(saved) && saved.length) return saved.map(normalizeProduct);
  } catch {
    // Seed from demo products below.
  }
  const seeded = demoProducts.map(normalizeProduct);
  storage.setItem(ADMIN_PRODUCTS_KEY, JSON.stringify(seeded));
  return seeded;
};

export const saveAdminProducts = (products, storage = window.localStorage) => {
  storage.setItem(ADMIN_PRODUCTS_KEY, JSON.stringify(products.map(normalizeProduct)));
};

export const readStoreSettings = (storage = window.localStorage) => {
  try {
    return { ...defaultSettings, ...JSON.parse(storage.getItem(ADMIN_SETTINGS_KEY)) };
  } catch {
    return defaultSettings;
  }
};

export const saveStoreSettings = (settings, storage = window.localStorage) => {
  const nextSettings = { ...defaultSettings, ...settings };
  storage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(nextSettings));
  return nextSettings;
};