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
    modals
}) => {
    return (
        <div className="min-h-[100dvh] font-outfit pb-12">
            {header}

            {topElements}

            {toasts}

            {children}

            {footer}

            {modals}
        </div>
    );
};
