"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from './use-toast';
import { loadModelFromFirestore, saveModelToFirestore } from '@/lib/model-storage';

// Dynamically import TensorFlow.js and MobileNet
type MobileNet = any;
let mobilenet: MobileNet;

const loadMobileNet = async () => {
    if (!mobilenet) {
        const tf = await import('@tensorflow/tfjs');
        await tf.ready();
        const mn = await import('@tensorflow-models/mobilenet');
        mobilenet = await mn.load();
    }
    return mobilenet;
};

// Dynamically import KNN Classifier
type KNNClassifier = any;
let knnClassifier: KNNClassifier;

const createKnnClassifier = async () => {
    const knn = await import('@tensorflow-models/knn-classifier');
    return knn.create();
};

class SignLanguageModel {
    private mobilenet: MobileNet;
    private knn: KNNClassifier;
    labels: string[];
    onDirtyStateChange: (isDirty: boolean) => void;

    constructor(mobilenet: MobileNet, knn: KNNClassifier, onDirtyStateChange: (isDirty: boolean) => void) {
        this.mobilenet = mobilenet;
        this.knn = knn;
        this.labels = [];
        this.onDirtyStateChange = onDirtyStateChange;
    }

    addLabel(label: string) {
        if (!this.labels.includes(label)) {
            this.labels.push(label);
            this.labels.sort();
            this.onDirtyStateChange(true);
        }
    }

    addExample(label: string, embeddings: number[]) {
        const tf = require('@tensorflow/tfjs');
        const tensor = tf.tensor(embeddings, [1, embeddings.length]);
        this.knn.addExample(tensor, label);
        this.onDirtyStateChange(true);
    }
    
    async predict(pixels: any) {
        const embeddings = this.mobilenet.infer(pixels, true);
        if (this.knn.getNumClasses() > 0) {
            const result = await this.knn.predictClass(embeddings);
            return result;
        }
        return null;
    }

    clearLabel(label: string) {
        if (this.knn.getNumClasses() > 0) {
            this.knn.clearClass(label);
            this.onDirtyStateChange(true);
        }
    }
    
    getNumExamples(label: string): number {
        if (this.knn.classExampleCount[label]) {
            return this.knn.classExampleCount[label];
        }
        return 0;
    }

    getDataset() {
        return this.knn.getClassifierDataset();
    }

    async loadDataset(dataset: any) {
        const tf = require('@tensorflow/tfjs');

        // We need to deserialize the dataset from a plain object
        const tensorObj = JSON.parse(JSON.stringify(dataset));
        
        Object.keys(tensorObj).forEach((key) => {
            tensorObj[key] = tf.tensor(tensorObj[key].values, tensorObj[key].shape, tensorObj[key].dtype);
        });

        this.knn.setClassifierDataset(tensorObj);
        
        // After loading, we also need to get the labels
        const labels = this.knn.getClassExampleCount();
        this.labels = Object.keys(labels).sort();
    }
}


export function useModel() {
    const { toast } = useToast();
    const [model, setModel] = useState<SignLanguageModel | null>(null);
    const [isModelLoading, setIsModelLoading] = useState(true);
    const [isTraining, setIsTraining] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [exampleCounts, setExampleCounts] = useState<Record<string, number>>({});

    const loadModel = useCallback(async () => {
        setIsModelLoading(true);
        try {
            const [mobilenet, knn] = await Promise.all([loadMobileNet(), createKnnClassifier()]);
            const newModel = new SignLanguageModel(mobilenet, knn, setIsDirty);

            toast({ title: "Loading saved model from cloud..." });
            const dataset = await loadModelFromFirestore();
            if (dataset) {
                await newModel.loadDataset(dataset);
                toast({ title: "Model loaded successfully!" });
            } else {
                toast({ title: "No saved model found.", description: "Ready to train a new one." });
            }

            setModel(newModel);
            updateExampleCounts(newModel);
            setIsDirty(false);

        } catch (error) {
            console.error("Error loading the model:", error);
            toast({ title: "Model Load Failed", description: "Could not load AI models.", variant: "destructive" });
        } finally {
            setIsModelLoading(false);
        }
    }, [toast]);

    const updateExampleCounts = (currentModel: SignLanguageModel) => {
        const counts: Record<string, number> = {};
        for (const label of currentModel.labels) {
            counts[label] = currentModel.getNumExamples(label);
        }
        setExampleCounts(counts);
    };

    const addSign = (label: string) => {
        if (model) {
            model.addLabel(label);
            setModel({ ...model }); // Trigger re-render
            updateExampleCounts(model);
        }
    };

    const addExample = useCallback((label: string, embeddings: number[]) => {
        if(model) {
            model.addExample(label, embeddings);
            updateExampleCounts(model);
        }
    }, [model]);


    const getExamples = (label: string) => {
        return exampleCounts[label] || 0;
    };

    const clearSign = (label: string) => {
        if (model) {
            model.clearLabel(label);
            updateExampleCounts(model);
        }
    };

    const saveModel = async () => {
        if (!model) return;
        setIsSaving(true);
        try {
            const dataset = model.getDataset();
            await saveModelToFirestore(dataset);
            setIsDirty(false);
            toast({
                title: "Model Saved!",
                description: "Your custom sign model has been saved to the cloud.",
            });
        } catch (error) {
            console.error(error);
            toast({
                title: "Save Failed",
                description: "Could not save the model. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };


    return { model, isModelLoading, isTraining, loadModel, addSign, getExamples, clearSign, addExample, saveModel, isSaving, isDirty };
}
