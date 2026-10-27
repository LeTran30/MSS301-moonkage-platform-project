import { useCart, type CartItem } from '@/entities/cart';
import { useProductsByIds } from '@/entities/product';

/** Cart lines joined with their products (cart page, checkout). */
export function useCartItems(): { loading: boolean; items: CartItem[] } {
  const { lines } = useCart();
  const products = useProductsByIds(lines.map((l) => l.productId));
  if (products.kind !== 'loaded') return { loading: lines.length > 0, items: [] };
  const items = lines.flatMap((l): CartItem[] => {
    const p = products.data.find((x) => x.id === l.productId);
    return p
      ? [
          {
            productId: p.id,
            name: p.name,
            price: p.price,
            stock: p.stock,
            quantity: l.quantity,
            shopId: p.shopId,
            shopName: p.shopName,
            shippingFee: p.shippingFrom,
            shopTakesCustom: p.shopTakesCustom,
          },
        ]
      : [];
  });
  return { loading: false, items };
}
