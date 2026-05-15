import React from "react"

interface CardProps {
  children: React.ReactNode
}

export const Card: React.FC<CardProps> = ({ children }) => (
  <div className="bg-blackBg border border-neonBlue rounded-lg p-4 mb-4 shadow-md">
    {children}
  </div>
)