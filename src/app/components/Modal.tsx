import React, { useEffect, useRef } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    const previouslyFocusedElement =
      document.activeElement as HTMLElement | null;

    if (isOpen && modalRef.current) {
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusable[0]?.focus();
    }

    return () => {
      previouslyFocusedElement?.focus();
    };
  }, [isOpen]);

  // Handle background click
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity"
    >
      <div
        ref={modalRef}
        className="relative bg-card text-card-foreground p-6 rounded-2xl shadow-xl w-11/12 max-w-md animate-fade-in border border-border"
      >
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground text-2xl font-bold transition-colors"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;
