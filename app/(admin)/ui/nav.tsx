'use client';
import React from 'react';
import Link from 'next/link';
import SignOutButton from './sign-out-button';
import Image from 'next/image';
import { User } from 'next-auth';

export default function Navbar({user}: {user: User | null}) {
    return (
        <nav className="w-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link href="/">
                            <Image
                                src="/superexpert-ai-transparent.png"
                                alt="Logo"
                                width={200}
                                height={38}
                                priority={true}
                            />
                        </Link>
                    </div>

                    {/* Navigation Links - Desktop */}
                    <div className="hidden md:flex md:items-center md:space-x-8">
                        <Link
                            href="/"
                            className="text-gray-600 hover:text-gray-900 text-base font-medium">
                            Agents
                        </Link>
                        <Link
                            href="/admin/corpora"
                            className="text-gray-600 hover:text-gray-900 text-base font-medium">
                            Corpora
                        </Link>
                        <Link
                            href="https://superexpert.ai/docs/"
                            target="_blank"
                            className="text-gray-600 hover:text-gray-900 text-base font-medium">
                            Docs
                        </Link>
                        {user && (
                            <>
                                <SignOutButton />
                            </>
                        )}
                    </div>

                    {/* Mobile Hamburger */}
                    <div className="-mr-2 flex md:hidden">
                        <MobileMenu />
                    </div>
                </div>
            </div>
        </nav>
    );
}

function MobileMenu() {
    const [open, setOpen] = React.useState(false);

    return (
        <>
            <button
                onClick={() => setOpen(!open)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                {open ? (
                    <svg
                        className="h-6 w-6"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                ) : (
                    <svg
                        className="h-6 w-6"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 6h16M4 12h16M4 18h16"
                        />
                    </svg>
                )}
            </button>

            {open && (
                <div className="absolute top-16 left-0 right-0 bg-white shadow-lg py-4">
                    <Link
                        href="/"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setOpen(false)}>
                        Agents
                    </Link>
                    <Link
                        href="/admin/corpora"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setOpen(false)}>
                        Corpora
                    </Link>
                    <button
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                            setOpen(false); /* handle sign out */
                        }}>
                        Sign Out
                    </button>
                </div>
            )}
        </>
    );
}
