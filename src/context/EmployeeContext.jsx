import { createContext, useContext, useState, useEffect } from 'react'
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  onSnapshot, 
  query, 
  orderBy,
  where,
  Timestamp 
} from 'firebase/firestore'
import { db } from '../firebaseConfig'

const EmployeeContext = createContext()

export const useEmployee = () => {
  const context = useContext(EmployeeContext)
  if (!context) {
    throw new Error('useEmployee must be used within an EmployeeProvider')
  }
  return context
}

// Employee roles and departments
export const EMPLOYEE_ROLES = {
  MECHANIC: 'mechanic',
  SERVICE_ADVISOR: 'service_advisor',
  MANAGER: 'manager',
  RECEPTIONIST: 'receptionist',
  PARTS_SPECIALIST: 'parts_specialist',
  CASHIER: 'cashier',
  OWNER: 'owner'
}

export const EMPLOYEE_DEPARTMENTS = {
  SERVICE: 'service',
  PARTS: 'parts',
  ADMINISTRATION: 'administration',
  MANAGEMENT: 'management'
}

export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  ON_LEAVE: 'on_leave',
  SICK: 'sick'
}

export const LEAVE_TYPES = {
  VACATION: 'vacation',
  SICK: 'sick',
  PERSONAL: 'personal',
  EMERGENCY: 'emergency',
  MATERNITY: 'maternity',
  PATERNITY: 'paternity'
}

