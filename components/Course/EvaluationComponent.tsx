import React from 'react';
import { Evaluation } from '../../shared/apiTypes';
import { allTruthy } from '../../shared/util';
import ExternalLink from '../ExternalLink';
import Percentages from './Percentages';

const EvaluationComponent: React.FC<{ report: Evaluation }> = function ({ report }) {
  const hoursData = report['On average, how many hours per week did you spend on coursework outside of class? Enter a whole number between 0 and 168.'];

  return (
    <div className="flex flex-col items-stretch gap-4">
      <div className="flex justify-between items-center border-black border-b-2 pb-2">
        <h3 className="font-bold">
          {`${report.year} ${report.season}`}
        </h3>
        <ExternalLink href={report.url}>
          View report
        </ExternalLink>
      </div>

      <div>
        <h4 className="font-bold">Recommendations</h4>
        <Percentages categories={allTruthy(report['How strongly would you recommend this course to your peers?']?.recommendations || [])} />
      </div>

      <div>
        <h4 className="font-bold">Overall evaluation</h4>
        <Percentages categories={(allTruthy(report['Course General Questions']?.['Evaluate the course overall.'].votes || [])).slice().reverse()} />
      </div>

      {hoursData && (
        <div>
          <h4 className="font-bold">Hours per week (outside of class)</h4>
          <p>
            {`Mean: ${hoursData.mean?.toFixed(2)} | Median: ${hoursData.median?.toFixed(2)} | Mode: ${hoursData.mode?.toFixed(2)} | Stdev: ${hoursData.stdev?.toFixed(2)}`}
          </p>
        </div>
      )}
    </div>
  );
};

export default EvaluationComponent;
