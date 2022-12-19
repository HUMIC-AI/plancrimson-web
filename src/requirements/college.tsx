import ExternalLink from '../../components/ExternalLink';
import { Class } from '../../shared/apiTypes';
import type { Grade } from '../../shared/types';
import { FAILING_GRADES, getClassId } from '../../shared/util';
import { Requirement, RequirementGroup } from './util';

const genedRequirement = (
  targetType: NonNullable<Class['IS_SCL_DESCR100_HU_SCL_ATTR_GE']>,
): Requirement => ({
  id: targetType,
  sourcePage: 12,
  validate: (count) => count > 0,
  reducer: (prev, cls) => {
    // TODO check pass/fail case
    const genedType = cls.IS_SCL_DESCR100_HU_SCL_ATTR_GE;
    if (genedType === targetType) return prev + 1;
    return null;
  },
});

const divisionalDistribution = (
  targetType: NonNullable<Class['IS_SCL_DESCR100_HU_SCL_ATTR_LDD']>,
): Requirement => ({
  id: targetType,
  sourcePage: 58,
  validate: (count) => count > 0,
  reducer: (prev, cls) => {
    // TODO check pass/fail case
    const ldd = cls.IS_SCL_DESCR100_HU_SCL_ATTR_LDD;
    if (ldd === targetType) return prev + 1;
    return null;
  },
});

const genedRequirements: RequirementGroup = {
  groupId: 'General Education',
  description: (
    <div className="space-y-2">
      <p>
        Students graduating in May 2020 or later must complete four General
        Education courses, one from each of the following four General Education
        categories:
      </p>
      <ul className="list-inside list-disc">
        <li>Aesthetics & Culture</li>
        <li>Ethics & Civics</li>
        <li>Histories, Societies, Individuals</li>
        <li>Science & Technology in Society</li>
      </ul>
      <p>
        Three of these courses must be letter-graded. One may be taken
        pass/fail, with the permission of the instructor. However, if that same
        course is being used to fulfill a concentration or secondary field
        requirement, there may be limitations on pass/fail options.
      </p>
      <p>
        Three of these courses must be letter-graded. One may be taken
        pass/fail, with the permission of the instructor. However, if that same
        course is being used to fulfill a concentration or secondary field
        requirement, there may be limitations on pass/fail options.
      </p>
      <p>
        There are no constraints regarding the timing of these courses, as long
        as all are completed by graduation.
      </p>
      <p>
        General Education requirements will not be reduced for Advanced
        Standing, transfer students, or term time study abroad.
      </p>
      <p>
        Only courses approved by the Standing Committee on General Education can
        be used to fulfill General Education requirements. Students may not
        petition to have courses count. Designated Harvard Summer School and
        Harvard Summer Study Abroad courses may count for General Education.
        Ordinarily, summer courses count if they are identical to courses that
        receive General Education credit during the academic year and are taught
        by the same Harvard faculty members who teach them during the academic
        year (or by a member of the same department).
      </p>
      <p>
        For questions, students should refer to the Harvard College Program in
        General Education website (
        <ExternalLink href="https://gened.fas.harvard.edu/">
          https://gened.fas.harvard.edu/
        </ExternalLink>
        ), or contact the General Education Office (617-495-2563, Smith Campus
        Center, Fourth Floor,
        {' '}
        <ExternalLink href="mailto:gened_questions@fas.harvard.edu">
          gened_questions@fas.harvard.edu
        </ExternalLink>
        ).
      </p>
    </div>
  ),
  sourcePage: 12,
  requirements: [
    genedRequirement('Aesthetics and Culture'),
    genedRequirement('Ethics and Civics'),
    genedRequirement('Histories, Societies, Individuals'),
    genedRequirement('Science and Technology in Society'),
  ],
};

