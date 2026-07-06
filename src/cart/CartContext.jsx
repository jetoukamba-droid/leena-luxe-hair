import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { readAdminProducts } from "../admin/adminStore.js";
import { getCartLineId } from "./cartUtils.js";

const CartContext = createContext(null);
const storageKey = "leena-luxe-cart";

const readCart = () => {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || [];
  } catch {
    return [];
  }
};

export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items]);

  const enrichedItems = useMemo(
    () =>
      items
        .map((item) => ({
          ...item,
          product: readAdminProducts().find((product) => product.id === item.productId),
        }))
        .filter((item) => item.product),
    [items]
  );

  const itemCount = enrichedItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = enrichedItems.reduce((sum, item) => {
    const unitPrice = item.product.salePrice || item.product.price;
    return sum + unitPrice * item.quantity;
  }, 0);

  const addToCart = (product, options = {}) => {
    const length = options.length || product.lengths[0];
    const texture = options.texture || product.texture;
    const quantity = Number(options.quantity || 1);
    const lineId = getCartLineId(product.id, length, texture);

    setItems((current) => {
      const existing = current.find((item) => item.lineId === lineId);
      if (existing) {
        return current.map((item) =>
          item.lineId === lineId ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...current, { lineId, productId: product.id, length, texture, quantity }];
    });
  };

  const updateQuantity = (lineId, quantity) => {
    const nextQuantity = Math.max(1, Number(quantity) || 1);
    setItems((current) =>
      current.map((item) => (item.lineId === lineId ? { ...item, quantity: nextQuantity } : item))
    );
  };

  const removeFromCart = (lineId) => {
    setItems((current) => current.filter((item) => item.lineId !== lineId));
  };

  const value = {
    items: enrichedItems,
    itemCount,
    subtotal,
    addToCart,
    updateQuantity,
    removeFromCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
