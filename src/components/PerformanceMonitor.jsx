/**
 * Performance Monitor Component
 * Shows real-time performance metrics and system health
 */

import React, { useState, useEffect } from 'react'
import PerformanceOptimizer from '../utils/PerformanceOptimizer'

const PerformanceMonitor = ({ isOpen, onClose }) => {
  const [performanceStats, setPerformanceStats] = useState(null)
  const [cacheStats, setCacheStats] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (isOpen) {
      refreshStats()
      
      // Auto-refresh every 5 seconds when open
      const interval = setInterval(refreshStats, 5000)
      return () => clearInterval(interval)
    }
  }, [isOpen])

  const refreshStats = async () => {
    setIsRefreshing(true)
    
    try {
      const perfStats = PerformanceOptimizer.getPerformanceStats()
      const cache = PerformanceOptimizer.getCacheStats()
      
      setPerformanceStats(perfStats)
      setCacheStats(cache)
      
    } catch (error) {
      console.error('Failed to refresh performance stats:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const clearCache = () => {
    PerformanceOptimizer.clearCache()
    refreshStats()
  }

  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms.toFixed(1)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  const getPerformanceColor = (value, thresholds) => {
    if (value <= thresholds.good) return 'text-green-600'
    if (value <= thresholds.warning) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Performance Monitor</h2>
            <p className="text-gray-300 text-sm">System performance and cache statistics</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={refreshStats}
              disabled={isRefreshing}
              className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors disabled:opacity-50"
            >
              {isRefreshing ? '↻' : '⟳'} Refresh
            </button>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Performance Statistics */}
          {performanceStats && !performanceStats.noData ? (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Performance Statistics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {performanceStats.totalOperations}
                  </div>
                  <div className="text-sm text-blue-600">Total Operations</div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className={`text-2xl font-bold ${getPerformanceColor(100 - performanceStats.successRate, { good: 5, warning: 15 })}`}>
                    {performanceStats.successRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-green-600">Success Rate</div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className={`text-2xl font-bold ${getPerformanceColor(performanceStats.averageDuration, { good: 100, warning: 500 })}`}>
                    {formatDuration(performanceStats.averageDuration)}
                  </div>
                  <div className="text-sm text-yellow-600">Avg Duration</div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-600">
                    {performanceStats.failureCount}
                  </div>
                  <div className="text-sm text-red-600">Failures</div>
                </div>
              </div>

              {/* Fastest and Slowest Operations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">🚀 Fastest Operation</h4>
                  <div className="text-sm">
                    <div className="font-medium">{performanceStats.fastestOperation?.operation}</div>
                    <div className="text-green-600">
                      {formatDuration(performanceStats.fastestOperation?.duration)}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">🐌 Slowest Operation</h4>
                  <div className="text-sm">
                    <div className="font-medium">{performanceStats.slowestOperation?.operation}</div>
                    <div className="text-red-600">
                      {formatDuration(performanceStats.slowestOperation?.duration)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Common Errors */}
              {performanceStats.commonErrors && Object.keys(performanceStats.commonErrors).length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-red-800 mb-2">🚨 Common Errors</h4>
                  <div className="space-y-1">
                    {Object.entries(performanceStats.commonErrors).map(([error, count]) => (
                      <div key={error} className="flex justify-between text-sm">
                        <span className="text-red-700">{error}</span>
                        <span className="text-red-600 font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Performance Statistics</h3>
              <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                No performance data available yet. Start using the application to see metrics.
              </div>
            </div>
          )}

          {/* Cache Statistics */}
          {cacheStats && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Cache Performance</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600">
                    {cacheStats.totalEntries}
                  </div>
                  <div className="text-sm text-purple-600">Cache Entries</div>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-indigo-600">
                    {formatBytes(cacheStats.memoryUsage)}
                  </div>
                  <div className="text-sm text-indigo-600">Memory Usage</div>
                </div>

                <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 text-center">
                  <button
                    onClick={clearCache}
                    className="bg-pink-600 text-white px-4 py-2 rounded text-sm hover:bg-pink-700 transition-colors"
                  >
                    🗑️ Clear Cache
                  </button>
                  <div className="text-xs text-pink-600 mt-1">Free up memory</div>
                </div>
              </div>

              {/* Cache Age Info */}
              {cacheStats.oldestEntry && cacheStats.newestEntry && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Cache Age Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Oldest Entry:</span>
                      <div className="font-medium">
                        {new Date(cacheStats.oldestEntry).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Newest Entry:</span>
                      <div className="font-medium">
                        {new Date(cacheStats.newestEntry).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* System Recommendations */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">💡 Performance Tips</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Clear cache periodically to free up memory</li>
              <li>• Monitor operation durations - anything over 500ms may need optimization</li>
              <li>• Success rates below 95% indicate system issues that need attention</li>
              <li>• Use the conflict resolution system to prevent edit failures</li>
              <li>• Batch operations when possible to reduce database load</li>
            </ul>
          </div>

          {/* Live Memory Stats */}
          {typeof performance !== 'undefined' && performance.memory && (
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">🖥️ Live Memory Usage</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Used:</span>
                  <div className="font-medium">
                    {formatBytes(performance.memory.usedJSHeapSize)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Total:</span>
                  <div className="font-medium">
                    {formatBytes(performance.memory.totalJSHeapSize)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Limit:</span>
                  <div className="font-medium">
                    {formatBytes(performance.memory.jsHeapSizeLimit)}
                  </div>
                </div>
              </div>
              
              {/* Memory Usage Bar */}
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) > 0.8
                        ? 'bg-red-500'
                        : (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) > 0.6
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{
                      width: `${(performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100}%`
                    }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100).toFixed(1)}% used
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-6 py-4 flex justify-between items-center text-sm text-gray-600">
          <div>
            Last updated: {new Date().toLocaleTimeString()}
          </div>
          <div>
            Auto-refreshes every 5 seconds
          </div>
        </div>
      </div>
    </div>
  )
}

export default PerformanceMonitor
