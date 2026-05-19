import Rail from './Rail'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useSidebar } from '../contexts/SidebarContext'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { open } = useSidebar()
  return (
    <div className={`shell${open ? '' : ' sidebar-collapsed'}`}>
      <Rail />
      <Sidebar />
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        <Topbar />
        <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
