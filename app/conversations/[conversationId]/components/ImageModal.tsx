'use client';

import Modal from '@/app/components/Modal';
import Image from 'next/image';

interface ImageModalProps {
  isOpen?: boolean;
  onClose: () => void;
  src?: string | null;
}

const ImageModal: React.FC<ImageModalProps> = ({ 
  isOpen, 
  onClose, 
  src
}) => {
  if (!src) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="w-[512px] h-[412px]">
        <Image 
          className="object-fill" 
          fill 
          alt="Image" 
          src={src}
        />
      </div>
    </Modal>
  )
}

export default ImageModal;