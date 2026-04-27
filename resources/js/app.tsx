import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import '../css/app.css';
import './echo';

import { DashboardEditProvider } from './contexts/DashboardEditContext';

const appName = import.meta.env.VITE_APP_NAME || 'QUAMC';

createInertiaApp({
    title: (title) => title ? `${title} — ${appName}` : appName,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx')
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <DashboardEditProvider>
                <App {...props} />
            </DashboardEditProvider>
        );
    },
    progress: {
        color: '#c9a84c',
        includeCSS: false,
    },
});
