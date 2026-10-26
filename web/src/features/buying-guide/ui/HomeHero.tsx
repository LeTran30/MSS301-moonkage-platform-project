import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '../../../shared/config/routes';
import { guideStrings as s } from '../strings';

/**
 * Hero of M1.0: one 16:9 photo across the whole screen with the text block in the middle; the title is the
 * page's one `display` in `brand`. Until Moonkage has its photo the frame stays `surface-muted` (DS: no stand-in
 * pictures). `areaPrompt` is the "Chưa chọn nơi giao?" line for a visitor who has not chosen an area.
 */
export function HomeHero({ area, photo, areaPrompt }: { area: string; photo?: string; areaPrompt?: ReactNode }) {
  return (
    <section className={`home-hero${photo ? ' home-hero--photo' : ''}`} aria-labelledby="hero-title">
      {photo && <img className="home-hero__photo" src={photo} alt="" />}
      <div className="home-hero__text">
        <h1 id="hero-title" className="home-hero__title">
          {s.heroTitle(area)}
        </h1>
        <p className="home-hero__lead">{s.heroLead}</p>
        {areaPrompt}
        <div className="home-hero__actions">
          <Link to={routes.products} className="mk-btn mk-btn--primary">
            {s.heroAvailable}
          </Link>
          <Link to={routes.customOrder} className="mk-btn mk-btn--outline">
            {s.heroCustom}
          </Link>
        </div>
      </div>
      {!photo && <p className="home-hero__note">{s.heroPhotoNote}</p>}
    </section>
  );
}
