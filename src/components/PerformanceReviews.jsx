import { useState } from 'react'
import { useEmployee } from '../context/EmployeeContext'

function PerformanceReviews() {
  const {
    employees,
    performanceReviews,
    getActiveEmployees,
    addPerformanceReview
  } = useEmployee()

  const [showReviewForm, setShowReviewForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [reviewForm, setReviewForm] = useState({
    employeeId: '',
    reviewPeriod: '',
    overallRating: '',
    jobKnowledge: '',
    qualityOfWork: '',
    productivity: '',
    communication: '',
    teamwork: '',
    punctuality: '',
    goals: '',
    improvements: '',
    comments: ''
  })

  const activeEmployees = getActiveEmployees()

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await addPerformanceReview({
        ...reviewForm,
        reviewDate: new Date().toISOString().split('T')[0],
        overallRating: parseInt(reviewForm.overallRating),
        jobKnowledge: parseInt(reviewForm.jobKnowledge),
        qualityOfWork: parseInt(reviewForm.qualityOfWork),
        productivity: parseInt(reviewForm.productivity),
        communication: parseInt(reviewForm.communication),
        teamwork: parseInt(reviewForm.teamwork),
        punctuality: parseInt(reviewForm.punctuality)
      })

      setReviewForm({
        employeeId: '',
        reviewPeriod: '',
        overallRating: '',
        jobKnowledge: '',
        qualityOfWork: '',
        productivity: '',
        communication: '',
        teamwork: '',
        punctuality: '',
        goals: '',
        improvements: '',
        comments: ''
      })
      setShowReviewForm(false)
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('Failed to submit review. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getRatingText = (rating) => {
    switch (rating) {
      case 5: return 'Excellent'
      case 4: return 'Good'
      case 3: return 'Satisfactory'
      case 2: return 'Needs Improvement'
      case 1: return 'Unsatisfactory'
      default: return 'N/A'
    }
  }

  const getRatingColor = (rating) => {
    switch (rating) {
      case 5: return 'text-green-600 bg-green-100'
      case 4: return 'text-blue-600 bg-blue-100'
      case 3: return 'text-yellow-600 bg-yellow-100'
      case 2: return 'text-orange-600 bg-orange-100'
      case 1: return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Performance Reviews</h1>
            <p className="text-gray-600 mt-1">
              Conduct and manage employee performance evaluations
            </p>
          </div>
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {showReviewForm ? 'Cancel' : 'New Review'}
          </button>
        </div>
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">New Performance Review</h2>
          
          <form onSubmit={handleSubmitReview} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
                <select
                  required
                  value={reviewForm.employeeId}
                  onChange={(e) => setReviewForm({...reviewForm, employeeId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Employee</option>
                  {activeEmployees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.firstName} {employee.lastName} - {employee.role?.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Review Period *</label>
                <select
                  required
                  value={reviewForm.reviewPeriod}
                  onChange={(e) => setReviewForm({...reviewForm, reviewPeriod: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Period</option>
                  <option value="quarterly">Quarterly Review</option>
                  <option value="semi-annual">Semi-Annual Review</option>
                  <option value="annual">Annual Review</option>
                  <option value="probationary">Probationary Review</option>
                </select>
              </div>
            </div>

            {/* Performance Ratings */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Ratings (1-5 scale)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'overallRating', label: 'Overall Rating' },
                  { key: 'jobKnowledge', label: 'Job Knowledge' },
                  { key: 'qualityOfWork', label: 'Quality of Work' },
                  { key: 'productivity', label: 'Productivity' },
                  { key: 'communication', label: 'Communication' },
                  { key: 'teamwork', label: 'Teamwork' },
                  { key: 'punctuality', label: 'Punctuality & Attendance' }
                ].map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field.label} *</label>
                    <select
                      required
                      value={reviewForm[field.key]}
                      onChange={(e) => setReviewForm({...reviewForm, [field.key]: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Rating</option>
                      <option value="5">5 - Excellent</option>
                      <option value="4">4 - Good</option>
                      <option value="3">3 - Satisfactory</option>
                      <option value="2">2 - Needs Improvement</option>
                      <option value="1">1 - Unsatisfactory</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Text Areas */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Goals for Next Period</label>
                <textarea
                  value={reviewForm.goals}
                  onChange={(e) => setReviewForm({...reviewForm, goals: e.target.value})}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="List specific goals and objectives for the next review period..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Areas for Improvement</label>
                <textarea
                  value={reviewForm.improvements}
                  onChange={(e) => setReviewForm({...reviewForm, improvements: e.target.value})}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Identify areas where the employee can improve..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Comments</label>
                <textarea
                  value={reviewForm.comments}
                  onChange={(e) => setReviewForm({...reviewForm, comments: e.target.value})}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Any additional feedback or observations..."
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowReviewForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Performance Reviews</h3>
        </div>
        
        <div className="p-6">
          {performanceReviews.length > 0 ? (
            <div className="space-y-4">
              {performanceReviews.slice(0, 10).map((review) => {
                const employee = employees.find(emp => emp.id === review.employeeId)
                return (
                  <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {employee?.firstName?.[0]}{employee?.lastName?.[0]}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {employee?.firstName} {employee?.lastName}
                          </div>
                          <div className="text-xs text-gray-500 capitalize">
                            {review.reviewPeriod?.replace('_', ' ')} Review
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRatingColor(review.overallRating)}`}>
                          {getRatingText(review.overallRating)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {review.reviewDate ? new Date(review.reviewDate).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                    </div>
                    
                    {review.comments && (
                      <div className="mt-3 text-sm text-gray-600">
                        {review.comments.substring(0, 150)}
                        {review.comments.length > 150 && '...'}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No performance reviews</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start by creating your first employee performance review.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Review Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Average Rating</div>
              <div className="text-2xl font-bold text-gray-900">
                {performanceReviews.length > 0 
                  ? (performanceReviews.reduce((sum, review) => sum + review.overallRating, 0) / performanceReviews.length).toFixed(1)
                  : '0.0'
                }
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Total Reviews</div>
              <div className="text-2xl font-bold text-gray-900">{performanceReviews.length}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">This Quarter</div>
              <div className="text-2xl font-bold text-gray-900">
                {performanceReviews.filter(review => {
                  const reviewDate = new Date(review.reviewDate)
                  const now = new Date()
                  const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
                  return reviewDate >= quarterStart
                }).length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PerformanceReviews