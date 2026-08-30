import {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  /* =====================================================
     ADD PRODUCT TO CART
  ===================================================== */

  const addToCart = (product) => {
    if (!product || product.id === undefined) {
      console.error(
        "Cannot add invalid product to cart:",
        product
      );

      return;
    }

    setCart((currentCart) => {
      const existingProduct = currentCart.find(
        (item) => item.id === product.id
      );

      /* -----------------------------------------------
         PRODUCT ALREADY EXISTS
      ----------------------------------------------- */

      if (existingProduct) {
        return currentCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity:
                  Number(item.quantity || 0) + 1,
              }
            : item
        );
      }

      /* -----------------------------------------------
         NEW PRODUCT
      ----------------------------------------------- */

      return [
        ...currentCart,
        {
          ...product,
          quantity: 1,
        },
      ];
    });
  };

  /* =====================================================
     REMOVE ONE QUANTITY
  ===================================================== */

  const removeFromCart = (productId) => {
    setCart((currentCart) =>
      currentCart
        .map((item) => {
          if (item.id !== productId) {
            return item;
          }

          return {
            ...item,
            quantity:
              Number(item.quantity || 0) - 1,
          };
        })
        .filter(
          (item) => Number(item.quantity || 0) > 0
        )
    );
  };

  /* =====================================================
     DELETE PRODUCT COMPLETELY
  ===================================================== */

  const deleteFromCart = (productId) => {
    setCart((currentCart) =>
      currentCart.filter(
        (item) => item.id !== productId
      )
    );
  };

  /* =====================================================
     CLEAR ENTIRE CART
  ===================================================== */

  const clearCart = () => {
    setCart([]);
  };

  /* =====================================================
     CART COUNT
     Total number of physical/ordered items
  ===================================================== */

  const cartCount = useMemo(() => {
    return cart.reduce(
      (count, item) =>
        count + Number(item.quantity || 0),
      0
    );
  }, [cart]);

  /* =====================================================
     CART TOTAL
  ===================================================== */

  const total = useMemo(() => {
    return cart.reduce((sum, item) => {
      const price = Number(item.price || 0);
      const quantity = Number(item.quantity || 0);

      return sum + price * quantity;
    }, 0);
  }, [cart]);

  /* =====================================================
     UNIQUE PRODUCTS COUNT
  ===================================================== */

  const uniqueItemCount = useMemo(() => {
    return cart.length;
  }, [cart]);

  /* =====================================================
     CHECK WHETHER PRODUCT IS IN CART
  ===================================================== */

  const isInCart = (productId) => {
    return cart.some(
      (item) => item.id === productId
    );
  };

  /* =====================================================
     GET PRODUCT QUANTITY
  ===================================================== */

  const getQuantity = (productId) => {
    const product = cart.find(
      (item) => item.id === productId
    );

    return product
      ? Number(product.quantity || 0)
      : 0;
  };

  /* =====================================================
     UPDATE PRODUCT QUANTITY
  ===================================================== */

  const updateQuantity = (
    productId,
    quantity
  ) => {
    const newQuantity = Number(quantity);

    if (!Number.isFinite(newQuantity)) {
      return;
    }

    if (newQuantity <= 0) {
      deleteFromCart(productId);
      return;
    }

    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === productId
          ? {
              ...item,
              quantity: Math.floor(
                newQuantity
              ),
            }
          : item
      )
    );
  };

  /* =====================================================
     INCREASE QUANTITY
  ===================================================== */

  const increaseQuantity = (productId) => {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === productId
          ? {
              ...item,
              quantity:
                Number(item.quantity || 0) + 1,
            }
          : item
      )
    );
  };

  /* =====================================================
     DECREASE QUANTITY
  ===================================================== */

  const decreaseQuantity = (productId) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === productId
            ? {
                ...item,
                quantity:
                  Number(item.quantity || 0) - 1,
              }
            : item
        )
        .filter(
          (item) => Number(item.quantity || 0) > 0
        )
    );
  };

  /* =====================================================
     CONTEXT VALUE
  ===================================================== */

  const contextValue = {
    /* Cart */
    cart,
    cartCount,
    uniqueItemCount,
    total,

    /* Cart actions */
    addToCart,
    removeFromCart,
    deleteFromCart,
    clearCart,

    /* Quantity helpers */
    updateQuantity,
    increaseQuantity,
    decreaseQuantity,
    getQuantity,

    /* Product helpers */
    isInCart,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

/* =====================================================
   CART HOOK
===================================================== */

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside a CartProvider."
    );
  }

  return context;
}