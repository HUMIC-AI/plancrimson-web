# PlanCrimson

The frontend for the PlanCrimson project!

- Search for courses through an intuitive interface
- Up-to-date with my.harvard
- Compare multiple schedules side-by-side
- Check for conflicting courses

See [TODO](./TODO.md) for planned features. See the [parent repository](https://github.com/HUMIC-AI/plancrimson) for more details.

## Getting started

See the [About](pages/about.tsx) page for the tech stack.

To use Firebase Emulators, you will need Java installed. You can download it [here](https://www.java.com/en/download/).

Make sure to run Firebase Emulators in parallel with Next.js:

```bash
yarn dev
```

In a separate terminal:

```bash
yarn db
```

Also make sure you select the workspace TypeScript version.
Open the VS Code command palette and run `Select TypeScript version > Use Workspace Version`.

## Notes

### Search UI

The search UI is built with [Instant MeiliSearch](https://github.com/meilisearch/instant-meilisearch) and the [InstantSearch API from Algolia](https://www.algolia.com/doc/api-reference/widgets/react/). The [MeiliSearch React GitHub repository](https://github.com/meilisearch/meilisearch-react/) describes how these technologies work together.

I've decided it's not worth the trouble upgrading to the new [react-instantsearch-hooks](https://github.com/algolia/instantsearch/tree/master/packages/react-instantsearch-hooks-web).

- `SearchComponents/` contains a number of widgets built using these interfaces.

See also https://www.algolia.com/doc/guides/building-search-ui/going-further/routing-urls/react/

### Local Meilisearch

You can run MeiliSearch locally as a Homebrew service with `brew services start meilisearch`.
(You can list current services with `brew services list`.)
By default it will be on port `http://localhost:7700/`.
When running Meilisearch as a Homebrew service, logs are stored under `/usr/local/var/log/meilisearch.log`.
You can use the interactive CLI in `harvard-scraper` to configure the local MeiliSearch instance and upload course data.

They provide a [Postman Collection](https://www.meilisearch.com/docs/learn/cookbooks/postman_collection), which is helpful
for easily sending requests to the database.

### Common React gotchas

- Make sure the right dependencies are being passed!
- [React strict mode will cause certain effects to be run twice in development mode.](https://react.dev/learn/you-might-not-need-an-effect) To fix this, go to [./next.config.js](./next.config.js) and set `reactStrictMode` to `false`.

## Deployment

Since I'm unwilling to pay for an npm account to use private npm packages (namely for [plancrimson-utils](https://github.com/HUMIC-AI/plancrimson-utils)), at the moment I'm just copying the `/lib` directory there directly into `/src` and ignoring it from [.gitignore](./.gitignore).

Previously [package.json](./package.json) contained the dependency `"plancrimson-utils": "link:../plancrimson-utils"`. See more about [yarn protocols](https://yarnpkg.com/features/protocols).

## Contributing

Contributions are welcome! Fork this repository and make a PR. Below are some details for parts of the tech stack.

However, I won't be providing the public MeiliSearch API key for the database; you'll have to reverse-engineer that as an entry requirement `:)`.
