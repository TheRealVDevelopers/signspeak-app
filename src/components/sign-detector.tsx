
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type * as tf from '@tensorflow/tfjs';
import type * as mobilenet from '@tensorflow-models/mobilenet';
import type * as knnClassifier from '@tensorflow-models/knn-classifier';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera, Sparkles, Hand } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';


const CONFIDENCE_THRESHOLD = 0.8;
const MAX_WORD_HISTORY = 5;

// Default sentences for matching
const defaultTargetSentences = [
    "what is your name",
    "how are you",
    "i need water",
    "good morning",
    "where is the toilet",
    "i am fine",
    "thank you",
    "please help me",
    "nice to meet you",
    "i love you"
].map(s => s.toLowerCase());


export default function SignDetector() {
  const { toast } = useToast();

  // TensorFlow and model refs
  const tfRef = useRef<typeof tf | null>(null);
  const mobilenetRef = useRef<typeof mobilenet | null>(null);
  const knnClassifierRef = useRef<typeof knnClassifier | null>(null);

  const classifier = useRef<knnClassifier.KNNClassifier | null>(null);
  const mobilenetModel = useRef<mobilenet.MobileNet | null>(null);
  const webcamRef = useRef<HTMLVideoElement>(null);
  
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  
  const [prediction, setPrediction] = useState<{ label: string, confidence: number } | null>(null);
  const [infoMessage, setInfoMessage] = useState("Enable your webcam to begin.");

  const [wordHistory, setWordHistory] = useState<string[]>([]);
  const [detectedSentence, setDetectedSentence] = useState<string | null>(null);

  const [classLabels, setClassLabels] = useState<string[]>([]);
  const [targetSentences, setTargetSentences] = useState<string[]>(defaultTargetSentences);
  
  const [areModelsLoaded, setAreModelsLoaded] = useState(false);


  const loadModels = useCallback(async () => {
    if (areModelsLoaded) return;
    setIsModelLoading(true);
    setInfoMessage("Loading AI models and custom data...");
    
    try {
      // Dynamically import the libraries
      const [tf, mobilenet, knnClassifier] = await Promise.all([
        import('@tensorflow/tfjs'),
        import('@tensorflow-models/mobilenet'),
        import('@tensorflow-models/knn-classifier')
      ]);

      tfRef.current = tf;
      mobilenetRef.current = mobilenet;
      knnClassifierRef.current = knnClassifier;

      await tf.setBackend('webgl');
      const mobilenetPromise = mobilenet.load();
      classifier.current = knnClassifier.create();

      const storedClassifier = localStorage.getItem('signLanguageClassifier');
      if (storedClassifier) {
        const tensors = JSON.parse(storedClassifier, (key, value) => {
          if (value && value.tensor) {
            return tf.tensor(value.data, value.shape, value.dtype as any);
          }
          return value;
        });
        classifier.current.setClassifierDataset(tensors);
        toast({ title: "Loaded saved model from browser." });
      }

      const storedLabels = localStorage.getItem('signLanguageLabels');
      if (storedLabels) {
        const labels = JSON.parse(storedLabels);
        setClassLabels(labels);
        
        const customSentences = labels.filter((l: string) => l.includes(' '));
        setTargetSentences(prev => [...new Set([...prev, ...customSentences.map((s:string) => s.toLowerCase())])]);
      } else {
        setClassLabels([]);
      }

      mobilenetModel.current = await mobilenetPromise;
      setAreModelsLoaded(true);
      setInfoMessage("Models loaded! Click 'Detect Gesture' to start.");
    } catch (error) {
      console.error("Model loading failed:", error);
      setInfoMessage("Error: Could not load models. Please refresh the page.");
      toast({
        title: "Model Loading Failed",
        description: "There was an issue loading the machine learning models.",
        variant: "destructive"
      });
    } finally {
      setIsModelLoading(false);
    }
  }, [toast, areModelsLoaded]);

  const enableWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (webcamRef.current) {
        webcamRef.current.srcObject = stream;
        webcamRef.current.addEventListener('loadeddata', () => {
          setHasCameraPermission(true);
          loadModels();
        });
      }
    } catch (error) {
      console.error("Webcam access denied:", error);
      setHasCameraPermission(false);
      setInfoMessage("Webcam access is required. Please allow access and try again.");
      toast({
        title: "Webcam Access Denied",
        description: "Please enable camera access in your browser settings.",
        variant: "destructive"
      });
    }
  }, [loadModels, toast]);
  

  const checkForSentenceMatch = (history: string[]) => {
      const recentWords = history.join(' ').toLowerCase();
      const match = targetSentences.find(sentence => recentWords.includes(sentence));
      if (match) {
          setDetectedSentence(match.charAt(0).toUpperCase() + match.slice(1));
      } else {
          setDetectedSentence(null);
      }
  };

  const predictGesture = async () => {
    if (!mobilenetModel.current || !classifier.current || !webcamRef.current || !tfRef.current) {
        toast({
          title: "Models not ready",
          description: "The AI models are still loading. Please wait a moment.",
          variant: "destructive"
        });
        return;
    }

    if(classifier.current.getNumClasses() === 0){
        toast({
            title: "Cannot Predict",
            description: "Please train at least one custom sign on the 'Train' page before detecting.",
            variant: "destructive"
        });
        setIsPredicting(false);
        return;
    }


    setIsPredicting(true);
    setPrediction(null);

    const activation = tfRef.current.tidy(() => {
        const img = tfRef.current!.browser.fromPixels(webcamRef.current!);
        return mobilenetModel.current!.infer(img, true);
    });

    try {
        const result = await classifier.current!.predictClass(activation, 5);
        const confidence = result.confidences[result.label];
        
        if (classLabels.length > 0) {
          const label = classLabels[parseInt(result.label, 10)];
          if (confidence > CONFIDENCE_THRESHOLD) {
              setPrediction({ label, confidence });
              const newHistory = [...wordHistory, label.toLowerCase()].slice(-MAX_WORD_HISTORY);
              setWordHistory(newHistory);
              checkForSentenceMatch(newHistory);
          } else {
              setPrediction({ label: "Unrecognized", confidence: 1 - confidence });
          }
        } else {
           toast({ title: "Prediction Error", description: "Class labels not loaded correctly.", variant: "destructive" });
        }

    } catch(e) {
        console.error("Prediction failed", e);
        toast({ title: "Prediction Failed", description: "An error occurred during prediction.", variant: "destructive" });
    } finally {
        activation.dispose();
        setIsPredicting(false);
    }
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="text-primary" />
            <span>Live Feed</span>
          </CardTitle>
          <CardDescription>{infoMessage}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-secondary rounded-md overflow-hidden relative flex items-center justify-center">
             <video
              ref={webcamRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transform -scale-x-100 ${hasCameraPermission === true ? 'block' : 'hidden'}`}
            />
            {hasCameraPermission === null && !isModelLoading && (
              <div className="text-center text-muted-foreground p-4">
                 <p>Enable your webcam to start gesture detection.</p>
              </div>
            )}
            {hasCameraPermission === false && (
                <Alert variant="destructive" className="m-4">
                  <AlertTitle>Camera Access Required</AlertTitle>
                  <AlertDescription>
                    Please allow camera access to use this feature. You may need to change permissions in your browser settings.
                  </AlertDescription>
                </Alert>
            )}
             {isModelLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-foreground">Loading AI models...</p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          {hasCameraPermission === null && (
            <Button onClick={enableWebcam} className="w-full">
              <Camera className="mr-2" />
              Enable Webcam
            </Button>
          )}
        </CardFooter>
      </Card>

      <div className="flex flex-col gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hand className="text-primary" />
              <span>Word & Sentence Detection</span>
            </CardTitle>
            <CardDescription>
              The AI's prediction will appear below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-medium mb-2 text-center">Detected Word</h3>
              {prediction ? (
                <div className="space-y-4">
                  <p className="text-2xl font-bold text-center">
                    <span className="text-accent">{prediction.label}</span>
                  </p>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-muted-foreground">Confidence</span>
                      <span className="text-sm font-medium text-primary">{(prediction.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={prediction.confidence * 100} className="w-full" />
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground h-24 flex items-center justify-center">
                  <p>Word prediction will be shown here.</p>
                </div>
              )}
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-medium mb-2 text-center">Detected Sentence</h3>
              <CardDescription className="text-center mb-2">
                  History: {wordHistory.join(', ') || 'None'}
              </CardDescription>
              {detectedSentence ? (
                  <p className="text-2xl font-bold text-center text-accent">
                      {detectedSentence}
                  </p>
              ) : (
                  <div className="text-center text-muted-foreground h-12 flex items-center justify-center">
                      <p>Matching sentence will appear here.</p>
                  </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={predictGesture} disabled={!areModelsLoaded || isPredicting || !hasCameraPermission} className="w-full bg-accent hover:bg-accent/90">
              {isPredicting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {isPredicting ? 'Detecting...' : 'Detect Gesture'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

    