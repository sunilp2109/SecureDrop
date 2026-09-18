import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, ShieldCheck, X } from 'lucide-react';

const links = [
  { to: '/security', label: 'How it works' },
  { to: '/dashboard', label: 'Dashboard' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-ink-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 text-white" onClick={() => setOpen(false)}>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/30 bg-accent/10">
            <ShieldCheck className="h-4 w-4 text-accent" />
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-wide">SecureDrop</span>
            <span className="hidden text-[10px] text-mist-500 sm:block">Share files. Leave no trace.</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `hidden rounded-lg px-3 py-2 text-sm transition duration-180 sm:inline-flex ${isActive ? 'text-white' : 'text-mist-400 hover:text-white'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <Link
            to="/send"
            className="rounded-xl bg-accent px-3.5 py-2 text-sm font-semibold text-ink-950 transition duration-180 hover:bg-accent-dim motion-safe:hover:-translate-y-px"
          >
            Send file
          </Link>
          <button
            type="button"
            className="rounded-lg p-2 text-mist-300 sm:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>
      </div>
      {open ? (
        <div className="border-t border-white/[0.06] bg-ink-950 px-4 py-3 sm:hidden">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-3 text-sm text-mist-200"
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      ) : null}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 text-xs text-mist-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>Secure by design, simple by default.</p>
        <div className="flex gap-4">
          <Link to="/security" className="hover:text-mist-300">
            Security
          </Link>
          <Link to="/dashboard" className="hover:text-mist-300">
            Dashboard
          </Link>
        </div>
      </div>
    </footer>
  );
}
