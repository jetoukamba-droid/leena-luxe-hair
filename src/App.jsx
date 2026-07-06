import React, { useEffect, useMemo, useState } from "react";
import { CartProvider, useCart } from "./cart/CartContext.jsx";
import { formatPrice } from "./cart/cartUtils.js";
import { categories, textures } from "./data/products.js";
import { clearAdminSession, ensureDefaultAdminAccount, getAdminSession, verifyAdminCredentials } from "./admin/adminAuth.js";
import AdminDashboard from "./admin/AdminDashboard.jsx";
import { readAdminProducts } from "./admin/adminStore.js";

const careInstructions = [
  "Co-wash before install and every 1-2 weeks.",
  "Use sulfate-free shampoo, moisturizing conditioner, and a light serum.",
  "Detangle from ends to roots with a wide-tooth comb.",
  "Wrap, braid, or bonnet hair nightly to preserve texture and shine.",
];

const getCurrentRoute = () => {
  if (window.location.hash) return window.location.hash;
  return window.location.pathname === "/" ? "#/" : `#${window.location.pathname}`;
};

function useHashRoute() {
  const [hash, setHash] = useState(getCurrentRoute);

  useEffect(() => {
    const handleRouteChange = () => setHash(getCurrentRoute());
    window.addEventListener("hashchange", handleRouteChange);
    window.addEventListener("popstate", handleRouteChange);
    return () => {
      window.removeEventListener("hashchange", handleRouteChange);
      window.removeEventListener("popstate", handleRouteChange);
    };
  }, []);

  const navigate = (path) => {
    window.location.hash = path;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return { hash, navigate };
}

function ProductArt({ product, compact = false }) {
  const primaryPhoto = product.photos?.[0];
  return (
    <div className={`product-art tone-${product.imageTone} ${compact ? "compact" : ""}`}>
      {primaryPhoto && <img className="product-photo" src={primaryPhoto} alt={product.name} />}
      <span>{product.category}</span>
      <strong>{product.texture}</strong>
    </div>
  );
}

function Header({ route, navigate }) {
  const { itemCount } = useCart();
  const [open, setOpen] = useState(false);
  const [adminSession, setAdminSession] = useState(() => getAdminSession());
  useEffect(() => {
    setAdminSession(getAdminSession());
  }, [route]);
  const links = [
    ["#/", "Home"],
    ["#/shop", "Shop"],
    ["#/shop?category=Bundles", "Bundles"],
    ["#/shop?category=Lace%20Wigs", "Wigs"],
    ["#/about", "About"],
    ["#/faq", "FAQ"],
    ["#/contact", "Contact"],
  ];

  const go = (path) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <header className="site-header">
      <button className="menu-button" onClick={() => setOpen((value) => !value)} aria-label="Open menu">
        <span />
        <span />
      </button>
      <button className="brand" onClick={() => go("#/")}>
        <span>Leena</span>
        <strong>Luxe Hair</strong>
      </button>
      <nav className={`main-nav ${open ? "open" : ""}`}>
        {links.map(([path, label]) => (
          <button className={route === path ? "active" : ""} key={path} onClick={() => go(path)}>
            {label}
          </button>
        ))}
        {adminSession?.role === "admin" && (
          <button className={route === "#/admin" ? "active" : ""} onClick={() => go("#/admin")}>Admin Dashboard</button>
        )}
      </nav>
      <button className="cart-link" onClick={() => go("#/cart")} aria-label={`Cart with ${itemCount} items`}>
        Cart <span>{itemCount}</span>
      </button>
    </header>
  );
}

