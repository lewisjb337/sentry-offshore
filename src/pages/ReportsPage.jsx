import { useMemo, useState } from 'react';

import { useAppData } from '../context/AppDataContext';

import {
    buildReport,
    exportReportCsv,
    printReport,
} from '../lib/reporting';


const reportTypes = [
    {
        id: 'pob-snapshot',
        title: 'POB Snapshot',
        description:
            'Generate a current persons-on-board record for one vessel or the entire fleet.',
        icon: 'ti-users-group',
    },
    {
        id: 'crew-movement-log',
        title: 'Crew Movement Log',
        description:
            'Export the chronological personnel movement ledger across vessels and projects.',
        icon: 'ti-route',
    },
    {
        id: 'muster-report',
        title: 'Muster Report',
        description:
            'Produce an auditable muster record containing the frozen roster, accountability and exceptions.',
        icon: 'ti-clipboard-check',
    },
    {
        id: 'daily-operations',
        title: 'Daily Operations',
        description:
            'Generate a vessel daily operations record covering activities, weather, delays and observations.',
        icon: 'ti-notebook',
    },
    {
        id: 'crew-report',
        title: 'Crew Report',
        description:
            'Create an individual personnel report containing identity, readiness and operational history.',
        icon: 'ti-user',
    },
    {
        id: 'vessel-report',
        title: 'Vessel Report',
        description:
            'Generate a vessel record containing specifications, assignment and current POB.',
        icon: 'ti-ship',
    },
];


