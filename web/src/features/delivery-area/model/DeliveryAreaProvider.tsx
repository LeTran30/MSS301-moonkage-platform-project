import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { readJson, writeJson } from '../../../shared/utils/storage';
import { DeliveryAreaContext } from './areaContext';

const STORAGE_KEY = 'moonkage.area';
/** Shown before the visitor chooses; the sample catalogue is Hà Nội. */
const DEFAULT_AREA = 'Hà Nội';
/** Sample list until the address service exposes provinces. */
const PROVINCES = ['Hà Nội', 'TP Hồ Chí Minh', 'Hải Phòng', 'Đà Nẵng', 'Cần Thơ'];

export function DeliveryAreaProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<string | null>(() => {
    const value = readJson<string | null>(STORAGE_KEY, null);
    return value && PROVINCES.includes(value) ? value : null;
  });

  const setArea = useCallback((province: string) => {
    writeJson(STORAGE_KEY, province);
    setStored(province);
  }, []);

  const value = useMemo(
    () => ({ area: stored ?? DEFAULT_AREA, chosen: stored !== null, provinces: PROVINCES, setArea }),
    [stored, setArea],
  );
  return <DeliveryAreaContext.Provider value={value}>{children}</DeliveryAreaContext.Provider>;
}
