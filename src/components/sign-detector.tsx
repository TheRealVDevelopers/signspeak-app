"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera, Video, VideoOff, Sparkles, History, X } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

// This imports the function that calls the Genkit AI flow.
import { detectSign } from '@/ai/flows/sign-detection';

const CONFIDENCE_THRESHOLD = 0.5; // Lower threshold for general model

export default function SignDetector() {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState<{ word: string, confidence: number } | null>(null);
  const [detectionHistory, setDetectionHistory] = useState<string[]>([]);
  const [isCameraOn, setIsCameraOn] = useState(false);

  const getCameraPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasCameraPermission(true);
      setIsCameraOn(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      setIsCameraOn(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings to use this app.',
      });
    }
  }, [toast]);

  useEffect(() => {
    getCameraPermission();
    
    // Cleanup function to stop media tracks when component unmounts
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    }
  }, [getCameraPermission]);

  const toggleCamera = () => {
    if (isCameraOn) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
        setIsCameraOn(false);
      }
    } else {
      getCameraPermission();
    }
  };

  const handleDetect = async () => {
    if (!videoRef.current || !videoRef.current.srcObject) {
      toast({ title: "Camera is not active.", variant: "destructive" });
      return;
    }
    setIsDetecting(true);
    setDetectionResult(null);

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Flip the image horizontally
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.current, -canvas.width, 0, canvas.width, canvas.height);
    
    const imageDataUri = canvas.toDataURL('image/jpeg');

    try {
      const result = await detectSign({ imageDataUri });

      if (result && result.detectedWord) {
        const { detectedWord, confidence } = result;

        if (confidence > CONFIDENCE_THRESHOLD && detectedWord.toLowerCase() !== 'unrecognized') {
          setDetectionResult({ word: detectedWord, confidence });
          setDetectionHistory(prev => [detectedWord, ...prev].slice(0, 10)); // Keep last 10
        } else {
          setDetectionResult({ word: "Unrecognized Gesture", confidence: 1 - confidence });
        }
      } else {
         throw new Error("Invalid response from AI.");
      }
    } catch (error) {
      console.error("Error during prediction:", error);
      toast({
        title: "Prediction Failed",
        description: "An error occurred during the detection process.",
        variant: "destructive"
      });
      setDetectionResult({ word: "Error", confidence: 0 });
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Camera and Controls Section */}
      <Card className="lg:col-span-2 shadow-lg border-2 border-primary/20 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="text-primary" />
              <span>Live Camera Feed</span>
            </div>
             <Button size="icon" variant="ghost" onClick={toggleCamera}>
              {isCameraOn ? <VideoOff /> : <Video />}
            </Button>
          </CardTitle>
          <CardDescription>
            Position your hand gesture in the frame and click detect.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-secondary rounded-lg overflow-hidden relative flex items-center justify-center border">
            <video
              ref={videoRef}
              className={`w-full h-full object-cover transform -scale-x-100 ${isCameraOn ? 'block' : 'hidden'}`}
              autoPlay
              muted
              playsInline
            />
            {!isCameraOn && hasCameraPermission !== false && (
              <div className="text-center text-muted-foreground p-4 flex flex-col items-center">
                 <VideoOff className="w-16 h-16 mb-4 text-muted-foreground/50"/>
                 <h3 className="font-bold text-lg">Camera is Off</h3>
                 <p>Press the camera icon to turn it on.</p>
              </div>
            )}
            {hasCameraPermission === false && (
                <Alert variant="destructive" className="m-4">
                  <AlertTitle>Camera Access Required</AlertTitle>
                  <AlertDescription>
                    Please allow camera access to use this feature. You may need to refresh the page and grant permission.
                  </AlertDescription>
                </Alert>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleDetect} disabled={!isCameraOn || isDetecting} className="w-full text-lg py-6 bg-accent hover:bg-accent/90">
            {isDetecting ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Sparkles className="mr-2 h-6 w-6" />}
            {isDetecting ? 'Detecting...' : 'Detect Gesture Now'}
          </Button>
        </CardFooter>
      </Card>

      {/* Results Section */}
      <div className="flex flex-col gap-6">
        <Card className="shadow-lg flex-grow bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="text-primary" />
              <span>Detection Result</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-full text-center space-y-4">
            {detectionResult ? (
              <>
                <p className="text-4xl font-bold text-accent">
                  {detectionResult.word}
                </p>
                <div className="w-full px-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-muted-foreground">Confidence</span>
                    <span className="text-sm font-medium text-primary">{(detectionResult.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={detectionResult.confidence * 100} />
                </div>
              </>
            ) : (
              <div className="text-muted-foreground py-8">
                <p>Click "Detect" to see the result.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                <History className="text-primary" />
                <span>History</span>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setDetectionHistory([])} disabled={detectionHistory.length === 0}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {detectionHistory.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {detectionHistory.map((word, index) => (
                  <Badge key={index} variant="secondary" className="text-md">
                    {word}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center text-sm">No detections yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
