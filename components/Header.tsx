"use client";

import Image from "next/image";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 shadow-sm">
      {/* Red contact bar */}
      <div className="bg-red-600 text-white text-xs sm:text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-2">
          <div className="flex items-center gap-2 min-w-0">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
            </svg>
            <span className="truncate">
              Kololo Airstrip (Independence Grounds), Kampala
            </span>
          </div>
          <a href="tel:0800211700" className="flex items-center gap-2 hover:underline flex-shrink-0">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57-.35-.11-.74-.03-1.02.24l-2.2 2.2a15.05 15.05 0 01-6.59-6.58l2.2-2.21c.28-.27.36-.66.25-1.01A11.36 11.36 0 018.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1zM19 12h2a9 9 0 00-9-9v2c3.87 0 7 3.13 7 7z" />
            </svg>
            <span className="hidden sm:inline">0800 211 700</span>
            <span className="sm:hidden">Call</span>
          </a>
        </div>
      </div>

      {/* White header bar */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
    <a href="/" className="flex items-center gap-3">
<Image
  src="/nira-logo.png"
  alt="NIRA"
  width={140}
  height={56}
  className="h-12 sm:h-14 w-auto object-contain"
  style={{ width: "auto", height: "auto" }}
  priority
/>
</a>
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Theme toggle — always visible */}
            <ThemeToggle />

            {/* Hamburger (mobile) */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6 text-gray-700 dark:text-gray-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-700 dark:text-gray-300 ml-4">
          <a href="/" className="hover:text-red-700 dark:hover:text-red-500">Services</a>
          <a href="/dashboards" className="hover:text-red-700 dark:hover:text-red-500">Dashboards</a>
          <a href="/about" className="hover:text-red-700 dark:hover:text-red-500">About</a>
          <a href="/contact" className="hover:text-red-700 dark:hover:text-red-500">Contact</a>
          <a href="/admin" className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
            Admin
          </a>
        </nav>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <nav className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
<div className="px-4 py-3 space-y-2 text-sm font-medium text-gray-700 dark:text-gray-300">
  <a href="/" className="block py-2 hover:text-red-700 dark:hover:text-red-500">Services</a>
  <a href="/dashboards" className="block py-2 hover:text-red-700 dark:hover:text-red-500">Dashboards</a>
  <a href="/about" className="block py-2 hover:text-red-700 dark:hover:text-red-500">About</a>
  <a href="/contact" className="block py-2 hover:text-red-700 dark:hover:text-red-500">Contact</a>
  <a href="/admin" className="block py-2 text-red-700 dark:text-red-500 font-semibold">Admin</a>
</div>
          </nav>
        )}
      </div>
    </header>
  );
}