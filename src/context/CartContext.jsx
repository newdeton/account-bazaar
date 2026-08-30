import {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

const CartContext = createContext(null);

const USD_TO_KES_RATE = 129;

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  /* =====================================================
     ADD PRODUCT
  ===================================================== */

  const addToCart = (product) => {
    if (!product) {
      console.error(
        "Cannot add invalid product to cart:",
        product
      );
      return;
    }

    const productId =
      product.id ||
      product._id ||
      product.productId;

    if (!productId) {
      console.error(
        "Product does not have a valid ID:",
        product
      );
      return;
    }

    setCart((currentCart) => {
      const existingProduct = currentCart.find(
        (item) =>
          String(item.id) === String(productId)
      );

      if (existingProduct) {
        return currentCart.map((item) =>
          String(item.id) === String(productId)
            ? {
                ...item,
                quantity:
                  Number(item.quantity || 0) + 1,
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          ...product,

          id: productId,

          productId,

          price: Number(
            product.price || 0
          ),

          quantity: 1,
        },
      ];
    });
  };

  /* =====================================================
     REMOVE ONE
  ===================================================== */

  const removeFromCart = (productId) => {
    setCart((currentCart) =>
      currentCart
        .map((item) => {
          if (
            String(item.id) !==
            String(productId)
          ) {
            return item;
          }

          return {
            ...item,
            quantity:
              Number(item.quantity || 0) - 1,
          };
        })
        .filter(
          (item) =>
            Number(item.quantity || 0) > 0
        )
    );
  };

  /* =====================================================
     DELETE PRODUCT
  ===================================================== */

  const deleteFromCart = (productId) => {
    setCart((currentCart) =>
      currentCart.filter(
        (item) =>
          String(item.id) !==
          String(productId)
      )
    );
  };

  /* =====================================================
     CLEAR CART
  ===================================================== */

  const clearCart = () => {
    setCart([]);
  };

  /* =====================================================
     CART COUNT
  ===================================================== */

  const cartCount = useMemo(() => {
    return cart.reduce(
      (count, item) =>
        count +
        Number(item.quantity || 0),
      0
    );
  }, [cart]);

  /* =====================================================
     UNIQUE ITEMS
  ===================================================== */

  const uniqueItemCount = useMemo(() => {
    return cart.length;
  }, [cart]);

  /* =====================================================
     TOTAL USD
  ===================================================== */

  const total = useMemo(() => {
    return Number(
      cart
        .reduce((sum, item) => {
          const price = Number(
            item.price || 0
          );

          const quantity = Number(
            item.quantity || 0
          );

          return (
            sum +
            price * quantity
          );
        }, 0)
        .toFixed(2)
    );
  }, [cart]);

  /* =====================================================
     TOTAL KES
     
     Display helper only.
     
     Backend remains the authority for payment
     calculation and uses the same 129 rate.
  ===================================================== */

  const totalKES = useMemo(() => {
    return Number(
      (
        total *
        USD_TO_KES_RATE
      ).toFixed(2)
    );
  }, [total]);

  /* =====================================================
     CHECK PRODUCT
  ===================================================== */

  const isInCart = (productId) => {
    return cart.some(
      (item) =>
        String(item.id) ===
        String(productId)
    );
  };

  /* =====================================================
     GET QUANTITY
  ===================================================== */

  const getQuantity = (productId) => {
    const product = cart.find(
      (item) =>
        String(item.id) ===
        String(productId)
    );

    return product
      ? Number(product.quantity || 0)
      : 0;
  };

  /* =====================================================
     UPDATE QUANTITY
  ===================================================== */

  const updateQuantity = (
    productId,
    quantity
  ) => {
    const newQuantity = Math.floor(
      Number(quantity)
    );

    if (
      !Number.isFinite(newQuantity)
    ) {
      return;
    }

    if (newQuantity <= 0) {
      deleteFromCart(productId);
      return;
    }

    setCart((currentCart) =>
      currentCart.map((item) =>
        String(item.id) ===
        String(productId)
          ? {
              ...item,
              quantity:
                newQuantity,
            }
          : item
      )
    );
  };

  /* =====================================================
     INCREASE
  ===================================================== */

  const increaseQuantity = (
    productId
  ) => {
    setCart((currentCart) =>
      currentCart.map((item) =>
        String(item.id) ===
        String(productId)
          ? {
              ...item,
              quantity:
                Number(
                  item.quantity || 0
                ) + 1,
            }
          : item
      )
    );
  };

  /* =====================================================
     DECREASE
  ===================================================== */

  const decreaseQuantity = (
    productId
  ) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          String(item.id) ===
          String(productId)
            ? {
                ...item,
                quantity:
                  Number(
                    item.quantity || 0
                  ) - 1,
              }
            : item
        )
        .filter(
          (item) =>
            Number(
              item.quantity || 0
            ) > 0
        )
    );
  };

  /* =====================================================
     CONTEXT
  ===================================================== */

  const contextValue = {
    cart,

    cartCount,

    uniqueItemCount,

    total,

    totalUSD: total,

    totalKES,

    exchangeRate:
      USD_TO_KES_RATE,

    addToCart,

    removeFromCart,

    deleteFromCart,

    clearCart,

    updateQuantity,

    increaseQuantity,

    decreaseQuantity,

    getQuantity,

    isInCart,
  };

  return (
    <CartContext.Provider
      value={contextValue}
    >
      {children}
    </CartContext.Provider>
  );
}

/* =====================================================
   CART HOOK
===================================================== */

export function useCart() {
  const context =
    useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside a CartProvider."
    );
  }

  return context;
}