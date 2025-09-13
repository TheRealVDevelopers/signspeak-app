"use client"
import { useState, useEffect, useCallback, useRef } from 'react';

// Dynamically import TensorFlow.js and KNN Classifier
type KNNClassifier = any;
let knnClassifier: KNNClassifier;

const loadKnnClassifier = async () => {
    if (!knnClassifier) {
        const tf = await import('@tensorflow/tfjs');
        await tf.ready(); // Ensure backend is ready
        const knn = await import('@tensorflow-models/knn-classifier');
        knnClassifier = knn.create();
    }
    return knnClassifier;
};

// Custom hook for KNN Classifier
export function useKnnClassifier() {
    const [classifier, setClassifier] = useState<KNNClassifier | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const initClassifier = useCallback(async () => {
        setIsLoading(true);
        try {
            const knn = await loadKnnClassifier();
            setClassifier(knn);
        } catch (error) {
            console.error("Error loading KNN classifier:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        initClassifier();
    }, [initClassifier]);

    const addExample = useCallback((tensor: any, label: string) => {
        if (classifier) {
            classifier.addExample(tensor, label);
        }
    }, [classifier]);

    const predict = useCallback(async (tensor: any) => {
        if (classifier && classifier.getNumClasses() > 0) {
            const result = await classifier.predictClass(tensor);
            return result;
        }
        return null;
    }, [classifier]);

    const clearClass = useCallback((label: string) => {
        if (classifier && classifier.getNumClasses() > 0) {
            classifier.clearClass(label);
        }
    }, [classifier]);
    
    const getClassifierDataset = useCallback(() => {
        if (classifier) {
            return classifier.getClassifierDataset();
        }
        return null;
    }, [classifier]);
    
    const setClassifierDataset = useCallback((dataset: any) => {
        if (classifier) {
            classifier.setClassifierDataset(dataset);
        }
    }, [classifier]);

    return { classifier, isLoading, addExample, predict, clearClass, getClassifierDataset, setClassifierDataset };
}
