import { useState, useEffect } from 'react'
import { 
  collection, 
  getDocs, 
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
    // Real-time listener for collection changes
    const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'))
    
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const items = []
        querySnapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() })
        })
        setData(items)
        setLoading(false)
      },
      (err) => {
        console.error(`Error fetching ${collectionName}:`, err)
        setError(err.message)
        setLoading(false)
        
        // Fallback to localStorage if Firebase fails
        const localData = localStorage.getItem(collectionName)
        if (localData) {
          try {
            setData(JSON.parse(localData))
          } catch (e) {
            console.error('Error parsing localStorage data:', e)
          }
        }
      }
    )

    return () => unsubscribe()
  }, [collectionName])

  const addItem = async (item) => {
    try {
      const itemWithTimestamp = {
        ...item,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      console.log('Attempting to add item to Firebase:', itemWithTimestamp)
      const docRef = await addDoc(collection(db, collectionName), itemWithTimestamp)
      console.log('Firebase add successful, ID:', docRef.id)
      
      // Also save to localStorage as backup
      const currentData = data || []
      const newData = [{ id: docRef.id, ...itemWithTimestamp }, ...currentData]
      localStorage.setItem(collectionName, JSON.stringify(newData))
      setData(newData)
      
      return docRef.id
    } catch (error) {
      console.error(`Firebase error adding ${collectionName} item:`, error)
      console.log('Falling back to localStorage...')
      
      try {
        // Fallback to localStorage
        const newItem = { 
          id: Date.now().toString(), 
          ...item, 
          createdAt: new Date(),
          updatedAt: new Date()
        }
        const currentData = data || []
        const newData = [newItem, ...currentData]
        setData(newData)
        localStorage.setItem(collectionName, JSON.stringify(newData))
        
        console.log('localStorage fallback successful, ID:', newItem.id)
        return newItem.id
      } catch (localError) {
        console.error('localStorage fallback also failed:', localError)
        throw localError
      }
    }
  }

  const updateItem = async (id, updates) => {
    try {
      const docRef = doc(db, collectionName, id)
      const updateData = {
        ...updates,
        updatedAt: new Date()
      }
      
      await updateDoc(docRef, updateData)
      
      // Also update localStorage
      const updatedData = data.map(item => 
        item.id === id ? { ...item, ...updateData } : item
      )
      localStorage.setItem(collectionName, JSON.stringify(updatedData))
      
    } catch (error) {
      console.error(`Error updating ${collectionName} item:`, error)
      
      // Fallback to localStorage
      const updatedData = data.map(item => 
        item.id === id ? { ...item, ...updates, updatedAt: new Date() } : item
      )
      setData(updatedData)
      localStorage.setItem(collectionName, JSON.stringify(updatedData))
    }
  }

  const deleteItem = async (id) => {
    try {
      await deleteDoc(doc(db, collectionName, id))
      
      // Also remove from localStorage
      const filteredData = data.filter(item => item.id !== id)
      localStorage.setItem(collectionName, JSON.stringify(filteredData))
      
    } catch (error) {
      console.error(`Error deleting ${collectionName} item:`, error)
      
      // Fallback to localStorage
      const filteredData = data.filter(item => item.id !== id)
      setData(filteredData)
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
