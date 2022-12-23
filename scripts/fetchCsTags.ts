/* eslint-disable no-console */
import axios from 'axios';
import cheerio from 'cheerio';
import { writeFileSync } from 'fs';
import { getFilePath } from './util';

async function fetchCsTags(filePath: string) {
  const response = await axios.get(
    'https://csadvising.seas.harvard.edu/concentration/courses/tags/',
  );
  const html = response.data;
  const $ = cheerio.load(html);
  const allTags = $('#tag-table > tbody > tr')
    .map((_, el) => {
      const [courseNumber, title, tags] = $(el)
        .children()
        .map(
          // eslint-disable-next-line @typescript-eslint/no-shadow
          (_, td) => $(td).text().trim(),
        )
        .toArray();
      return {
        courseNumber,
        title,
        tags: tags.split(',').map((tag) => tag.trim()),
      };
    })
    .toArray();

  writeFileSync(filePath, JSON.stringify(allTags, null, 2));
}

export default {
  label: 'Download CS course tags',
  async run() {
    const filePath = await getFilePath('File path to save JSON file to:', 'src/requirements/cs/tags');
    await fetchCsTags(filePath);
  },
};