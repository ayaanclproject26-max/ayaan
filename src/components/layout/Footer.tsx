import Link from "next/link";
import { Globe, Camera, MessageCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#111827] text-white/90 py-12 sm:py-16 border-t border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 mb-10">
        
        {/* Brand */}
        <div className="flex flex-col gap-5">
          <Link href="/" className="flex items-center">
            <img src="/logo.png" alt="Ayaan Logo" className="h-9 w-auto" />
          </Link>
          <p className="text-sm opacity-70 leading-relaxed max-w-xs">
            Modern, premium fashion for men, women, and children. Designed with elegance and crafted with quality.
          </p>
          <div className="flex items-center gap-3">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors text-white focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
              <Globe size={16} strokeWidth={1.5} />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors text-white focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
              <Camera size={16} strokeWidth={1.5} />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors text-white focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
              <MessageCircle size={16} strokeWidth={1.5} />
            </a>
          </div>
        </div>

        {/* Company */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] mb-5 text-white/50">COMPANY</h3>
          <ul className="flex flex-col gap-3">
            <li><Link href="/" className="text-sm hover:opacity-70 transition-opacity">About Us</Link></li>
            <li><Link href="/" className="text-sm hover:opacity-70 transition-opacity">Contact</Link></li>
            <li><Link href="/" className="text-sm hover:opacity-70 transition-opacity">Careers</Link></li>
          </ul>
        </div>

        {/* Customer Support */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] mb-5 text-white/50">SUPPORT</h3>
          <ul className="flex flex-col gap-3">
            <li><Link href="/" className="text-sm hover:opacity-70 transition-opacity">Shipping Information</Link></li>
            <li><Link href="/" className="text-sm hover:opacity-70 transition-opacity">Order Tracking</Link></li>
            <li><Link href="/" className="text-sm hover:opacity-70 transition-opacity">FAQ</Link></li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] mb-5 text-white/50">LEGAL</h3>
          <ul className="flex flex-col gap-3">
            <li><Link href="/" className="text-sm hover:opacity-70 transition-opacity">Privacy Policy</Link></li>
            <li><Link href="/" className="text-sm hover:opacity-70 transition-opacity">Terms & Conditions</Link></li>
            <li><Link href="/" className="text-sm hover:opacity-70 transition-opacity">Cookie Policy</Link></li>
          </ul>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-white/10 gap-3 text-xs text-white/40">
        <p>&copy; {new Date().getFullYear()} Ayaan Clothing. All rights reserved.</p>
        <p>Designed for Elegance</p>
      </div>
    </footer>
  );
}
