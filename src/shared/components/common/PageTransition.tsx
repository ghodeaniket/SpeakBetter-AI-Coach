import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Box } from '@mui/material';

interface PageTransitionProps {
  children: ReactNode;
  variant?: 'fadeIn' | 'slideUp' | 'slideIn' | 'none';
  duration?: number;
}

const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  variant = 'fadeIn',
  duration = 0.5
}) => {
  // Different animation variants
  const getAnimationProps = () => {
    switch (variant) {
      case 'fadeIn':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          transition: { duration }
        };
      case 'slideUp':
        return {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -20 },
          transition: { duration }
        };
      case 'slideIn':
        return {
          initial: { opacity: 0, x: 20 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: -20 },
          transition: { duration }
        };
      case 'none':
      default:
        return {};
    }
  };

  // If framer-motion is not available, just render the children
  if (typeof motion !== 'function') {
    return <Box>{children}</Box>;
  }

  return (
    <motion.div {...getAnimationProps()}>
      {children}
    </motion.div>
  );
};

export default PageTransition;
