import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
}

export default function Card({ title, action, children }: CardProps) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-4">
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between">
          {title && (
            <h2 className="text-sm font-semibold text-ink-2">{title}</h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
