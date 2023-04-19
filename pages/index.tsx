import { where } from 'firebase/firestore';
import {
  useState, useEffect, useMemo, useRef,
} from 'react';
import {
  breakpoints, allTruthy, getUniqueSemesters, compareSemesters,
} from 'plancrimson-utils';
import Layout from '../components/Layout/Layout';
import { Footer } from '../components/Layout/Footer';
import Navbar from '../components/Layout/Navbar';
import { SemestersList } from '../components/YearSchedule/PlanningSection';
import HiddenSchedules from '../components/YearSchedule/HiddenSchedules';
import HeaderSection from '../components/YearSchedule/HeaderSection';
import RequirementsSection from '../components/YearSchedule/RequirementsSection';
import {
  Auth, ClassCache, Planner, Profile, Schedules, Settings,
} from '@/src/features';
import { useAppSelector, useBreakpoint } from '@/src/hooks';
import validateSchedules from '@/src/requirements';
import collegeRequirements from '@/src/requirements/college';
import {
  GroupResult,
  Requirement,
  RequirementGroup,
} from '@/src/requirements/util';
import { SemesterDisplayProps } from '@/components/YearSchedule/SemesterDisplay';
import { classNames } from '@/src/utils';
import { ClassesCloud } from './ClassesCloud';

export default function PlanPage() {
  const userId = Auth.useAuthProperty('uid');
  const profile = useAppSelector(Profile.selectUserProfile);
  const semesterFormat = useAppSelector(Planner.selectSemesterFormat);
  const sampleSchedule = useAppSelector(Planner.selectSampleSchedule);
  const showReqs = useAppSelector(Planner.selectShowReqs);
  const chosenSchedules = useAppSelector(Settings.selectChosenSchedules);
  const schedules = useAppSelector(Schedules.selectSchedules);
  const classCache = useAppSelector(ClassCache.selectClassCache);
  const md = useBreakpoint(breakpoints.md);
  const columns = useColumns();

  const [validationResults, setValidationResults] = useState<GroupResult | null>(null);
  const [selectedRequirements, setSelectedRequirements] = useState<RequirementGroup>(collegeRequirements);
  const [highlightedRequirement, setHighlightedRequirement] = useState<Requirement>();

  const resizeRef = useRef<HTMLDivElement>(null!);

  // check if the user has no schedules
  // if so, create them
  const q = useMemo(() => (userId ? [where('ownerUid', '==', userId)] : []), [userId]);

  useEffect(() => {
    const showSchedules = semesterFormat === 'sample'
      ? sampleSchedule!.schedules
      : allTruthy(
        Object.values(chosenSchedules).map((id) => (id ? schedules[id] : null)),
      );
    const results = validateSchedules(
      selectedRequirements,
      showSchedules,
      profile,
      classCache,
    );
    setValidationResults(results);
  }, [selectedRequirements, classCache, sampleSchedule, semesterFormat, profile]);

  if (!userId) {
    return <ClassesCloud />;
  }


  // className={classNames(
  //   showReqs && 'md:p-8 md:grid-rows-1 md:grid-cols-[auto_1fr] items-stretch',
  //   'w-full grid gap-4 min-h-screen',
  // )}

  if (!md) {
    return (
      <Layout title="plan" scheduleQueryConstraints={q} custom>
        <div className="flex min-h-screen flex-col">
          <Navbar />

          <div className={classNames(
            'flex-1 flex flex-col relative bg-black md:p-4',
            showReqs && 'md:rounded-lg md:shadow-lg',
          )}
          >
            <HeaderSection resizeRef={resizeRef} columns={columns} />
            <SemestersList highlightedRequirement={highlightedRequirement} resizeRef={resizeRef} columns={columns} />
            <HiddenSchedules />
          </div>
        </div>

        {showReqs && (
        <RequirementsSection
          {...{
            selectedRequirements,
            setSelectedRequirements,
            highlightRequirement: setHighlightedRequirement,
            highlightedRequirement,
            validationResults,
          }}
        />
        )}

        <Footer />
      </Layout>
    );
  }

  return (
    <Layout title="Plan" scheduleQueryConstraints={q} className="flex flex-1 flex-row-reverse">
      <div className={classNames(
        'flex-1 flex flex-col relative bg-black md:p-4',
        showReqs && 'md:rounded-lg md:shadow-lg',
      )}
      >
        <HeaderSection resizeRef={resizeRef} columns={columns} />
        <SemestersList highlightedRequirement={highlightedRequirement} resizeRef={resizeRef} columns={columns} />
        <HiddenSchedules />
      </div>

      {showReqs && (
      <RequirementsSection
        {...{
          selectedRequirements,
          setSelectedRequirements,
          highlightRequirement: setHighlightedRequirement,
          highlightedRequirement,
          validationResults,
        }}
      />
      )}
    </Layout>
  );
}

function useColumns() {
  const semesterFormat = useAppSelector(Planner.selectSemesterFormat);
  const userSchedules = useAppSelector(Schedules.selectSchedules);
  const classYear = useAppSelector(Profile.selectClassYear);
  const sampleSchedule = useAppSelector(Planner.selectSampleSchedule);
  const chosenSchedules = useAppSelector(Settings.selectChosenSchedules);

  const columns: SemesterDisplayProps[] = useMemo(() => {
    switch (semesterFormat) {
      case 'sample':
        if (!sampleSchedule) return [];
        return sampleSchedule.schedules.map(({ year, season, id }) => ({
          semester: { year, season },
          chosenScheduleId: id,
          key: id,
        }));

      case 'selected':
        if (!classYear) return [];
        return getUniqueSemesters(
          classYear,
          ...Object.values(userSchedules),
        ).map(({ year, season }) => ({
          key: `${year}${season}`,
          semester: { year, season },
          chosenScheduleId: chosenSchedules[`${year}${season}`] || null,
        }));

      case 'all':
        return Object.values(userSchedules)
          .sort(compareSemesters)
          .map(({ year, season, id }) => ({
            key: id,
            semester: { year, season },
            chosenScheduleId: id,
            highlight: chosenSchedules[`${year}${season}`] || undefined,
          }));

      default:
        return [];
    }
  }, [classYear, sampleSchedule?.schedules, userSchedules, chosenSchedules, semesterFormat]);

  return columns;
}
