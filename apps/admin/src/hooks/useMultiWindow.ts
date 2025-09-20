import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from 'react-query'

export function useWindowFocusRefresh() {
  const queryClient = useQueryClient()
  const lastFocusTime = useRef<number>(Date.now())
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    const handleFocus = () => {
      const now = Date.now()
      const timeSinceLastFocus = now - lastFocusTime.current
      
      // If more than 30 seconds since last focus, refresh data
      if (timeSinceLastFocus > 30000) {
        console.log('Window focused after', timeSinceLastFocus, 'ms - refreshing data')
        
        setIsRefreshing(true)
        
        // Invalidate all queries to force fresh data
        queryClient.invalidateQueries().finally(() => {
          setIsRefreshing(false)
        })
        
        // Update last focus time
        lastFocusTime.current = now
      }
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleFocus()
      }
    }

    // Listen for window focus and visibility changes
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [queryClient])

  return { isRefreshing }
}

export function useMultiWindowDetection() {
  const queryClient = useQueryClient()

  useEffect(() => {
    // Check if there are multiple windows/tabs open
    const checkMultipleWindows = () => {
      // Use localStorage to track window count
      const windowId = `window_${Date.now()}_${Math.random()}`
      const windows = JSON.parse(localStorage.getItem('admin_windows') || '[]')
      
      // Clean up old window IDs (older than 5 minutes)
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
      const activeWindows = windows.filter((w: any) => w.timestamp > fiveMinutesAgo)
      
      // Add current window
      activeWindows.push({ id: windowId, timestamp: Date.now() })
      localStorage.setItem('admin_windows', JSON.stringify(activeWindows))
      
      // If multiple windows detected, reduce cache time
      if (activeWindows.length > 1) {
        console.log(`Multiple windows detected (${activeWindows.length}) - enabling aggressive refresh`)
        
        // Set shorter stale time for multi-window scenarios
        queryClient.setDefaultOptions({
          queries: {
            staleTime: 30 * 1000, // 30 seconds instead of 5 minutes
            refetchOnWindowFocus: true,
            refetchOnMount: true,
          },
        })
      }
      
      // Cleanup on window close
      const cleanup = () => {
        const remainingWindows = activeWindows.filter((w: any) => w.id !== windowId)
        localStorage.setItem('admin_windows', JSON.stringify(remainingWindows))
      }
      
      window.addEventListener('beforeunload', cleanup)
      return cleanup
    }

    const cleanup = checkMultipleWindows()
    return cleanup
  }, [queryClient])
}
