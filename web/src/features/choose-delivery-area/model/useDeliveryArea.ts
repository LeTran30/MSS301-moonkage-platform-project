import { useContext } from 'react';
import { DeliveryAreaContext, type DeliveryAreaValue } from './areaContext';

export function useDeliveryArea(): DeliveryAreaValue {
  const value = useContext(DeliveryAreaContext);
  if (!value) throw new Error('useDeliveryArea must be used inside <DeliveryAreaProvider>');
  return value;
}
