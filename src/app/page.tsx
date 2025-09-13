import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Waves, Camera, Zap, BookOpen, ChevronRight, BrainCircuit } from 'lucide-react';

const FeatureCard = ({ icon, title, description, href }: { icon: React.ElementType, title: string, description: string, href: string }) => {
  const Icon = icon;
  return (
    <Link href={href} passHref>
       <Card className="bg-card/50 backdrop-blur-xl border-primary/20 hover:border-primary/50 transition-all duration-300 transform hover:-translate-y-2 h-full">
        <CardContent className="p-6 text-center flex flex-col items-center">
          <div className="p-4 bg-primary/20 rounded-full mb-4">
            <Icon className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-2">{title}</h3>
          <p className="text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
};


const SignCard = ({ sign, meaning }: { sign: string, meaning: string }) => (
  <Card className="bg-card/50 backdrop-blur-xl border-accent/20 p-4 flex flex-col items-center justify-center aspect-square transition-all duration-300 hover:bg-accent/20 hover:scale-105">
    <div className="text-5xl">{sign}</div>
    <div className="mt-2 text-lg font-semibold">{meaning}</div>
  </Card>
);


export default function LandingPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-background via-indigo-950/50 to-background animation-background-pan">
      <main className="container mx-auto px-4 py-12 sm:py-24 z-10">

        {/* Hero Section */}
        <section className="text-center mb-24">
          <div className="inline-flex items-center justify-center gap-3 mb-4 animate-float">
            <Waves className="h-16 w-16 text-accent" />
            <h1 className="text-6xl sm:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              SignSpeak
            </h1>
          </div>
          <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
            Bridge the communication gap. Instantly translate Indian Sign Language gestures into text with the power of AI.
          </p>
          <div className="mt-8">
            <Link href="/detect">
              <Button size="lg" className="text-xl py-8 px-12 bg-gradient-to-r from-primary to-secondary text-white shadow-lg hover:shadow-primary/50 transition-all duration-300 transform hover:scale-105">
                Start Detecting Now <ChevronRight className="ml-2" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="mb-24">
          <h2 className="text-4xl font-bold text-center mb-12">Features</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <FeatureCard
              href="/detect"
              icon={Zap}
              title="Real-time Detection"
              description="Instantly translate sign language gestures into text using your webcam."
            />
            <FeatureCard
              href="/train"
              icon={BrainCircuit}
              title="Train Your Own Signs"
              description="Teach the AI new gestures and build your own personalized sign language model."
            />
          </div>
        </section>


        {/* How It Works Section */}
        <section className="mb-24">
          <h2 className="text-4xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="p-6 bg-secondary/20 rounded-full mb-4 border-2 border-secondary/50">
                <Camera className="w-12 h-12 text-secondary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">1. Enable Camera</h3>
              <p className="text-muted-foreground">Grant access to your webcam to get started.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="p-6 bg-accent/20 rounded-full mb-4 border-2 border-accent/50">
                <Zap className="w-12 h-12 text-accent" />
              </div>
              <h3 className="text-2xl font-bold mb-2">2. Make a Sign</h3>
              <p className="text-muted-foreground">Position your hand clearly in the frame.</p>
            </div>
            <div className="flex flex-col items-center">
               <div className="p-6 bg-primary/20 rounded-full mb-4 border-2 border-primary/50">
                <BookOpen className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">3. Get Translation</h3>
              <p className="text-muted-foreground">Our AI instantly provides the text translation.</p>
            </div>
          </div>
        </section>

        {/* ISL Primer Section */}
        <section className="mb-24">
           <h2 className="text-4xl font-bold text-center mb-12">A Glimpse into ISL</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <SignCard sign="👋" meaning="Hello" />
              <SignCard sign="👍" meaning="Yes" />
              <SignCard sign="👎" meaning="No" />
              <SignCard sign="🙏" meaning="Thank You" />
            </div>
        </section>


        {/* Call to Action */}
        <section className="text-center bg-card/50 backdrop-blur-xl border border-primary/20 rounded-lg p-12">
           <h2 className="text-4xl font-bold mb-4">Ready to Communicate?</h2>
           <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
             Experience seamless sign language detection and break down communication barriers today.
           </p>
           <Link href="/detect">
              <Button size="lg" className="text-xl py-8 px-12 bg-gradient-to-r from-primary to-secondary text-white shadow-lg hover:shadow-primary/50 transition-all duration-300 transform hover:scale-105">
                Go to Detector <ChevronRight className="ml-2" />
              </Button>
            </Link>
        </section>

      </main>
    </div>
  );
}
