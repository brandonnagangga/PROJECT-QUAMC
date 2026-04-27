import React, { createContext, useContext, useMemo, useState } from 'react';
import { router } from '@inertiajs/react';

export interface DashboardPreferences {
    hidden_widgets: string[];
    is_edit_mode: boolean;
}

interface DashboardEditContextType {
    isEditMode: boolean;
    toggleEditMode: () => void;
    hiddenWidgets: string[];
    hideWidget: (id: string) => void;
    resetWidgets: () => void;
    hasUnsavedChanges: boolean;
    saveChanges: () => Promise<boolean>;
    discardChanges: () => void;
    syncFromServer: (preferences?: Partial<DashboardPreferences> | null) => void;
}

const DashboardEditContext = createContext<DashboardEditContextType | undefined>(undefined);

const normalizePreferences = (preferences?: Partial<DashboardPreferences> | null): DashboardPreferences => {
    const rawHidden = Array.isArray(preferences?.hidden_widgets) ? preferences?.hidden_widgets : [];
    const hidden_widgets = Array.from(
        new Set(
            rawHidden
                .filter((id): id is string => typeof id === 'string')
                .map((id) => id.trim())
                .filter((id) => id.length > 0),
        ),
    );

    return {
        hidden_widgets,
        is_edit_mode: Boolean(preferences?.is_edit_mode),
    };
};

const signatureFor = (preferences: DashboardPreferences): string => {
    return JSON.stringify({
        hidden_widgets: preferences.hidden_widgets,
        is_edit_mode: preferences.is_edit_mode,
    });
};

export const DashboardEditProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isEditMode, setIsEditMode] = useState(false);
    const [hiddenWidgets, setHiddenWidgets] = useState<string[]>([]);
    const [savedPreferences, setSavedPreferences] = useState<DashboardPreferences>({
        hidden_widgets: [],
        is_edit_mode: false,
    });
    const [hydrated, setHydrated] = useState(false);

    const currentPreferences = useMemo<DashboardPreferences>(() => ({
        hidden_widgets: hiddenWidgets,
        is_edit_mode: isEditMode,
    }), [hiddenWidgets, isEditMode]);

    const hasUnsavedChanges = useMemo(
        () => signatureFor(currentPreferences) !== signatureFor(savedPreferences),
        [currentPreferences, savedPreferences],
    );

    const syncFromServer = (preferences?: Partial<DashboardPreferences> | null) => {
        const normalized = normalizePreferences(preferences);
        setSavedPreferences(normalized);

        if (!hydrated || !hasUnsavedChanges) {
            setHiddenWidgets(normalized.hidden_widgets);
            setIsEditMode(normalized.is_edit_mode);
        }

        if (!hydrated) {
            setHydrated(true);
        }
    };

    const toggleEditMode = () => setIsEditMode((prev) => !prev);

    const hideWidget = (id: string) => {
        setHiddenWidgets((prev) => (prev.includes(id) ? prev : [...prev, id]));
    };

    const resetWidgets = () => {
        setHiddenWidgets([]);
    };

    const discardChanges = () => {
        setHiddenWidgets(savedPreferences.hidden_widgets);
        setIsEditMode(savedPreferences.is_edit_mode);
    };

    const saveChanges = (): Promise<boolean> => {
        if (!hasUnsavedChanges) {
            return Promise.resolve(true);
        }

        const payload = {
            hidden_widgets: hiddenWidgets,
            is_edit_mode: isEditMode,
        };

        return new Promise((resolve) => {
            router.post('/dashboard/preferences', payload, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    const normalized = normalizePreferences(payload);
                    setSavedPreferences(normalized);
                    resolve(true);
                },
                onError: () => resolve(false),
            });
        });
    };

    return (
        <DashboardEditContext.Provider
            value={{
                isEditMode,
                toggleEditMode,
                hiddenWidgets,
                hideWidget,
                resetWidgets,
                hasUnsavedChanges,
                saveChanges,
                discardChanges,
                syncFromServer,
            }}
        >
            {children}
        </DashboardEditContext.Provider>
    );
};

export const useDashboardEdit = () => {
    const context = useContext(DashboardEditContext);
    if (context === undefined) {
        throw new Error('useDashboardEdit must be used within a DashboardEditProvider');
    }
    return context;
};

