import React from "react"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  color?: "blue" | "green"
}

export const Button: React.FC<ButtonProps> = ({ children, color = "blue", ...rest }) => {
  const base = "px-4 py-2 rounded-md font-bold transition-all duration-200"
  const colors = {
    blue: "bg-neonBlue text-black hover:bg-blue-400",
    green: "bg-neonGreen text-black hover:bg-green-400"
  }
  return (
    <button className={`${base} ${colors[color]}`} {...rest}>
      {children}
    </button>
  )
}