function formatDateTime(value) {
    if (!value) {
        return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString('en-GB');
}


function normalizeSavedReportSnapshot(report) {
    let rawSnapshot = report?.snapshot ?? {};

    if (typeof rawSnapshot === 'string') {
        try {
            rawSnapshot = JSON.parse(rawSnapshot);
        } catch {
            rawSnapshot = {};
        }
    }

    if (!rawSnapshot || typeof rawSnapshot !== 'object') {
        rawSnapshot = {};
    }

    // Support snapshots produced by earlier iterations where the actual
    // report payload may have been wrapped one level deeper.
    const snapshot =
        rawSnapshot.report && typeof rawSnapshot.report === 'object'
            ? rawSnapshot.report
            : rawSnapshot.output && typeof rawSnapshot.output === 'object'
                ? rawSnapshot.output
                : rawSnapshot.data && typeof rawSnapshot.data === 'object'
                    ? rawSnapshot.data
                    : rawSnapshot;

    return {
        ...snapshot,
        title:
            snapshot.title ||
            report?.title ||
            'Generated report',
        subtitle:
            snapshot.subtitle ||
            'Saved report snapshot',
        generatedAt:
            snapshot.generatedAt ||
            report?.generatedAt ||
            report?.createdAt ||
            null,
        summary: Array.isArray(snapshot.summary)
            ? snapshot.summary
            : [],
        details: Array.isArray(snapshot.details)
            ? snapshot.details
            : [],
        columns: Array.isArray(snapshot.columns)
            ? snapshot.columns
            : [],
        rows: Array.isArray(snapshot.rows)
            ? snapshot.rows
            : [],
    };
}


function ReportsPage() {
    const {
        data,
        vesselPob,
        currentAssignments,
        createReport,
    } = useAppData();

    const [selectedReport, setSelectedReport] =
        useState(null);

    const [filters, setFilters] = useState({
        vesselId: '',
        personId: '',
        operationId: '',
        dateFrom: '',
        dateTo: '',
    });

    const [reportError, setReportError] =
        useState('');

    const [savingReport, setSavingReport] =
        useState(false);

    const [savedReportId, setSavedReportId] =
        useState(null);

    const [historyReport, setHistoryReport] =
        useState(null);

    const [historyTypeFilter, setHistoryTypeFilter] =
        useState('');

    const [historyPage, setHistoryPage] =
        useState(1);

    const REPORTS_PER_PAGE = 8;


    /* =====================================================
       DERIVED DATA
       ===================================================== */

    const activeVessels = useMemo(
        () =>
            (data.vessels || []).filter(
                (vessel) =>
                    vessel.status !== 'archived',
            ),
        [data.vessels],
    );


    const activePeople = useMemo(
        () =>
            (data.people || []).filter(
                (person) =>
                    person.status !== 'archived',
            ),
        [data.people],
    );


    const musterOperations = useMemo(
        () =>
            (data.operations || [])
                .filter(
                    (operation) =>
                        operation.operationType ===
                        'muster',
                )
                .sort(
                    (a, b) =>
                        new Date(
                            b.startAt ||
                            b.createdAt ||
                            0,
                        ) -
                        new Date(
                            a.startAt ||
                            a.createdAt ||
                            0,
                        ),
                ),
        [data.operations],
    );


    const reportStats = useMemo(
        () => ({
            people: activePeople.length,
            vessels: activeVessels.length,
            movements:
                data.movements?.length || 0,
            operations:
                data.operations?.length || 0,
        }),
        [
            activePeople,
            activeVessels,
            data.movements,
            data.operations,
        ],
    );



    const reportHistory = useMemo(
        () =>
            [...(data.reports || [])].sort(
                (a, b) =>
                    new Date(
                        b.generatedAt ||
                        b.createdAt ||
                        0,
                    ) -
                    new Date(
                        a.generatedAt ||
                        a.createdAt ||
                        0,
                    ),
            ),
        [data.reports],
    );


    const filteredReportHistory = useMemo(
        () =>
            reportHistory.filter(
                (report) =>
                    !historyTypeFilter ||
                    report.reportType ===
                    historyTypeFilter,
            ),
        [
            reportHistory,
            historyTypeFilter,
        ],
    );


    const historyPageCount = Math.max(
        1,
        Math.ceil(
            filteredReportHistory.length /
            REPORTS_PER_PAGE,
        ),
    );


    const visibleReportHistory = useMemo(() => {
        const safePage = Math.min(
            historyPage,
            historyPageCount,
        );

        const start =
            (safePage - 1) *
            REPORTS_PER_PAGE;

        return filteredReportHistory.slice(
            start,
            start +
            REPORTS_PER_PAGE,
        );
    }, [
        filteredReportHistory,
        historyPage,
        historyPageCount,
        REPORTS_PER_PAGE,
    ]);


    /* =====================================================
       VALIDATION
       ===================================================== */

    const canGenerateReport = useMemo(() => {
        if (!selectedReport) {
            return false;
        }

        switch (selectedReport.id) {
            case 'crew-report':
                return Boolean(
                    filters.personId,
                );

            case 'vessel-report':
                return Boolean(
                    filters.vesselId,
                );

            case 'muster-report':
                return Boolean(
                    filters.operationId,
                );

            case 'pob-snapshot':
            case 'crew-movement-log':
            case 'daily-operations':
                return true;

            default:
                return false;
        }
    }, [
        selectedReport,
        filters,
    ]);


    /* =====================================================
       REPORT OUTPUT
       ===================================================== */

    const reportOutput = useMemo(() => {
        if (
            !selectedReport ||
            !canGenerateReport
        ) {
            return null;
        }

        try {
            return buildReport({
                reportType:
                selectedReport.id,

                data,

                vesselPob,

                currentAssignments,

                filters,
            });
        } catch (error) {
            console.error(
                'Unable to build report:',
                error,
            );

            return null;
        }
    }, [
        selectedReport,
        canGenerateReport,
        data,
        vesselPob,
        currentAssignments,
        filters,
    ]);


    /* =====================================================
       ACTIONS
       ===================================================== */

    const openReport = (report) => {
        setSelectedReport(report);

        setFilters({
            vesselId: '',
            personId: '',
            operationId: '',
            dateFrom: '',
            dateTo: '',
        });

        setReportError('');
        setSavedReportId(null);
    };


    const closeReport = () => {
        setSelectedReport(null);

        setFilters({
            vesselId: '',
            personId: '',
            operationId: '',
            dateFrom: '',
            dateTo: '',
        });

        setReportError('');
        setSavedReportId(null);
    };


    const updateFilter = (
        field,
        value,
    ) => {
        setFilters(
            (current) => ({
                ...current,
                [field]: value,
            }),
        );

        setReportError('');
        setSavedReportId(null);
    };


    const resolveReportScope = () => {
        if (!selectedReport) {
            return {
                vesselId: null,
                personId: null,
                projectId: null,
            };
        }

        const vessel =
            (data.vessels || []).find(
                (item) =>
                    item.id ===
                    filters.vesselId,
            );

        const operation =
            (data.operations || []).find(
                (item) =>
                    item.id ===
                    filters.operationId,
            );

        let projectId =
            operation?.projectId ||
            vessel?.currentProjectId ||
            null;

        if (
            selectedReport.id ===
            'crew-report' &&
            filters.personId
        ) {
            const assignment =
                currentAssignments[
                    filters.personId
                ];

            const assignedVessel =
                (data.vessels || []).find(
                    (item) =>
                        item.id ===
                        assignment?.vesselId,
                );

            projectId =
                assignedVessel?.currentProjectId ||
                null;
        }

        return {
            vesselId:
                filters.vesselId ||
                operation?.vesselId ||
                null,

            personId:
                filters.personId ||
                null,

            projectId,
        };
    };


    const handleSaveReport = async () => {
        if (
            !selectedReport ||
            !reportOutput ||
            savingReport
        ) {
            return null;
        }

        if (savedReportId) {
            return (
                (data.reports || []).find(
                    (report) =>
                        report.id ===
                        savedReportId,
                ) || null
            );
        }

        try {
            setSavingReport(true);
            setReportError('');

            const scope =
                resolveReportScope();

            const saved =
                await createReport({
                    reportType:
                        selectedReport.id,

                    title:
                        reportOutput.title,

                    format:
                        'pdf',

                    vesselId:
                        scope.vesselId,

                    personId:
                        scope.personId,

                    projectId:
                        scope.projectId,

                    dateFrom:
                        filters.dateFrom ||
                        null,

                    dateTo:
                        filters.dateTo ||
                        null,

                    parameters: {
                        ...filters,
                        operationId:
                            filters.operationId ||
                            null,
                    },

                    snapshot:
                        reportOutput,
                });

            setSavedReportId(
                saved.id,
            );

            return saved;
        } catch (error) {
            console.error(
                'Unable to save report:',
                error,
            );

            setReportError(
                error.message ||
                'Unable to save report.',
            );

            return null;
        } finally {
            setSavingReport(false);
        }
    };


    const ensureReportSaved = async () => {
        if (savedReportId) {
            return true;
        }

        const saved =
            await handleSaveReport();

        return Boolean(saved);
    };


    const handleCsvExport = async () => {
        if (!reportOutput) {
            return;
        }

        const saved =
            await ensureReportSaved();

        if (!saved) {
            return;
        }

        try {
            setReportError('');

            exportReportCsv(
                reportOutput,
            );
        } catch (error) {
            console.error(
                'CSV export failed:',
                error,
            );

            setReportError(
                error.message ||
                'Unable to export CSV.',
            );
        }
    };


    const handlePrint = async () => {
        if (!reportOutput) {
            return;
        }

        const saved =
            await ensureReportSaved();

        if (!saved) {
            return;
        }

        try {
            setReportError('');

            printReport(
                reportOutput,
            );
        } catch (error) {
            console.error(
                'Report print failed:',
                error,
            );

            setReportError(
                error.message ||
                'Unable to print report.',
            );
        }
    };



    const getHistoryReportOutput = (report) => {
        const savedSnapshot =
            normalizeSavedReportSnapshot(report);

        const hasSavedContent =
            savedSnapshot.rows.length > 0 ||
            savedSnapshot.columns.length > 0 ||
            savedSnapshot.summary.length > 0 ||
            savedSnapshot.details.length > 0;

        if (hasSavedContent) {
            return savedSnapshot;
        }

        // Older demo/seed report rows were created before complete immutable
        // snapshots were stored. Rebuild only those legacy rows so they remain
        // useful in development. Reports generated by the current application
        // always use the persisted snapshot above.
        try {
            const parameters =
                report?.parameters &&
                typeof report.parameters === 'object'
                    ? report.parameters
                    : {};

            const rebuilt = buildReport({
                reportType: report.reportType,
                data,
                vesselPob,
                currentAssignments,
                filters: {
                    ...parameters,
                    vesselId:
                        report.vesselId ||
                        parameters.vesselId ||
                        '',
                    personId:
                        report.personId ||
                        parameters.personId ||
                        '',
                    operationId:
                        parameters.operationId ||
                        '',
                    dateFrom:
                        report.dateFrom
                            ? String(report.dateFrom).slice(0, 10)
                            : parameters.dateFrom || '',
                    dateTo:
                        report.dateTo
                            ? String(report.dateTo).slice(0, 10)
                            : parameters.dateTo || '',
                },
            });

            return {
                ...rebuilt,
                title:
                    report.title ||
                    rebuilt.title,
                subtitle:
                    'Legacy report reconstructed from current demo data',
                generatedAt:
                    report.generatedAt ||
                    report.createdAt ||
                    rebuilt.generatedAt,
                isLegacyReconstruction: true,
            };
        } catch (error) {
            console.warn(
                'Unable to reconstruct legacy report snapshot:',
                error,
            );

            return savedSnapshot;
        }
    };


    const openHistoryReport = (report) => {
        if (!report) {
            return;
        }

        setHistoryReport(report);
        setReportError('');
    };


    const closeHistoryReport = () => {
        setHistoryReport(null);
        setReportError('');
    };


    const exportHistoryCsv = (
        report,
    ) => {
        try {
            setReportError('');

            exportReportCsv(
                getHistoryReportOutput(
                    report,
                ),
            );
        } catch (error) {
            console.error(
                'Saved report CSV export failed:',
                error,
            );

            setReportError(
                error.message ||
                'Unable to export saved report.',
            );
        }
    };


    const printHistoryReport = (
        report,
    ) => {
        try {
            setReportError('');

            printReport(
                getHistoryReportOutput(
                    report,
                ),
            );
        } catch (error) {
            console.error(
                'Saved report print failed:',
                error,
            );

            setReportError(
                error.message ||
                'Unable to print saved report.',
            );
        }
    };


    /* =====================================================
       RENDER
       ===================================================== */

    return (
        <>
            <header className="app-topbar">
                <div>
                    <p className="label">
                        Records & exports
                    </p>

                    <h1>
                        Reports
                    </h1>
                </div>
            </header>


            <section className="app-page reports-page">
                <div className="app-page__intro">
                    <p>
                        Generate operational records from
                        Sentry&apos;s personnel, vessel,
                        movement and operations data.
                    </p>
                </div>


                <div className="entity-summary">
                    <ReportStat
                        label="Personnel"
                        value={
                            reportStats.people
                        }
                        icon="ti-users"
                    />

                    <ReportStat
                        label="Vessels"
                        value={
                            reportStats.vessels
                        }
                        icon="ti-ship"
                    />

                    <ReportStat
                        label="Movements"
                        value={
                            reportStats.movements
                        }
                        icon="ti-route"
                    />

                    <ReportStat
                        label="Operations"
                        value={
                            reportStats.operations
                        }
                        icon="ti-clipboard-check"
                    />
                </div>


                <div className="reports-heading">
                    <div>
                        <p className="label">
                            Report library
                        </p>

                        <h2>
                            Operational reports
                        </h2>

                        <p>
                            Select a report to configure its
                            scope and preview the resulting
                            record before export.
                        </p>
                    </div>
                </div>


                <div className="report-type-grid">
                    {reportTypes.map(
                        (report) => (
                            <article
                                key={
                                    report.id
                                }
                                className="panel report-type-card"
                            >
                                <div className="report-type-card__icon">
                                    <i
                                        className={`ti ${report.icon}`}
                                        aria-hidden="true"
                                    />
                                </div>

                                <div className="report-type-card__copy">
                                    <span className="label">
                                        Report
                                    </span>

                                    <h2>
                                        {
                                            report.title
                                        }
                                    </h2>

                                    <p>
                                        {
                                            report.description
                                        }
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="btn btn--secondary"
                                    onClick={() =>
                                        openReport(
                                            report,
                                        )
                                    }
                                >
                                    Generate

                                    <i
                                        className="ti ti-arrow-right"
                                        aria-hidden="true"
                                    />
                                </button>
                            </article>
                        ),
                    )}
                </div>


                <section className="report-history">
                    <div className="report-history__heading">
                        <div>
                            <p className="label">
                                Generated records
                            </p>

                            <h2>
                                Report history
                            </h2>

                            <p>
                                Saved reports are immutable snapshots.
                                Reopen or export the exact record that
                                was generated at the time.
                            </p>
                        </div>

                        <div className="report-history__filter">
                            <label htmlFor="report-history-type">
                                Type
                            </label>

                            <select
                                id="report-history-type"
                                className="input"
                                value={
                                    historyTypeFilter
                                }
                                onChange={(event) => {
                                    setHistoryTypeFilter(
                                        event.target.value,
                                    );
                                    setHistoryPage(1);
                                }}
                            >
                                <option value="">
                                    All report types
                                </option>

                                {reportTypes.map(
                                    (report) => (
                                        <option
                                            key={report.id}
                                            value={report.id}
                                        >
                                            {report.title}
                                        </option>
                                    ),
                                )}
                            </select>
                        </div>
                    </div>

                    {filteredReportHistory.length > 0 ? (
                        <>
                            <div className="report-history__list">
                                {visibleReportHistory.map(
                                    (report) => (
                                        <SavedReportRow
                                            key={report.id}
                                            report={report}
                                            reportTypes={reportTypes}
                                            data={data}
                                            onView={() =>
                                                openHistoryReport(
                                                    report,
                                                )
                                            }
                                            onCsv={() =>
                                                exportHistoryCsv(
                                                    report,
                                                )
                                            }
                                            onPrint={() =>
                                                printHistoryReport(
                                                    report,
                                                )
                                            }
                                        />
                                    ),
                                )}
                            </div>

                            <div className="report-history__pagination">
                                <span>
                                    {Math.min(
                                        (historyPage - 1) *
                                        REPORTS_PER_PAGE +
                                        1,
                                        filteredReportHistory.length,
                                    )}
                                    {'–'}
                                    {Math.min(
                                        historyPage *
                                        REPORTS_PER_PAGE,
                                        filteredReportHistory.length,
                                    )}
                                    {' of '}
                                    {filteredReportHistory.length}
                                </span>

                                <div>
                                    <button
                                        type="button"
                                        className="icon-btn"
                                        disabled={
                                            historyPage <= 1
                                        }
                                        onClick={() =>
                                            setHistoryPage(
                                                (page) =>
                                                    Math.max(
                                                        1,
                                                        page - 1,
                                                    ),
                                            )
                                        }
                                        aria-label="Previous report page"
                                    >
                                        <i
                                            className="ti ti-chevron-left"
                                            aria-hidden="true"
                                        />
                                    </button>

                                    <span className="report-history__page">
                                        {Math.min(
                                            historyPage,
                                            historyPageCount,
                                        )}
                                        {' / '}
                                        {historyPageCount}
                                    </span>

                                    <button
                                        type="button"
                                        className="icon-btn"
                                        disabled={
                                            historyPage >=
                                            historyPageCount
                                        }
                                        onClick={() =>
                                            setHistoryPage(
                                                (page) =>
                                                    Math.min(
                                                        historyPageCount,
                                                        page + 1,
                                                    ),
                                            )
                                        }
                                        aria-label="Next report page"
                                    >
                                        <i
                                            className="ti ti-chevron-right"
                                            aria-hidden="true"
                                        />
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="panel report-history__empty">
                            <i
                                className="ti ti-file-history"
                                aria-hidden="true"
                            />

                            <div>
                                <strong>
                                    No generated reports yet
                                </strong>

                                <p>
                                    Generate a report above and it will
                                    be retained here as an immutable
                                    snapshot.
                                </p>
                            </div>
                        </div>
                    )}
                </section>
            </section>


            {selectedReport && (
                <div
                    className="modal-backdrop"
                    onMouseDown={(
                        event,
                    ) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeReport();
                        }
                    }}
                >
                    <div
                        className="report-builder"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="report-builder-title"
                    >
                        <header className="report-builder__header">
                            <div>
                                <p className="label">
                                    Generate report
                                </p>

                                <h2 id="report-builder-title">
                                    {
                                        selectedReport.title
                                    }
                                </h2>

                                <p>
                                    {
                                        selectedReport.description
                                    }
                                </p>
                            </div>

                            <button
                                type="button"
                                className="icon-btn"
                                onClick={
                                    closeReport
                                }
                                aria-label="Close"
                            >
                                <i
                                    className="ti ti-x"
                                    aria-hidden="true"
                                />
                            </button>
                        </header>


                        <div className="report-builder__body">
                            <ReportFilters
                                report={
                                    selectedReport
                                }
                                filters={
                                    filters
                                }
                                updateFilter={
                                    updateFilter
                                }
                                vessels={
                                    activeVessels
                                }
                                people={
                                    activePeople
                                }
                                musters={
                                    musterOperations
                                }
                                data={
                                    data
                                }
                            />


                            {reportError && (
                                <div className="form-error">
                                    {
                                        reportError
                                    }
                                </div>
                            )}


                            {reportOutput ? (
                                <ReportPreview
                                    report={
                                        reportOutput
                                    }
                                />
                            ) : (
                                <ReportEmptyState
                                    report={
                                        selectedReport
                                    }
                                />
                            )}
                        </div>


                        <footer className="report-builder__footer">
                            <button
                                type="button"
                                className="btn btn--secondary"
                                onClick={
                                    closeReport
                                }
                            >
                                Close
                            </button>

                            <button
                                type="button"
                                className="btn btn--secondary"
                                disabled={
                                    !reportOutput ||
                                    savingReport ||
                                    Boolean(savedReportId)
                                }
                                onClick={
                                    handleSaveReport
                                }
                            >
                                <i
                                    className={`ti ${
                                        savedReportId
                                            ? 'ti-check'
                                            : 'ti-device-floppy'
                                    }`}
                                    aria-hidden="true"
                                />

                                {savedReportId
                                    ? 'Saved'
                                    : savingReport
                                        ? 'Saving...'
                                        : 'Save report'}
                            </button>

                            <button
                                type="button"
                                className="btn btn--secondary"
                                disabled={
                                    !reportOutput ||
                                    savingReport
                                }
                                onClick={
                                    handleCsvExport
                                }
                            >
                                <i
                                    className="ti ti-file-type-csv"
                                    aria-hidden="true"
                                />

                                CSV
                            </button>

                            <button
                                type="button"
                                className="btn btn--primary"
                                disabled={
                                    !reportOutput ||
                                    savingReport
                                }
                                onClick={
                                    handlePrint
                                }
                            >
                                <i
                                    className="ti ti-file-type-pdf"
                                    aria-hidden="true"
                                />

                                PDF / Print
                            </button>
                        </footer>
                    </div>
                </div>
            )}


            {historyReport && (
                <div
                    className="modal-backdrop"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeHistoryReport();
                        }
                    }}
                >
                    <div
                        className="report-builder"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="saved-report-title"
                    >
                        <header className="report-builder__header">
                            <div>
                                <p className="label">
                                    Saved report
                                </p>

                                <h2 id="saved-report-title">
                                    {historyReport.title}
                                </h2>

                                <p>
                                    Generated{' '}
                                    {formatDateTime(
                                        historyReport.generatedAt,
                                    )}
                                </p>
                            </div>

                            <button
                                type="button"
                                className="icon-btn"
                                onClick={
                                    closeHistoryReport
                                }
                                aria-label="Close"
                            >
                                <i
                                    className="ti ti-x"
                                    aria-hidden="true"
                                />
                            </button>
                        </header>

                        <div className="report-builder__body">
                            <ReportPreview
                                report={
                                    getHistoryReportOutput(
                                        historyReport,
                                    )
                                }
                            />
                        </div>

                        <footer className="report-builder__footer">
                            <button
                                type="button"
                                className="btn btn--secondary"
                                onClick={
                                    closeHistoryReport
                                }
                            >
                                Close
                            </button>

                            <button
                                type="button"
                                className="btn btn--secondary"
                                onClick={() =>
                                    exportHistoryCsv(
                                        historyReport,
                                    )
                                }
                            >
                                <i
                                    className="ti ti-file-type-csv"
                                    aria-hidden="true"
                                />
                                CSV
                            </button>

                            <button
                                type="button"
                                className="btn btn--primary"
                                onClick={() =>
                                    printHistoryReport(
                                        historyReport,
                                    )
                                }
                            >
                                <i
                                    className="ti ti-file-type-pdf"
                                    aria-hidden="true"
                                />
                                PDF / Print
                            </button>
                        </footer>
                    </div>
                </div>
            )}
        </>
    );
}



