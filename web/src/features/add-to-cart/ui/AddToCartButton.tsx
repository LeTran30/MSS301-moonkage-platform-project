import { useState } from 'react';
import { type Product } from '@/entities/product';
import { isSessionEnded } from '@/shared/api';
import { Button, toast } from '@/shared/ui';
import { useCartSync } from '../model/useCartSync';

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
  const { addLine } = useCartSync();

  const handleAdd = async () => {
    setLoading(true);
    try {
      await addLine(product.id, quantity);
      toast.success(`Đã thêm ${quantity}x "${product.name}" vào giỏ hàng!`);
    } catch (error) {
      // 401: the app already asks the user to sign in and moves them there.
      if (isSessionEnded(error)) return;
      toast.error('Không thêm vào giỏ hàng được. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      loading={loading}
      disabled={loading || product.stock === 0}
      onClick={() => void handleAdd()}
      iconLeft={product.stock === 0 ? undefined : 'cart'}
    >
      {product.stock === 0 ? 'Tạm hết hàng' : 'Thêm vào giỏ'}
    </Button>
  );
}
