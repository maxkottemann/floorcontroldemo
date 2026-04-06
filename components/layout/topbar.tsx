"use client";

type topbarProps = {
  title: string;
};
export default function Topbar({ title }: topbarProps) {
  return (
    <div className="flex flex-row w-full bg-p h-20 justify-between items-center px-6 text-xl">
      <h2 className="font-bold">{title}</h2>
    </div>
  );
}
