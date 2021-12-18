import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Facet, MyHarvardResponse } from '../src/types';
import courseData from '../src/courseData.json';

export type SearchParams = {
  search?: string;
  pageNumber?: number;
  facets?: Array<string>;
};

export type SearchResults = {
  error: null;
  data: null;
} | {
  error: string;
  data: null;
} | {
  error: null;
  data: MyHarvardResponse;
  search: string;
  pageNumber: number;
  totalPages: number
};

type Props = {
  currentSearch?: string;
  setSearchParams: React.Dispatch<React.SetStateAction<SearchParams | null>>;
  allFacets: Array<Facet>;
};

export function useSearch({ searchOnChange } : { searchOnChange: boolean }) {
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResults>({ error: null, data: null });
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!searchOnChange || searchParams === null || loading) return;

    setLoading(true);

    axios.post('/api/search', searchParams).then((result) => {
      if (result.status !== 200) {
        setSearchResults({
          error: JSON.stringify(result.data?.error) || result.statusText,
          data: null,
        });
      } else if (!Array.isArray(result.data) || result.data.length === 0) {
        setSearchResults({
          error: `An unexpected error occurred when fetching data from my.harvard. Did not receive nonempty array, instead received: ${result.data}`,
          data: null,
        });
      } else {
        const data = result.data as MyHarvardResponse;
        setSearchResults({
          data,
          search: searchParams.search || '',
          pageNumber: searchParams.pageNumber || 1,
          totalPages: data[2].TotalPages,
          error: null,
        });
      }
      setLoading(false);
    }).catch((err) => {
      setSearchResults({ error: err.message, data: null });
      setLoading(false);
    });
  }, [searchOnChange, searchParams, loading]);

  return {
    searchParams, setSearchParams, searchResults, setSearchResults,
  };
}

export function getFacets(searchResults: SearchResults) {
  return searchResults.data ? searchResults.data[1].Facets : [];
}

const CategorySelect: React.FC<Props> = function ({ currentSearch, setSearchParams, allFacets }) {
  return (
    <details className="max-w-2xl space-y-2" style={{ minWidth: '16rem' }}>
      <summary className="cursor-pointer text-center rounded bg-gray-300 py-2">Find courses</summary>

      <button type="button" onClick={() => setSearchParams(({ search: '' }))}>Search all</button>

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
                        onClick={() => setSearchParams((prev) => ({
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
                        onClick={() => setSearchParams((prev) => ({
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

      {courseData.map(({ HU_SB_ACAD_CAREER: acronym, DESCR: title, HU_SB_CFG_CT_VW: categories }) => (
        <details key={title} className="border-black border-2 py-2 px-4 rounded-lg">
          <summary className="text-xl cursor-pointer">
            {`${title} (${acronym})`}
          </summary>
          <hr className="border-black my-2" />
          <div className="space-y-2 px-2">
            {categories.map(({ HU_SB_CAT_DESCR: categoryTitle, HU_SB_CFG_SC_VW: subcategories }) => (
              <details key={categoryTitle}>
                <summary className="text-xl cursor-pointer">
                  {categoryTitle}
                </summary>
                <hr className="border-black mt-2" />
                <ul className="p-2 rounded-b bg-gray-300 grid gap-x-2" style={{ gridTemplateColumns: 'auto auto' }}>
                  {subcategories.map(({ HU_SB_SUBCAT_DESCR: subcategoryTitle, HU_SB_SRCH_DEFN: search, HU_SB_DEPT_URL: url }) => (
                    <li key={subcategoryTitle} className="contents">
                      <button
                        type="button"
                        onClick={() => setSearchParams((prev) => ({ ...prev, search, pageNumber: 1 }))}
                        className={`text-left pl-1 rounded transition-colors ${search === currentSearch ? 'bg-blue-300 hover:bg-red-300' : 'hover:bg-gray-500'}`}
                      >
                        {subcategoryTitle}
                      </button>
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">Link</a>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </details>
      ))}
    </details>
  );
};

export default CategorySelect;
