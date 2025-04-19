import { ReactNode, useState } from "react";

interface ExpandableCardProps {
  title: string | ReactNode;
  icon?: ReactNode;
  defaultExpanded?: boolean;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  children: ReactNode;
}

/**
 * A reusable expandable card component with consistent styling and behavior
 */
export const ExpandableCard = ({
  title,
  icon,
  defaultExpanded = true,
  className = "",
  headerClassName = "",
  bodyClassName = "",
  children,
}: ExpandableCardProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`card bg-base-100 border border-base-300 shadow-sm mb-8 ${className}`}>
      <div
        className={`card-title p-4 cursor-pointer flex justify-between items-center ${headerClassName}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          {icon && <div className="mr-2">{icon}</div>}
          {typeof title === "string" ? <h3 className="text-lg font-bold">{title}</h3> : title}
        </div>
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

      {isExpanded && <div className={`card-body pt-0 ${bodyClassName}`}>{children}</div>}
    </div>
  );
};
