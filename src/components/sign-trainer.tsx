
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as knnClassifier from '@tensorflow-models/knn-classifier';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera, PlusCircle, Trash2, Save, BrainCircuit } from 'lucide-react';
import { Separator } from './ui/separator';

export default function SignTrainer() {
  const { toast } = useToast();

  const classifier = useRef<knnClassifier.KNNClassifier | null>(null);
  const mobilenetModel = useRef<mobilenet.MobileNet | null>(null);
  const webcamRef = useRef<HTMLVideoElement>(null);
  
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [webcamEnabled, setWebcamEnabled] = useState(false);
  const [infoMessage, setInfoMessage] = useState("Loading AI model...");

  const [newSignLabel, setNewSignLabel] = useState("");
  const [trainedSigns, setTrainedSigns] = useState<Array<{ label: string; samples: number }>>([]);
  const [isSaving, setIsSaving] = useState(false);

  const loadModels = useCallback(async () => {
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
      }

      const storedLabels = localStorage.getItem('signLanguageLabels');
      if (storedLabels) {
          const labels: string[] = JSON.parse(storedLabels);
          const counts = await classifier.current.getClassExampleCount();
          const signs = labels.map((label, i) => ({
              label,
              samples: counts[i] || 0,
          }));
          setTrainedSigns(signs);
      }
      
      mobilenetModel.current = await mobilenetPromise;
      setIsModelLoading(false);
      setInfoMessage("Model loaded! Enable webcam to start training.");
    } catch (error) {
      console.error("Model loading failed:", error);
      setInfoMessage("Error loading models. Please refresh.");
      toast({ title: "Model Loading Failed", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  const enableWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (webcamRef.current) {
        webcamRef.current.srcObject = stream;
        webcamRef.current.addEventListener('loadeddata', () => {
          setWebcamEnabled(true);
          setInfoMessage("Webcam active. Add a label and take samples.");
        });
      }
    } catch (error) {
      console.error("Webcam access denied:", error);
      toast({ title: "Webcam Access Denied", variant: "destructive" });
      setInfoMessage("Webcam access is required to train.");
    }
  };

  const addSign = () => {
    if (!newSignLabel.trim()) {
      toast({ title: "Label Required", description: "Please enter a word or sentence for your sign.", variant: "destructive" });
      return;
    }
    if (trainedSigns.some(sign => sign.label.toLowerCase() === newSignLabel.trim().toLowerCase())) {
      toast({ title: "Label Exists", description: "This label is already in use. Please choose another.", variant: "destructive"});
      return;
    }
    setTrainedSigns(prev => [...prev, { label: newSignLabel.trim(), samples: 0 }]);
    setNewSignLabel("");
  };

  const addSample = (label: string) => {
    if (!mobilenetModel.current || !classifier.current || !webcamRef.current) return;
    
    const classId = trainedSigns.findIndex(sign => sign.label === label);
    if (classId === -1) return;

    tf.tidy(() => {
      const img = tf.browser.fromPixels(webcamRef.current!);
      const activation = mobilenetModel.current!.infer(img, true);
      classifier.current!.addExample(activation, classId);
    });

    setTrainedSigns(prev => prev.map(sign => 
      sign.label === label ? { ...sign, samples: sign.samples + 1 } : sign
    ));

    toast({
      title: `Sample Added for "${label}"`,
    });
  };

  const deleteSign = (labelToDelete: string) => {
    if (!classifier.current) return;
    
    const classId = trainedSigns.findIndex(sign => sign.label === labelToDelete);
    if (classId === -1) return;
    
    classifier.current.clearClass(classId);

    setTrainedSigns(prev => prev.filter(sign => sign.label !== labelToDelete));
    
    toast({
      title: "Sign Deleted",
      description: `"${labelToDelete}" and its samples have been removed.`,
      variant: "destructive"
    });
  };

  const saveModel = async () => {
    if (!classifier.current) return;
    setIsSaving(true);
    
    try {
        const dataset = classifier.current.getClassifierDataset();
        const jsonDataset = JSON.stringify(dataset, (key, value) => {
          if (value instanceof tf.Tensor) {
            return { tensor: true, data: value.arraySync(), shape: value.shape, dtype: value.dtype };
          }
          return value;
        });
        localStorage.setItem('signLanguageClassifier', jsonDataset);
        
        const labels = trainedSigns.map(sign => sign.label);
        localStorage.setItem('signLanguageLabels', JSON.stringify(labels));

        toast({
            title: "Model Saved!",
            description: "Your custom signs have been saved to the browser."
        });
    } catch (error) {
        console.error("Failed to save model:", error);
        toast({ title: "Save Failed", description: "Could not save the model to your browser's storage.", variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="text-primary" />
            <span>Training Camera</span>
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
                {isModelLoading ? <Loader2 className="h-8 w-8 animate-spin mx-auto" /> : <p>Enable webcam to see live feed.</p>}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          {!webcamEnabled && (
            <Button onClick={enableWebcam} disabled={isModelLoading} className="w-full">
              {isModelLoading ? 'Loading...' : 'Enable Webcam'}
            </Button>
          )}
        </CardFooter>
      </Card>
      
      <div className="flex flex-col gap-4">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><BrainCircuit className="text-primary"/>Add & Train Signs</CardTitle>
                <CardDescription>Define a new word or sentence, then add gesture samples for it.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="flex gap-2">
                    <Input 
                        value={newSignLabel}
                        onChange={(e) => setNewSignLabel(e.target.value)}
                        placeholder="Enter word or sentence (e.g., 'Hello' or 'I am hungry')"
                        onKeyDown={(e) => e.key === 'Enter' && addSign()}
                    />
                    <Button onClick={addSign}>Add</Button>
                </div>
                <div className="max-h-64 overflow-y-auto pr-2 space-y-3">
                    {trainedSigns.length === 0 && <p className="text-muted-foreground text-center py-4">No signs added yet.</p>}
                    {trainedSigns.map((sign, index) => (
                        <React.Fragment key={sign.label}>
                            <div className="flex items-center justify-between gap-2 p-2 rounded-md border">
                                <div className="flex flex-col">
                                    <span className="font-medium">{sign.label}</span>
                                    <span className="text-sm text-muted-foreground">{sign.samples} samples</span>
                                </div>
                                <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addSample(sign.label)}
                                    disabled={!webcamEnabled}
                                >
                                    <PlusCircle className="mr-2 h-4 w-4" /> Sample
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => deleteSign(sign.label)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                </div>
                            </div>
                        </React.Fragment>
                    ))}
                </div>
            </CardContent>
             <CardFooter>
                <Button onClick={saveModel} disabled={isSaving || trainedSigns.length === 0} className="w-full">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Model to Browser
                </Button>
            </CardFooter>
        </Card>
      </div>
    </div>
  );
}
