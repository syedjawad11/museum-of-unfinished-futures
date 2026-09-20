import { metadata, viewport } from "next-sanity/studio";
import { EmbeddedStudio } from "./embedded-studio";

export { metadata, viewport };

export default function StudioPage() {
  return <EmbeddedStudio />;
}
