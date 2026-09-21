import type { JevRequest } from '../../lib/types';
import fixture from '../../lib/article-case.json';
import { RequestView, FieldValue } from './RequestView';
export function TestingStory() {
  return (
    <div className="testing-story">
      <div className="test-step">
        <span className="test-step-number">1</span>
        <div>
          <h3>Hold the earlier decisions fixed</h3>
          <p>
            For the middle-edge extraction test, we supplied the goal, target and extraction
            intention. The only answer being scored was the reference face. This kept
            target-selection errors out of the measurement.
          </p>
          <div className="test-fixture">
            <small>RECORDED DEVELOPMENT CASE 09</small>
            <dl>
              <div>
                <dt>Goal supplied</dt>
                <dd>middle-layer</dd>
              </div>
              <div>
                <dt>Chosen piece</dt>
                <dd>FR (green / red edge)</dd>
              </div>
              <div>
                <dt>Current position</dt>
                <dd>BR · back right</dd>
              </div>
              <div>
                <dt>Destination</dt>
                <dd>FR · front right</dd>
              </div>
              <div>
                <dt>Intention supplied</dt>
                <dd>extract</dd>
              </div>
              <div>
                <dt>Question</dt>
                <dd>Which face should become the reference front?</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
      <div className="test-step">
        <span className="test-step-number">2</span>
        <div>
          <h3>Work out the acceptable answer offline</h3>
          <p>
            The extraction needs the occupied slot at local FR. Making the original right face the
            reference front puts this BR slot there, so the expected answer is R. The evaluator also
            applies an extraction offline to check that the edge reaches U and the completed first
            layer stays intact. Neither the expected answer nor the simulated outcome is sent to
            JEV.
          </p>
          <div className="story-flow">
            <div>
              <small>ORIGINAL FRAME</small>
              <code>occupied slot = BR</code>
            </div>
            <span aria-hidden="true">→</span>
            <div>
              <small>REFERENCE R</small>
              <code>occupied slot = local FR</code>
            </div>
          </div>
        </div>
      </div>
      <div className="test-step">
        <span className="test-step-number">3</span>
        <div>
          <h3>Compare the actual responses</h3>
          <p>
            The baseline received four reference views, including the piece’s current position and
            destination in each. It chose F in this case. That choice is consistent with using the
            destination, though the response does not tell us its reasoning. The revision made the
            current-slot mapping explicit.
          </p>
          <div className="test-outputs">
            <div>
              <small>ORIGINAL QUESTION</small>
              <strong>
                F <span>incorrect</span>
              </strong>
              <p>Provider confidence: 0.49</p>
            </div>
            <div>
              <small>EXPLICIT SLOT RULE</small>
              <strong>
                R <span>accepted</span>
              </strong>
              <p>Provider confidence: 0.88</p>
            </div>
          </div>
          <p>
            The revised rule includes: “current FR requires front F; current BR requires front R;
            current BL requires front B; current FL requires front L.” JEV still reads the current
            slot and chooses the face.
          </p>
          {(['baseline', 'revised'] as const).map((key) => (
            <details key={key}>
              <summary>
                {key === 'baseline' ? 'Original' : 'Revised'} case 09: exact request and response
              </summary>
              <RequestView request={fixture[key].request as JevRequest} />
              <h4>Recorded native response</h4>
              <FieldValue value={fixture[key].response} />
            </details>
          ))}
        </div>
      </div>
      <div className="test-step">
        <span className="test-step-number">4</span>
        <div>
          <h3>Check more than the example that failed</h3>
          <p>
            Each development variant saw 20 different states, with five targets in each middle slot.
            Every target was away from its destination, and every cube had a completed first layer.
            We then checked the selected wording on 20 fresh validation states. There was one run
            per case, rather than 20 repetitions of the same request.
          </p>
          <div className="test-table">
            <table>
              <thead>
                <tr>
                  <th>Reference question variant</th>
                  <th>Development</th>
                  <th>Validation</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Original wording</td>
                  <td>16 / 20</td>
                  <td>13 / 20</td>
                </tr>
                <tr className="winner">
                  <td>Explicit current-slot mapping</td>
                  <td>20 / 20</td>
                  <td>20 / 20</td>
                </tr>
                <tr>
                  <td>Read position, then use full views</td>
                  <td>5 / 20</td>
                  <td>Not run</td>
                </tr>
                <tr>
                  <td>Read position, then use that observation only</td>
                  <td>19 / 20</td>
                  <td>Not run</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            The extra position-reading call did not automatically help. In the full-view variant,
            the position was read correctly in every case, but the following request selected F in
            all 20. We kept the explicit mapping and tested operation selection separately before
            integrating it.
          </p>
          <p className="fine-print">
            Source: extraction-reference-v1 development and validation records. These results cover
            extraction frames with the target and intention supplied. They do not establish accuracy
            for choosing a target or for flipped edges already in their home slot.
          </p>
        </div>
      </div>
    </div>
  );
}
