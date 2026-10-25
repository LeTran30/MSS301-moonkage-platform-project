import { useDisclosure } from '../../../shared/ui';
import { useDeliveryArea } from '../model/useDeliveryArea';
import { areaStrings } from '../strings';

/**
 * "Giao tới Hà Nội ▾" of the utility bar (M1.1 as a popover): one list of provinces, closes on choice, Escape or a
 * click outside. `variant="link"` is the "Chọn khu vực giao" link inside the home hero.
 */
export function AreaPicker({ variant = 'bar', label }: { variant?: 'bar' | 'link'; label?: string }) {
  const { area, provinces, setArea } = useDeliveryArea();
  const { open, toggle, close, ref, id: listId } = useDisclosure();

  return (
    <div className={`area-picker area-picker--${variant}`} ref={ref}>
      <button type="button" className="area-picker__toggle" aria-expanded={open} aria-controls={listId} onClick={toggle}>
        {variant === 'bar' ? (
          <>
            <svg className="mk-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            {areaStrings.deliverTo}: <strong>{area}</strong>
            <svg className="mk-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </>
        ) : (
          (label ?? areaStrings.choose)
        )}
      </button>
      {open && (
        <div id={listId} className="area-picker__menu" role="group" aria-label={areaStrings.menuLabel}>
          <p className="caption-text">{areaStrings.menuHint}</p>
          {provinces.map((p) => (
            <button
              key={p}
              type="button"
              className="area-picker__option"
              aria-pressed={p === area}
              onClick={() => {
                setArea(p);
                close();
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
