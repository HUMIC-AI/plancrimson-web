# PlanCrimson

The frontend for the Plan Crimson project!

- Search for courses through an intuitive interface
- Up-to-date with my.harvard
- Compare multiple schedules side-by-side
- Check for conflicting courses

See the [About](pages/about.tsx) page for the tech stack. See [TODO](./TODO.md) for planned features.

## Notes

### Search UI

The search UI is built with [Instant MeiliSearch](https://github.com/meilisearch/instant-meilisearch) and the [InstantSearch API from Algolia](https://www.algolia.com/doc/api-reference/widgets/react/). The [MeiliSearch React GitHub repository](https://github.com/meilisearch/meilisearch-react/) describes how these technologies work together.

I've decided it's not worth the trouble upgrading to the new [react-instantsearch-hooks](https://github.com/algolia/instantsearch/tree/master/packages/react-instantsearch-hooks-web).

- `SearchComponents/` contains a number of widgets built using these interfaces.

### Local Meilisearch

You can run MeiliSearch locally. By default it will be on port `http://localhost:7700/`.

When running Meilisearch as a Homebrew service, logs are stored under `/usr/local/var/log/meilisearch.log`.

They provide a [Postman Collection](https://www.meilisearch.com/docs/learn/cookbooks/postman_collection), which is helpful
for easily sending requests to the database.

### Common React gotchas

- Make sure the right dependencies are being passed!
- [React strict mode will cause certain effects to be run twice in development mode.](https://react.dev/learn/you-might-not-need-an-effect) To fix this, go to [./next.config.js](./next.config.js) and set `reactStrictMode` to `false`.

## Contributing

Contributions are welcome! Fork this repository and make a PR. Below are some details for parts of the tech stack.
