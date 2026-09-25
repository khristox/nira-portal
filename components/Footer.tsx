export default function Footer() {
  return (
    <footer className="hidden md:block bg-gray-900 dark:bg-black text-gray-400 mt-auto transition-colors border-t border-gray-800 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          
          {/* Left: Copyright */}
          <div>
            © {new Date().getFullYear()} NIRA — National Identification and Registration Authority.
          </div>

          {/* Right: Minimal links & contact */}
          <div className="flex items-center gap-5">
            <a href="/about" className="hover:text-white transition-colors">About</a>
            <a href="/contact" className="hover:text-white transition-colors">Contact</a>
            <a href="tel:0800211700" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57-.35-.11-.74-.03-1.02.24l-2.2 2.2a15.05 15.05 0 01-6.59-6.58l2.2-2.21c.28-.27.36-.66.25-1.01A11.36 11.36 0 018.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z" />
              </svg>
              0800 211 700
            </a>
          </div>

        </div>
      </div>
    </footer>
  );
}