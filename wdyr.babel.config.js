module.exports = function (api) {
  const isServer = api.caller((caller) => caller?.isServer);
  const isCallerDevelopment = api.caller((caller) => caller?.isDev);
  const isTest = api.env('test');

  if (isTest) {
    return {
      presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
    };
  }

  const presets = [
    [
      'next/babel',
      {
        'preset-react': {
          importSource:
            !isServer && isCallerDevelopment
              ? '@welldone-software/why-did-you-render'
              : 'react',
        },
      },
    ],
  ];

  return { presets };
};
