import React from 'react';
import { Evaluation } from '../../shared/apiTypes';
import { allTruthy } from '../../shared/util';
import Percentages from './Percentages';

const EvaluationComponent: React.FC<{ report: Evaluation }> = function ({ report }) {
  const hoursData = report['On average, how many hours per week did you spend on coursework outside of class? Enter a whole number between 0 and 168.'];

  return (
    <div className="flex flex-col items-stretch gap-4">
      <div className="flex justify-between items-center border-black border-b-2 pb-2">
        <h3 className="font-bold">
          {`${report.year} ${report.season}`}
        </h3>
        <a href={report.url} className="text-blue-300 hover:text-blue-500" target="_blank" rel="noreferrer">
          View report
        </a>
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
            {`Mean: ${hoursData.mean} | Median: ${hoursData.median} | Mode: ${hoursData.mode} | Stdev: ${hoursData.stdev}`}
          </p>
        </div>
      )}
    </div>
  );
};

export default EvaluationComponent;
