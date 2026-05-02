import { createPortal } from 'react-dom';

const SIZE_CLASS = {
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
};

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClass = SIZE_CLASS[size] || SIZE_CLASS.md;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className={`relative w-full ${sizeClass} bg-valorant-dark border-2 border-valorant-red clip-corner-sm shadow-2xl z-10`}>
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-valorant-dark-tertiary">
          <h2 className="text-3xl font-tungsten text-white tracking-wider">
            {title}
          </h2>
          <button 
            onClick={onClose}
            className="text-valorant-light hover:text-valorant-red transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
