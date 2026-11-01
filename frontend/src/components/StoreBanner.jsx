export function StoreBanner({
  image,
  alt,
  eyebrow,
  title,
  description,
  children,
  className = "",
}) {
  return (
    <section className={`store-banner ${className}`}>
      <img
        className="store-banner-image"
        src={`https://images.unsplash.com/${image}?auto=format&fit=crop&w=2000&q=85`}
        alt={alt}
        fetchPriority="high"
      />
      <div className="store-banner-shade" />
      <div className="store-banner-content">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && (
          <p className="store-banner-description">{description}</p>
        )}
        {children}
      </div>
    </section>
  );
}
