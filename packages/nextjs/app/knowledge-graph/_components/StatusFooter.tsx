interface StatusFooterProps {
  status: string;
  operationsCount: number;
  onOperationsClick?: () => void;
  isHookDemo?: boolean;
}

/**
 * Fixed footer component displaying status and operation count
 */
export const StatusFooter = ({ status, operationsCount, onOperationsClick, isHookDemo = false }: StatusFooterProps) => {
  return (
    <div className="fixed bottom-0 left-0 w-full bg-gradient-to-br from-primary to-secondary text-white py-2 px-4 shadow-lg z-50">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-xs opacity-80">Status:</span>
          <span className="ml-2 text-sm font-medium">{status || "Ready"}</span>
        </div>
        <div className="badge badge-neutral text-xs font-medium cursor-pointer" onClick={onOperationsClick}>
          {operationsCount} ops
        </div>
      </div>
    </div>
  );
};
