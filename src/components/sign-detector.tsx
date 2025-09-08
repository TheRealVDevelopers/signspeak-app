"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardFooter, CardDescription, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera, Video, VideoOff, Sparkles, History, X, Award, Flame } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { detectSign } from '@/ai/flows/sign-detection';
import { cn } from '@/lib/utils';

const CONFIDENCE_THRESHOLD = 0.5;

export default function SignDetector() {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState<{ word: string, confidence: number } | null>(null);
  const [detectionHistory, setDetectionHistory] = useState<string[]>([]);
  const [isCameraOn, setIsCameraOn] = useState(false);
  
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);

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
        description: 'Please enable camera permissions in your browser settings.',
      });
    }
  }, [toast]);

  useEffect(() => {
    getCameraPermission();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
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
    
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.current, -canvas.width, 0, canvas.width, canvas.height);
    
    const imageDataUri = canvas.toDataURL('image/jpeg');

    try {
      const result = await detectSign({ imageDataUri });

      if (result && result.detectedWord) {
        const { detectedWord, confidence } = result;

        if (confidence > CONFIDENCE_THRESHOLD && detectedWord.toLowerCase() !== 'unrecognized') {
          setDetectionResult({ word: detectedWord, confidence });
          setDetectionHistory(prev => [detectedWord, ...prev].slice(0, 10));
          setCombo(prev => prev + 1);
          setScore(prev => prev + 100 * (combo + 1));
        } else {
          setDetectionResult({ word: "Unrecognized", confidence: 1 - confidence });
          setCombo(0); // Reset combo
        }
      } else {
         throw new Error("Invalid response from AI.");
      }
    } catch (error) {
      console.error("Error during prediction:", error);
      toast({
        title: "Prediction Failed",
        description: "An error occurred. Please try again.",
        variant: "destructive"
      });
      setDetectionResult({ word: "Error", confidence: 0 });
      setCombo(0); // Reset combo
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 shadow-2xl bg-card/50 backdrop-blur-xl border border-primary/20 transition-all duration-300 hover:border-primary/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xl font-bold">
              <Camera className="text-primary" />
              <span>Live Feed</span>
            </div>
             <Button size="icon" variant="ghost" onClick={toggleCamera} className="hover:bg-primary/20">
              {isCameraOn ? <VideoOff /> : <Video />}
            </Button>
          </CardTitle>
          <CardDescription>Position your hand, then click Detect.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-black/50 rounded-lg overflow-hidden relative flex items-center justify-center border-2 border-dashed border-muted">
            <video
              ref={videoRef}
              className={`w-full h-full object-cover transform -scale-x-100 ${isCameraOn ? 'block' : 'hidden'}`}
              autoPlay muted playsInline
            />
            {!isCameraOn && hasCameraPermission !== false && (
              <div className="text-center text-muted-foreground p-4 flex flex-col items-center">
                 <VideoOff className="w-16 h-16 mb-4 text-muted-foreground/50"/>
                 <h3 className="font-bold text-lg">Camera is Off</h3>
                 <p>Press the camera icon to begin.</p>
              </div>
            )}
            {hasCameraPermission === false && (
                <Alert variant="destructive" className="m-4">
                  <AlertTitle>Camera Access Required</AlertTitle>
                  <AlertDescription>
                    Please allow camera access in your browser settings to use this app.
                  </AlertDescription>
                </Alert>
            )}
            <div className="absolute inset-0 border-4 border-primary/50 rounded-lg pointer-events-none animate-pulse" style={{ animationDuration: '3s' }}/>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleDetect} disabled={!isCameraOn || isDetecting} size="lg" className="w-full text-xl py-8 bg-gradient-to-r from-primary to-secondary text-white shadow-lg hover:shadow-primary/50 transition-all duration-300 transform hover:scale-105">
            {isDetecting ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Sparkles className="mr-2 h-6 w-6" />}
            {isDetecting ? 'Detecting...' : 'Detect Gesture'}
          </Button>
        </CardFooter>
      </Card>

      <div className="flex flex-col gap-6">
        <Card className="shadow-2xl flex-grow bg-card/50 backdrop-blur-xl border border-primary/20 transition-all duration-300">
           <CardHeader>
             <CardTitle className="flex items-center justify-between">
               <div className="flex items-center gap-2 text-xl font-bold">
                 <Award className="text-primary" />
                 <span>Score</span>
               </div>
               <div className="flex items-center gap-2">
                 <Badge variant="secondary" className="text-lg flex items-center gap-1">
                   <Flame className="text-orange-400"/>x{combo}
                 </Badge>
                 <Badge className="text-lg bg-gradient-to-r from-primary to-secondary text-white">{score}</Badge>
               </div>
             </CardTitle>
           </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-full text-center space-y-4 p-6">
            <div className="w-full h-40 flex items-center justify-center [perspective:1000px]">
             {detectionResult ? (
                <div className={cn("relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d]", detectionResult ? '[transform:rotateY(180deg)]' : '')}>
                  <div className="absolute w-full h-full flex items-center justify-center text-muted-foreground [backface-visibility:hidden]">
                    Ready to Detect...
                  </div>
                  <div className="absolute w-full h-full bg-primary/10 rounded-lg flex flex-col items-center justify-center [transform:rotateY(180deg)] [backface-visibility:hidden]">
                      <p className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent to-white">
                        {detectionResult.word}
                      </p>
                      <div className="w-3/4 px-4 mt-4">
                        <Progress value={detectionResult.confidence * 100} className="h-3 [&>div]:bg-gradient-to-r [&>div]:from-accent [&>div]:to-secondary" />
                        <div className="flex justify-between mt-1">
                          <span className="text-xs font-medium text-muted-foreground">Confidence</span>
                          <span className="text-xs font-medium text-white">{(detectionResult.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground py-8">
                  <p>Click "Detect" to see the magic.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg bg-card/50 backdrop-blur-xl border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                <History className="text-primary" />
                <span>History</span>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setDetectionHistory([])} disabled={detectionHistory.length === 0} className="hover:bg-primary/20">
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {detectionHistory.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {detectionHistory.map((word, index) => (
                  <Badge key={index} variant="outline" className="text-md border-accent/50 text-accent">
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
