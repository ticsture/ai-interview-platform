// PracticePage: thin server component wrapper that renders the client logic.
// Keeping the separation allows future server-side data prefetch if needed.
import PracticeClient from "./PracticeClient";

export default function PracticePage() {
  return <PracticeClient />;
}
