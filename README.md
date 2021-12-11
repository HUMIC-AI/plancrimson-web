# Harvard concentration planner

## goals

- allow consideration of multiple possible schedules
- see which concentrations each course fits into
- check for conflicting courses
- eventual flexibility for adding "custom courses" to simulate study abroad
- search for a given course, e.g. my.harvard
- more convenient interface than my.harvard

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
