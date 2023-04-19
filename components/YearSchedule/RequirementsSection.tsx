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
import { classNames, Schedule } from 'plancrimson-utils';
import {
  GroupResult,
  Requirement,
  RequirementGroup,
  SampleSchedule,
} from '@/src/requirements/util';
import ExternalLink from '../ExternalLink';
import FadeTransition from '../FadeTransition';
import RequirementGroupComponent from './RequirementsDisplay';
import { allRequirements } from '@/src/requirements';
import { handleError, useAppDispatch, useAppSelector } from '@/src/hooks';
import {
  Auth, Planner, Schedules, Settings,
} from '@/src/features';
import { selectShowReqs } from '@/src/features/semesterFormat';


interface RequirementsSectionProps {
  selectedRequirements: RequirementGroup;
  setSelectedRequirements: React.Dispatch<RequirementGroup>;
  validationResults: GroupResult | null;
  highlightedRequirement: Requirement | undefined;
  highlightRequirement: React.Dispatch<React.SetStateAction<Requirement | undefined>>;
}

export default function RequirementsSection({
  selectedRequirements: selectedReqGroup,
  setSelectedRequirements,
  validationResults,
  highlightedRequirement,
  highlightRequirement,
}: RequirementsSectionProps) {
  const dispatch = useAppDispatch();
  const showReqs = useAppSelector(selectShowReqs);
  const topRef = useRef<HTMLDivElement>(null!);
  const bottomRef = useRef<HTMLDivElement>(null!);
  const [topIntersecting, setTopIntersecting] = useState(false);
  const [bottomIntersecting, setBottomIntersecting] = useState(false);
  const [notification, setNotification] = useState(true);

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
    <div className={classNames(
      showReqs && 'md:rounded-lg',
      'relative mb-12 md:mb-0 border-gray-light space-y-4 md:border-2 md:shadow-lg sm:overflow-auto sm:resize-x',
      'md:max-w-xs lg:max-w-sm xl:max-w-md w-screen', // container effect
    )}
    >
      <div className="flex flex-col space-y-4 md:absolute md:inset-4">
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
          <div className="flex items-center">
            <Listbox.Button className="flex w-full items-center justify-between rounded border-2 px-3 py-2 text-left font-medium shadow">
              {selectedReqGroup.groupId}
              <FaChevronDown />
            </Listbox.Button>

            <button
              type="button"
              className="interactive ml-4 rounded-xl p-2"
              onClick={() => dispatch(Planner.setShowReqs(false))}
              title="Hide requirements panel"
            >
              <FaAngleDoubleRight />
            </button>
          </div>

          <FadeTransition>
            <Listbox.Options className="absolute z-20 w-full overflow-hidden rounded-b-lg border bg-black shadow">
              {allRequirements.map(({ groupId }) => (
                <Listbox.Option
                  key={groupId}
                  value={groupId}
                  className="interactive cursor-pointer px-4 py-2 odd:bg-gray-light even:bg-white"
                >
                  {groupId}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </FadeTransition>
        </Listbox>

        <Disclosure>
          <Disclosure.Button className="interactive mx-auto w-max px-4 py-2 text-sm leading-none text-gray-dark underline">
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
            <Disclosure.Button className="interactive pl-2 text-sm leading-none text-gray-dark underline">
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
          <div className="relative mx-4 rounded-lg bg-blue-light px-6 py-2 text-left text-sm italic md:mx-0 lg:py-4">
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
              className="interactive absolute right-2 top-2 text-xl not-italic"
            >
              <FaTimes />
            </button>
          </div>
        </FadeTransition>

        <div className="relative flex-1">
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
}


function SuggestionForm() {
  const uid = Auth.useAuthProperty('uid');
  const email = Auth.useAuthProperty('email');

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
    async (ev: any) => {
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
            'flex-1 appearance-none border rounded w-full py-1 px-2 text-gray-dark',
            'focus:outline-none focus:shadow-lg shadow transition-shadow max-w-[16rem]',
          )}
        />
        <button
          type="submit"
          className="group relative ml-2 rounded bg-black/30 p-2 transition-colors hover:bg-black/50"
        >
          <FaEnvelope />
          <span className="absolute right-0 top-full z-10 mt-2 hidden w-32 rounded bg-black/80 p-2 text-sm text-white group-hover:block">
            Your email will be recorded when making a suggestion.
          </span>
        </button>
      </form>
      <FadeTransition show={show}>
        <p className="mt-1 pl-2 text-center text-xs text-gray-dark">
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
    })));
    const schedules = await Promise.all(promises);

    try {
      dispatch(Planner.showSelected());
      schedules.forEach((s) => {
        const { year, season, title: id } = s.payload as Schedule;
        dispatch(Settings.chooseSchedule({
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
        className="interactive font-medium"
      >
        Clone
      </button>
      <a
        href={schedule.source}
        target="_blank"
        rel="noopener noreferrer"
        className="interactive font-medium"
      >
        Source
      </a>
    </div>
  );
}
