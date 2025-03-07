"use client";

import { ReactNode } from "react";

interface ModalProps {
  isVisible: boolean;
  children: ReactNode;
}

const Modal = ({ isVisible, children }: ModalProps) => {
  if (!isVisible) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

export default Modal;