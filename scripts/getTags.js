const axios = require('axios').default;
const cheerio = require('cheerio');
async function main() {
  const response = await axios.get(
    'https://csadvising.seas.harvard.edu/concentration/courses/tags/'
  );
  const html = response.data;
  const $ = cheerio.load(html);
  const tags = $('#tag-table > tbody > tr')
    .map((_, el) => {
      const [courseNumber, title, tags] = $(el)
        .children()
        .map(
          // eslint-disable-next-line @typescript-eslint/no-shadow
          (_, td) => $(td).text().trim()
        )
        .toArray();
      return {
        courseNumber,
        title,
        tags: tags.split(',').map((tag) => tag.trim()),
      };
    })
    .toArray();

  console.log(JSON.stringify(tags, null, 2));
}
main();