const distributionRequirement: RequirementGroup = {
  groupId: 'Distribution',
  description: (
    <div className="space-y-2">
      <p>
        All students must complete one departmental (non-Gen Ed) course in each
        of the three main divisions of the FAS and the John A. Paulson School of
        Engineering and Applied Sciences (SEAS):
      </p>
      <p>
        Courses used to fulfill the distribution requirement may be taken
        pass/fail with the permission of the instructor. However, when the same
        courses are being used to fulfill a concentration or secondary field
        requirement, there may be limitations on pass/fail options.
      </p>
      <p>
        All courses in every division will count toward the distribution
        requirement except elementaryand intermediate-level languages, some
        graduate courses, courses in Expository Writing, music performance
        courses, Freshman Seminars, and House Seminars.
      </p>
      <p>
        A course taken to fulfill a Divisional Distribution requirement cannot
        be counted toward the College’s Quantitative Reasoning with Data (QRD)
        requirement. There are no constraints regarding the timing of these
        courses, as long as all are completed by graduation.
      </p>
      <p>
        Transfer students may fulfill the distribution requirement with courses
        taken at their previous undergraduate institution. Courses taken during
        term time or summer study abroad, and courses taken at Harvard Summer
        School may also count for the distribution requirement.
      </p>
      <p>
        For questions, students should contact
        {' '}
        <ExternalLink href="mailto:divdist@fas.harvard.edu">
          divdist@fas.harvard.edu
        </ExternalLink>
        .
      </p>
    </div>
  ),
  sourcePage: 13,
  requirements: [
    divisionalDistribution('Arts and Humanities'),
    divisionalDistribution('Social Sciences'),
    divisionalDistribution('Science & Engineering & Applied Science'),
  ],
};

const qrdRequirement: Requirement = {
  id: 'Quantitative Reasoning with Data',
  description: (
    <div className="space-y-2">
      <p>
        Students in the Class of 2023 (and in later classes) must complete one
        course in Quantitative Reasoning with Data.
      </p>
      <p>
        Students in the Class of 2020, 2021, and 2022 must fulfill the QRD
        requirement by completing either one course in Quantitative Reasoning
        with Data or one course that fulfills the previous Empirical and
        Mathematical Reasoning requirement (to include courses in the
        departments of Applied Mathematics, Mathematics, Computer Science, and
        Statistics).
      </p>
      <p>
        These students can consult a list of courses previously approved for the
        Empirical and Mathematical Reasoning requirement, available at
        {' '}
        <ExternalLink href="https://oue.fas.harvard.edu/files/oue/files/courses_previously_approved_for_emr.pdf">
          https://oue.fas.harvard.edu/files/oue/files/courses_previously_approved_for_emr.pdf
        </ExternalLink>
        .
      </p>
      <p>
        Courses used to fulfill the QRD requirement may be taken pass/fail, with
        the permission of the instructor. However, when the same courses are
        being used to fulfill a concentration or secondary field requirement,
        there may be limitations on pass/fail options.
      </p>
      <p>
        A course taken to fulfill the QRD requirement cannot be counted toward
        the College’s Divisional Distribution requirement.
      </p>
      <p>
        There are no constraints regarding the timing of this requirement, as
        long as it is completed by graduation.
      </p>
      <p>
        Courses taken at Harvard Summer School may count for the QRD
        requirement. For questions, students should contact
        {' '}
        <ExternalLink href="mailto:QRD@fas.harvard.edu">
          QRD@fas.harvard.edu
        </ExternalLink>
        .
      </p>
    </div>
  ),
  sourcePage: 13,
  validate: (total) => total >= 1,
  reducer: (prev, cls) => {
    if (cls.IS_SCL_DESCR100_HU_SCL_ATTR_LQR) return prev + 1;
    return null;
  },
};

const exposRequirement: Requirement = {
  id: 'Expository Writing',
  sourcePage: 14,
  description: (
    <div className="space-y-2">
      <p>
        Degree candidates admitted as first-year students must enroll during
        their first year of residence in a prescribed course in Expository
        Writing offered by the Harvard College Writing Program. A final grade of
        D– or better in Expository Writing 20 ordinarily fulfills the writing
        requirement; however, the Director of the Harvard College Writing
        Program may require particular students to do additional work during the
        following term in order to satisfy the requirement. Courses taken on a
        pass/fail basis may not be used to fulfill the Harvard College writing
        requirement. Harvard Summer School courses in expository writing or
        creative writing may not be used to fulfill the Harvard College writing
        requirement. Harvard Summer School courses in expository writing may not
        be used for degree credit.
      </p>
      <p>
        All transfer students are expected to satisfy the same writing
        requirement as students admitted as first-year students unless they have
        demonstrated superior writing ability in the English language before
        they arrive at Harvard. Transfer students who seek exemption from the
        writing requirement must provide the Director of the Harvard College
        Writing Program with a substantial sample of their own written work in
        the summer before matriculation at Harvard. Such a sample should include
        at least 20 double-spaced, typewritten pages. Papers submitted to and
        evaluated by a faculty member at the college the student attended before
        coming to Harvard constitute an appropriate sample. The Director will
        evaluate the papers and decide if an exemption should be granted.
        Transfer students seeking exemption should contact the Harvard College
        Writing Program at 617-495-2566 or
        {' '}
        <ExternalLink href="mailto:expos@fas.harvard.edu">
          expos@fas.harvard.edu
        </ExternalLink>
        {' '}
        for more information.
      </p>
      <p>
        Any student who fails to complete the writing requirement during the
        first year of residence must enroll in an appropriate Expository Writing
        course during each subsequent term of residence until the requirement is
        met.
      </p>
    </div>
  ),
  validate: (count) => count >= 1,
  reducer: (prev, cls, schedule) => {
    if (cls.CRSE_ID === '116353') {
      const grade = schedule.classes.find(
        ({ classId }) => classId === getClassId(cls),
      )?.grade;
      if (!grade) return prev + 1; // expos course id
      if ((FAILING_GRADES as readonly Grade[]).includes(grade)) return null;
      return prev + 1;
    }
    return null;
  },
};

