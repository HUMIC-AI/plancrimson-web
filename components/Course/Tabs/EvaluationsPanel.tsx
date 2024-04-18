import { Tab } from '@headlessui/react';
import {
  Evaluation,
  getEvaluationId,
} from '@/src/lib';
import { EvaluationComponent } from './EvaluationComponent';

type Props = {
  evaluations: Evaluation[];
};

export default function EvaluationsPanel({ evaluations }: Props) {
  return (
    <Tab.Panel>
      {evaluations.length > 0 ? (
        <ul className="space-y-4">
          {evaluations.map((val) => (
            <li key={getEvaluationId(val)}>
              <EvaluationComponent report={val} />
            </li>
          ))}
        </ul>
      ) : (
        <p>No evaluations found.</p>
      )}
    </Tab.Panel>
  );
}
