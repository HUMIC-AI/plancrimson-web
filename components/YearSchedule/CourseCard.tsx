import React, { createRef, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { Class } from '../../shared/apiTypes';
import useUserData from '../../src/context/userData';
import { classNames, getClassId } from '../../src/util';

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
  highlight?: boolean;
};

const CourseCard: React.FC<Props> = function ({
  course, setDragStatus, scheduleId, highlight,
}) {
  const {
    SUBJECT: subject,
    CATALOG_NBR: catalogNumber,
    IS_SCL_DESCR100: title,
    IS_SCL_MEETING_PAT: schedule,
    IS_SCL_TIME_START: startTime,
    IS_SCL_TIME_END: endTime,
    HU_STRM_CLASSNBR: classKey,
  } = course;
  const { removeCourses } = useUserData();
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
        <button type="button" className="absolute top-2 right-2 text-black z-20" onClick={() => removeCourses({ classId: getClassId(course), scheduleId })}>
          <FaTimes />
        </button>
        <div
          className={classNames(
            'text-sm rounded-md absolute inset-0 flex flex-col items-center justify-center',
            highlight ? 'bg-yellow-500' : 'bg-green-500',
          )}
          style={{ backfaceVisibility: 'hidden' }}
        >
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
        <div
          className="bg-blue-500 rounded-md absolute w-full h-full flex flex-col items-center justify-center"
          style={{ transform: 'rotateY(0.5turn)', backfaceVisibility: 'hidden' }}
        >
          {`${subject}${catalogNumber}`}
          <br />
          {classKey}
        </div>
      </div>
    </button>
  );
};

export default CourseCard;
