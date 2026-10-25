"use client";

type BreadcrumbSegment = {
  label: string;
  current?: boolean;
};

type BreadcrumbProps = {
  /** Segmentos após o root "~". O último é automaticamente marcado como atual. */
  segments: BreadcrumbSegment[];
};

/**
 * Breadcrumb acessível com <nav aria-label> e marcação de página atual.
 * Replica visualmente o estilo de caminho de arquivo do VS Code.
 */
export function Breadcrumb({ segments }: BreadcrumbProps) {
  const items: BreadcrumbSegment[] = [
    { label: "~" },
    { label: "dashboard" },
    ...segments.map((seg, idx) => ({
      ...seg,
      current: idx === segments.length - 1,
    })),
  ];

  return (
    <nav aria-label="Localização" className="breadcrumb">
      {items.map((item, idx) => (
        <span key={idx}>
          {idx > 0 && <span className="slash" aria-hidden="true">/</span>}
          <span
            className={item.current ? "current" : undefined}
            aria-current={item.current ? "page" : undefined}
          >
            {item.label}
          </span>
        </span>
      ))}
    </nav>
  );
}
