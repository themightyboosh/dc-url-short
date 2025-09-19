import { db } from './firebase.js';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  increment,
  query,
  where,
  getDocs
} from 'firebase/firestore';

// Generate a random short code
function generateShortCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Create a short URL
export async function createShortUrl(originalUrl, customCode = null) {
  try {
    let shortCode = customCode || generateShortCode();
    
    // Check if custom code already exists
    if (customCode) {
      const existingDoc = await getDoc(doc(db, 'urls', shortCode));
      if (existingDoc.exists()) {
        throw new Error('Custom code already exists');
      }
    }
    
    // Create the URL document
    const urlData = {
      originalUrl: originalUrl,
      shortCode: shortCode,
      createdAt: new Date(),
      clickCount: 0,
      lastAccessed: null
    };
    
    await setDoc(doc(db, 'urls', shortCode), urlData);
    
    return {
      shortCode,
      shortUrl: `${process.env.BASE_URL || 'http://localhost:3000'}/${shortCode}`,
      originalUrl
    };
  } catch (error) {
    console.error('Error creating short URL:', error);
    throw error;
  }
}

// Get original URL by short code
export async function getOriginalUrl(shortCode) {
  try {
    const docRef = doc(db, 'urls', shortCode);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // Update click count and last accessed
      await updateDoc(docRef, {
        clickCount: increment(1),
        lastAccessed: new Date()
      });
      
      return data.originalUrl;
    } else {
      throw new Error('Short URL not found');
    }
  } catch (error) {
    console.error('Error getting original URL:', error);
    throw error;
  }
}

// Get analytics for a short URL
export async function getUrlAnalytics(shortCode) {
  try {
    const docRef = doc(db, 'urls', shortCode);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        shortCode: data.shortCode,
        originalUrl: data.originalUrl,
        clickCount: data.clickCount,
        createdAt: data.createdAt,
        lastAccessed: data.lastAccessed
      };
    } else {
      throw new Error('Short URL not found');
    }
  } catch (error) {
    console.error('Error getting analytics:', error);
    throw error;
  }
}

// Get all URLs (for admin purposes)
export async function getAllUrls() {
  try {
    const urlsRef = collection(db, 'urls');
    const snapshot = await getDocs(urlsRef);
    
    const urls = [];
    snapshot.forEach((doc) => {
      urls.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return urls;
  } catch (error) {
    console.error('Error getting all URLs:', error);
    throw error;
  }
}
