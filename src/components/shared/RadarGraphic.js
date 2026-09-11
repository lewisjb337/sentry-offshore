function RadarGraphic() {
    const dots = [
        {
            cx: 205,
            cy: 95,
            delay: 0.39,
        },
        {
            cx: 215,
            cy: 220,
            delay: 1.53,
        },
        {
            cx: 110,
            cy: 205,
            delay: 2.53,
        },
    ];

    return (
        <svg
            viewBox="0 0 320 320"
            aria-label="Live fleet radar illustration"
        >
            <circle
                cx="160"
                cy="160"
                r="140"
                fill="none"
                stroke="var(--border)"
                strokeWidth="1"
            />

            <circle
                cx="160"
                cy="160"
                r="100"
                fill="none"
                stroke="var(--border)"
                strokeWidth="1"
            />

            <circle
                cx="160"
                cy="160"
                r="60"
                fill="none"
                stroke="var(--border)"
                strokeWidth="1"
            />

            <circle
                cx="160"
                cy="160"
                r="20"
                fill="none"
                stroke="var(--border-strong)"
                strokeWidth="1"
            />

            <line
                x1="160"
                y1="20"
                x2="160"
                y2="300"
                stroke="var(--border)"
                strokeWidth="1"
            />

            <line
                x1="20"
                y1="160"
                x2="300"
                y2="160"
                stroke="var(--border)"
                strokeWidth="1"
            />

            <g
                style={{
                    transformOrigin: '160px 160px',
                    animation: 'sentry-radar-spin 4s linear infinite',
                }}
            >
                <path
                    d="M160,160 L160,20 A140,140 0 0,1 217,32 Z"
                    fill="var(--accent)"
                    opacity="0.1"
                />

                <line
                    x1="160"
                    y1="160"
                    x2="160"
                    y2="20"
                    stroke="var(--accent)"
                    strokeWidth="1.5"
                />
            </g>

            {dots.map((dot, index) => (
                <circle
                    key={`dot-${index}`}
                    cx={dot.cx}
                    cy={dot.cy}
                    r="3"
                    fill="var(--text-muted)"
                />
            ))}

            {dots.map((dot, index) => (
                <circle
                    key={`ping-${index}`}
                    cx={dot.cx}
                    cy={dot.cy}
                    r="3"
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="1.5"
                    opacity="0"
                    style={{
                        transformOrigin: `${dot.cx}px ${dot.cy}px`,
                        animation: 'sentry-radar-ping 4s linear infinite',
                        animationDelay: `${dot.delay}s`,
                    }}
                />
            ))}

            <circle
                cx="160"
                cy="160"
                r="3"
                fill="var(--text-primary)"
            />
        </svg>
    );
}

export default RadarGraphic;