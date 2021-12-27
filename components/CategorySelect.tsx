import React, { useState } from 'react';
import { Listbox } from '@headlessui/react';
import { FaCaretDown } from 'react-icons/fa';
import courseData from '../src/courseData.json';
import useSearch from '../src/hooks';
import FadeTransition from './FadeTransition';
import { Facet } from '../shared/apiTypes';

type Props = {
  currentSearch?: string;
  search: ReturnType<typeof useSearch>['search']
  allFacets: Array<Facet>;
};

const CategorySelect: React.FC<Props> = function ({ currentSearch, search, allFacets }) {
  const [school, setSchool] = useState('FAS');

  // HU_SB_CFG_CT_VW: categories

  return (
    <div>
      <Listbox value={school} onChange={setSchool} as="div" className="relative">
        <Listbox.Button className={`relative w-full py-2 pl-3 pr-10 text-left bg-white rounded-lg
                                    shadow-md hover:shadow-lg cursor-default focus:outline-none
                                    focus-visible:ring-2 focus-visible:ring-opacity-75
                                    focus-visible:ring-white focus-visible:ring-offset-orange-300
                                    focus-visible:ring-offset-2 focus-visible:border-indigo-500
                                    sm:text-sm transition-shadow`}
        >
          <span className="block truncate">
            {school}
          </span>
          <span className="absolute inset-y-0 right-0 flex items-center pointer-events-none">
            <FaCaretDown />
          </span>
        </Listbox.Button>
        <FadeTransition>
          <Listbox.Options className={`absolute w-full py-1 mt-1 overflow-auto text-base bg-white
                                       rounded-md shadow-lg max-h-60 ring-1 ring-black ring-opacity-5
                                       focus:outline-none sm:text-sm`}
          >
            {courseData.map(({ HU_SB_ACAD_CAREER: acronym, DESCR: title }) => (
              <Listbox.Option
                key={acronym}
                value={acronym}
                className={({ active }) => `${active ? 'text-amber-900 bg-amber-100' : 'text-gray-900'}
                        cursor-default select-none relative py-2 pl-10 pr-4`}
              >
                {`${title} (${acronym})`}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </FadeTransition>
      </Listbox>

      <button type="button" onClick={() => search(({ search: '' }))}>
        Search all
      </button>

      {/* filters */}
      {allFacets.length > 0 && (
        <details className="border-black border-2 py-2 px-4 rounded-lg">
          <summary className="text-xl cursor-pointer">Filters</summary>
          <hr className="border-black my-2" />
          {allFacets
            .map(({
              FacetLabel: title, FacetChildCollection: filters, Selected: selected, ...rest
            }) => ({
              title, filters, selected, ...rest,
            }))
            .filter(({ title, filters, selected }) => title !== 'Category' && ((filters && filters.length > 0) || selected))
            .map(({
              title, filters, selected, FacetName, FacetValue, DisplayValue,
            }) => (
              <div key={title}>
                <h3>{title}</h3>
                {selected
                  ? (
                    <li>
                      <button
                        type="button"
                        onClick={() => search((prev) => ({
                          ...prev!,
                          facets: prev!.facets ? prev!.facets.filter((facet) => facet !== `${FacetName}:${FacetValue}:${title}`) : [],
                        }))}
                        className="bg-blue-300 hover:bg-red-300 transition-colors"
                      >
                        {DisplayValue}
                      </button>
                    </li>
                  )
                  : filters!.map(({
                    DisplayValue: childTitle, FacetName: childFacetName, FacetValue: childFacetValue, FacetLabel: childFacetLabel, Count,
                  }) => (
                    <li key={childTitle}>
                      <button
                        type="button"
                        onClick={() => search((prev) => ({
                          ...prev!,
                          facets: [...(prev!.facets || []), `${childFacetName}:${childFacetValue}:${childFacetLabel}`],
                        }))}
                        className={`text-left rounded transition-colors ${filters!.length === 1 ? 'line-through cursor-not-allowed' : 'hover:bg-gray-500'}`}
                        disabled={filters!.length === 1}
                      >
                        {`${childTitle} (${Count})`}
                      </button>
                    </li>
                  ))}
              </div>
            ))}
        </details>
      )}

      <div className="space-y-2 px-2">
        {courseData
          .find(({ HU_SB_ACAD_CAREER: acronym }) => acronym === school)?.HU_SB_CFG_CT_VW
          .map(({ HU_SB_CAT_DESCR: categoryTitle, HU_SB_CFG_SC_VW: subcategories }) => (
            <details key={categoryTitle}>
              <summary className="text-lg cursor-pointer">
                {categoryTitle.replace('John A. Paulson School of Engineering and Applied Sciences', 'SEAS')}
              </summary>
              <hr className="border-black mt-2" />
              <ul className="p-2 rounded-b bg-gray-300 grid gap-x-2" style={{ gridTemplateColumns: 'auto auto' }}>
                {subcategories.map(({ HU_SB_SUBCAT_DESCR: subcategoryTitle, HU_SB_SRCH_DEFN: searchText, HU_SB_DEPT_URL: url }) => (
                  <li key={subcategoryTitle} className="contents">
                    <button
                      type="button"
                      onClick={() => search((prev) => ({ ...prev, search: searchText, pageNumber: 1 }))}
                      className={`text-left pl-1 rounded transition-colors
                                    ${searchText === currentSearch ? 'bg-blue-300 hover:bg-red-300' : 'hover:bg-gray-500'}`}
                    >
                      {subcategoryTitle}
                    </button>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">Link</a>
                  </li>
                ))}
              </ul>
            </details>
          )) || <p>Choose a school to begin.</p>}
      </div>
    </div>
  );
};

export default CategorySelect;
