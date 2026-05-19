import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'motion/react';
import React, {
    ReactNode,
    createContext,
    isValidElement,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';

interface TabContextType {
    activeTab: string;
    setActiveTab: (value: string) => void;
    wobbly: boolean;
    hover: boolean;
    defaultValue: string;
    prevIndex: number;
    setPrevIndex: (value: number) => void;
    tabsOrder: string[];
}

const TabContext = createContext<TabContextType | undefined>(undefined);

export const useTabs = () => {
    const context = useContext(TabContext);
    if (!context) {
        throw new Error('useTabs must be used within a TabsProvider');
    }
    return context;
};

interface TabsProviderProps {
    children: ReactNode;
    defaultValue: string;
    value?: string;
    onValueChange?: (value: string) => void;
    wobbly?: boolean;
    hover?: boolean;
}

export const TabsProvider = ({
    children,
    defaultValue,
    value,
    onValueChange,
    wobbly = true,
    hover = false,
}: TabsProviderProps) => {
    const [activeTab, setActiveTabState] = useState(value ?? defaultValue);
    const [prevIndex, setPrevIndex] = useState(0);
    const [tabsOrder, setTabsOrder] = useState<string[]>([]);

    useEffect(() => {
        if (value !== undefined) setActiveTabState(value);
    }, [value]);

    useEffect(() => {
        const order: string[] = [];
        React.Children.forEach(children, (child) => {
            if (!isValidElement(child)) return;
            if ('value' in child.props && typeof child.props.value === 'string') {
                order.push(child.props.value);
            }
        });
        setTabsOrder(order);
    }, [children]);

    const setActiveTab = (next: string) => {
        setActiveTabState(next);
        onValueChange?.(next);
    };

    const ctxValue = useMemo(
        () => ({
            activeTab,
            setActiveTab,
            wobbly,
            hover,
            defaultValue,
            setPrevIndex,
            prevIndex,
            tabsOrder,
        }),
        [activeTab, wobbly, hover, defaultValue, prevIndex, tabsOrder]
    );

    return <TabContext.Provider value={ctxValue}>{children}</TabContext.Provider>;
};

export const TabsBtn = ({
    children,
    className,
    value,
}: {
    children: ReactNode;
    className?: string;
    value: string;
}) => {
    const { activeTab, setPrevIndex, setActiveTab, defaultValue, hover, wobbly, tabsOrder } = useTabs();
    const active = activeTab === value;

    const handleClick = () => {
        setPrevIndex(Math.max(0, tabsOrder.indexOf(activeTab)));
        setActiveTab(value);
    };

    return (
        <motion.div
            className={cn(
                'cursor-pointer rounded-md px-2 py-1 sm:px-4 sm:py-2 relative transition-colors duration-200',
                active ? 'text-[var(--color-button-primary-text)]' : 'text-[var(--color-text-secondary)]',
                className
            )}
            onFocus={() => {
                if (hover) handleClick();
            }}
            onMouseEnter={() => {
                if (hover) handleClick();
            }}
            onClick={handleClick}
        >
            <span className="relative z-[3] inline-flex items-center gap-1.5">{children}</span>

            {active && (
                <AnimatePresence mode="wait">
                    <motion.div
                        transition={{
                            layout: {
                                duration: 0.2,
                                ease: 'easeInOut',
                                delay: 0.2,
                            },
                        }}
                        layoutId={defaultValue}
                        className="absolute left-0 top-0 h-full w-full rounded-md bg-[var(--color-button-primary-bg)] z-[1]"
                    />
                </AnimatePresence>
            )}

            {wobbly && active && (
                <>
                    <AnimatePresence mode="wait">
                        <motion.div
                            transition={{
                                layout: {
                                    duration: 0.4,
                                    ease: 'easeInOut',
                                    delay: 0.04,
                                },
                            }}
                            layoutId={defaultValue}
                            className="absolute left-0 top-0 h-full w-full rounded-md bg-[var(--color-button-primary-bg)] opacity-25 z-[0]"
                        />
                    </AnimatePresence>
                    <AnimatePresence mode="wait">
                        <motion.div
                            transition={{
                                layout: {
                                    duration: 0.4,
                                    ease: 'easeOut',
                                    delay: 0.2,
                                },
                            }}
                            layoutId={`${defaultValue}b`}
                            className="absolute left-0 top-0 h-full w-full rounded-md bg-[var(--color-button-primary-bg)] opacity-15 z-[0]"
                        />
                    </AnimatePresence>
                </>
            )}
        </motion.div>
    );
};

export const TabsContent = ({
    children,
    className,
    value,
    yValue = false,
}: {
    children: ReactNode;
    className?: string;
    value: string;
    yValue?: boolean;
}) => {
    const { activeTab, tabsOrder, prevIndex } = useTabs();
    const isForward = tabsOrder.indexOf(activeTab) > prevIndex;

    return (
        <AnimatePresence mode="popLayout">
            {activeTab === value && (
                <motion.div
                    initial={{ opacity: 0, y: yValue ? (isForward ? 10 : -10) : 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: yValue ? (isForward ? -50 : 50) : 0 }}
                    transition={{
                        duration: 0.3,
                        ease: 'easeInOut',
                        delay: 0.05,
                    }}
                    className={cn('relative rounded-md p-2 px-4', className)}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
};
