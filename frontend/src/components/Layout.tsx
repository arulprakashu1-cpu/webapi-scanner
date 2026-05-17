import Rail from './Rail'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
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
