import React from "react"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export const Input: React.FC<InputProps> = ({ label, ...rest }) => (
  <div className="flex flex-col mb-4">
    <label className="mb-1">{label}</label>
    <input
      className="px-3 py-2 rounded-md bg-blackBg border border-neonBlue text-neonBlue focus:outline-none focus:ring-2 focus:ring-neonBlue"
      {...rest}
    />
  </div>
)