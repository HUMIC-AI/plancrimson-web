import React, {
  useCallback, useEffect, useRef, useState,
} from 'react';
import { Disclosure, Listbox } from '@headlessui/react';
import {
  FaAngleDoubleRight, FaChevronDown, FaEnvelope, FaTimes,
} from 'react-icons/fa';
import {
  arrayUnion,
  doc,
  getDoc,
  getFirestore,
  setDoc,
} from 'firebase/firestore';
import {
  GroupResult,
  Requirement,
  RequirementGroup,
  SampleSchedule,
} from '../../src/requirements/util';
import ExternalLink from '../ExternalLink';
import FadeTransition from '../FadeTransition';
import RequirementGroupComponent from './RequirementsDisplay';
import { allTruthy, classNames } from '../../shared/util';
import { allRequirements } from '../../src/requirements';
import { handleError, useAppDispatch, useAppSelector } from '../../src/hooks';
import { Auth, Planner, Schedules } from '../../src/features';

interface RequirementsSectionProps {
  selectedRequirements: RequirementGroup;
  setSelectedRequirements: React.Dispatch<RequirementGroup>;
  validationResults: GroupResult | null;
  highlightedRequirement: Requirement | undefined;
  highlightRequirement: React.Dispatch<
  React.SetStateAction<Requirement | undefined>
  >;
  notification: boolean;
  setNotification: React.Dispatch<React.SetStateAction<boolean>>;
}

function SuggestionForm() {
  const uid = useAppSelector(Auth.selectUserUid);
  const email = useAppSelector(Auth.selectEmail);

  const timeoutRef = useRef<number>();

  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [show, setShow] = useState(false);

  const showMessage = useCallback(() => {
    setShow(true);
    timeoutRef.current = setTimeout(() => {
      setShow(false);
      setTimeout(() => {
        timeoutRef.current = undefined;
      }, 1000);
    }, 2000) as unknown as number;
  }, []);

  const submitSuggestion = useCallback(
    async (ev) => {
      ev.preventDefault();
      // only allow user to submit every 2 seconds
      if (typeof timeoutRef.current !== 'undefined') return;
      if (!uid) {
        setSuggestion('You must be logged in to give suggestions!');
        showMessage();
        return;
      }

      const program = new FormData(ev.currentTarget)
        .get('program')
        ?.toString()
        .trim()
        .toLowerCase();
      if (!program) return;

      const db = getFirestore();
      try {
        const existing = await getDoc(doc(db, 'suggestions', uid));
        const suggestions: string[] | undefined = existing.get('suggestions');
        if (suggestions && suggestions.length >= 10) {
          setSuggestion(
            'You may only make up to ten suggestions. Please check back later.',
          );
        } else if (suggestions?.includes(program)) {
          setSuggestion('You have already suggested that program!');
        } else {
          await setDoc(
            existing.ref,
            {
              suggestions: arrayUnion(program),
              userEmail: email,
            },
            { merge: true },
          );
          setSuggestion(
            `Suggestion successfully recorded! (${
              (suggestions?.length || 0) + 1
            }/10)`,
          );
        }
      } catch (err) {
        console.error('error updating suggestion', err);
        setSuggestion(
          'There was an error recording your suggestion. Please try again.',
        );
      } finally {
        showMessage();
      }
    },
    [email, uid],
  );

  return (
    <div>
      <form className="flex justify-center" onSubmit={submitSuggestion}>
        <input
          type="text"
          name="program"
          id="program"
          placeholder="Program"
          className={classNames(
            'flex-1 appearance-none border rounded w-full py-1 px-2 text-gray-700',
            'focus:outline-none focus:shadow-lg shadow transition-shadow max-w-[16rem]',
          )}
        />
        <button
          type="submit"
          className="ml-2 p-2 rounded bg-black bg-opacity-30 hover:bg-opacity-50 transition-colors relative group"
        >
          <FaEnvelope />
          <span className="hidden text-sm group-hover:block absolute top-full mt-2 right-0 bg-black bg-opacity-80 text-white z-10 w-32 p-2 rounded">
            Your email will be recorded when making a suggestion.
          </span>
        </button>
      </form>
      <FadeTransition show={show}>
        <p className="text-gray-600 text-xs pl-2 mt-1 text-center">
          {suggestion}
        </p>
      </FadeTransition>
    </div>
  );
}

interface SampleScheduleEntryProps {
  schedule: SampleSchedule;
}

function SampleScheduleEntry({ schedule }: SampleScheduleEntryProps) {
  const dispatch = useAppDispatch();
  const sampleSchedule = useAppSelector(Planner.selectSampleSchedule);

  const isSelected = sampleSchedule?.name === schedule.name;

  async function clone() {
    const promises = schedule.schedules.map((s) => dispatch(Schedules.createSchedule({
      ...s,
      title: `${s.title} (${schedule.id})`,
      force: true,
    })));
    const schedules = await Promise.all(promises);

    try {
      const errors = allTruthy(schedules.map(({ payload }) => ('errors' in payload ? payload.errors : null)));
      if (errors.length) {
        throw new Error(errors.map((err) => err.join(', ')).join('; '));
      }
      dispatch(Planner.showSelected());
      schedules.forEach((s) => {
        const { year, season, title: id } = s.payload as Schedules.CreateSchedulePayload;
        dispatch(Schedules.chooseSchedule({
          term: `${year}${season}`,
          scheduleId: id,
        }));
      });
      alert('Cloned successfully!');
    } catch (err) {
      handleError(err);
    }
  }

  return (
    <div className="flex items-center space-x-4">
      <button
        type="button"
        className={classNames(
          isSelected && 'font-bold',
          'text-left interactive',
        )}
        onClick={() => {
          if (isSelected) {
            dispatch(Planner.showSelected());
          } else {
            dispatch(Planner.showSample(schedule));
          }
        }}
      >
        {schedule.name}
      </button>
      <button
        type="button"
        onClick={clone}
        className="font-medium interactive"
      >
        Clone
      </button>
      <a
        href={schedule.source}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium interactive"
      >
        Source
      </a>
    </div>
  );
}

const RequirementsSection: React.FC<RequirementsSectionProps> = function ({
  selectedRequirements: selectedReqGroup,
  setSelectedRequirements,
  validationResults,
  highlightedRequirement,
  highlightRequirement,
  notification,
  setNotification,
}) {
  const dispatch = useAppDispatch();
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
    <div className="relative mb-12 md:mb-0 border-gray-300 space-y-4 md:border-2 md:rounded-lg md:shadow-lg md:max-w-xs lg:max-w-sm xl:max-w-md w-screen sm:overflow-auto sm:resize-x">
      <div className="md:absolute md:inset-4 flex flex-col space-y-4">
        <Listbox
          value={selectedReqGroup.groupId}
          onChange={(groupId) => setSelectedRequirements(
            allRequirements.find(
              (requirements) => requirements.groupId === groupId,
            )!,
          )}
          as="div"
          className="relative"
        >
          <div className="flex space-x-4 items-center">
            <Listbox.Button className="flex justify-between items-center w-full shadow py-2 px-3 border-2 rounded text-left font-medium">
              {selectedReqGroup.groupId}
              <FaChevronDown />
            </Listbox.Button>
            <button
              type="button"
              className="interactive"
              onClick={() => dispatch(Planner.setShowReqs(false))}
              title="Hide requirements panel"
            >
              <FaAngleDoubleRight />
            </button>
          </div>
          <FadeTransition>
            <Listbox.Options className="absolute w-full bg-gray-800 rounded-b-lg overflow-hidden shadow border z-20">
              {allRequirements.map(({ groupId }) => (
                <Listbox.Option
                  key={groupId}
                  value={groupId}
                  className="odd:bg-gray-300 even:bg-white interactive py-2 px-4 cursor-pointer"
                >
                  {groupId}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </FadeTransition>
        </Listbox>

        <Disclosure>
          <Disclosure.Button className="leading-none text-sm underline text-gray-600 py-2 interactive w-max mx-auto px-4">
            Suggest new programs and concentrations
          </Disclosure.Button>
          <FadeTransition>
            <Disclosure.Panel className="px-4">
              <SuggestionForm />
            </Disclosure.Panel>
          </FadeTransition>
        </Disclosure>

        {selectedReqGroup.sampleSchedules && (
          <Disclosure>
            <Disclosure.Button className="leading-none text-sm underline text-gray-600 pl-2 interactive">
              Sample schedules
            </Disclosure.Button>
            <FadeTransition>
              <Disclosure.Panel className="px-4 text-sm">
                <ul>
                  {selectedReqGroup.sampleSchedules.map((schedule) => (
                    <li key={schedule.name}>
                      <SampleScheduleEntry schedule={schedule} />
                    </li>
                  ))}
                </ul>
              </Disclosure.Panel>
            </FadeTransition>
          </Disclosure>
        )}

        <FadeTransition show={notification}>
          <div className="relative rounded-lg bg-blue-300 py-2 lg:py-4 px-6 mx-4 md:mx-0 text-sm text-left italic">
            <div className="flex flex-col space-y-2">
              <span>
                Remember that this is an unofficial tool
                {' '}
                <strong>only</strong>
                ,
                is still under development, and is not affiliated with Harvard.
              </span>
              <span>
                For up-to-date requirements, consult the
                {' '}
                <ExternalLink href="https://handbook.college.harvard.edu/">
                  Harvard College Student Handbook
                </ExternalLink>
                {' '}
                or your Advising Report, which can be found by going to
                {' '}
                <ExternalLink href="https://my.harvard.edu/">
                  my.harvard
                </ExternalLink>
                {' '}
                and clicking on &ldquo;My Program&rdquo;.
              </span>
              <span>More concentrations and programs coming soon!</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(false)}
              className="absolute top-2 right-2 not-italic text-xl interactive"
            >
              <FaTimes />
            </button>
          </div>
        </FadeTransition>

        <div className="flex-1 relative">
          <div
            className={classNames(
              'md:absolute md:inset-0 overflow-y-auto box-content md:border-black md:border-dashed',
              !topIntersecting && 'md:border-t-2',
              !bottomIntersecting && 'md:border-b-2',
            )}
          >
            <div ref={topRef} id="topIntersection" />
            <RequirementGroupComponent
              depth={0}
              requirements={selectedReqGroup}
              validationResults={validationResults}
              highlightRequirement={highlightRequirement}
              highlightedRequirement={highlightedRequirement}
            />
            <div ref={bottomRef} id="bottomIntersection" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequirementsSection;
