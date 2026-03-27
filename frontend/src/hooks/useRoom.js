import { useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'

let socketInstance = io(
  import.meta.env.VITE_API_URL || 'http://localhost:5000',
  { transports: ['websocket'], autoConnect: false }
)

export function getSocket() {
  if (!socketInstance) {
    socketInstance = io('http://localhost:5000', {
      transports: ['websocket'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })
  }
  return socketInstance
}

export function useRoom(events = {}) {
  const socket    = getSocket()
  const eventsRef = useRef(events)
  eventsRef.current = events

  useEffect(() => {
    // Register event handlers
    const handlers = {}
    Object.entries(eventsRef.current).forEach(([event, handler]) => {
      handlers[event] = (data) => eventsRef.current[event]?.(data)
      socket.on(event, handlers[event])
    })

    // Connect if not already
    if (!socket.connected) socket.connect()

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        socket.off(event, handler)
      })
    }
  }, [])

  // emit waits for connection if needed
  const emit = useCallback((event, data) => {
    if (socket.connected) {
      socket.emit(event, data)
    } else {
      socket.once('connect', () => socket.emit(event, data))
      socket.connect()
    }
  }, [])

  return { emit, socket }
}