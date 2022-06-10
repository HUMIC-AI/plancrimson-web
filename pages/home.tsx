import Image from 'next/image';
import Link from 'next/link';
import Layout from '../components/Layout/Layout';
import demoImg from '../public/demo.png';
import searchImg from '../public/search.png';
import evaluationImg from '../public/evaluation.png';

export default function LandingPage() {
  return (
    <Layout className="w-full from-gray-800 to-blue-900 bg-gradient-to-br text-white flex flex-col items-center px-8 sm:px-24 py-24">
      {/* <div className="absolute inset-0 bg-blue-900">Hi</div> */}
      <h1 className="text-5xl sm:text-6xl uppercase tracking-wider font-black text-center">Plan Crimson</h1>
      <p className="italic text-xl text-center mt-8">Make the most of your Harvard education</p>
      <Link href="/search">
        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
        <a className="inline-block text-center mt-8 py-4 px-8 font-bold bg-white text-blue-900 text-2xl rounded-md hover:opacity-50 transition-all shadow-md hover:shadow-xl">
          Get started now
        </a>
      </Link>

      <div className="flex flex-col sm:flex-row items-center sm:space-x-12 mt-24 text-center sm:text-right">
        <div className="max-w-sm">
          <h2 className="text-4xl font-bold">Search and sort courses by the metrics you care about</h2>
          <p className="text-xl mt-8">Sort by popularity, workload, recommendations, and more, all from up-to-date data</p>
        </div>
        <div className="max-w-4xl mt-8 mx-4 sm:mt-0">
          <Image src={searchImg} alt="courses and requirements" className="rounded-xl" />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center sm:space-x-12 mt-24 text-center sm:text-right">
        <div className="max-w-sm">
          <h2 className="text-4xl font-bold">View evaluations from all past years in one place</h2>
          <p className="text-xl mt-8">No more back-and-forth between my.harvard, Q Reports, and Course Evaluations — see what past students have to say</p>
        </div>
        <div className="max-w-xl mt-8 mx-4 sm:mt-0">
          <Image src={evaluationImg} alt="courses and requirements" className="rounded-[2rem]" />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center sm:space-x-12 mt-24 text-center sm:text-right">
        <div className="max-w-sm">
          <h2 className="text-4xl font-bold">Verify your program requirements</h2>
          <p className="text-xl mt-8">Easily view information from the Student Handbook, with more programs and concentrations coming soon</p>
        </div>
        <div className="max-w-4xl mt-8 mx-4 sm:mt-0">
          <Image src={demoImg} alt="courses and requirements" className="rounded-xl" />
        </div>
      </div>

      <Link href="/search">
        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
        <a className="inline-block mt-24 py-4 px-8 font-bold bg-white text-blue-900 text-2xl rounded-md hover:opacity-50 transition-all shadow-md hover:shadow-xl">
          Get started now
        </a>
      </Link>
    </Layout>
  );
}
