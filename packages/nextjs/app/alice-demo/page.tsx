// In app/alice-demo/page.tsx
"use client";

import AliceLikesPizzaDemo from "./_components/AliceLikesPizzaDemo";

// In app/alice-demo/page.tsx

const DemoPage = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">Knowledge Graph Hooks Demo</h1>
      <AliceLikesPizzaDemo />
    </div>
  );
};

export default DemoPage;
