import { lazy, Suspense } from 'react';
const RequestPermalink = lazy(() => import('../components/RequestPermalink').then(m => ({ default: m.RequestPermalink })));
import { VerifiedFlow } from '../components/VerifiedFlow';
import { createFileRoute, Link } from '@tanstack/react-router';
import '../flow.css';
export const Route = createFileRoute('/request-flow')({
  component: FlowViewer,
  validateSearch: (
    search: Record<string, unknown>,
  ): { recording?: 'primitive' | 'skills'; round?: number; request?: number } => ({
    recording:
      search.recording === 'primitive'
        ? ('primitive' as const)
        : search.recording === 'skills'
          ? ('skills' as const)
          : undefined,
    round:
      Number.isInteger(Number(search.round)) && Number(search.round) > 0 ? Number(search.round) : 1,
    request:
      Number.isInteger(Number(search.request)) && Number(search.request) > 0
        ? Number(search.request)
        : 1,
  }),
  head: () => ({
    meta: [{ title: 'Inside the article’s solve | JEV Cube Lab' }],
    links: [{ rel: 'preload', as: 'fetch', href: `${import.meta.env.BASE_URL}recordings/article-best-flow.json`, crossOrigin: 'anonymous' }],
  }),
});
function FlowViewer() {
  const search = Route.useSearch();
  return (
    <div className="flow-theme">
      <header className="flow-article-header">
        <Link to="/how-it-works">JEV / CUBE LAB</Link>
        <Link to="/how-it-works" hash="start">
          Back to the article
        </Link>
      </header>
      {search.recording === 'primitive' ? (
        <Suspense fallback={<p role="status">Loading saved request…</p>}><RequestPermalink
          policy={search.recording}
          round={search.round ?? 1}
          step={search.request ?? 1}
        /></Suspense>
      ) : (
        <VerifiedFlow
          key={`${search.round}-${search.request}`}
          initialRound={search.recording ? search.round : undefined}
          initialRequest={search.request}
          recordingUrl={`${import.meta.env.BASE_URL}recordings/article-best-flow.json`}
        />
      )}
    </div>
  );
}
