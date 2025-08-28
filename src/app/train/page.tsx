
import SignTrainer from '@/components/sign-trainer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TrainPage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-4xl">
        <div className="flex justify-start mb-4">
          <Link href="/" passHref>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl md:text-6xl">
            Train Your Gestures
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Create your own dynamic sign language. Add a label, provide gesture
            samples, and build your personal library.
          </p>
        </header>
        <SignTrainer />
      </div>
    </main>
  );
}
