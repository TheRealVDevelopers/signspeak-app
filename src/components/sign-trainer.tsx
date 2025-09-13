"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera, Video, VideoOff, BrainCircuit, Trash2, Upload, PlusCircle, AlertCircle, X, WandSparkles } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { useModel } from '@/hooks/use-model';
import { captureTrainingData } from '@/ai/flows/training-data-capture';


const CAPTURE_COUNT = 50;

export default function SignTrainer() {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [newSignLabel, setNewSignLabel] = useState('');

  const {
    model,
    isModelLoading,
    isTraining,
    loadModel,
    addSign,
    getExamples,
    clearSign,
    saveModel,
    isSaving,
    isDirty,
  } = useModel();

  const [isCapturing, setIsCapturing] = useState(false);
  const [captureProgress, setCaptureProgress] = useState(0);

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
    loadModel();
     return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [getCameraPermission, loadModel]);

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

  const handleAddSign = () => {
    if (newSignLabel && model && !model.labels.includes(newSignLabel)) {
      addSign(newSignLabel);
      setNewSignLabel('');
    } else {
        toast({
            title: "Invalid Sign Label",
            description: "Please enter a unique name for the new sign.",
            variant: "destructive",
        })
    }
  };
  
  const handleCapture = async (label: string) => {
    if (!videoRef.current || !model) return;
  
    setIsCapturing(true);
    setCaptureProgress(0);
  
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
  
    const captureFrame = async (i: number) => {
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current!, -canvas.width, 0, canvas.width, canvas.height);
      const imageDataUri = canvas.toDataURL('image/jpeg');
  
      try {
        const { embeddings } = await captureTrainingData({ imageDataUri });
        if(embeddings) {
            model.addExample(label, embeddings);
        }
      } catch (error) {
        console.error("Error generating embeddings:", error);
        toast({
          title: "Embedding Failed",
          description: `Could not process frame ${i + 1}.`,
          variant: "destructive",
        });
      }
  
      setCaptureProgress(((i + 1) / CAPTURE_COUNT) * 100);
    };
  
    for (let i = 0; i < CAPTURE_COUNT; i++) {
      await captureFrame(i);
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay between captures
    }
  
    setIsCapturing(false);
    toast({
        title: "Capture Complete",
        description: `Added ${CAPTURE_COUNT} examples for "${label}".`,
    })
  };

  const isLoading = isModelLoading || (isCameraOn && !videoRef.current?.srcObject);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 shadow-2xl bg-card/50 backdrop-blur-xl border border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xl font-bold">
              <Camera className="text-primary" />
              <span>Training Camera</span>
            </div>
            <Button size="icon" variant="ghost" onClick={toggleCamera} className="hover:bg-primary/20">
              {isCameraOn ? <VideoOff /> : <Video />}
            </Button>
          </CardTitle>
          <CardDescription>Capture examples for your custom sign gestures.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-black/50 rounded-lg overflow-hidden relative flex items-center justify-center border-2 border-dashed border-muted">
            <video
              ref={videoRef}
              className={`w-full h-full object-cover transform -scale-x-100 ${isCameraOn ? 'block' : 'hidden'}`}
              autoPlay muted playsInline
            />
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white">
                <Loader2 className="w-16 h-16 animate-spin mb-4"/>
                <p className="text-lg font-semibold">
                  {isModelLoading ? "Loading AI Model..." : "Starting Camera..."}
                </p>
              </div>
            )}
             {!isCameraOn && hasCameraPermission !== false && !isLoading && (
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
             {isCapturing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
                <p className="text-white text-2xl font-bold mb-4">Capturing...</p>
                <Progress value={captureProgress} className="w-3/4" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-2xl bg-card/50 backdrop-blur-xl border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            <BrainCircuit className="text-primary" />
            <span>Model Controls</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter new sign name"
              value={newSignLabel}
              onChange={(e) => setNewSignLabel(e.target.value)}
              disabled={isCapturing || isTraining || isLoading}
            />
            <Button onClick={handleAddSign} disabled={!newSignLabel || isCapturing || isTraining || isLoading}>
              <PlusCircle className="mr-2"/> Add
            </Button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {model && model.labels.length > 0 ? (
                model.labels.map((label) => (
                    <Card key={label} className="bg-primary/10">
                    <CardHeader className="p-4 flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">{label}</CardTitle>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary">{getExamples(label)} examples</Badge>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/20" onClick={() => clearSign(label)} disabled={isCapturing}>
                                <Trash2 className="h-4 w-4"/>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardFooter className="p-4 pt-0">
                        <Button className="w-full" onClick={() => handleCapture(label)} disabled={!isCameraOn || isCapturing || isTraining}>
                            {isCapturing ? <Loader2 className="animate-spin mr-2"/> : <Camera className="mr-2"/>}
                            Capture Examples
                        </Button>
                    </CardFooter>
                    </Card>
              ))
            ) : (
                <div className="text-center text-muted-foreground py-8">
                    <p>No signs added yet.</p>
                    <p className="text-sm">Add a sign to start training.</p>
                </div>
            )}
            </div>

            {isTraining && (
                <div className="flex items-center gap-2 text-primary">
                    <Loader2 className="animate-spin" />
                    <p>Training in progress...</p>
                </div>
            )}
        </CardContent>
        <CardFooter className='flex flex-col gap-2'>
            <Button className="w-full" size="lg" onClick={saveModel} disabled={isSaving || isTraining || !isDirty}>
                {isSaving ? <Loader2 className="animate-spin mr-2"/> : <Upload className="mr-2"/>}
                Save Model to Cloud
            </Button>
            {isDirty && (
                <div className="flex items-center text-sm text-amber-400 gap-1">
                    <AlertCircle className="h-4 w-4" />
                    You have unsaved changes.
                </div>
            )}
        </CardFooter>
      </Card>
    </div>
  );
}