export function EmployeeProvider({ children }) {
  // Employee Management State
  const [employees, setEmployees] = useState([])
  const [employeeLoading, setEmployeeLoading] = useState(true)
  const [selectedEmployee, setSelectedEmployee] = useState(null)

  // Attendance State
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [schedules, setSchedules] = useState([])
  const [leaveRequests, setLeaveRequests] = useState([])

  // Payroll State
  const [payrollRecords, setPayrollRecords] = useState([])
  const [commissionRates, setCommissionRates] = useState({})

  // Performance State
  const [performanceReviews, setPerformanceReviews] = useState([])

  // Real-time listeners
  useEffect(() => {
    // Employees listener
    const employeesRef = collection(db, 'employees')
    const employeesQuery = query(employeesRef, orderBy('lastName', 'asc'))
    const unsubscribeEmployees = onSnapshot(employeesQuery, (snapshot) => {
      const employeeData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setEmployees(employeeData)
      setEmployeeLoading(false)
    })

    // Attendance listener
    const attendanceRef = collection(db, 'attendance')
    const attendanceQuery = query(attendanceRef, orderBy('date', 'desc'))
    const unsubscribeAttendance = onSnapshot(attendanceQuery, (snapshot) => {
      const attendanceData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setAttendanceRecords(attendanceData)
    })

    // Payroll listener
    const payrollRef = collection(db, 'payroll')
    const payrollQuery = query(payrollRef, orderBy('payPeriodEnd', 'desc'))
    const unsubscribePayroll = onSnapshot(payrollQuery, (snapshot) => {
      const payrollData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setPayrollRecords(payrollData)
    })

    return () => {
      unsubscribeEmployees()
      unsubscribeAttendance()
      unsubscribePayroll()
    }
  }, [])

  // Employee Management Functions
  const addEmployee = async (employeeData) => {
    try {
      const docRef = await addDoc(collection(db, 'employees'), {
        ...employeeData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        status: 'active'
      })
      console.log('Employee added successfully:', docRef.id)
      return docRef.id
    } catch (error) {
      console.error('Error adding employee:', error)
      throw error
    }
  }

  const updateEmployee = async (employeeId, updates) => {
    try {
      await updateDoc(doc(db, 'employees', employeeId), {
        ...updates,
        updatedAt: Timestamp.now()
      })
      console.log('Employee updated successfully')
    } catch (error) {
      console.error('Error updating employee:', error)
      throw error
    }
  }

  const deleteEmployee = async (employeeId) => {
    try {
      // Soft delete - mark as inactive
      await updateDoc(doc(db, 'employees', employeeId), {
        status: 'inactive',
        terminationDate: Timestamp.now(),
        updatedAt: Timestamp.now()
      })
      console.log('Employee deactivated successfully')
    } catch (error) {
      console.error('Error deactivating employee:', error)
      throw error
    }
  }

  // Attendance Functions
  const clockIn = async (employeeId) => {
    try {
      const now = new Date()
      const today = now.toISOString().split('T')[0]
      
      await addDoc(collection(db, 'attendance'), {
        employeeId,
        date: today,
        clockIn: Timestamp.now(),
        status: ATTENDANCE_STATUS.PRESENT,
        createdAt: Timestamp.now()
      })
      console.log('Clock in recorded')
    } catch (error) {
      console.error('Error clocking in:', error)
      throw error
    }
  }

  const clockOut = async (employeeId, attendanceId) => {
    try {
      await updateDoc(doc(db, 'attendance', attendanceId), {
        clockOut: Timestamp.now(),
        updatedAt: Timestamp.now()
      })
      console.log('Clock out recorded')
    } catch (error) {
      console.error('Error clocking out:', error)
      throw error
    }
  }

  const submitLeaveRequest = async (leaveData) => {
    try {
      await addDoc(collection(db, 'leave_requests'), {
        ...leaveData,
        status: 'pending',
        submittedAt: Timestamp.now(),
        createdAt: Timestamp.now()
      })
      console.log('Leave request submitted')
    } catch (error) {
      console.error('Error submitting leave request:', error)
      throw error
    }
  }

  // Payroll Functions
  const calculatePayroll = (employeeId, payPeriodStart, payPeriodEnd) => {
    const employee = employees.find(emp => emp.id === employeeId)
    if (!employee) return null

    // Get attendance records for the period
    const periodAttendance = attendanceRecords.filter(record => 
      record.employeeId === employeeId &&
      record.date >= payPeriodStart &&
      record.date <= payPeriodEnd
    )

    // Calculate hours worked
    const totalHours = periodAttendance.reduce((total, record) => {
      if (record.clockIn && record.clockOut) {
        const hoursWorked = (record.clockOut.toDate() - record.clockIn.toDate()) / (1000 * 60 * 60)
        return total + hoursWorked
      }
      return total
    }, 0)

    // Calculate base pay
    const basePay = employee.hourlyRate ? 
      totalHours * employee.hourlyRate : 
      employee.salary ? employee.salary / 26 : 0 // Bi-weekly salary

    // Calculate overtime (over 40 hours)
    const overtimeHours = Math.max(0, totalHours - 40)
    const overtimePay = overtimeHours * (employee.hourlyRate || 0) * 1.5

    // Calculate commission (if applicable)
    const commission = calculateCommission(employeeId, payPeriodStart, payPeriodEnd)

    return {
      employeeId,
      payPeriodStart,
      payPeriodEnd,
      totalHours,
      overtimeHours,
      basePay,
      overtimePay,
      commission,
      grossPay: basePay + overtimePay + commission,
      netPay: (basePay + overtimePay + commission) * 0.8 // Simplified tax calculation
    }
  }

  const calculateCommission = (employeeId, startDate, endDate) => {
    // This would integrate with your existing commission system
    // For now, returning 0 as a placeholder
    return 0
  }

  // Performance Functions
  const addPerformanceReview = async (reviewData) => {
    try {
      await addDoc(collection(db, 'performance_reviews'), {
        ...reviewData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      })
      console.log('Performance review added')
    } catch (error) {
      console.error('Error adding performance review:', error)
      throw error
    }
  }

  // Utility Functions
  const getActiveEmployees = () => {
    return employees.filter(emp => emp.status === 'active')
  }

  const getEmployeesByDepartment = (department) => {
    return employees.filter(emp => emp.department === department && emp.status === 'active')
  }

  const getTodaysAttendance = () => {
    const today = new Date().toISOString().split('T')[0]
    return attendanceRecords.filter(record => record.date === today)
  }

  const value = {
    // State
    employees,
    employeeLoading,
    selectedEmployee,
    setSelectedEmployee,
    attendanceRecords,
    schedules,
    leaveRequests,
    payrollRecords,
    performanceReviews,
    
    // Employee Management
    addEmployee,
    updateEmployee,
    deleteEmployee,
    
    // Attendance
    clockIn,
    clockOut,
    submitLeaveRequest,
    
    // Payroll
    calculatePayroll,
    
    // Performance
    addPerformanceReview,
    
    // Utilities
    getActiveEmployees,
    getEmployeesByDepartment,
    getTodaysAttendance,
    
    // Constants
    EMPLOYEE_ROLES,
    EMPLOYEE_DEPARTMENTS,
    ATTENDANCE_STATUS,
    LEAVE_TYPES
  }

  return (
    <EmployeeContext.Provider value={value}>
      {children}
    </EmployeeContext.Provider>
  )
}