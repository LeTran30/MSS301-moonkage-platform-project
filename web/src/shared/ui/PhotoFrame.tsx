/**
 * Image area of a card or gallery. Shows the photo when there is one; otherwise a sunk frame with the label, so a
 * missing photo never looks like a real product.
 */
export function PhotoFrame({
  src,
  alt,
  label,
  ratio = '1 / 1',
  className = '',
}: {
  src?: string;
  alt: string;
  label?: string;
  ratio?: string;
  className?: string;
}) {
  return (
    <div className={`photo-frame ${className}`} style={{ aspectRatio: ratio }}>
      {src ? <img src={src} alt={alt} loading="lazy" /> : <span className="photo-frame__label">{label ?? alt}</span>}
    </div>
  );
}
