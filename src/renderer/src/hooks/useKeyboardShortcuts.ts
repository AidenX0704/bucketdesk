import { useEffect } from 'react'
import type { StorageObject } from '../../../shared/types/object'

interface KeyboardShortcutOptions {
  selectedObject: StorageObject | undefined
  onDelete: (object: StorageObject) => void
  onRename: (object: StorageObject) => void
  onBack: () => void
  enabled: boolean
}

export function useKeyboardShortcuts({
  selectedObject,
  onDelete,
  onRename,
  onBack,
  enabled
}: KeyboardShortcutOptions): void {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement
      const tagName = target.tagName.toLowerCase()
      if (tagName === 'input' || tagName === 'textarea' || target.isContentEditable) return

      if (event.key === 'Delete' && selectedObject) {
        event.preventDefault()
        onDelete(selectedObject)
        return
      }

      if (event.key === 'F2' && selectedObject) {
        event.preventDefault()
        onRename(selectedObject)
        return
      }

      if (event.key === 'Backspace') {
        event.preventDefault()
        onBack()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [enabled, selectedObject, onDelete, onRename, onBack])
}