function SavedReportRow({
                            report,
                            reportTypes,
                            data,
                            onView,
                            onCsv,
                            onPrint,
                        }) {
    const definition =
        reportTypes.find(
            (item) =>
                item.id ===
                report.reportType,
        );

    const vessel =
        (data.vessels || []).find(
            (item) =>
                item.id ===
                report.vesselId,
        );

    const person =
        (data.people || []).find(
            (item) =>
                item.id ===
                report.personId,
        );

    const project =
        (data.projects || []).find(
            (item) =>
                item.id ===
                report.projectId,
        );

    const scopeParts = [];

    if (person) {
        scopeParts.push(
            `${person.firstName} ${person.lastName}`,
        );
    }

    if (vessel) {
        scopeParts.push(
            vessel.name,
        );
    }

    if (project) {
        scopeParts.push(
            project.name,
        );
    }

    if (
        report.dateFrom ||
        report.dateTo
    ) {
        const from =
            report.dateFrom
                ? new Date(
                    report.dateFrom,
                ).toLocaleDateString(
                    'en-GB',
                )
                : 'Start';

        const to =
            report.dateTo
                ? new Date(
                    report.dateTo,
                ).toLocaleDateString(
                    'en-GB',
                )
                : 'Now';

        scopeParts.push(
            `${from} – ${to}`,
        );
    }

    const scope =
        scopeParts.length > 0
            ? scopeParts.join(' · ')
            : 'Organisation-wide';

    return (
        <article className="panel saved-report-row">
            <div className="saved-report-row__icon">
                <i
                    className={`ti ${
                        definition?.icon ||
                        'ti-file-report'
                    }`}
                    aria-hidden="true"
                />
            </div>

            <div className="saved-report-row__main">
                <div className="saved-report-row__eyebrow">
                    <span className="label">
                        {definition?.title ||
                            report.reportType}
                    </span>

                    <span className="status-pill status-pill--success">
                        Generated
                    </span>
                </div>

                <strong className="saved-report-row__title">
                    {report.title ||
                        definition?.title ||
                        'Generated report'}
                </strong>

                <span className="saved-report-row__scope">
                    {scope}
                </span>
            </div>

            <div className="saved-report-row__time">
                <span className="label">
                    Generated
                </span>

                <strong>
                    {formatDateTime(
                        report.generatedAt ||
                        report.createdAt,
                    )}
                </strong>
            </div>

            <div className="saved-report-row__actions">
                <button
                    type="button"
                    className="btn btn--secondary saved-report-row__view"
                    onClick={onView}
                >
                    View
                </button>

                <button
                    type="button"
                    className="icon-btn"
                    onClick={onCsv}
                    aria-label="Export saved report as CSV"
                    title="CSV"
                >
                    <i
                        className="ti ti-file-type-csv"
                        aria-hidden="true"
                    />
                </button>

                <button
                    type="button"
                    className="icon-btn"
                    onClick={onPrint}
                    aria-label="Print saved report"
                    title="PDF / Print"
                >
                    <i
                        className="ti ti-file-type-pdf"
                        aria-hidden="true"
                    />
                </button>
            </div>
        </article>
    );
}


