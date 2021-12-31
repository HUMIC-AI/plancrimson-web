import './initFirebase';
import { getAuth } from 'firebase-admin/auth';
import qs from 'qs';
import { MyHarvardResponse } from '../shared/apiTypes';
import fetcher, { FetchError } from '../shared/fetcher';
import advancedFields from '../src/advancedFields.json';

type Props = {
  search: string;
  searchQuery: string;
  facets: Array<string>;
  pageNumber: number;
  auth?: string;
};

export default async function searchMyHarvard({
  search, searchQuery, facets, pageNumber, auth,
}: Partial<Props> = {}): Promise<MyHarvardResponse> {
  const searchText = Object.keys(advancedFields).reduce(
    (acc, key) => acc.replaceAll(
      `${advancedFields[key as keyof typeof advancedFields]}:`,
      `${key}:`,
    ),
    `( ${search || ''} ) (${searchQuery || ''})`,
  );

  console.log(`searching my.harvard for ${searchText}`);

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

  const data = await fetcher({
    method: 'post',
    // comes from IS.SCL.Config.GetSearchResultsUrl()
    url: 'https://portal.my.harvard.edu/psc/hrvihprd/EMPLOYEE/EMPL/s/WEBLIB_IS_SCL.ISCRIPT1.FieldFormula.IScript_Search',
    headers: {
      Origin: 'https://portal.my.harvard.edu',
      Cookie: auth || process.env.MY_HARVARD_COOKIE!,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: formData,
  });

  if (!Array.isArray(data)) {
    throw new FetchError('my.harvard returned a nonarray response. Ensure that the MY_HARVARD_COOKIE variable in .env.local is up to date.', 0, data);
  }

  return data as MyHarvardResponse;
}

export async function verifyIdToken(token: string | undefined) {
  if (!token || !token.startsWith('Bearer')) {
    return false;
  }
  const verify = await getAuth().verifyIdToken(token.split(' ')[1]);
  const user = await getAuth().getUser(verify.uid);
  if (user.customClaims?.admin) return true;
  return false;
}
