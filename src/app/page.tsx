import SignDetector from '@/components/sign-detector';
import { Hand } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12 bg-background">
      <div className="w-full max-w-6xl">
        <header className="mb-8 md:mb-12 text-center">
           <div className="inline-flex items-center justify-center gap-3 mb-4">
            <Hand className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl">
              SignSpeak
            </h1>
          </div>
          <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
            Use your webcam to translate sign language gestures into words in real-time.
          </p>
        </header>
        <SignDetector />
      </div>
    </main>
  );
}
