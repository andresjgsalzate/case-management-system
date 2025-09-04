import React from "react";

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({
  children,
  className = "",
}) => {
  return <div className={`space-y-6 ${className}`}>{children}</div>;
};
