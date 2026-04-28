import { Link } from '@inertiajs/react';

interface TabDef {
    key: string;
    label: string;
    value: string;
    subtitle: string;
    tint: string;
}

export function SystemOverviewTabs({
    tabs,
    activeTab,
}: {
    tabs: TabDef[];
    activeTab: string;
}) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18 }}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                    <Link
                        key={tab.key}
                        href={`/dashboard?systemTab=${tab.key}`}
                        preserveScroll
                        preserveState
                        style={{
                            textDecoration: 'none',
                            borderRadius: 18,
                            padding: '16px 18px',
                            background: isActive ? tab.tint : '#fff',
                            border: `1px solid ${isActive ? '#cfd8ea' : '#e6eaf2'}`,
                            boxShadow: isActive ? '0 10px 28px rgba(15, 23, 42, 0.05)' : 'none',
                            transition: 'all 0.18s ease',
                            display: 'grid',
                            gap: 8,
                        }}
                    >
                        <div style={{ fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7c8aa5', fontWeight: 600 }}>
                            {tab.label}
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{tab.value}</div>
                        <div style={{ fontSize: 11, color: '#8fa0bf' }}>{tab.subtitle}</div>
                    </Link>
                );
            })}
        </div>
    );
}
