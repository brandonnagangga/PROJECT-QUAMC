import React from 'react';
import { X } from 'lucide-react';
import { useDashboardEdit } from '@/contexts/DashboardEditContext';

interface DashboardWidgetWrapperProps {
    id: string;
    children: React.ReactNode;
}

export default function DashboardWidgetWrapper({ id, children }: DashboardWidgetWrapperProps) {
    const { isEditMode, hiddenWidgets, hideWidget } = useDashboardEdit();

    if (hiddenWidgets.includes(id)) {
        return null;
    }

    return (
        <div style={{ position: 'relative' }} className={isEditMode ? 'dashboard-edit-shaking' : ''} data-tour={id}>
            {isEditMode && (
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        hideWidget(id);
                    }}
                    className="dashboard-card-remove-btn"
                    style={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: '#ef4444',
                        color: 'white',
                        border: '2px solid white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                >
                    <X size={12} />
                </button>
            )}
            {children}
        </div>
    );
}
