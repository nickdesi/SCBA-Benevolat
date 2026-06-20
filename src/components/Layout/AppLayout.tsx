import React, { ReactNode } from 'react';

interface AppLayoutProps {
  header: ReactNode;
  topElements?: ReactNode; // EventSchema, MatchTicker
  toasts: ReactNode;
  children: ReactNode; // Main Content
  footer: ReactNode; // Footer, BottomNav
  modals: ReactNode; // All Modals
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  header,
  topElements,
  toasts,
  children,
  footer,
  modals,
}) => {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden font-outfit pb-28 md:pb-12">
      <div className="pointer-events-none absolute -left-24 top-20 h-64 w-64 rounded-full bg-[#c4492d]/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-48 h-80 w-80 rounded-full bg-[#0f766e]/18 blur-3xl" />

      <div className="relative z-10 animate-fade-in">
        {header}

        {topElements}

        {toasts}

        {children}

        {footer}

        {modals}
      </div>
    </div>
  );
};
