import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const MODEL_DOC_ID = 'sign-language-model';
const MODEL_COLLECTION_ID = 'models';

export async function saveModelToFirestore(dataset: any) {
  try {
    const modelRef = doc(db, MODEL_COLLECTION_ID, MODEL_DOC_ID);
    await setDoc(modelRef, { dataset: JSON.stringify(dataset) });
  } catch (e) {
    console.error('Error saving model to Firestore: ', e);
    throw new Error('Could not save the model to the cloud.');
  }
}

export async function loadModelFromFirestore() {
  try {
    const modelRef = doc(db, MODEL_COLLECTION_ID, MODEL_DOC_ID);
    const modelSnap = await getDoc(modelRef);

    if (modelSnap.exists()) {
      const data = modelSnap.data();
      // The dataset is stored as a JSON string, so we need to parse it.
      return JSON.parse(data.dataset);
    } else {
      console.log('No model found in Firestore. Creating a new one.');
      return null;
    }
  } catch (e) {
    console.error('Error loading model from Firestore: ', e);
    throw new Error('Could not load the model from the cloud.');
  }
}
