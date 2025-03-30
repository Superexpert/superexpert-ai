import React, { useState, useRef, useEffect } from 'react';
import styles from '@/styles/collapsible-panel.module.css';

interface CollapsiblePanelProps {
  id: string;
  title: string;
  children: React.ReactNode;
  expandedPanel: string | null;
  onToggle: (id: string) => void;
}

export const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({
  id,
  title,
  children,
  expandedPanel,
  onToggle,
}) => {
  const isOpen = id === expandedPanel;
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<string>(isOpen ? 'auto' : '0px');

  useEffect(() => {
    if (isOpen) {
      const contentHeight = contentRef.current?.scrollHeight;
      setHeight(`${contentHeight}px`);
    } else {
      setHeight('0px');
    }
  }, [isOpen]);

  const handleTransitionEnd = () => {
    if (isOpen) {
      setHeight('auto'); // Maintain auto height after transition
    }
  };

  return (
    <div className={styles.collapsiblePanel}>
      <button type="button" className={styles.collapsibleHeader} onClick={() => onToggle(id)}>
        {title}
      </button>
      <div
        className={styles.collapsibleContent}
        ref={contentRef}
        style={{ height }}
        onTransitionEnd={handleTransitionEnd}
      >
        <div className={styles.collapsibleContentInner}>{children}</div>
      </div>
    </div>
  );
};