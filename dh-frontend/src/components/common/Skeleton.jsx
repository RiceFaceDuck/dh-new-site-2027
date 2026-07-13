
/**
 * A reusable Skeleton loading component.
 * Uses Tailwind CSS animate-pulse for the shimmer effect.
 * 
 * @param {string} className - Tailwind classes for width, height, rounding, etc.
 * @param {string} variant - 'text', 'circular', or 'rectangular'
 */
const Skeleton = ({ className = '', variant = 'rectangular', ...props }) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700 animate-pulse';
  
  let variantClasses = '';
  switch (variant) {
    case 'circular':
      variantClasses = 'rounded-full';
      break;
    case 'text':
      variantClasses = 'rounded-md h-4 w-full';
      break;
    case 'rectangular':
    default:
      variantClasses = 'rounded-lg';
      break;
  }

  return (
    <div 
      className={`${baseClasses} ${variantClasses} ${className}`} 
      {...props} 
    />
  );
};

export default Skeleton;
