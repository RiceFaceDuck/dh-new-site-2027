import { ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AccordionSection = ({ title, summary, step, activeStep, setActiveStep, isCompleted, children }) => {
  const isOpen = activeStep === step;
  return (
    <div className={`border rounded-xl mb-4 overflow-hidden transition-all duration-300 ${isOpen ? 'border-emerald-500 shadow-md' : 'border-gray-200 bg-white'}`}>
      <div 
        className={`p-4 flex items-center justify-between cursor-pointer select-none transition-colors ${isOpen ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-gray-50'}`}
        onClick={() => setActiveStep(isOpen ? null : step)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${isCompleted ? 'bg-emerald-500 text-white' : (isOpen ? 'bg-emerald-200 text-emerald-800' : 'bg-gray-200 text-gray-600')}`}>
            {isCompleted ? <CheckCircle2 size={18} /> : step}
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
            <h2 className="text-lg font-bold">{title}</h2>
            {!isOpen && isCompleted && summary && (
              <span className="text-sm text-gray-500 font-medium truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                — {summary}
              </span>
            )}
          </div>
        </div>
        {isOpen ? <ChevronUp size={20} className="text-emerald-600 shrink-0" /> : <ChevronDown size={20} className="text-gray-400 shrink-0" />}
      </div>
      
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden bg-white"
          >
            <div className="p-4 md:p-6 border-t border-gray-100">
              {children}
              
              <div className="mt-6 flex justify-end">
                <button 
                  onClick={() => setActiveStep(step + 1)}
                  className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  ถัดไป
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccordionSection;
