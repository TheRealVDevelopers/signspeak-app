
import SignDetector from '@/components/sign-detector';
import { Hand, Waves } from 'lucide-react';

export default function DetectPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-background via-indigo-950/50 to-background animation-background-pan">
      <main className="flex flex-col items-center p-4 sm:p-8 md:p-12 z-10">
        <div className="w-full max-w-7xl">
          <header className="mb-8 md:mb-12 text-center">
            <div className="inline-flex items-center justify-center gap-3 mb-4 animate-float">
              <Waves className="h-12 w-12 text-accent" />
              <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                SignSpeak
              </h1>
            </div>
            <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
              Translate sign language gestures into words with a touch of magic.
            </p>
          </header>
          <SignDetector />
        </div>
      </main>
    </div>
  );
}
