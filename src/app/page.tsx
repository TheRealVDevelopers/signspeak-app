
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
          <div className="text-left max-w-3xl mx-auto space-y-6">
              <p className="text-muted-foreground">
                SignSpeak empowers you to build a personalized sign language
                recognizer. Whether you're using standard Indian Sign Language
                (ISL) or creating your own signs, our platform learns from you.
                Follow these simple steps to get started:
              </p>
              <ol className="list-decimal list-inside space-y-4 text-muted-foreground">
                <li>
                  <span className="font-semibold text-foreground">Train Your Signs:</span> Navigate to the <Link href="/train" className="text-primary underline">Train</Link> page. 
                  Create a label for your gesture (e.g., "Hello" or "I need water"). 
                  Then, hold the sign in front of your webcam and click "Sample" multiple times to provide examples. The more samples you provide, the more accurate the detection will be.
                </li>
                <li>
                  <span className="font-semibold text-foreground">Save Your Progress:</span> Once you've added all your desired signs and their samples, click the "Save Model to Browser" button. This will store your custom AI model securely in your browser's local storage, so it remembers your signs for next time.
                </li>
                <li>
                  <span className="font-semibold text-foreground">Detect & Communicate:</span> Go to the <Link href="/detect" className="text-primary underline">Detect</Link> page. 
                  Your webcam will activate, and you can start making the signs you've trained. The application will display the detected word or sentence in real-time. You can even string signs together to form complete sentences.
                </li>
              </ol>
               <p className="text-muted-foreground pt-4">
                That's it! You have a dynamic sign language recognizer tailored to your unique way of communicating.
              </p>
          </div>
        </div>
      </div>
    </main>
  );
}
