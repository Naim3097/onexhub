import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebaseConfig'

export const debugCustomerOrders = async (customerId) => {
  console.log('🚨 =========================')
  console.log('🚨 DEBUGGING CUSTOMER ORDERS')
  console.log('🚨 Customer ID:', customerId)
  console.log('🚨 =========================')
  
  try {
    const ordersRef = collection(db, 'spare_parts_orders')
    const ordersQuery = query(ordersRef, where('customerId', '==', customerId))
    const snapshot = await getDocs(ordersQuery)
    
    console.log(`📊 Found ${snapshot.size} orders for customer ${customerId}`)
    
    const partFrequency = new Map()
    let totalParts = 0
    
    snapshot.docs.forEach((doc, orderIndex) => {
      const orderData = doc.data()
      console.log(`\n📋 Order ${orderIndex + 1}: ${doc.id}`)
      console.log(`   Created: ${orderData.createdAt?.toDate?.() || orderData.createdAt}`)
      console.log(`   Status: ${orderData.orderStatus}`)
      console.log(`   Job Sheet: ${orderData.jobSheetNumber}`)
      
      const orderItems = orderData.orderItems || []
      console.log(`   📦 Contains ${orderItems.length} items:`)
      
      orderItems.forEach((item, itemIndex) => {
        totalParts++
        const partKey = `${item.kodProduk} - ${item.namaProduk}`
        const count = partFrequency.get(partKey) || 0
        partFrequency.set(partKey, count + 1)
        
        console.log(`      ${itemIndex + 1}. ${item.namaProduk}`)
        console.log(`         Code: ${item.kodProduk}`)
        console.log(`         Price: RM${item.unitPrice}`)
        console.log(`         Qty: ${item.quantity}`)
        console.log(`         Spec: ${item.specification || 'none'}`)
      })
    })
    
    console.log(`\n📊 ANALYSIS SUMMARY:`)
    console.log(`   Total Orders: ${snapshot.size}`)
    console.log(`   Total Part Entries: ${totalParts}`)
    console.log(`   Unique Parts: ${partFrequency.size}`)
    
    console.log(`\n🔍 PART FREQUENCY ANALYSIS:`)
    partFrequency.forEach((count, partKey) => {
      const status = count > 1 ? '❌ DUPLICATE' : '✅ UNIQUE'
      console.log(`   ${status} ${partKey}: appears ${count} time(s)`)
    })
    
    console.log(`\n💡 DUPLICATION CAUSES:`)
    if (snapshot.size > 1) {
      console.log(`   - Multiple orders (${snapshot.size} orders found)`)
    }
    if (totalParts > partFrequency.size) {
      console.log(`   - Same part in multiple orders or multiple times in same order`)
    }
    
    return {
      ordersCount: snapshot.size,
      totalParts,
      uniqueParts: partFrequency.size,
      partFrequency: Object.fromEntries(partFrequency)
    }
    
  } catch (error) {
    console.error('❌ Error in debugCustomerOrders:', error)
    throw error
  }
}