'use client';
import React from 'react';
import Link from 'next/link';
import { handleSignOut } from '@/lib/actions/server-actions';

export default function ChatHeader() {
    return (
        <header className="w-full">
            <nav>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-14">
                        {/* Logo */}
                        <div className="flex-shrink-0 flex items-center">
                            <Link href="/">
                                <span className="text-xl font-bold text-gray-900">
                                    <span className="bg-black rounded-full text-white w-7 h-7 inline-flex items-center justify-center">
                                        Su
                                    </span>
                                    perexpert.AI
                                </span>
                            </Link>
                        </div>

                        <div className="hidden md:flex md:items-center md:space-x-8">
                            <form action={handleSignOut}>
                                <button className="">Sign out</button>
                            </form>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    );
}
