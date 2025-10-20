'server-only';

import admin from 'firebase-admin';
import { vi } from 'zod/locales';

type QuizType = 'map' | 'quiz' | 'matchingQuiz';

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
 * @param jsonData any
 * @param svgData string | undefined
 */
async function addQuizRecordFirestore(type: QuizType, name: string, jsonData: any, svgData?: string) {
  try {
    const docRef = await firestoreDb.collection('quizzes').add({
      type,
      name,
      jsonData,
      svgData: svgData || null,
      createdAt: new Date(),
      viewCount: 0
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

/**
 * Get popular quizzes from Firestore (backend only)
 * @returns Array of popular quizzes
 */
async function getPopularQuizzes(limit: number = 3) {
    try {
        const snapshot = await firestoreDb.collection('quizzes').orderBy('viewCount', 'desc').limit(limit).get();
        const popularQuizzes = snapshot.docs.map(doc => doc.data().name);
        return popularQuizzes;
    } catch (error) {
        console.error('Error fetching popular quizzes from Firestore:', error);
        throw error;
    }
}

/**
 * Increment view count for a quiz in Firestore (backend only)
 * @param quizId string
 */
async function incrementQuizViewCount(quizId: string) {
    try {
        const quizRef = firestoreDb.collection('quizzes').doc(quizId);
        await quizRef.update({
            viewCount: admin.firestore.FieldValue.increment(1)
        });
    } catch (error) {
        console.error('Error incrementing view count:', error);
        throw error;
    }
}

/**
 * Get quiz by ID from Firestore (backend only)
 * @param quizId string
 * @returns Quiz data
 */
async function getQuizById(quizId: string) {
    try {
        const quizRef = firestoreDb.collection('quizzes').doc(quizId);
        const doc = await quizRef.get();
        if (doc.exists) {
            return doc.data();
        } else {
            throw new Error('Quiz not found');
        }
    } catch (error) {
        console.error('Error fetching quiz by ID:', error);
        throw error;
    }
}

/**
 * Get quiz type by ID from Firestore (backend only)
 * @param quizId string
 * @returns Quiz type
 */
async function getQuizTypeById(quizId: string): Promise<QuizType | null> {
    try {
        const quizRef = firestoreDb.collection('quizzes').doc(quizId);
        const doc = await quizRef.get();
        if (doc.exists) {
            const data = doc.data();
            return data?.type || null;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error fetching quiz type by ID:', error);
        throw error;
    }
}


export { addQuizRecordFirestore, getQuizzesNames, getPopularQuizzes, incrementQuizViewCount, getQuizById, getQuizTypeById };