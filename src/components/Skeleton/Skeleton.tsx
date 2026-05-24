type Radius = "sm" | "md" | "lg" | "xl" | "full";

const radiusClass: Record<Radius, string> = {
  sm: "rounded",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
};

type SkeletonProps = {
  className?: string;
  rounded?: Radius;
};

export function Skeleton({ className = "", rounded = "md" }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${radiusClass[rounded]} ${className}`}
      aria-hidden="true"
    />
  );
}

type SkeletonTextProps = {
  lines?: number;
  className?: string;
};

export function SkeletonText({ lines = 1, className = "" }: SkeletonTextProps) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3 ${i === lines - 1 && lines > 1 ? "w-2/3" : "w-full"}`}
        />
      ))}
    </div>
  );
}
