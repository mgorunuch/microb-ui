import React, {ReactNode} from 'react';
import { Home } from 'lucide-react';
import Link from "next/link";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-base-200">
      {/* Navbar */}
      <div className="navbar bg-base-100 shadow-lg">
        <div className="flex-1">
          <a className="btn btn-ghost text-xl">Microb-UI</a>
        </div>
      </div>

      {/* Sidebar and Main Content */}
      <div className="drawer lg:drawer-open">
        <input id="drawer" type="checkbox" className="drawer-toggle" />

        <div className="drawer-content flex flex-col p-4">
          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>
        </div>

        <div className="drawer-side">
          <label htmlFor="drawer" className="drawer-overlay"></label>
          <ul className="menu p-4 w-64 h-full bg-base-100 text-base-content">
            {[
              { icon: <Home />, content: 'Dashboard', link: '/' },
              { icon: <Home />, content: 'DNS Explorer', link: '/dns-explorer' },
              { icon: <Home />, content: 'Domain table', link: '/domain-table' },
            ].map(v => (
              <li key={v.link}>
                <Link href={v.link} className="flex items-center gap-2 mb-2">
                  {v.icon}
                  {v.content}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Layout;
