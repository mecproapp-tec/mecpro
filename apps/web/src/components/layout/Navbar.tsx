// src/components/Navbar.tsx
import React from "react";

export const Navbar: React.FC = () => {
  return (
    <div className="bg-gray-900 text-blue-500 p-4 flex justify-between items-center">
      <div className="font-bold text-xl">MecPro</div>
      <div className="flex gap-4">
        <div>Menu</div>
        <div>🔔</div>
      </div>
    </div>
  );
};