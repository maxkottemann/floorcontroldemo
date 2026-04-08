import { useState, useEffect } from "react";

interface InputfieldProps {
  title: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export default function Inputfield({
  title,
  placeholder,
  onChange,
  value: initialValue,
  className,
}: InputfieldProps) {
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState("");

  useEffect(() => {
    setValue(initialValue ?? "");
  }, [initialValue]);

  const hasContent = value.length > 0;

  return (
    <div className="relative w-full">
      <div
        className={`
          relative rounded-xl border bg-white transition-all duration-200
          ${
            focused
              ? "border-p shadow-[0_0_0_3px_rgba(15,23,42,0.08)]"
              : "border-slate-200 shadow-sm hover:border-p"
          }
        `}
      >
        <label
          className={`
            pointer-events-none absolute left-4 font-medium tracking-wide transition-all duration-200
            ${
              focused || hasContent
                ? "top-1 text-[10px] uppercase text-slate-400"
                : "top-1/2 -translate-y-1/2 text-sm text-slate-400"
            }
          `}
          style={{ letterSpacing: focused || hasContent ? "0.08em" : "0" }}
        >
          {title}
        </label>

        <input
          type="text"
          value={value}
          placeholder={focused ? placeholder : ""}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => {
            setValue(e.target.value);
            onChange?.(e.target.value);
          }}
          className={`
            w-full rounded-xl bg-transparent px-4 pb-3 pt-5 text-sm
            text-slate-900 placeholder-slate-300 outline-none
            ${className}
          `}
        />

        <div
          className={`
            absolute bottom-0 left-4 right-4 h-[1.5px] rounded-full
            bg-p transition-all duration-300
            ${focused ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"}
          `}
          style={{ transformOrigin: "left" }}
        />
      </div>
    </div>
  );
}
