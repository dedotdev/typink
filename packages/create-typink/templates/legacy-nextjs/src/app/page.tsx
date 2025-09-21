import { TypinkIntro } from '@/components/typink-intro';
import { GreeterBoard } from '@/components/greeter-board';

export default function Home() {
  return (
    <div className='space-y-16'>
      {/* Typink Intro Section */}
      <TypinkIntro />

      {/* Greeter Contract Section */}
      <div className='container mx-auto px-4 pb-16'>
        <div className='max-w-3xl mx-auto'>
          <GreeterBoard />
        </div>
      </div>
    </div>
  );
}
