function FeaturePreview({ label, rows }) {
    const getToneClass = (tone) => {
        if (!tone) {
            return '';
        }

        return `preview-data--${tone}`;
    };

    return (
        <div className="panel panel--inset">
            <p className="label preview-header">
                {label}
            </p>

            {rows.map((row, index) => (
                <div
                    key={`${row.a}-${index}`}
                    className="feature-preview-row"
                >
                    <span className="preview-primary">
                        {row.a}
                    </span>

                    <span className="preview-secondary">
                        {row.b}
                    </span>

                    <span
                        className={`preview-data ${getToneClass(row.tone)}`}
                    >
                        {row.c}
                    </span>
                </div>
            ))}
        </div>
    );
}

export default FeaturePreview;