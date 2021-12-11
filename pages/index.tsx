import type { NextPage } from 'next';
import Head from 'next/head';
// import Image from 'next/image';
import axios from 'axios';
import { FaSearch } from 'react-icons/fa';
import { useState } from 'react';
import courseData from '../src/courseData.json';
import { Course, MyHarvardResponse } from '../src/types';

type SearchResults = {
  status: 'none' | 'loading' | 'error';
  data?: string | object;
} | {
  status: 'success',
  data: MyHarvardResponse;
};

const ResultsSection = function ({ status, data }: SearchResults) {
  switch (status) {
    case 'none':
      return null;
    case 'loading': return <p>Loading...</p>;
    case 'error':
      return (
        <p>
          An error occurred fetching data:
          {' '}
          {data}
        </p>
      );
    case 'success': {
      if (!Array.isArray(data) || (data as any[]).length === 0) {
        return 'An unexpected error occurred';
      }
      const courses = (data as MyHarvardResponse)[0].ResultsCollection;
      return (
        <section className="space-y-4">
          <h2 className="text-2xl">Results</h2>
          {/* <pre>{JSON.stringify(data, null, 2)}</pre> */}
          {courses.map(({
            Key: key,
            IS_SCL_DESCR100: course,
            IS_SCL_DESCR: rawDescription,
            IS_SCL_DESCR_IS_SCL_DESCRH: term,
            IS_SCL_DESCR_IS_SCL_DESCRL: instructors,
            HU_REC_PREP: prereqs,
            HU_SUBJ_CATLG_NBR: catalogNumber,
            IS_SCL_TIME_START: startTime,
            IS_SCL_TIME_END: endTime,
            IS_SCL_MEETING_PAT: meetingPattern,
            SSR_COMPONENTDESCR: componentDescription,
            IS_SCL_DESCR100_HU_SCL_GRADE_BASIS: gradingBasis,
          }) => {
            const description = rawDescription.replaceAll(/<\/?.>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/, ' ').trim();
            return (
              <div key={key} className="border-black border-2 rounded-md p-2 space-y-2">
                <h3 className="text-xl">{course}</h3>
                <hr className="border-black" />
                <div className="flex justify-between items-center">
                  <span>{catalogNumber}</span>
                  <span className="border-l border-r border-black sm:border-none text-center px-2">
                    {term}
                    <br className="sm:hidden" />
                    <span className="hidden sm:inline">, </span>
                    {meetingPattern === 'TBA' ? 'Time TBA' : `${meetingPattern} ${startTime}–${endTime}`}
                  </span>
                  <span className="text-right">{componentDescription}</span>
                </div>
                <hr className="border-black" />
                <div className="flex justify-between items-center">
                  <span>
                    {Array.isArray(instructors) ? instructors.join(', ') : instructors}
                  </span>
                  <span>{gradingBasis}</span>
                </div>
                {(description || prereqs) && <hr className="border-black" />}
                {description && <p>{description}</p>}
                {prereqs && (
                <p>
                  <span className="font-bold">Recommended Prep:</span>
                  {' '}
                  {prereqs}
                </p>
                )}
              </div>
            );
          })}
        </section>
      ); }
    default:
      return <p>An unexpected error occurred. Please check the ResultsSection component.</p>;
  }
};

const Home: NextPage = function () {
  const [searchResults, setSearchResults] = useState<SearchResults>({
    status: 'none',
  });

  const handleClick = async (search: string) => {
    setSearchResults({ status: 'loading' });

    const result = await axios.get('/api/search', {
      params: { search: `( ${search} ) ( )` },
    });

    if (result.status !== 200) {
      setSearchResults({
        status: 'error',
        data: result.data?.error || result.statusText,
      });
    } else {
      setSearchResults({
        status: 'success',
        data: result.data,
      });
    }
  };

  return (
    <div>
      <Head>
        <title>Harvard Concentration Planner</title>
      </Head>
      <main className="p-8 mx-auto max-w-2xl flex flex-col items-stretch space-y-4">
        <h1 className="text-4xl text-center">Harvard Concentration Planner</h1>

        <details className="">
          <summary className="cursor-pointer text-center">Find courses</summary>
          {courseData.map(({ HU_SB_ACAD_CAREER: acronym, DESCR: title, HU_SB_CFG_CT_VW: categories }) => (
            <details key={title} className="border-black border-2 p-4 rounded-lg">
              <summary className="text-2xl cursor-pointer">
                {title}
                {' '}
                (
                {acronym}
                )
              </summary>
              <hr className="border-black my-2" />
              <div className="space-y-2 px-2">
                {categories.map(({ HU_SB_CAT_DESCR: categoryTitle, HU_SB_CFG_SC_VW: subcategories }) => (
                  <details key={categoryTitle}>
                    <summary className="text-xl cursor-pointer">
                      {categoryTitle}
                    </summary>
                    <hr className="border-black mt-2" />
                    <ul className="p-4 rounded-b bg-gray-300 grid gap-y-1" style={{ gridTemplateColumns: 'auto auto' }}>
                      {subcategories.map(({ HU_SB_SUBCAT_DESCR: subcategoryTitle, HU_SB_SRCH_DEFN: search, HU_SB_DEPT_URL: url }) => (
                        <li key={subcategoryTitle} className="contents">
                          <span>
                            {subcategoryTitle}
                          </span>
                          <span className="flex items-center gap-4">
                            <button type="button" onClick={() => handleClick(search)}>
                              <FaSearch />
                            </button>
                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">Link</a>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </details>
                ))}
              </div>
            </details>
          ))}
        </details>

        <ResultsSection status={searchResults.status} data={searchResults.data} />
      </main>
    </div>
  );
};

export default Home;
