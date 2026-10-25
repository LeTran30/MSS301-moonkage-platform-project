import { useOutletContext } from 'react-router-dom';
import type { SellerProfile } from '../../features/seller';

interface SellerContext {
  profile: SellerProfile;
  /** Loads the profile again (after re-submitting, after paying the fee). */
  reload: () => void;
}

/** The seller profile the layout loaded (state, shop name, ways of selling). */
export const useSellerContext = () => useOutletContext<SellerContext>().profile;
export const useSellerReload = () => useOutletContext<SellerContext>().reload;
