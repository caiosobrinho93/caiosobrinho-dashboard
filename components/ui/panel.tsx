import type { ReactNode } from "react";

type PanelProps = {
  title: string;
  subtitle?: string;
  dotColor?: string;
  action?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function Panel({
  title,
  subtitle,
  dotColor,
  action,
  children,
  footer,
  className,
}: PanelProps) {
  return (
    <section className={`panel${className ? ` ${className}` : ""}`}>
      <div className="panel-header">
        <span className="panel-dot" style={dotColor ? { background: dotColor } : undefined} />
        <div className="panel-heading">
          <h2 className="panel-title">{title}</h2>
          {subtitle ? <span className="panel-subtitle">{subtitle}</span> : null}
        </div>
        {action}
      </div>
      {children}
      {footer ? <div className="panel-footer">{footer}</div> : null}
    </section>
  );
}
