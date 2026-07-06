export const getCartLineId = (productId, length, texture) => `${productId}:${length}:${texture}`;

export const formatPrice = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
