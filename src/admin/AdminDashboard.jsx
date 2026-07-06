import React, { useMemo, useState } from "react";
import { categories, textures } from "../data/products.js";
import { formatPrice } from "../cart/cartUtils.js";
import { clearAdminSession } from "./adminAuth.js";
import {
  placeholderCustomers,
  placeholderOrders,
  readStoreSettings,
  saveAdminProducts,
  saveStoreSettings,
} from "./adminStore.js";

const emptyProduct = {
  id: "",
  name: "",
  category: "Bundles",
  price: 0,
  salePrice: "",
  texture: "Body Wave",
  lengths: [18, 20, 22],
  description: "",
  inventoryQuantity: 10,
  inventory: "In stock",
  badge: "New",
  active: true,
  imageTone: "champagne",
  photos: [],
};

const slugify = (value) =>
  String(value || "product")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || `product-${Date.now()}`;

const toProductForm = (product = emptyProduct) => ({
  ...emptyProduct,
  ...product,
  salePrice: product.salePrice ?? "",
  lengthsText: Array.isArray(product.lengths) ? product.lengths.join(", ") : String(product.lengths || ""),
  active: product.active !== false,
  photos: Array.isArray(product.photos) ? product.photos : [],
});

const readFilesAsDataUrls = (files) =>
  Promise.all(
    Array.from(files).map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
    )
  );

