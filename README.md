# Harvard concentration planner

## goals

- allow consideration of multiple possible schedules
- see which concentrations each course fits into
- check for conflicting courses
- eventual flexibility for adding "custom courses" to simulate study abroad
- search for a given course, e.g. my.harvard
- more convenient interface than my.harvard
- more detailed prerequisite or related courses chart
  - "students also took:"

This project is mostly reverse engineered from the `my.harvard` portal via analyzing requests through the `Network` tab in Chrome Dev Tools and filtering by Fetch/XHR

The way it was reverse engineered:

- if you open the "Course Search" page, the request to https://portal.my.harvard.edu/psc/hrvihprd/EMPLOYEE/EMPL/s/WEBLIB_HU_SB.ISCRIPT1.FieldFormula.IScript_BuildSearchBrowser gives responses with the different schools, different categories within each school, and subcategories within each category
- In particular, the subcategories have a `HU_SB_SRCH_DEFN` field that contains a search query
- But searching directly using this field doesn't actually work
- so if you check what happens when you click the button for the subcategory,
- it calls `HU.SCL.DPTSelectSubCat(this)`
- looking through the JS responses in the Network tab of the Chrome tools shows that the definition is in `HU_BASE_JS_MIN_1.js`
- this writes the search value to HU_DPTAddOn
- runs IS.SCL.Search(el) which is defined in IS_SCL_JS_MIN_1.js
- this calls IS.S2.SES.Search(el, searchObj (which is undefined), IS.SCL)
- which is a really big function defined in `https://portal.my.harvard.edu/cs/hrvihprd/cache_85811/IS_S2_SES_BASE_JS_MIN_10.js`, but using IS.SCL gets the values for IS.SCL.Config.AdvancedFields

## Tech stack

See the [About](pages/about.tsx) page.

## Code overview

Below is a brief overview of the codebase. Check it out if you're interested in contributing or learning more about these technologies!

To see the number of lines in each of the relevant code files, run:

```bash
find . \( -name "*.tsx" -o -name "*.ts" \) \
    -not -path '*/node_modules/*' \
    -exec wc -l {} \; | sort
```

Below is a walkthrough of the project and some notable files.

`/components/` contains most of the UI. Each file seeks to export a single component by default with the same name as the file.

## Search UI

The search UI is built with [Instant MeiliSearch](https://github.com/meilisearch/instant-meilisearch) and the [InstantSearch API from Algolia](https://www.algolia.com/doc/api-reference/widgets/react/). The [MeiliSearch React GitHub repository](https://github.com/meilisearch/meilisearch-react/) describes how these technologies work together.

- `SearchComponents/` contains a number of widgets built using the

## User logic

On the `Find Classmates` page, users can find other users and view their basic description and any schedules they have made public.

User A can send a friend request to User B.

If B accepts the request, then A and B are now friends. This means their schedules are automatically visible to each other.

A user can make some of their schedules public. This means that anyone can see those schedules regardless of whether or not they are friends.

## Tutorial

A schedule is made of semesters. A user can edit each semester they are enrolled in.

You can add the same semester to multiple schedules.
