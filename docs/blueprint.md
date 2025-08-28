# **App Name**: SignSpeak

## Core Features:

- Webcam Feed: Display live webcam feed to capture user's hand gestures using the video element.
- Gesture Detection Trigger: A 'Detect Gesture' button to initiate sign detection.
- Sign Detection: Use ML model tool to process the input hand gesture to classify sign and render interpretation of input hand gesture into text using Mobilenet + KNN classifier.
- Word Output Display: Display recognized word prominently based on model interpretation (e.g. 'Hello', 'Yes').
- Training Data Capture: Provide training interface for capturing and labeling samples for each gesture, enabling the KNN classifier training data
- Confidence level: Display real-time confidence level, enabling insight of the degree of ML certainty.

## Style Guidelines:

- Primary color: Dark slate blue (#3B4252) to convey reliability and calm.
- Background color: Very light grey (#F0F4F8), near-white to provide a clear contrast, enabling comfortable reading in different conditions.
- Accent color: Soft purple (#B48EAD) to highlight interactive elements without overwhelming the user. It is about 30 degrees to the left on the color wheel from the primary.
- Font: 'Inter', sans-serif, chosen for its modern, machined, objective, neutral, readable qualities. Suitable for both headlines and body text.
- Simple, clear icons for training, camera access, and other user controls.
- Clean and spacious layout, focusing on webcam feed and output display.
- Smooth transitions and feedback animations to improve user experience.