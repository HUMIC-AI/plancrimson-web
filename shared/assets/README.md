# Assets

`concentrations.json` is scraped from https://advising.college.harvard.edu/concentrations as follows:

```js
elements.map(e => [e.textContent, [...e.nextSibling.nextSibling.firstChild.firstChild.firstChild.children].filter(e => e.tagName === 'A').map(e => e.text)])
```

`seasPlan.json` can be fetched from https://info.seas.harvard.edu/courses/api/schedule/courses
- contains full data about class times in most semesters

the public course info can be fetched from https://info.seas.harvard.edu/courses/api/courses/public
- for each course, contains the semesters that it's offered in

`csTags.json` is scraped with `/scripts/fetchCsTags.ts`

for getting `subjects.json`:

```bash
jq -s '[.[] | .[]] | [.[] | {(.SUBJECT): .IS_SCL_DESCR_IS_SCL_DESCRD}] | sort | add' allcourses-2022-06-08.json allcourses.json
```
