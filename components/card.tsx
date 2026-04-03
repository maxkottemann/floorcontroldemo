import React from "react";

type CardProps = {
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

export default function Card({ title, description, children }: CardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 max-w-md w-full text-black">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>

      {description && <p className="text-gray-600 mb-4">{description}</p>}

      <div>{children}</div>
    </div>
  );
}