/* =========================================================
   REPORT FILTERS
   ========================================================= */

function ReportFilters({
                           report,
                           filters,
                           updateFilter,
                           vessels,
                           people,
                           musters,
                           data,
                       }) {
    const showVessel =
        report.id ===
        'pob-snapshot' ||
        report.id ===
        'crew-movement-log' ||
        report.id ===
        'daily-operations' ||
        report.id ===
        'vessel-report';


    const showDates =
        report.id ===
        'crew-movement-log' ||
        report.id ===
        'daily-operations';


    const showPerson =
        report.id ===
        'crew-report';


    const showMuster =
        report.id ===
        'muster-report';


    const vesselRequired =
        report.id ===
        'vessel-report';


    return (
        <div className="report-config report-config--wide">
            <div className="report-filter-grid">

                {showVessel && (
                    <div className="field">
                        <label htmlFor="report-vessel">
                            Vessel
                        </label>

                        <select
                            id="report-vessel"
                            className="input"
                            value={
                                filters.vesselId
                            }
                            onChange={(
                                event,
                            ) =>
                                updateFilter(
                                    'vesselId',
                                    event.target
                                        .value,
                                )
                            }
                        >
                            {vesselRequired ? (
                                <option value="">
                                    Select a
                                    vessel...
                                </option>
                            ) : (
                                <option value="">
                                    All vessels
                                </option>
                            )}

                            {vessels.map(
                                (vessel) => (
                                    <option
                                        key={
                                            vessel.id
                                        }
                                        value={
                                            vessel.id
                                        }
                                    >
                                        {
                                            vessel.name
                                        }
                                    </option>
                                ),
                            )}
                        </select>
                    </div>
                )}


                {showPerson && (
                    <div className="field">
                        <label htmlFor="report-person">
                            Person
                        </label>

                        <select
                            id="report-person"
                            className="input"
                            value={
                                filters.personId
                            }
                            onChange={(
                                event,
                            ) =>
                                updateFilter(
                                    'personId',
                                    event.target
                                        .value,
                                )
                            }
                        >
                            <option value="">
                                Select a
                                person...
                            </option>

                            {people
                                .slice()
                                .sort(
                                    (a, b) =>
                                        `${a.lastName || ''} ${a.firstName || ''}`.localeCompare(
                                            `${b.lastName || ''} ${b.firstName || ''}`,
                                        ),
                                )
                                .map(
                                    (person) => (
                                        <option
                                            key={
                                                person.id
                                            }
                                            value={
                                                person.id
                                            }
                                        >
                                            {
                                                person.firstName
                                            }{' '}
                                            {
                                                person.lastName
                                            }
                                            {person.employeeNumber
                                                ? ` · ${person.employeeNumber}`
                                                : ''}
                                        </option>
                                    ),
                                )}
                        </select>
                    </div>
                )}


                {showMuster && (
                    <div className="field">
                        <label htmlFor="report-muster">
                            Muster
                        </label>

                        <select
                            id="report-muster"
                            className="input"
                            value={
                                filters.operationId
                            }
                            onChange={(
                                event,
                            ) =>
                                updateFilter(
                                    'operationId',
                                    event.target
                                        .value,
                                )
                            }
                        >
                            <option value="">
                                Select a
                                muster...
                            </option>

                            {musters.map(
                                (muster) => {
                                    const vessel =
                                        (
                                            data.vessels ||
                                            []
                                        ).find(
                                            (
                                                item,
                                            ) =>
                                                item.id ===
                                                muster.vesselId,
                                        );

                                    return (
                                        <option
                                            key={
                                                muster.id
                                            }
                                            value={
                                                muster.id
                                            }
                                        >
                                            {
                                                muster.title
                                            }
                                            {' · '}
                                            {vessel?.name ||
                                                'Unknown vessel'}
                                            {' · '}
                                            {formatDateTime(
                                                muster.startAt,
                                            )}
                                        </option>
                                    );
                                },
                            )}
                        </select>
                    </div>
                )}


                {showDates && (
                    <>
                        <div className="field">
                            <label htmlFor="report-date-from">
                                From
                            </label>

                            <input
                                id="report-date-from"
                                className="input"
                                type="date"
                                value={
                                    filters.dateFrom
                                }
                                onChange={(
                                    event,
                                ) =>
                                    updateFilter(
                                        'dateFrom',
                                        event.target
                                            .value,
                                    )
                                }
                            />
                        </div>

                        <div className="field">
                            <label htmlFor="report-date-to">
                                To
                            </label>

                            <input
                                id="report-date-to"
                                className="input"
                                type="date"
                                value={
                                    filters.dateTo
                                }
                                onChange={(
                                    event,
                                ) =>
                                    updateFilter(
                                        'dateTo',
                                        event.target
                                            .value,
                                    )
                                }
                            />
                        </div>
                    </>
                )}

            </div>
        </div>
    );
}


