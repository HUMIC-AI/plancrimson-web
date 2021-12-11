import 'tailwindcss/tailwind.css';
import type { AppProps } from 'next/app';

const MyApp = function ({ Component, pageProps }: AppProps) {
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <Component {...pageProps} />;
};

export default MyApp;
