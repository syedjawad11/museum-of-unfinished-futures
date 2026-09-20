export function GalleryEmptyState() {
  return (
    <section
      aria-labelledby="empty-gallery-title"
      className="rounded-lg border border-[#d7cec0] bg-[#fffaf1] p-6"
    >
      <h2 className="text-2xl font-semibold text-[#172026]" id="empty-gallery-title">
        No published artifacts yet
      </h2>
      <p className="mt-4 leading-7 text-[#44505a]">
        The approved Sanity dataset is connected, but it has no published artifacts yet.
      </p>
    </section>
  );
}
