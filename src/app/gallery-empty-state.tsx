export function GalleryEmptyState() {
  return (
    <section
      aria-labelledby="empty-gallery-title"
      className="rounded-lg border border-brass-dim/60 bg-floor/60 p-6"
    >
      <h2
        className="font-display text-2xl text-spotlight"
        id="empty-gallery-title"
      >
        No published artifacts yet
      </h2>
      <p className="mt-4 leading-7 text-ink-muted">
        The approved Sanity dataset is connected, but it has no published artifacts yet.
      </p>
    </section>
  );
}