function ProductCard({ product, navigate }) {
  const { addToCart } = useCart();
  const price = product.salePrice || product.price;

  return (
    <article className="product-card">
      <button className="image-button" onClick={() => navigate(`#/product/${product.id}`)}>
        <ProductArt product={product} />
        <em>{product.badge}</em>
      </button>
      <div className="product-card-body">
        <div>
          <p>{product.category}</p>
          <h3>{product.name}</h3>
        </div>
        <div className="price-row">
          <strong>{formatPrice(price)}</strong>
          {product.salePrice && <span>{formatPrice(product.price)}</span>}
        </div>
        <p className="meta-line">{product.texture} / {product.inventory}</p>
        <div className="card-actions">
          <button className="secondary-button" onClick={() => navigate(`#/product/${product.id}`)}>
            Details
          </button>
          <button className="primary-button" onClick={() => addToCart(product)}>
            Add to Cart
          </button>
        </div>
      </div>
    </article>
  );
}

function HomePage({ navigate, catalogProducts }) {
  const bestSellers = catalogProducts.filter((product) => product.active !== false && product.badge === "Best Seller").slice(0, 4);

  return (
    <>
      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">Premium human hair extensions</p>
          <h1>Luxury Hair Extensions That Turn Heads</h1>
          <p>
            Polished textures, luminous finishes, and install-ready pieces crafted for women who expect beauty
            to feel effortless.
          </p>
          <div className="hero-actions">
            <button className="primary-button light" onClick={() => navigate("#/shop")}>Shop Now</button>
            <button className="secondary-button light" onClick={() => navigate("#/shop")}>Explore Collection</button>
          </div>
        </div>
        <div className="hero-showcase">
          <div className="hero-card large">HD Lace</div>
          <div className="hero-card">Raw Bundles</div>
          <div className="hero-card warm">Luxe Care</div>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Shop by category</p>
          <h2>Featured Collections</h2>
        </div>
        <div className="category-grid">
          {["Bundles", "Lace Wigs", "Frontals", "Closures", "Hair Care"].map((category) => (
            <button key={category} onClick={() => navigate(`#/shop?category=${encodeURIComponent(category)}`)}>
              <span>{category}</span>
              <small>Explore</small>
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">Client favorites</p>
            <h2>Best Sellers</h2>
          </div>
          <button className="text-button" onClick={() => navigate("#/shop")}>View all products</button>
        </div>
        <div className="product-grid">
          {bestSellers.map((product) => <ProductCard key={product.id} product={product} navigate={navigate} />)}
        </div>
      </section>

      <section className="why-section">
        {[
          ["Premium Human Hair", "Soft, reusable extensions selected for density, luster, and longevity."],
          ["Install-Ready Lace", "Frontals, closures, and wigs designed for a refined, natural finish."],
          ["Luxury Support", "Clear care guidance and responsive service before and after purchase."],
        ].map(([title, copy]) => (
          <div key={title}>
            <span />
            <h3>{title}</h3>
            <p>{copy}</p>
          </div>
        ))}
      </section>

      <section className="reviews-section">
        <div className="section-heading">
          <p className="eyebrow">Reviews</p>
          <h2>Soft, full, and camera-ready</h2>
        </div>
        <div className="review-grid">
          {[
            ["The body wave bundles stayed full after coloring and heat styling.", "Maya R."],
            ["My glueless wig looked custom right out of the box. The lace melted beautifully.", "Danielle K."],
            ["Shipping was quick and the hair care notes made maintenance simple.", "Ari S."],
          ].map(([quote, name]) => (
            <figure key={name}>
              <blockquote>"{quote}"</blockquote>
              <figcaption>{name}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <Newsletter />
    </>
  );
}

function ShopPage({ navigate, initialCategory, catalogProducts }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory || "All");
  const [texture, setTexture] = useState("All");
  const [sort, setSort] = useState("featured");

  useEffect(() => {
    setCategory(initialCategory || "All");
  }, [initialCategory]);

  const filtered = useMemo(() => {
    const list = catalogProducts
      .filter((product) => product.active !== false)
      .filter((product) => category === "All" || product.category === category)
      .filter((product) => texture === "All" || product.texture === texture)
      .filter((product) => product.name.toLowerCase().includes(query.toLowerCase()));

    return [...list].sort((a, b) => {
      const aPrice = a.salePrice || a.price;
      const bPrice = b.salePrice || b.price;
      if (sort === "low") return aPrice - bPrice;
      if (sort === "high") return bPrice - aPrice;
      return 0;
    });
  }, [catalogProducts, category, query, sort, texture]);

  return (
    <section className="shop-page">
      <div className="shop-hero">
        <p className="eyebrow">The Leena Luxe edit</p>
        <h1>Shop premium extensions, wigs, lace, and care essentials.</h1>
      </div>
      <div className="shop-layout">
        <aside className="filters-panel">
          <label>
            Search
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products" />
          </label>
          <label>
            Category
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option>All</option>
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>
            Texture
            <select value={texture} onChange={(event) => setTexture(event.target.value)}>
              <option>All</option>
              {textures.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>
            Sort by price
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="featured">Featured</option>
              <option value="low">Low to high</option>
              <option value="high">High to low</option>
            </select>
          </label>
        </aside>
        <div className="shop-results">
          <div className="results-bar">{filtered.length} products</div>
          <div className="product-grid">
            {filtered.map((product) => <ProductCard key={product.id} product={product} navigate={navigate} />)}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductPage({ id, navigate, catalogProducts }) {
  const product = catalogProducts.find((item) => item.id === id && item.active !== false);
  const { addToCart } = useCart();
  const [length, setLength] = useState(product?.lengths[0]);
  const [texture, setTexture] = useState(product?.texture);
  const [quantity, setQuantity] = useState(1);

  if (!product) {
    return (
      <section className="empty-page">
        <h1>Product not found</h1>
        <button className="primary-button" onClick={() => navigate("#/shop")}>Back to Shop</button>
      </section>
    );
  }

  const addSelected = () => addToCart(product, { length, texture, quantity });

  return (
    <section className="product-detail">
      <div className="gallery">
        <ProductArt product={product} />
        <div className="thumbnail-row">
          <ProductArt product={product} compact />
          <ProductArt product={{ ...product, imageTone: "gold" }} compact />
          <ProductArt product={{ ...product, imageTone: "ivory" }} compact />
        </div>
      </div>
      <div className="detail-panel">
        <p className="eyebrow">{product.category} / {product.inventory}</p>
        <h1>{product.name}</h1>
        <div className="price-row large">
          <strong>{formatPrice(product.salePrice || product.price)}</strong>
          {product.salePrice && <span>{formatPrice(product.price)}</span>}
        </div>
        <p>{product.description}</p>
        <label>
          Length
          <select value={length} onChange={(event) => setLength(event.target.value)}>
            {product.lengths.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>
          Texture
          <select value={texture} onChange={(event) => setTexture(event.target.value)}>
            {[product.texture, "Body Wave", "Straight", "Deep Wave", "Loose Wave", "Kinky Curly", "Water Wave"]
              .filter((item, index, array) => item && array.indexOf(item) === index)
              .map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>
          Quantity
          <input type="number" min="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
        </label>
        <div className="detail-actions">
          <button className="primary-button" onClick={addSelected}>Add to Cart</button>
          <button className="secondary-button" onClick={addSelected}>Buy Now</button>
        </div>
        <InfoBlock title="Description" lines={[product.description]} />
        <InfoBlock title="Hair Care Instructions" lines={careInstructions} />
        <InfoBlock
          title="Shipping and Returns"
          lines={[
            "Orders are prepared within 2-4 business days while checkout is in preview mode.",
            "Unopened items may be eligible for return review within 7 days of delivery.",
          ]}
        />
      </div>
    </section>
  );
}

function InfoBlock({ title, lines }) {
  return (
    <div className="info-block">
      <h3>{title}</h3>
      {lines.map((line) => <p key={line}>{line}</p>)}
    </div>
  );
}

function CartPage({ navigate }) {
  const { items, subtotal, updateQuantity, removeFromCart } = useCart();
  const shipping = subtotal > 0 ? 12 : 0;

  return (
    <section className="cart-page">
      <div>
        <p className="eyebrow">Your bag</p>
        <h1>Cart</h1>
      </div>
      {items.length === 0 ? (
        <div className="empty-cart">
          <h2>Your cart is waiting for something beautiful.</h2>
          <button className="primary-button" onClick={() => navigate("#/shop")}>Shop Now</button>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {items.map((item) => (
              <article className="cart-item" key={item.lineId}>
                <ProductArt product={item.product} compact />
                <div>
                  <h3>{item.product.name}</h3>
                  <p>{item.length}" / {item.texture}</p>
                  <strong>{formatPrice(item.product.salePrice || item.product.price)}</strong>
                </div>
                <input
                  aria-label={`Quantity for ${item.product.name}`}
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(event) => updateQuantity(item.lineId, event.target.value)}
                />
                <button className="text-button" onClick={() => removeFromCart(item.lineId)}>Remove</button>
              </article>
            ))}
          </div>
          <aside className="summary-panel">
            <h2>Order Summary</h2>
            <div><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
            <div><span>Shipping estimate</span><strong>{formatPrice(shipping)}</strong></div>
            <div className="summary-total"><span>Total preview</span><strong>{formatPrice(subtotal + shipping)}</strong></div>
            <button className="primary-button checkout-button">Checkout Coming Soon</button>
          </aside>
        </div>
      )}
    </section>
  );
}

function AboutPage() {
  return (
    <section className="content-page">
      <p className="eyebrow">Our story</p>
      <h1>Leena Luxe Hair was created for polished beauty that lasts beyond the install.</h1>
      <p>
        We focus on premium human hair, soft lace, refined textures, and clear care guidance so every customer
        can feel confident from first wear through every refresh.
      </p>
      <div className="promise-grid">
        <InfoBlock title="Quality Promise" lines={["Full-feeling density, smooth cuticles, and pieces selected for reuse."]} />
        <InfoBlock title="Human Hair Focus" lines={["Extensions made to style, color, curl, press, and maintain with a premium finish."]} />
      </div>
    </section>
  );
}

function ContactPage() {
  return (
    <section className="contact-page">
      <div>
        <p className="eyebrow">Concierge support</p>
        <h1>Contact Leena Luxe Hair</h1>
        <p>Email: hello@leenaluxehair.com</p>
        <p>Phone: (404) 555-0198</p>
        <div className="whatsapp-box">
          <h3>WhatsApp Styling Help</h3>
          <p>Message us for length guidance, lace matching, and custom order questions.</p>
          <button className="secondary-button">WhatsApp Coming Soon</button>
        </div>
      </div>
      <form className="contact-form">
        <label>Name<input placeholder="Your name" /></label>
        <label>Email<input type="email" placeholder="you@example.com" /></label>
        <label>Message<textarea rows="6" placeholder="How can we help?" /></label>
        <button className="primary-button" type="button">Send Message</button>
      </form>
    </section>
  );
}

function FaqPage() {
  const faqs = [
    ["Shipping", "Orders will display real shipping options after checkout is connected. For now, this demo shows an estimate."],
    ["Returns", "Hair must remain unopened, unused, and unaltered for return review."],
    ["Payments", "Online payment is not connected yet. Stripe will be added later."],
    ["Hair Care", "Use sulfate-free products, avoid heavy oils, and protect hair at night."],
    ["Custom Orders", "Custom lace, color, and density requests can be prepared for a future admin workflow."],
  ];
  return (
    <section className="content-page">
      <p className="eyebrow">Questions</p>
      <h1>FAQ</h1>
      <div className="faq-list">
        {faqs.map(([question, answer]) => (
          <details key={question} open>
            <summary>{question}</summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function AdminLoginPage({ navigate }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState(() => getAdminSession());
  const [message, setMessage] = useState("");

  const login = (event) => {
    event.preventDefault();
    const nextSession = verifyAdminCredentials(email, password);
    if (!nextSession) {
      setMessage("The admin credentials were not accepted.");
      return;
    }
    setPassword("");
    setMessage("Admin login successful.");
    setSession(nextSession);
    navigate("#/admin");
  };

  const logout = () => {
    clearAdminSession();
    setSession(null);
    setMessage("");
  };

  return (
    <section className="content-page">
      <p className="eyebrow">Admin</p>
      <h1>Administrator Login</h1>
      {session?.role === "admin" ? (
        <div className="promise-grid">
          <InfoBlock title="Signed In" lines={[`Admin: ${session.email}`, "Role: admin", "Privileges: full administrator access"]} />
          <div className="info-block">
            <h3>Session</h3>
            <p>{message || "Administrator session is active."}</p>
            <button className="secondary-button" type="button" onClick={logout}>Sign Out</button>
          </div>
        </div>
      ) : (
        <form className="contact-form" onSubmit={login}>
          <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" /></label>
          <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" /></label>
          {message && <p>{message}</p>}
          <button className="primary-button" type="submit">Sign In</button>
        </form>
      )}
    </section>
  );
}
function ProtectedAdminDashboard({ products, onProductsChange, navigate }) {
  const session = getAdminSession();

  useEffect(() => {
    if (session?.role !== "admin") {
      navigate("#/admin/login");
    }
  }, [navigate, session]);

  if (session?.role !== "admin") return null;

  return <AdminDashboard products={products} onProductsChange={onProductsChange} navigate={navigate} />;
}
function Newsletter() {
  return (
    <section className="newsletter-section">
      <div>
        <p className="eyebrow">Private list</p>
        <h2>Get restock alerts, care notes, and launch previews.</h2>
      </div>
      <form>
        <input type="email" placeholder="Email address" />
        <button className="primary-button" type="button">Sign Up</button>
      </form>
    </section>
  );
}

function Footer({ navigate }) {
  return (
    <footer className="footer">
      <div>
        <h2>Leena Luxe Hair</h2>
        <p>Premium extensions, lace wigs, frontals, closures, and care essentials.</p>
      </div>
      <div>
        {["Shop", "About", "FAQ", "Contact"].map((item) => (
          <button key={item} onClick={() => navigate(`#/${item.toLowerCase()}`)}>{item}</button>
        ))}
      </div>
    </footer>
  );
}

function AppShell() {
  const { hash, navigate } = useHashRoute();
  const [catalogProducts, setCatalogProducts] = useState(() => readAdminProducts());

  useEffect(() => {
    setCatalogProducts(readAdminProducts());
  }, [hash]);
  const [pathPart, queryString = ""] = hash.slice(1).split("?");
  const params = new URLSearchParams(queryString);
  const route = hash;
  const productMatch = pathPart.match(/^\/product\/(.+)$/);

  let page = <HomePage navigate={navigate} catalogProducts={catalogProducts} />;
  if (pathPart === "/shop") page = <ShopPage navigate={navigate} initialCategory={params.get("category")} catalogProducts={catalogProducts} />;
  if (productMatch) page = <ProductPage id={productMatch[1]} navigate={navigate} catalogProducts={catalogProducts} />;
  if (pathPart === "/cart") page = <CartPage navigate={navigate} />;
  if (pathPart === "/about") page = <AboutPage />;
  if (pathPart === "/contact") page = <ContactPage />;
  if (pathPart === "/faq") page = <FaqPage />;
  if (pathPart === "/admin/login") page = <AdminLoginPage navigate={navigate} />;
  if (pathPart === "/admin") page = <ProtectedAdminDashboard products={catalogProducts} onProductsChange={setCatalogProducts} navigate={navigate} />;

  return (
    <>
      <Header route={route} navigate={navigate} />
      <main>{page}</main>
      <Footer navigate={navigate} />
    </>
  );
}

export default function App() {
  useEffect(() => {
    ensureDefaultAdminAccount();
  }, []);

  return (
    <CartProvider>
      <AppShell />
    </CartProvider>
  );
}
