import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { config } from '../../../shared/config/env';
import {
  ALL_PROVINCE_NAMES,
  DEFAULT_PROVINCE_NAME,
  findProvince,
  provinceCodeOf,
} from '../../../shared/config/provinces';
import { readJson, writeJson } from '../../../shared/utils/storage';
import { DeliveryAreaContext } from './areaContext';

const STORAGE_KEY = 'moonkage.area';
/** Sample list used in demo mode; real API mode exposes all 34 provinces. */
const DEMO_PROVINCES = ['Hà Nội', 'TP Hồ Chí Minh', 'Hải Phòng', 'Đà Nẵng', 'Cần Thơ'];

export function DeliveryAreaProvider({ children }: { children: ReactNode }) {
  const provinces = config.demoMode ? DEMO_PROVINCES : ALL_PROVINCE_NAMES;
  const [stored, setStored] = useState<string | null>(() => {
    const value = readJson<string | null>(STORAGE_KEY, null);
    const matched = value ? findProvince(value) : undefined;
    return matched && provinces.includes(matched.name) ? matched.name : null;
  });

  const setArea = useCallback((province: string) => {
    const normalized = findProvince(province)?.name ?? province;
    writeJson(STORAGE_KEY, normalized);
    setStored(normalized);
  }, []);

  const area = stored ?? DEFAULT_PROVINCE_NAME;
  const value = useMemo(
    () => ({
      area,
      provinceCode: provinceCodeOf(area),
      chosen: stored !== null,
      provinces,
      setArea,
    }),
    [area, provinces, setArea, stored],
  );
  return <DeliveryAreaContext.Provider value={value}>{children}</DeliveryAreaContext.Provider>;
}
