import { Doorway } from "@/components/Doorway";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-start gap-6 px-6 py-24 sm:px-10">
      <p className="font-mono text-xs uppercase tracking-[0.24em] text-brass">
        Wing closed · exhibit not catalogued
      </p>
      <h1 className="font-display text-4xl text-spotlight sm:text-5xl">
        This exhibit was never finished.
      </h1>
      <p className="max-w-xl text-lg leading-8 text-ink-muted">
        The case you are looking for is either still on the workbench or was
        never accessioned into this wing of the museum.
      </p>
      <Doorway href="/" label="Back to the hall" />
    </div>
  );
}
