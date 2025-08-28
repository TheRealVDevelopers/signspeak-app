
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as knnClassifier from '@tensorflow-models/knn-classifier';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera, Sparkles, Hand, MessagesSquare } from 'lucide-react';

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

  const classifier = useRef<knnClassifier.KNNClassifier | null>(null);
  const mobilenetModel = useRef<mobilenet.MobileNet | null>(null);
  const webcamRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isModelLoading, setIsModelLoading] = useState(true);
  const [webcamEnabled, setWebcamEnabled] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  
  const [prediction, setPrediction] = useState<{ label: string, confidence: number } | null>(null);
  const [infoMessage, setInfoMessage] = useState("Loading models and custom data...");

  const [wordHistory, setWordHistory] = useState<string[]>([]);
  const [detectedSentence, setDetectedSentence] = useState<string | null>(null);

  const [classLabels, setClassLabels] = useState<string[]>([]);
  const [targetSentences, setTargetSentences] = useState<string[]>(defaultTargetSentences);

  const loadModelAndClassifier = useCallback(async () => {
    try {
      await tf.setBackend('webgl');
      const mobilenetPromise = mobilenet.load();
      classifier.current = knnClassifier.create();

      const storedClassifier = localStorage.getItem('signLanguageClassifier');
      if (storedClassifier) {
        const tensors = JSON.parse(storedClassifier, (key, value) => {
          if (value.tensor) {
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
      setIsModelLoading(false);
      setInfoMessage("Model loaded! Enable your webcam to begin.");
    } catch (error) {
      console.error("Model loading failed:", error);
      setInfoMessage("Error: Could not load models. Please refresh the page.");
      toast({
        title: "Model Loading Failed",
        description: "There was an issue loading the machine learning models.",
        variant: "destructive"
      });
    }
  }, [toast]);

  useEffect(() => {
    loadModelAndClassifier();
  }, [loadModelAndClassifier]);

  const enableWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (webcamRef.current) {
        webcamRef.current.srcObject = stream;
        webcamRef.current.addEventListener('loadeddata', () => {
          setWebcamEnabled(true);
          setInfoMessage("Webcam active. Click 'Detect Gesture' to start.");
        });
      }
    } catch (error) {
      console.error("Webcam access denied:", error);
      setInfoMessage("Webcam access is required. Please allow access and try again.");
      toast({
        title: "Webcam Access Denied",
        description: "Please enable camera access in your browser settings.",
        variant: "destructive"
      });
    }
  };

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
    if (!mobilenetModel.current || !classifier.current || !webcamRef.current || classifier.current.getNumClasses() === 0) {
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

    const activation = tf.tidy(() => {
        const img = tf.browser.fromPixels(webcamRef.current!);
        return mobilenetModel.current!.infer(img, true);
    });

    try {
        const result = await classifier.current!.predictClass(activation, 5);
        const confidence = result.confidences[result.label];
        
        // Ensure classLabels has been loaded
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
              className={`w-full h-full object-cover transform -scale-x-100 ${webcamEnabled ? 'block' : 'hidden'}`}
            />
            {!webcamEnabled && (
              <div className="text-center text-muted-foreground">
                <p>Webcam feed will appear here.</p>
                {isModelLoading && <Loader2 className="h-8 w-8 animate-spin mx-auto mt-4" />}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          {!webcamEnabled && (
            <Button onClick={enableWebcam} disabled={isModelLoading} className="w-full">
              {isModelLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
              {isModelLoading ? 'Loading Model...' : 'Enable Webcam'}
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
            <Button onClick={predictGesture} disabled={!webcamEnabled || isPredicting} className="w-full bg-accent hover:bg-accent/90">
              {isPredicting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {isPredicting ? 'Detecting...' : 'Detect Gesture'}
            </Button>
          </CardFooter>
        </Card>
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} width="224" height="224" />
    </div>
  );
}
