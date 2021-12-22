import axios from 'axios';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import qs from 'qs';
import advancedFields from '../src/advancedFields.json';
import { MyHarvardResponse } from '../src/types';

if (getApps().length === 0) {
  initializeApp({
    credential: applicationDefault(),
  });
}

type Props = { search: string; searchQuery: string; facets: Array<string>; pageNumber: number };

export default async function searchMyHarvard({
  search, searchQuery, facets, pageNumber,
}: Partial<Props> = {}): Promise<MyHarvardResponse> {
  const searchText = Object.keys(advancedFields).reduce(
    (acc, key) => acc.replaceAll(
      `${advancedFields[key as keyof typeof advancedFields]}:`,
      `${key}:`,
    ),
    `( ${search || ''} ) ( ${searchQuery || ''} )`,
  );

  const formData = qs.stringify({
    SearchReqJSON: JSON.stringify({
      SaveRecent: false,
      Facets: facets || [],
      PageNumber: pageNumber || 1,
      SortOrder: ['SCORE'],
      TopN: '',
      PageSize: '',
      ExcludeBracketed: true,
      SearchText: searchText,
    }),
  });

  // to refresh the cookie,
  // open the Network tab in dev tools, filter by Fetch/XHR, login to my.harvard, search for some courses, copy the value of the "cookie" header

  const { data } = await axios({
    method: 'post',
    // comes from IS.SCL.Config.GetSearchResultsUrl()
    url: 'https://portal.my.harvard.edu/psc/hrvihprd/EMPLOYEE/EMPL/s/WEBLIB_IS_SCL.ISCRIPT1.FieldFormula.IScript_Search',
    headers: {
      Origin: 'https://portal.my.harvard.edu',
      Cookie: process.env.MY_HARVARD_COOKIE!,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: formData,
  });

  if (!Array.isArray(data)) {
    throw new Error('my.harvard returned a nonarray response. Ensure that the MY_HARVARD_COOKIE variable in .env.local is up to date.');
  }

  return data as MyHarvardResponse;
}
