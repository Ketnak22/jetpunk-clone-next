'server-only';

import admin from 'firebase-admin';

// Only initialize once (for server-side)
if (!admin.apps.length) {
	admin.initializeApp({
		credential: admin.credential.cert({
			projectId: process.env.FIREBASE_PROJECT_ID,
			clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
			privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
		}),
	});
}

const firestoreDb = admin.firestore();

/**
 * Add a quiz record to Firestore (backend only)
 * @param type 'map' | 'quiz' | 'matchingQuiz'
 * @param name string
 * @param filename string
 */
async function addQuizRecordFirestore(type: 'map' | 'quiz' | 'matchingQuiz', name: string, filename: string) {
  try {
    const docRef = await firestoreDb.collection('quizzes').add({
      type,
      name,
      filename,
      createdAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error inserting quiz record to Firestore:', error);
    throw error;
  }
}

/**
 * Get all quiz names from Firestore (backend only)
 * @returns Array of quiz names
 */
async function getQuizzesNames() {
    try {
        const snapshot = await firestoreDb.collection('quizzes').get();
        const quizNames = snapshot.docs.map(doc => doc.data().name);
        return quizNames;
    } catch (error) {
        console.error('Error fetching quiz names from Firestore:', error);
        throw error;
    }
}

export { firestoreDb, addQuizRecordFirestore, getQuizzesNames };

/*
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if it hasn't been initialized already
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Handle multiline key
    }),
    // Optional: specify databaseURL if using other services like Realtime Database
    // databaseURL: "https://<DATABASE_NAME>.firebaseio.com",
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { dataToSave } = req.body;
      const docRef = await db.collection('yourCollection').add(dataToSave);
      res.status(200).json({ message: 'Document added successfully!', id: docRef.id });
    } catch (error) {
      console.error("Error writing document:", error);
      res.status(500).json({ error: 'Failed to write document' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

*/