function AdminDashboard({ products, onProductsChange, navigate }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [editingId, setEditingId] = useState(null);
  const [productForm, setProductForm] = useState(toProductForm());
  const [settings, setSettings] = useState(() => readStoreSettings());
  const [notice, setNotice] = useState("");

  const activeProducts = products.filter((product) => product.active !== false);
  const lowStockProducts = products.filter((product) => Number(product.inventoryQuantity || 0) <= 5);
  const totalRevenue = placeholderOrders.reduce((sum, order) => sum + order.total, 0);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === editingId),
    [editingId, products]
  );

  const saveProduct = (event) => {
    event.preventDefault();
    const nextProduct = {
      ...productForm,
      id: editingId || slugify(productForm.name),
      price: Number(productForm.price) || 0,
      salePrice: productForm.salePrice === "" ? undefined : Number(productForm.salePrice),
      inventoryQuantity: Number(productForm.inventoryQuantity) || 0,
      inventory: Number(productForm.inventoryQuantity) <= 5 ? "Low stock" : "In stock",
      lengths: productForm.lengthsText
        .split(",")
        .map((length) => length.trim())
        .filter(Boolean)
        .map((length) => (Number.isNaN(Number(length)) ? length : Number(length))),
      photos: productForm.photos || [],
    };
    delete nextProduct.lengthsText;

    const nextProducts = editingId
      ? products.map((product) => (product.id === editingId ? nextProduct : product))
      : [...products, nextProduct];

    saveAdminProducts(nextProducts);
    onProductsChange(nextProducts);
    setProductForm(toProductForm());
    setEditingId(null);
    setNotice("Product saved.");
  };

  const editProduct = (product) => {
    setEditingId(product.id);
    setProductForm(toProductForm(product));
    setActiveTab("products");
  };

  const deleteProduct = (productId) => {
    const nextProducts = products.filter((product) => product.id !== productId);
    saveAdminProducts(nextProducts);
    onProductsChange(nextProducts);
    if (editingId === productId) {
      setEditingId(null);
      setProductForm(toProductForm());
    }
    setNotice("Product deleted.");
  };

  const handlePhotoUpload = async (event) => {
    const uploaded = await readFilesAsDataUrls(event.target.files || []);
    setProductForm((current) => ({ ...current, photos: [...(current.photos || []), ...uploaded] }));
    event.target.value = "";
  };

  const saveSettings = (event) => {
    event.preventDefault();
    setSettings(saveStoreSettings(settings));
    setNotice("Settings saved.");
  };

  const signOut = () => {
    clearAdminSession();
    navigate("#/admin/login");
  };

  return (
    <section className="admin-shell">
      <div className="admin-topbar">
        <div>
          <p className="eyebrow">Administrator</p>
          <h1>Leena Luxe Hair Dashboard</h1>
          <p>Signed in as tlinvestmentproperties@gmail.com</p>
        </div>
        <button className="secondary-button" type="button" onClick={signOut}>Sign Out</button>
      </div>

      <div className="admin-tabs">
        {[
          ["overview", "Overview"],
          ["products", "Products"],
          ["orders", "Orders"],
          ["customers", "Customers"],
          ["settings", "Settings"],
        ].map(([key, label]) => (
          <button className={activeTab === key ? "active" : ""} key={key} onClick={() => setActiveTab(key)}>{label}</button>
        ))}
      </div>

      {notice && <div className="admin-notice">{notice}</div>}

      {activeTab === "overview" && (
        <div className="admin-panel">
          <div className="admin-stat-grid">
            <StatCard label="Total Products" value={products.length} />
            <StatCard label="Active Products" value={activeProducts.length} />
            <StatCard label="Total Orders" value={placeholderOrders.length} />
            <StatCard label="Total Customers" value={placeholderCustomers.length} />
            <StatCard label="Revenue Placeholder" value={formatPrice(totalRevenue)} />
          </div>
          <h2>Low Stock Products</h2>
          <AdminTable
            headers={["Product", "Category", "Qty", "Status"]}
            rows={lowStockProducts.map((product) => [product.name, product.category, product.inventoryQuantity, product.active ? "Active" : "Inactive"])}
          />
        </div>
      )}

      {activeTab === "products" && (
        <div className="admin-product-layout">
          <form className="admin-panel admin-form" onSubmit={saveProduct}>
            <div className="admin-form-heading">
              <h2>{editingId ? "Edit Product" : "Add New Product"}</h2>
              {editingId && <button className="text-button" type="button" onClick={() => { setEditingId(null); setProductForm(toProductForm()); }}>Clear</button>}
            </div>
            <label>Product name<input value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} required /></label>
            <div className="admin-two-column">
              <label>Category<select value={productForm.category} onChange={(event) => setProductForm({ ...productForm, category: event.target.value })}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label>Badge<select value={productForm.badge} onChange={(event) => setProductForm({ ...productForm, badge: event.target.value })}>{["New", "Best Seller", "Sale", "Premium"].map((item) => <option key={item}>{item}</option>)}</select></label>
            </div>
            <div className="admin-two-column">
              <label>Price<input type="number" min="0" value={productForm.price} onChange={(event) => setProductForm({ ...productForm, price: event.target.value })} /></label>
              <label>Sale price<input type="number" min="0" value={productForm.salePrice} onChange={(event) => setProductForm({ ...productForm, salePrice: event.target.value })} /></label>
            </div>
            <div className="admin-two-column">
              <label>Texture<select value={productForm.texture} onChange={(event) => setProductForm({ ...productForm, texture: event.target.value })}>{textures.map((item) => <option key={item}>{item}</option>)}<option>All Textures</option></select></label>
              <label>Inventory quantity<input type="number" min="0" value={productForm.inventoryQuantity} onChange={(event) => setProductForm({ ...productForm, inventoryQuantity: event.target.value })} /></label>
            </div>
            <label>Available lengths<input value={productForm.lengthsText} onChange={(event) => setProductForm({ ...productForm, lengthsText: event.target.value })} placeholder="16, 18, 20, 22" /></label>
            <label>Description<textarea rows="4" value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} /></label>
            <label>Product photos<input type="file" accept="image/*" multiple onChange={handlePhotoUpload} /></label>
            {productForm.photos?.length > 0 && (
              <div className="admin-photo-grid">
                {productForm.photos.map((photo, index) => <img src={photo} alt={`Product preview ${index + 1}`} key={`${photo}-${index}`} />)}
              </div>
            )}
            <label className="admin-check"><input type="checkbox" checked={productForm.active} onChange={(event) => setProductForm({ ...productForm, active: event.target.checked })} /> Product active</label>
            <button className="primary-button" type="submit">{editingId ? "Save Product" : "Add Product"}</button>
          </form>

          <div className="admin-panel">
            <h2>Products</h2>
            <div className="admin-product-list">
              {products.map((product) => (
                <article className="admin-product-row" key={product.id}>
                  {product.photos?.[0] ? <img src={product.photos[0]} alt={product.name} /> : <div className={`admin-product-thumb tone-${product.imageTone || "champagne"}`} />}
                  <div>
                    <h3>{product.name}</h3>
                    <p>{product.category} / {product.texture} / Qty {product.inventoryQuantity}</p>
                    <p>{product.active ? "Active" : "Inactive"} / {product.badge}</p>
                  </div>
                  <div className="admin-row-actions">
                    <button className="secondary-button" type="button" onClick={() => editProduct(product)}>Edit</button>
                    <button className="text-button" type="button" onClick={() => deleteProduct(product.id)}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "orders" && (
        <div className="admin-panel">
          <h2>Orders</h2>
          <AdminTable headers={["Order", "Customer", "Email", "Items", "Status", "Total", "Date"]} rows={placeholderOrders.map((order) => [order.orderNumber, order.customerName, order.email, order.items, order.status, formatPrice(order.total), order.date])} />
        </div>
      )}

      {activeTab === "customers" && (
        <div className="admin-panel">
          <h2>Customers</h2>
          <AdminTable headers={["ID", "Name", "Email", "Orders", "Total Spent", "Joined"]} rows={placeholderCustomers.map((customer) => [customer.id, customer.name, customer.email, customer.orders, formatPrice(customer.totalSpent), customer.joined])} />
        </div>
      )}

      {activeTab === "settings" && (
        <form className="admin-panel admin-form" onSubmit={saveSettings}>
          <h2>Website Settings</h2>
          <div className="admin-two-column">
            <label>Store name<input value={settings.storeName} onChange={(event) => setSettings({ ...settings, storeName: event.target.value })} /></label>
            <label>Contact email<input type="email" value={settings.contactEmail} onChange={(event) => setSettings({ ...settings, contactEmail: event.target.value })} /></label>
          </div>
          <div className="admin-two-column">
            <label>Phone number<input value={settings.phone} onChange={(event) => setSettings({ ...settings, phone: event.target.value })} /></label>
            <label>WhatsApp number<input value={settings.whatsapp} onChange={(event) => setSettings({ ...settings, whatsapp: event.target.value })} /></label>
          </div>
          <label>Announcement bar text<input value={settings.announcement} onChange={(event) => setSettings({ ...settings, announcement: event.target.value })} /></label>
          <label>Free shipping amount<input type="number" min="0" value={settings.freeShippingAmount} onChange={(event) => setSettings({ ...settings, freeShippingAmount: Number(event.target.value) || 0 })} /></label>
          <button className="primary-button" type="submit">Save Settings</button>
        </form>
      )}
    </section>
  );
}

function StatCard({ label, value }) {
  return (
    <article className="admin-stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function AdminTable({ headers, rows }) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
        <tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={`${index}-${cellIndex}`}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

export default AdminDashboard;