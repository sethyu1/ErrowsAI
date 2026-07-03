import React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface QAProps {
  title: string;
  description: string | React.ReactNode;
  isExpanded?: boolean;
  onToggle?: () => void;
}

const QA: React.FC<QAProps> = ({
  title,
  description,
  isExpanded = false,
  onToggle,
}) => {

  return (
    <div className="border border-gray-700 rounded-[16px] bg-[#090A0A] overflow-hidden w-[960px] max-sm:w-full">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full h-[60px] max-sm:h-[auto] flex items-center justify-between px-6 text-left hover:bg-gray-800/50 transition-colors"
      >
        <h3
          className="text-[18px] leading-[28px] font-bold text-white pr-4"
          style={{ fontFamily: "Urbanist" }}
        >
          {title}
        </h3>
        <motion.div
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <ChevronDown className="w-5 h-5 text-gray-300" />
        </motion.div>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-2">
              <div className="text-[#A4ACB9] text-[14px] md:text-sm leading-relaxed">
                {description}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QA;
