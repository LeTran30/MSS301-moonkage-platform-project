import { Link } from 'react-router-dom';
import { useCurrentUser } from '@/entities/user';
import { SellEntryLink } from '@/entities/vendor';
import logoFull from '@/shared/assets/moonkage-logo.png';
import { routes } from '@/shared/config/routes';
import styles from './Footer.module.css';

/**
 * Site footer on `brand` with the full logo, brand note, and utility links.
 */
export function Footer() {
  const session = useCurrentUser();
  const vendorStatus = session?.vendorStatus ?? 'none';

  return (
    <footer className={`${styles.footer} mk-on-brand`}>
      <div className={styles.footerInner}>
        <div className={styles.footerBrand}>
          <img src={logoFull} alt="Moonkage" className={styles.footerLogo} width="96" height="118" />
          <p className={styles.footerNote}>Nền tảng thương mại bánh Trung thu và quà tặng mùa thu.</p>
        </div>
        <nav className={styles.footerLinks} aria-label="Chân trang">
          <SellEntryLink status={vendorStatus} />
          <Link to={routes.base.policy}>Quy định và giải quyết khiếu nại</Link>
        </nav>
      </div>
    </footer>
  );
}
