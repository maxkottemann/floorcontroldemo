type CardProps = {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  clickable?: boolean;
  href?: string;
  className?: string;
};

export default function Card({
  title,
  description,
  children,
  clickable,
  href,
  className = "",
}: CardProps) {
  return (
    <div
      className={`
        rounded-3xl bg-white p-6 shadow-sm
        border border-slate-200
        transition-all duration-200 text-black
        ${clickable ? "hover:shadow-md hover:-translate-y-0.5 cursor-pointer" : ""}
        ${className}
      `}
    >
      {title && (
        <h2 className="text-xltext-slate-900 font-bold mb-2">{title}</h2>
      )}

      {description && (
        <p className="text-sm text-slate-600 mb-4">{description}</p>
      )}

      <div>{children}</div>
    </div>
  );
}
