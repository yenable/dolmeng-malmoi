import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

// 공개 설정값이다. 실제 접근 제어는 firestore.rules(보안 규칙)에서 한다.
const firebaseConfig = {
  apiKey: 'AIzaSyD3yUWma1mTDhwoxlqSuBxfa7ESPsdFo9g',
  authDomain: 'dolmeng-malmoi-5c918.firebaseapp.com',
  projectId: 'dolmeng-malmoi-5c918',
  storageBucket: 'dolmeng-malmoi-5c918.firebasestorage.app',
  messagingSenderId: '315872013123',
  appId: '1:315872013123:web:b1d88d28077629538b5df6',
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

export const ADMIN_EMAIL = 'lyy8867@gmail.com'
