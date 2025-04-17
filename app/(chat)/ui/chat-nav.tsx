'use client';
import React from 'react';
import Link from 'next/link'; 
import SignOutButton from '@/app/(admin)/ui/sign-out-button';

export default function ChatNav() {
  return (
    <nav className="w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/">
              <span className="text-xl font-bold text-gray-900">
                <span className="bg-black rounded-full text-white w-7 h-7 inline-flex items-center justify-center">Su</span>
                perexpert.AI
              </span>
            </Link>
          </div>

          <div className="hidden md:flex md:items-center md:space-x-8">
            <SignOutButton />
          </div>

 
        </div>
      </div>
    </nav>
  );
}




