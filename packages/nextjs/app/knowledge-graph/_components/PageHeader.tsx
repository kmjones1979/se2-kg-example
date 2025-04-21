interface PageHeaderProps {
  title: string;
  subtitle: string;
  showHookDemo: boolean;
  setShowHookDemo: (value: boolean) => void;
}

/**
 * Page header component with gradient background and mode toggle
 */
export const PageHeader = ({ title, subtitle, showHookDemo, setShowHookDemo }: PageHeaderProps) => {
  return (
    <div className="bg-gradient-to-br from-primary to-secondary text-white p-4 shadow-xl">
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-center text-3xl md:text-4xl font-bold mb-2">{title}</h1>
        <p className="text-center text-sm md:text-base opacity-90">{subtitle}</p>
        <div className="flex justify-center mt-2">
          <button onClick={() => setShowHookDemo(!showHookDemo)} className="btn btn-sm btn-outline btn-accent">
            {showHookDemo ? "Switch to Traditional Interface" : "Switch to Modern Hooks Interface"}
          </button>
        </div>
      </div>
    </div>
  );
};
