import { useState } from 'react';
import { addToCart } from '@/entities/cart';
import { type Product } from '@/entities/product';
import { Button, toast } from '@/shared/ui';
import { syncCartAddToBackend } from '../model/useCartSync';

interface Props {
  product: Product;
  quantity?: number;
  className?: string;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

export function AddToCartButton({
  product,
  quantity = 1,
  className,
  variant = 'primary',
  size = 'md',
}: Props) {
  const [loading, setLoading] = useState(false);

  const handleAdd = () => {
    setLoading(true);
    addToCart(
      {
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.images[0] || '/images/banh-nuong.jpg',
        vendorId: product.vendorId,
        vendorName: product.vendorName,
        stock: product.stock,
      },
      quantity
    );
    syncCartAddToBackend(product.id, quantity);
    toast.success(`Đã thêm ${quantity}x "${product.name}" vào giỏ hàng!`);
    setTimeout(() => setLoading(false), 300);
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      disabled={loading || product.stock === 0}
      onClick={handleAdd}
    >
      {product.stock === 0 ? 'Tạm hết hàng' : '🛒 Thêm vào giỏ'}
    </Button>
  );
}
