import styles from '@/styles/collapsible-panel.module.css';
import React, { useState, useRef, useEffect } from 'react';

export function CollapsiblePanel({
    title,
    openByDefault,
    children,
}: {
    title: string;
    openByDefault?: boolean,
    children: React.ReactNode;
}) {
    const [isOpen, setIsOpen] = useState(openByDefault);
    const contentRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState('0px');

    const toggleOpen = () => {
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        setHeight(isOpen ? `${contentRef.current?.scrollHeight}px` : '0px');
    }, [isOpen]);

    return (
        <div className={styles.collapsiblePanel}>
            <div className={styles.collapsibleHeader}>
                <button onClick={toggleOpen} type="button">
                    {isOpen ? 'Collapse' : 'Expand'} {title}
                </button>
            </div>
            <div
                ref={contentRef}
                className={styles.collapsibleContent}
                style={{
                    height,
                }}>
                <div className={styles.collapsibleContentInner}>{children}</div>
            </div>
        </div>
    );
}
