
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Hand, PlusCircle, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-12 bg-background">
      <div className="w-full max-w-4xl text-center">
        <header className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl md:text-6xl">
            Welcome to SignSpeak
          </h1>
          <p className="mt-4 text-lg text-muted-foreground sm:text-xl">
            Your personal, dynamic sign language companion. Go beyond standard
            signs and create a language that's uniquely yours.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlusCircle className="text-primary" />
                <span>Train Your Own Signs</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Teach the AI your custom gestures. Associate any sign with a
                word or sentence you choose. No rules, just your expression.
              </p>
              <Link href="/train" passHref>
                <Button className="w-full">
                  Start Training <ArrowRight className="ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hand className="text-accent" />
                <span>Detect & Communicate</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Use your trained model to detect signs in real-time. Watch as
                your gestures are translated into words and sentences.
              </p>
              <Link href="/detect" passHref>
                <Button variant="secondary" className="w-full">
                  Go to Detection <ArrowRight className="ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-primary mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            SignSpeak empowers you to build a personalized sign language
            recognizer. Whether you're using standard Indian Sign Language
            (ISL) or creating your own signs, our platform learns from you.
            Simply add gesture samples, label them, and let the AI translate
            your movements into text.
          </p>
        </div>
      </div>
    </main>
  );
}
