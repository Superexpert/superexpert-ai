"use client";

import { ReactNode } from "react";

interface ModalProps {
  isVisible: boolean;
  styles: Record<string, string>;

  children: ReactNode;
}

const Modal = ({ isVisible, styles, children }: ModalProps) => {
  if (!isVisible) return null;

  return (
    <div className={styles.modalOverlay}>
      <div id="modal" className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

export default Modal;