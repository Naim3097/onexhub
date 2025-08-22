import { useState, useEffect } from 'react'
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot,
  query,
  orderBy 
} from 'firebase/firestore'
import { db } from '../firebaseConfig'

export const useFirebaseCollection = (collectionName) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let hasLocalData = false
    
    // Load localStorage data immediately for instant display
    const localData = localStorage.getItem(collectionName)
    if (localData) {
      try {
        const parsedData = JSON.parse(localData)
        if (parsedData && Array.isArray(parsedData) && parsedData.length > 0) {
          console.log(`✅ Loaded ${parsedData.length} ${collectionName} from cache instantly`)
          setData(parsedData)
          setLoading(false) // Show cached data immediately
          hasLocalData = true
        }
      } catch (e) {
        console.error('Error parsing localStorage data:', e)
      }
    }

    // Set up real-time listener for fresh data (runs in background if we have cached data)
    const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'))
    
    // Add timeout to prevent hanging Firebase connections - reduced to 2 seconds
    const connectionTimeout = setTimeout(() => {
      if (!hasLocalData) {
        console.log(`⚠️ Firebase connection timeout for ${collectionName}, using offline fallback`)
        setLoading(false)
        setError('Using offline data - connection timeout')
      }
    }, 2000) // Very fast fallback for better UX
    
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        clearTimeout(connectionTimeout)
        const items = []
        querySnapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() })
        })
        
        console.log(`🔄 Synced ${items.length} ${collectionName} from Firebase`)
        setData(items)
        setLoading(false)
        setError(null)
        
        // Update localStorage with fresh data
        localStorage.setItem(collectionName, JSON.stringify(items))
      },
      (err) => {
        clearTimeout(connectionTimeout)
        console.error(`❌ Firebase error for ${collectionName}:`, err)
        setError(`Using offline data - ${err.message}`)
        
        // Show loading=false if we have cached data
        if (hasLocalData || data.length > 0) {
          console.log(`📱 Using cached ${collectionName} data due to Firebase error`)
          setLoading(false)
        } else {
          console.log(`⚠️ No cached data available for ${collectionName}`)
          setLoading(false)
        }
      }
    )

    return () => {
      clearTimeout(connectionTimeout)
      unsubscribe()
    }
  }, [collectionName])

  const addItem = async (item) => {
    const itemWithTimestamp = {
      ...item,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    // Generate temporary ID for immediate feedback
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const tempItem = { ...itemWithTimestamp, id: tempId }
    
    // Add to UI immediately for instant response
    const currentData = data || []
    setData([tempItem, ...currentData])
    console.log(`⚡ Added item to UI instantly with temp ID: ${tempId}`)
    
    try {
      // Try Firebase with 1.5 second timeout for very fast fallback
      const firebasePromise = addDoc(collection(db, collectionName), itemWithTimestamp)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Firebase add timeout')), 1500)
      )
      
      const docRef = await Promise.race([firebasePromise, timeoutPromise])
      
      // Success: Replace temp item with real Firebase item
      const realItem = { ...itemWithTimestamp, id: docRef.id }
      setData(prevData => 
        prevData.map(item => item.id === tempId ? realItem : item)
      )
      
      // Update localStorage
      const updatedData = [realItem, ...currentData]
      localStorage.setItem(collectionName, JSON.stringify(updatedData))
      
      console.log(`✅ Firebase sync successful! Real ID: ${docRef.id}`)
      return docRef.id
      
    } catch (timeoutError) {
      // Timeout or error: Convert temp item to permanent local item
      const localId = Date.now().toString()
      const localItem = { ...itemWithTimestamp, id: localId }
      
      setData(prevData => 
        prevData.map(item => item.id === tempId ? localItem : item)
      )
      
      // Save to localStorage
      const localData = [localItem, ...currentData]
      localStorage.setItem(collectionName, JSON.stringify(localData))
      
      console.log(`📱 Firebase timeout - saved locally with ID: ${localId}`)
      return localId
    }
  }

  const updateItem = async (id, updates) => {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date()
      }
      
      // Update UI immediately
      setData(prevData => 
        prevData.map(item => item.id === id ? { ...item, ...updateData } : item)
      )
      
      // Try Firebase with timeout
      const firebasePromise = updateDoc(doc(db, collectionName, id), updateData)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Update timeout')), 2000)
      )
      
      await Promise.race([firebasePromise, timeoutPromise])
      
      // Update localStorage on success
      const updatedData = data.map(item => 
        item.id === id ? { ...item, ...updateData } : item
      )
      localStorage.setItem(collectionName, JSON.stringify(updatedData))
      
      console.log(`✅ Updated item ${id} in Firebase`)
      
    } catch (error) {
      console.log(`📱 Update saved locally for item ${id}`)
      
      // Update localStorage as fallback
      const updatedData = data.map(item => 
        item.id === id ? { ...item, ...updates, updatedAt: new Date() } : item
      )
      localStorage.setItem(collectionName, JSON.stringify(updatedData))
    }
  }

  const deleteItem = async (id) => {
    try {
      // Remove from UI immediately
      setData(prevData => prevData.filter(item => item.id !== id))
      
      // Try Firebase
      await deleteDoc(doc(db, collectionName, id))
      
      // Update localStorage on success
      const filteredData = data.filter(item => item.id !== id)
      localStorage.setItem(collectionName, JSON.stringify(filteredData))
      
      console.log(`✅ Deleted item ${id} from Firebase`)
      
    } catch (error) {
      console.log(`📱 Delete saved locally for item ${id}`)
      
      // Update localStorage as fallback
      const filteredData = data.filter(item => item.id !== id)
      localStorage.setItem(collectionName, JSON.stringify(filteredData))
    }
  }

  return {
    data,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem
  }
}
