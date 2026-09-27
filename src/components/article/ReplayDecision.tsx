import type { CubeMoveProgress } from '../Cube';
import actionDetails from '../../lib/article-action-details.json';

/** Factual annotations from the same saved action as the animated move sequence. */
export function ReplayDecision({
  policy,
  index,
  final = false,
  moveProgress,
  settled = false,
}: {
  policy: 'skills' | 'primitive';
  index: number;
  final?: boolean;
  settled?: boolean;
  moveProgress?: CubeMoveProgress;
}) {
  const details = actionDetails[policy],
    detail = details[index];
  if (!detail) return null;
  return (
    <div className="comparison-decision" key={index}>
      <small>{final ? 'FINAL ACTION' : `MOVES FROM ROUND ${index + 1}`}</small>

      <span>{detail.title}</span>
      <p>{detail.context}</p>
      <div className="comparison-decision-moves" aria-label="Chosen moves">
        {detail.alg.split(/\s+/).map((move, i) => (
          <code
            key={i}
            className={
              final || settled || (moveProgress?.key === index && i < moveProgress.done)
                ? 'move-done'
                : moveProgress?.key === index && i === moveProgress.active
                  ? 'move-active'
                  : 'move-pending'
            }
            aria-current={
              !final && !settled && moveProgress?.key === index && i === moveProgress.active
                ? 'step'
                : undefined
            }
          >
            {move}
          </code>
        ))}
      </div>
      {(settled || final) && detail.outcome && <small>Recorded result: {detail.outcome}</small>}
    </div>
  );
}
