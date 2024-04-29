'use client';

import { useState, useRef } from 'react';

export const Tooltip = ({
    children,
    text,
    isCollapsed = true,
    position = "right" }:
    {
        children: React.ReactNode;
        text: string | React.ReactNode;
        isCollapsed?: boolean,
        position?: "top" | "right" | "bottom";
    }) => {

    const [showTooltip, setShowTooltip] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
        setShowTooltip(true);
    };

    const handleMouseLeave = () => {
        setShowTooltip(false);
    };

    return (
        <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {showTooltip && (
                <div
                    ref={tooltipRef}
                    className={`bg-gray-800 text-white px-2 py-1 rounded absolute !z-[100] whitespace-nowrap  
                   ${position === "right" ? isCollapsed ? 'left-16 ml-2 mb-10' : 'left-full ml-2'
                            : position === "top" ? '-top-full right-0 -translate-y-2' : position === "bottom" ? 'top-full right-0 translate-y-2' : 'right-full -translate-x-2 top-1'
                        }`}
                >
                    {text}
                </div>
            )}
            {children}

        </div>
    );
};