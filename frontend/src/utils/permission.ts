import { usePermissionStore } from '@/stores/permission'

export function usePermission() {
  const permissionStore = usePermissionStore()

  function hasButton(action: string): boolean {
    return permissionStore.hasButton(action)
  }

  function hasMenu(path: string): boolean {
    return permissionStore.hasMenu(path)
  }

  return { hasButton, hasMenu }
}
