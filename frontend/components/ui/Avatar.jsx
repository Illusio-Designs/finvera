export default function Avatar({
  src,
  alt = 'Avatar',
  name,
  size = 'md',
  className = '',
}) {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  };

  const initials = (name || alt || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full bg-primary-50 text-primary-700 overflow-hidden border border-gray-200 ${sizes[size]} ${className}`}
      title={name || alt}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <span className="font-semibold">{initials || '?'}</span>
      )}
    </div>
  );
}
