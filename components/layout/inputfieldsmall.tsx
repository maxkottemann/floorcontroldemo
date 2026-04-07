interface InputfieldProps {
  title?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export default function InputfieldSmall({
  title,
  placeholder,
  value,
  onChange,
  className,
}: InputfieldProps) {
  return (
    <div className={`max-w-sm relative ${className}`}>
      {title && (
        <label className="block mb-1 text-sm font-medium text-gray-700">
          {title}
        </label>
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl shadow-sm text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 transition"
      />
    </div>
  );
}
