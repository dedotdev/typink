import Link from 'next/link';

export default function NotFound() {
  return (
    <div className='container mx-auto px-4 py-16 flex flex-col items-center justify-center'>
      <div className='text-center space-y-8 max-w-md'>
        <div className='space-y-4'>
          <h1 className='text-9xl font-bold bg-gradient-to-r from-gray-400 to-gray-600 bg-clip-text text-transparent'>
            404
          </h1>
          <div className='space-y-2'>
            <h2 className='text-2xl font-semibold'>Page Not Found</h2>
            <p className='text-muted-foreground'>Sorry, we couldn't find the page you're looking for.</p>
          </div>
        </div>

        <Link className='underline' href='/'>
          Go Home
        </Link>
      </div>
    </div>
  );
}