const languageRequirement: Requirement = {
  id: 'Language',
  sourcePage: 14,
  description: (
    <div className="space-y-2">
      <p>
        Degree candidates must demonstrate proficiency in a language other than
        English that is taught at Harvard or for which an appropriate
        examination can be given.
      </p>
      <p>
        The language requirement demands rigorous study but does not require a
        particular format of study or examination. Students should be taught in
        all forms of a language that are customary in the practice of that
        language. The requirement can be satisfied in one of the following ways:
      </p>
      <ul className="list-inside list-disc">
        <li>
          Earning a minimum score of 700 on a College Entrance Examination Board
          SAT II Test in a language other than English, a score of 5 on a
          relevant Advanced Placement examination, or a score of 7 on a relevant
          International Baccalaureate examination.
        </li>
        <li>
          Earning a passing score as determined by the department on a placement
          examination administered by certain language departments.
        </li>
        <li>
          Passing with a letter grade one appropriate year-long course (8
          credits) or two semesterlong courses (4 credits each) in one language
          at Harvard, or the equivalent as determined by the appropriate
          language department. These courses may not include foreign literature
          courses conducted in English.
        </li>
        <li>
          Passing with a letter grade in a language course or courses at the
          appropriate level taken in Harvard programs abroad, as approved by the
          appropriate language department. Study completed at other institutions
          may also fulfill the requirement if approved by the appropriate
          language department whether through examination or on the basis of
          achieving a minimum grade.
        </li>
        <li>
          A student whose high school education was conducted in a language
          other than English may satisfy the language requirement with evidence
          of the official high school transcript.
        </li>
        <li>
          A student who claims fluency in a language other than English may
          satisfy the language requirement through satisfactory completion of an
          examination in the relevant language, provided that an appropriate
          examination can be given. If the language is not one that is offered
          at Harvard, and if a qualified examiner, as determined by the Office
          of Undergraduate Education (OUE), cannot be identified, the student
          must meet the language requirement with another language.
        </li>
      </ul>
      <p>
        No student may take the relevant departmental examination more than once
        for the purpose of meeting the language requirement.
      </p>
      <p>
        Details on language placement exams, including the process for
        registering for these exams and FAQs, can be found on the Placement
        Exams Information website, at
        {' '}
        <ExternalLink href="https://placementinfo.fas.harvard.edu/home">
          https://placementinfo.fas.harvard.edu/home
        </ExternalLink>
        .
      </p>
      <p>
        Any student who has not met the language requirement upon entrance to
        Harvard ordinarily is required to enroll in and complete with a passing
        letter grade an appropriate year-long language course (8 credits) or two
        semester-long language courses (4 credits each) in a single language
        before the start of the junior year. (An appropriate course is one for
        which a student qualifies by previous instruction or placement test.)
        Most introductory courses in all languages taught at Harvard count
        toward fulfillment of the language requirement; exceptions are noted in
        the course listings in my.harvard.
      </p>
      <p>
        Exceptions to the ordinary means of satisfying the requirement, or to
        the timing of the requirement, can be granted only by the Administrative
        Board upon the recommendation of the student’s Resident Dean. Students
        who fail to meet the requirement by the beginning of their junior year,
        or in the timeframe specified by the Administrative Board, are subject
        to disciplinary action.
      </p>
      <p>
        Students who plan to continue language study beyond the requirement
        level may wish to qualify for a citation in that language (see Fields of
        Concentration,
        {' '}
        <ExternalLink href="https://handbook.college.harvard.edu/#fields">
          https://handbook.college.harvard.edu/#fields
        </ExternalLink>
        ).
      </p>
    </div>
  ),
  reducer: () => null,
};

const collegeRequirements: RequirementGroup = {
  groupId: 'College requirements',
  sourcePage: 12,
  requirements: [
    genedRequirements,
    distributionRequirement,
    qrdRequirement,
    exposRequirement,
    languageRequirement,
  ],
};

export default collegeRequirements;
