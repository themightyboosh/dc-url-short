import { useState, useEffect } from 'react'
import { User, onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    // Check for redirect result on page load
    getRedirectResult(auth).then((result) => {
      if (result) {
        console.log('Redirect login successful')
      }
    }).catch((error) => {
      console.error('Redirect login error:', error)
    })

    return unsubscribe
  }, [])

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    try {
      // Try popup first, fallback to redirect if it fails
      try {
        await signInWithPopup(auth, provider)
      } catch (popupError) {
        console.warn('Popup failed, trying redirect:', popupError)
        await signInWithRedirect(auth, provider)
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  return {
    user,
    loading,
    loginWithGoogle,
    logout
  }
}
