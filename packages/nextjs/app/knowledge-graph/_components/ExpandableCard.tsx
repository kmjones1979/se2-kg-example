import { ReactNode, useState } from "react";

interface ExpandableCardProps {
  title: ReactNode;
  children: ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

/**
 * Reusable expandable card component with toggle functionality
 */
export const ExpandableCard = ({ title, children, defaultExpanded = false, className = "" }: ExpandableCardProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`card bg-base-100 border border-base-300 shadow-sm mb-4 ${className}`}>
      <div
        className="card-title p-4 cursor-pointer flex justify-between items-center"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {typeof title === "string" ? <h3 className="text-lg font-bold">{title}</h3> : title}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-5 w-5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      {isExpanded && <div className="card-body pt-0">{children}</div>}
    </div>
  );
};
