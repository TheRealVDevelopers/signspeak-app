"use client";

import React, { useState, useRef, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as knnClassifier from '@tensorflow-models/knn-classifier';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera, Sparkles, PlusCircle, Hand } from 'lucide-react';

const SIGNS = ["Hello", "Yes", "No", "Thank You", "Please"];
const CONFIDENCE_THRESHOLD = 0.8;

export default function SignDetector() {
  const { toast } = useToast();

  // Refs for models and DOM elements
  const classifier = useRef<knnClassifier.KNNClassifier | null>(null);
  const mobilenetModel = useRef<mobilenet.MobileNet | null>(null);
  const webcamRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Component state
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [webcamEnabled, setWebcamEnabled] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  
  const initialSampleCounts = SIGNS.reduce((acc, sign) => ({ ...acc, [sign]: 0 }), {});
  const [sampleCounts, setSampleCounts] = useState<Record<string, number>>(initialSampleCounts);

  const [prediction, setPrediction] = useState<{ label: string, confidence: number } | null>(null);
  const [infoMessage, setInfoMessage] = useState("Loading the AI model, please wait...");

  // Load models on component mount
  useEffect(() => {
    async function loadModel() {
      try {
        await tf.setBackend('webgl');
        classifier.current = knnClassifier.create();
        mobilenetModel.current = await mobilenet.load();
        setIsModelLoading(false);
        setInfoMessage("Model loaded! Enable your webcam to begin.");
      } catch (error) {
        console.error("Model loading failed:", error);
        setInfoMessage("Error: Could not load the AI model. Please refresh the page.");
        toast({
          title: "Model Loading Failed",
          description: "There was an issue loading the machine learning model.",
          variant: "destructive"
        });
      }
    }
    loadModel();
  }, [toast]);

  // Function to enable the webcam
  const enableWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (webcamRef.current) {
        webcamRef.current.srcObject = stream;
        webcamRef.current.addEventListener('loadeddata', () => {
          setWebcamEnabled(true);
          setInfoMessage("Webcam active. Start training by adding samples.");
        });
      }
    } catch (error) {
      console.error("Webcam access denied:", error);
      setInfoMessage("Webcam access is required. Please allow access and try again.");
      toast({
        title: "Webcam Access Denied",
        description: "Please enable camera access in your browser settings to use this feature.",
        variant: "destructive"
      });
    }
  };

  // Function to add a training sample
  const addSample = async (classId: number) => {
    if (!mobilenetModel.current || !classifier.current || !webcamRef.current) return;
    
    tf.tidy(() => {
      const img = tf.browser.fromPixels(webcamRef.current!);
      const activation = mobilenetModel.current!.infer(img, true);
      classifier.current!.addExample(activation, classId);
    });

    const sign = SIGNS[classId];
    setSampleCounts(prev => ({ ...prev, [sign]: prev[sign] + 1 }));
    toast({
      title: `Sample Added for "${sign}"`,
      description: `You now have ${sampleCounts[sign] + 1} samples for this sign.`,
    });
  };

  // Function to predict the gesture
  const predictGesture = async () => {
    if (!mobilenetModel.current || !classifier.current || !webcamRef.current || classifier.current.getNumClasses() === 0) {
      toast({
        title: "Prediction Failed",
        description: "Please add training samples for at least one sign before detecting.",
        variant: "destructive"
      });
      return;
    }

    setIsPredicting(true);
    setPrediction(null);

    await tf.tidy(async () => {
      const img = tf.browser.fromPixels(webcamRef.current!);
      const activation = mobilenetModel.current!.infer(img, true);
      const result = await classifier.current!.predictClass(activation, 5);
      
      const confidence = result.confidences[result.label];
      const label = SIGNS[parseInt(result.label, 10)];

      if (confidence > CONFIDENCE_THRESHOLD) {
        setPrediction({ label, confidence });
      } else {
        setPrediction({ label: "Unrecognized", confidence: 1 - confidence });
      }
    });

    setIsPredicting(false);
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
      {/* Webcam and Info Panel */}
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

      {/* Controls and Results Panel */}
      <div className="flex flex-col gap-8">
        {/* Prediction Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hand className="text-primary" />
              <span>Detection</span>
            </CardTitle>
            <CardDescription>
              After training, click detect to see the result.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {prediction ? (
              <div className="space-y-4">
                <p className="text-2xl font-bold text-center">
                  Detected: <span className="text-accent">{prediction.label}</span>
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
                <p>Prediction will be shown here.</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={predictGesture} disabled={!webcamEnabled || isPredicting} className="w-full bg-accent hover:bg-accent/90">
              {isPredicting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {isPredicting ? 'Detecting...' : 'Detect Gesture'}
            </Button>
          </CardFooter>
        </Card>

        {/* Training Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="text-primary" />
              <span>Model Training</span>
            </CardTitle>
            <CardDescription>
              Show a sign to the camera and add 10-15 samples for best results.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {SIGNS.map((sign, index) => (
              <React.Fragment key={sign}>
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium">{sign}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {sampleCounts[sign]} samples
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addSample(index)}
                      disabled={!webcamEnabled || isModelLoading}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" /> Add
                    </Button>
                  </div>
                </div>
                {index < SIGNS.length - 1 && <Separator />}
              </React.Fragment>
            ))}
          </CardContent>
        </Card>
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} width="224" height="224" />
    </div>
  );
}
