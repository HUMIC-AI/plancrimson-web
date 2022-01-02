import React, { useEffect, useRef, useState } from 'react';
import { Listbox } from '@headlessui/react';
import { FaChevronDown, FaTimes } from 'react-icons/fa';
import { RequirementsMet, allRequirements } from '../../src/requirements';
import { RequirementGroup } from '../../src/requirements/util';
import ExternalLink from '../ExternalLink';
import FadeTransition from '../FadeTransition';
import RequirementsDisplay from './RequirementsDisplay';
import { classNames } from '../../shared/util';

type RequirementsSectionProps = {
  selectedRequirements: RequirementGroup;
  setSelectedRequirements: React.Dispatch<RequirementGroup>;
  validationResults: RequirementsMet;
  setHighlightedClasses: React.Dispatch<React.SetStateAction<string[]>>;
  notification: boolean;
  setNotification: React.Dispatch<React.SetStateAction<boolean>>;
};

const RequirementsSection: React.FC<RequirementsSectionProps> = function ({
  selectedRequirements, setSelectedRequirements, validationResults, setHighlightedClasses, notification, setNotification,
}) {
  const topRef = useRef<HTMLDivElement>(null!);
  const bottomRef = useRef<HTMLDivElement>(null!);
  const [topIntersecting, setTopIntersecting] = useState(false);
  const [bottomIntersecting, setBottomIntersecting] = useState(false);

  useEffect(() => {
    const topObserver = new IntersectionObserver(([{ isIntersecting }]) => {
      setTopIntersecting(isIntersecting);
    });
    topObserver.observe(topRef.current);
    const bottomObserver = new IntersectionObserver(([{ isIntersecting }]) => {
      setBottomIntersecting(isIntersecting);
    });
    bottomObserver.observe(bottomRef.current);
    return () => {
      topObserver.disconnect();
      bottomObserver.disconnect();
    };
  }, []);

  return (
    <div className="relative mb-12 md:mb-0 border-gray-200 space-y-4 md:border-2 md:rounded-lg md:shadow-lg md:max-w-xs lg:max-w-sm xl:max-w-md w-screen">
      <div className="md:absolute md:inset-4 flex flex-col gap-4">
        <Listbox
          value={selectedRequirements.groupId}
          onChange={(groupId) => setSelectedRequirements(
            allRequirements.find((requirements) => requirements.groupId === groupId)!,
          )}
          as="div"
          className="relative"
        >
          <Listbox.Button className="shadow py-2 px-3 border-2 rounded w-full text-left flex justify-between items-center font-medium">
            {selectedRequirements.groupId}
            <FaChevronDown />
          </Listbox.Button>
          <FadeTransition>
            <Listbox.Options className="absolute w-full bg-gray-800 rounded-b-lg overflow-hidden shadow border z-20">
              {allRequirements.map(({ groupId }) => (
                <Listbox.Option key={groupId} value={groupId} className="odd:bg-gray-300 even:bg-white hover:opacity-50 transition-opacity py-2 px-4 font-medium cursor-pointer">
                  {groupId}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </FadeTransition>
        </Listbox>

        <FadeTransition show={notification}>
          <div className="relative rounded-lg bg-blue-300 py-2 px-6">
            <span className="text-sm text-left italic">
              Remember that this is an unofficial tool
              {' '}
              <strong>only</strong>
              {' '}
              and is not affiliated with Harvard. For up-to-date requirements,
              consult the
              {' '}
              <ExternalLink href="https://handbook.college.harvard.edu/">Harvard College Student Handbook</ExternalLink>
              {' '}
              or your Advising Report, which can be found by going to
              {' '}
              <ExternalLink href="https://my.harvard.edu/">my.harvard</ExternalLink>
              {' '}
              and clicking on &ldquo;My Program&rdquo;.
            </span>
            <button
              type="button"
              onClick={() => setNotification(false)}
              className="absolute top-2 right-2 text-xl hover:opacity-50 transition-opacity"
            >
              <FaTimes />
            </button>
          </div>
        </FadeTransition>

        <div className="flex-1 relative">
          <div className={classNames(
            'md:absolute md:inset-0 overflow-y-auto box-content md:border-black md:border-dashed',
            !topIntersecting && 'md:border-t-2',
            !bottomIntersecting && 'md:border-b-2',
          )}
          >
            <div ref={topRef} id="topIntersection" />
            <RequirementsDisplay
              depth={0}
              requirements={selectedRequirements}
              validationResults={validationResults}
              setHighlightedClasses={setHighlightedClasses}
            />
            <div ref={bottomRef} id="bottomIntersection" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequirementsSection;
