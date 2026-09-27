import { VerifiedFlow } from '../components/VerifiedFlow';
import { createFileRoute, Link } from '@tanstack/react-router';
import '../flow.css';
export const Route = createFileRoute('/request-flow')({
  component: FlowViewer,
  head: () => ({ meta: [{ title: 'Inside the article’s solve | JEV Cube Lab' }] }),
});
function FlowViewer() {
  return (
    <div className="flow-theme">
      <header className="flow-article-header">
        <Link to="/how-it-works">JEV / CUBE LAB</Link>
        <Link to="/how-it-works" hash="start">
          Back to the article
        </Link>
      </header>
      <VerifiedFlow recordingUrl="/recordings/article-best-flow.json" />
    </div>
  );
}
