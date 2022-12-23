import Image from 'next/image';
import Link from 'next/link';
import Layout from '../components/Layout/Layout';
import demoImg from '../public/demo.png';
import searchImg from '../public/search.png';
import evaluationImg from '../public/evaluation.png';

export default function LandingPage() {
  return (
    <Layout className="flex w-full flex-col items-center bg-gradient-to-br from-gray-800 to-blue-900 px-8 py-24 text-white sm:px-24">
      {/* <div className="absolute inset-0 bg-blue-900">Hi</div> */}
      <h1 className="text-center text-5xl font-black uppercase tracking-wider sm:text-6xl">Plan Crimson</h1>
      <p className="mt-8 text-center text-xl italic">Make the most of your Harvard education</p>
      <Link href="/search" className="mt-8 inline-block rounded-md bg-white py-4 px-8 text-center text-2xl font-bold text-blue-900 shadow-md transition-all hover:opacity-50 hover:shadow-xl">
        Get started now
      </Link>

      <div className="mt-24 flex flex-col items-center text-center sm:flex-row sm:space-x-12 sm:text-right">
        <div className="max-w-sm">
          <h2 className="text-4xl font-bold">Search and sort courses by the metrics you care about</h2>
          <p className="mt-8 text-xl">Sort by popularity, workload, recommendations, and more, all from up-to-date data</p>
        </div>
        <div className="mx-4 mt-8 max-w-4xl sm:mt-0">
          <Image src={searchImg} alt="courses and requirements" className="rounded-xl" />
        </div>
      </div>

      <div className="mt-24 flex flex-col items-center text-center sm:flex-row sm:space-x-12 sm:text-right">
        <div className="max-w-sm">
          <h2 className="text-4xl font-bold">View evaluations from all past years in one place</h2>
          <p className="mt-8 text-xl">No more back-and-forth between my.harvard, Q Reports, and Course Evaluations — see what past students have to say</p>
        </div>
        <div className="mx-4 mt-8 max-w-xl sm:mt-0">
          <Image src={evaluationImg} alt="courses and requirements" className="rounded-[2rem]" />
        </div>
      </div>

      <div className="mt-24 flex flex-col items-center text-center sm:flex-row sm:space-x-12 sm:text-right">
        <div className="max-w-sm">
          <h2 className="text-4xl font-bold">Verify your program requirements</h2>
          <p className="mt-8 text-xl">Easily view information from the Student Handbook, with more programs and concentrations coming soon</p>
        </div>
        <div className="mx-4 mt-8 max-w-4xl sm:mt-0">
          <Image src={demoImg} alt="courses and requirements" className="rounded-xl" />
        </div>
      </div>

      <Link href="/search" className="mt-24 inline-block rounded-md bg-white py-4 px-8 text-2xl font-bold text-blue-900 shadow-md transition-all hover:opacity-50 hover:shadow-xl">
        Get started now
      </Link>
    </Layout>
  );
}
