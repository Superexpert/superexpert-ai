'use client';

import React, { useState, useRef, useEffect } from 'react';

export function CollapsiblePanel({
    title,
    openByDefault = false,
    children,
}: {
    title: string;
    openByDefault?: boolean;
    children: React.ReactNode;
}) {
    const [isOpen, setIsOpen] = useState(openByDefault);
    const contentRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState<string | undefined>(
        openByDefault ? 'auto' : '0px'
    );

    const toggleOpen = () => setIsOpen(!isOpen);

    useEffect(() => {
        setHeight(isOpen ? `${contentRef.current?.scrollHeight}px` : '0px');
    }, [isOpen, children]);

    return (
        <div className="w-full mb-4 bg-white rounded-lg shadow">
            <button
                type='button'
                onClick={toggleOpen}
                className="flex items-center justify-between w-full px-6 py-4 text-left text-gray-800 font-medium text-base hover:bg-gray-100 transition duration-200 focus:outline-none"
            >
                <span>{title}</span>
                <svg
                    className={`w-6 h-6 transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                >
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </button>

            <div
                ref={contentRef}
                style={{ height }}
                className="overflow-hidden transition-height duration-300 ease-in-out"
            >
                <div className="px-6 py-4 border-t border-gray-200">{children}</div>
            </div>
        </div>
    );
}

