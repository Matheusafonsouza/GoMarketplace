import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storagedProducts = await AsyncStorage.getItem('@GoMarketplace');

      if (storagedProducts) {
        setProducts(JSON.parse(storagedProducts));
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const cartAlreadyHaveProduct = products.some(
        item => item.id === product.id,
      );

      if (!cartAlreadyHaveProduct) {
        const item = {
          id: product.id,
          title: product.title,
          image_url: product.image_url,
          price: product.price,
          quantity: 1,
        };

        setProducts(state => [...state, item]);

        await AsyncStorage.setItem('@GoMarketplace', JSON.stringify(products));

        return;
      }

      const cartWithProductUpdated = products.map(item => {
        if (item.id === product.id) {
          item.quantity += 1;
          return item;
        }
        return item;
      });

      setProducts(cartWithProductUpdated);

      await AsyncStorage.setItem(
        '@GoMarketplace',
        JSON.stringify(cartWithProductUpdated),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const cartWithProductUpdated = products.map(item => {
        if (item.id === id) {
          item.quantity += 1;
          return item;
        }

        return item;
      });

      setProducts(cartWithProductUpdated);
      await AsyncStorage.setItem(
        '@GoMarketplace',
        JSON.stringify(cartWithProductUpdated),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const cartWithProductUpdated = products.map(item => {
        if (item.id === id) {
          item.quantity -= 1;

          return item;
        }

        return item;
      });

      const RemovedItemsCart = cartWithProductUpdated.filter(
        item => item.quantity > 0,
      );

      setProducts(RemovedItemsCart);
      await AsyncStorage.setItem(
        '@GoMarketplace',
        JSON.stringify(RemovedItemsCart),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