/* =========================================================
   REPORT PREVIEW
   ========================================================= */

function ReportPreview({
                           report,
                       }) {
    const summary = Array.isArray(report?.summary)
        ? report.summary
        : [];

    const details = Array.isArray(report?.details)
        ? report.details
        : [];

    const columns = Array.isArray(report?.columns)
        ? report.columns
        : [];

    const rows = Array.isArray(report?.rows)
        ? report.rows
        : [];

    return (
        <div className="report-preview">
            <header className="report-preview__header">
                <div>
                    <p className="label">
                        Report preview
                    </p>

                    <h2>
                        {report.title}
                    </h2>

                    <p>
                        {report.subtitle}
                    </p>
                </div>

                <div className="report-preview__generated">
                    <span className="label">
                        Generated
                    </span>

                    <strong>
                        {formatDateTime(
                            report.generatedAt,
                        )}
                    </strong>
                </div>
            </header>


            {summary.length >
                0 && (
                    <div className="report-preview__summary">
                        {summary.map(
                            (item) => (
                                <div
                                    key={
                                        item.label
                                    }
                                    className="record-metric"
                                >
                                <span className="label">
                                    {
                                        item.label
                                    }
                                </span>

                                    <strong>
                                        {
                                            item.value
                                        }
                                    </strong>
                                </div>
                            ),
                        )}
                    </div>
                )}


            {details.length >
                0 && (
                    <div className="report-preview__meta">
                        {details.map(
                            (item) => (
                                <ReportValue
                                    key={
                                        item.label
                                    }
                                    label={
                                        item.label
                                    }
                                    value={
                                        item.value
                                    }
                                />
                            ),
                        )}
                    </div>
                )}


            <div className="report-preview__section">
                <div className="report-preview__section-heading">
                    <span className="label">
                        Records
                    </span>

                    <span>
                        {rows.length}{' '}
                        {rows.length ===
                        1
                            ? 'record'
                            : 'records'}
                    </span>
                </div>


                {rows.length >
                0 ? (
                    <div className="report-table-wrap">
                        <table className="report-table">
                            <thead>
                            <tr>
                                {columns.map(
                                    (
                                        column,
                                    ) => (
                                        <th
                                            key={
                                                column.key
                                            }
                                        >
                                            {
                                                column.label
                                            }
                                        </th>
                                    ),
                                )}
                            </tr>
                            </thead>

                            <tbody>
                            {rows.map(
                                (
                                    row,
                                    rowIndex,
                                ) => (
                                    <tr
                                        key={
                                            row.id ||
                                            `report-row-${rowIndex}`
                                        }
                                    >
                                        {columns.map(
                                            (
                                                column,
                                            ) => (
                                                <td
                                                    key={
                                                        column.key
                                                    }
                                                >
                                                    <ReportCell
                                                        value={
                                                            row[
                                                                column
                                                                    .key
                                                                ]
                                                        }
                                                    />
                                                </td>
                                            ),
                                        )}
                                    </tr>
                                ),
                            )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="report-preview__empty">
                        No records match the
                        selected report criteria.
                    </div>
                )}
            </div>
        </div>
    );
}


function ReportCell({
                        value,
                    }) {
    if (
        value === undefined ||
        value === null ||
        value === ''
    ) {
        return '—';
    }

    if (
        typeof value ===
        'boolean'
    ) {
        return value
            ? 'Yes'
            : 'No';
    }

    if (
        Array.isArray(value)
    ) {
        return value.length
            ? value.join(', ')
            : '—';
    }

    if (
        typeof value ===
        'object'
    ) {
        return JSON.stringify(
            value,
        );
    }

    return String(value);
}


/* =========================================================
   EMPTY STATE
   ========================================================= */

function ReportEmptyState({
                              report,
                          }) {
    let message =
        'Choose the required criteria above to generate the report preview.';


    if (
        report.id ===
        'crew-report'
    ) {
        message =
            'Select a member of personnel to generate their crew report.';
    }


    if (
        report.id ===
        'vessel-report'
    ) {
        message =
            'Select a vessel to generate its vessel report.';
    }


    if (
        report.id ===
        'muster-report'
    ) {
        message =
            'Select a muster to generate its frozen accountability report.';
    }


    return (
        <div className="report-preview__empty report-preview__empty--large">
            <i
                className={`ti ${report.icon}`}
                aria-hidden="true"
            />

            <strong>
                Select report criteria
            </strong>

            <span>
                {message}
            </span>
        </div>
    );
}


/* =========================================================
   SUPPORTING COMPONENTS
   ========================================================= */

function ReportStat({
                        label,
                        value,
                        icon,
                    }) {
    return (
        <article className="panel entity-summary-card">
            <div>
                <span className="label">
                    {label}
                </span>

                <strong>
                    {value}
                </strong>
            </div>

            <span className="entity-summary-card__icon">
                <i
                    className={`ti ${icon}`}
                    aria-hidden="true"
                />
            </span>
        </article>
    );
}


function ReportValue({
                         label,
                         value,
                     }) {
    return (
        <div className="record-metric">
            <span className="label">
                {label}
            </span>

            <strong>
                {value ??
                    '—'}
            </strong>
        </div>
    );
}


export default ReportsPage;