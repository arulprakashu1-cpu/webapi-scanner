import { createContext, useContext, useState, ReactNode } from 'react'

interface SidebarCtx { open: boolean; toggle: () => void }
const SidebarContext = createContext<SidebarCtx>({ open: true, toggle: () => {} })

export const useSidebar = () => useContext(SidebarContext)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <SidebarContext.Provider value={{ open, toggle: () => setOpen(o => !o) }}>
      {children}
    </SidebarContext.Provider>
  )
}
