/**
 * Small mono accession tag. Renders the accessionNote verbatim — it never
 * invents a catalogue number that is not present in the content.
 */
export function AccessionTag({ accessionNote }: { accessionNote: string }) {
  return (
    <p className="inline-block rounded-sm border border-brass/50 bg-hall/60 px-2 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-brass">
      {accessionNote}
    </p>
  );
}
