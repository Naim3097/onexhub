import { useState } from 'react'

function Navigation({ activeSection, setActiveSection }) {
  const [openDropdown, setOpenDropdown] = useState(null)

  const navigationGroups = [
    {
      title: 'Spare Parts',
      sections: [
        { id: 'parts', label: 'Parts' },
        { id: 'invoice', label: 'Invoice' },
        { id: 'history', label: 'History' }
      ]
    },
    {
      title: 'Customer',
      sections: [
        { id: 'customers', label: 'Customers' },
        { id: 'car-status', label: 'Car Status' },
        { id: 'quotation', label: 'Quotation' },
        { id: 'customer-invoicing', label: 'Billing' },
        { id: 'accounting', label: 'Accounting' },
        { id: 'mechanic-commissions', label: 'Commissions' }
      ]
    },
    {
      title: 'Human Resources',
      sections: [
        { id: 'hr-dashboard', label: 'HR Dashboard' },
        { id: 'employee-management', label: 'Employee Management' },
        { id: 'attendance-tracking', label: 'Attendance & Scheduling' },
        { id: 'leave-management', label: 'Leave Management' },
        { id: 'payroll-management', label: 'Payroll & Compensation' },
        { id: 'performance-reviews', label: 'Performance Reviews' }
      ]
    }
  ]

  const getActiveGroupAndSection = () => {
    for (const group of navigationGroups) {
      const activeItem = group.sections.find(section => section.id === activeSection)
      if (activeItem) {
        return { group: group.title, section: activeItem.label }
      }
    }
    return { group: navigationGroups[0].title, section: navigationGroups[0].sections[0].label }
  }

  const handleSectionClick = (sectionId) => {
    setActiveSection(sectionId)
    setOpenDropdown(null)
  }

  const toggleDropdown = (groupTitle) => {
    setOpenDropdown(openDropdown === groupTitle ? null : groupTitle)
  }

  return (
    <nav className="bg-primary-white border-b border-black-10 sticky top-0 z-40">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex justify-center py-3">
          <div className="flex space-x-6">
            {navigationGroups.map((group) => (
              <div key={group.title} className="relative">
                {/* Dropdown Button */}
                <button
                  onClick={() => toggleDropdown(group.title)}
                  className={`flex items-center px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    group.sections.some(section => section.id === activeSection)
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <span className="mr-2">{group.title}</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      openDropdown === group.title ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {openDropdown === group.title && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    {group.sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => handleSectionClick(section.id)}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors duration-150 ${
                          activeSection === section.id
                            ? 'bg-blue-50 text-blue-600 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {section.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation
