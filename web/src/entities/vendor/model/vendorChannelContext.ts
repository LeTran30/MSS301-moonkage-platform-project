import { createContext, useContext } from 'react';
import type { VendorProfile } from './types';

interface VendorChannelValue {
  profile: VendorProfile;
  /** Loads the profile again (after re-submitting, after paying the fee). */
  reload: () => void;
}

export const VendorChannelContext = createContext<VendorChannelValue | null>(null);

function useVendorChannel(): VendorChannelValue {
  const value = useContext(VendorChannelContext);
  if (!value) throw new Error('useVendorContext must be used inside <VendorChannelGate>');
  return value;
}

/** The vendor profile the channel loaded (state, shop name, ways of selling). */
export const useVendorContext = () => useVendorChannel().profile;
export const useVendorReload = () => useVendorChannel().reload;
