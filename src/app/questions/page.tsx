// QuestionsPage: server component wrapper around the client-side CRUD UI.
// Keeps boundary clean if we add server-side prefetch or streaming later.
import QuestionsClient from "./QuestionsClient";

export default function QuestionsPage() {
  return <QuestionsClient />;
}
