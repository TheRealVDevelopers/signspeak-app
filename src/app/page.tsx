import SignDetector from '@/components/sign-detector';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-7xl">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl md:text-6xl font-headline">
            SignSpeak
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Teach the AI your signs and watch it learn in real-time.
          </p>
        </header>
        <SignDetector />
      </div>
    </main>
  );
}
