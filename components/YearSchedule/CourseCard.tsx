import React, { createRef, useState } from 'react';
import { Class } from '../../shared/apiTypes';
import { getClassId } from '../../src/util';

export type DragStatus = {
  dragging: false;
} | {
  dragging: true;
  data: {
    classId: string;
    originScheduleId: string;
  };
};

type Props = {
  course: Class;
  setDragStatus: React.Dispatch<React.SetStateAction<DragStatus>>;
  scheduleId: string;
};

const CourseCard: React.FC<Props> = function ({ course, setDragStatus, scheduleId }) {
  const {
    SUBJECT: subject,
    CATALOG_NBR: catalogNumber,
    IS_SCL_DESCR100: title,
    IS_SCL_MEETING_PAT: schedule,
    IS_SCL_TIME_START: startTime,
    IS_SCL_TIME_END: endTime,
    HU_STRM_CLASSNBR: classKey,
  } = course;
  const [open, setOpen] = useState(false);
  const cardRef = createRef<HTMLButtonElement>();

  return (
    <button
      type="button"
      className="h-40 w-40 bg-transparent outline-none"
      onClick={() => setOpen(!open)}
      style={{
        perspective: '100rem',
      }}
      ref={cardRef}
      draggable
      onDragStart={(ev) => {
        // eslint-disable-next-line no-param-reassign
        ev.dataTransfer.dropEffect = 'move';
        setDragStatus({
          dragging: true,
          data: { classId: getClassId(course), originScheduleId: scheduleId },
        });
      }}
    >
      <div
        className="relative w-full h-full transition-transform"
        style={{
          transform: open ? 'rotateY(0.5turn)' : '',
          transformStyle: 'preserve-3d',
        }}
      >
        <div className="bg-green-500 text-sm rounded absolute inset-0 flex flex-col items-center justify-center" style={{ backfaceVisibility: 'hidden' }}>
          <p>{`${subject}${catalogNumber}`}</p>
          <div>
            <p>
              {title}
            </p>
            <p>
              {`${schedule} ${startTime}–${endTime}`}
            </p>
          </div>
        </div>
        <div className="bg-blue-500 rounded absolute w-full h-full flex flex-col items-center justify-center" style={{ transform: 'rotateY(0.5turn)', backfaceVisibility: 'hidden' }}>
          {`${subject}${catalogNumber}`}
          <br />
          {classKey}
        </div>
      </div>
    </button>
  );
};

export default CourseCard;
