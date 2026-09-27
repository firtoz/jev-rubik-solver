import recordings from '../../lib/article-matched-recordings.json';
import { ComparisonDemo, type Recording } from './ScrollDemo';
export default function RecordedComparison() {
  return <ComparisonDemo recordings={recordings.recordings as unknown as Recording[]} latest />;
}
