// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiHandler } from 'next';
import qs from 'qs';
import axios from 'axios';
import advancedFields from '../../src/advancedFields.json';

type ResponseData = {
  error: string
};

const handler: NextApiHandler<ResponseData> = async (req, res) => {
  const {
    search, facets, pageNumber, searchQuery,
  } = req.body;

  if (typeof search !== 'string') {
    res.json({ error: 'Must specify a search via query parameters' });
    return;
  }
  if (typeof facets !== 'undefined' && !Array.isArray(facets)) {
    res.json({ error: 'Facets must be an array' });
    return;
  }

  const searchText = Object.keys(advancedFields).reduce(
    (acc, key) => acc.replaceAll(
      `${advancedFields[key as keyof typeof advancedFields]}:`,
      `${key}:`,
    ),
    `( ${search} ) ( ${searchQuery || ''} )`,
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
      Cookie: process.env.MY_HARVARD_COOKIE as string,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: formData,
  });

  res.json(data);
};

export default handler;
