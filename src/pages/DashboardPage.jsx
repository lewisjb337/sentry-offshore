import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAppData } from '../context/AppDataContext';


const VESSELS_PER_PAGE = 4;
const MOVEMENTS_PER_PAGE = 5;


function formatDateTime(value) {
    if (!value) {
        return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}


function formatLabel(value) {
    if (!value) {
        return '—';
    }

    return String(value)
        .replaceAll('_', ' ')
        .replaceAll('-', ' ')
        .replace(/\b\w/g, (letter) =>
            letter.toUpperCase(),
        );
}


function getMovementParticipantIds(movement) {
    if (
        Array.isArray(
            movement.participantIds,
        )
    ) {
        return movement.participantIds;
    }

    if (
        Array.isArray(
            movement.movementParticipants,
        )
    ) {
        return movement.movementParticipants
            .map(
                (participant) =>
                    participant.personId ||
                    participant.person_id,
            )
            .filter(Boolean);
    }

    if (movement.personId) {
        return [movement.personId];
    }

    return [];
}


function getPageItems(
    records,
    page,
    pageSize,
) {
    const start =
        (page - 1) * pageSize;

    return records.slice(
        start,
        start + pageSize,
    );
}


function DashboardPage() {
    const {
        data,
        vesselPob,
    } = useAppData();


    /* =====================================================
       FILTERS / PAGINATION
       ===================================================== */

    const [
        vesselStatusFilter,
        setVesselStatusFilter,
    ] = useState('');

    const [
        movementStatusFilter,
        setMovementStatusFilter,
    ] = useState('');

    const [
        movementTypeFilter,
        setMovementTypeFilter,
    ] = useState('');

    const [
        vesselPage,
        setVesselPage,
    ] = useState(1);

    const [
        movementPage,
        setMovementPage,
    ] = useState(1);


    /* =====================================================
       LOOKUPS
       ===================================================== */

    const vesselMap = useMemo(
        () =>
            Object.fromEntries(
                (data.vessels || []).map(
                    (vessel) => [
                        vessel.id,
                        vessel,
                    ],
                ),
            ),
        [data.vessels],
    );


    const personMap = useMemo(
        () =>
            Object.fromEntries(
                (data.people || []).map(
                    (person) => [
                        person.id,
                        person,
                    ],
                ),
            ),
        [data.people],
    );


    /* =====================================================
       DASHBOARD TOTALS
       ===================================================== */

    const dashboardVessels =
        useMemo(
            () =>
                (
                    data.vessels ||
                    []
                ).filter(
                    (vessel) =>
                        vessel.status !==
                        'archived',
                ),
            [data.vessels],
        );


    const activeVesselCount =
        useMemo(
            () =>
                dashboardVessels.filter(
                    (vessel) =>
                        vessel.status ===
                        'active',
                ).length,
            [dashboardVessels],
        );


    const totalPob = useMemo(
        () =>
            dashboardVessels.reduce(
                (
                    total,
                    vessel,
                ) =>
                    total +
                    Number(
                        vesselPob?.[
                            vessel.id
                            ] || 0,
                    ),
                0,
            ),
        [
            dashboardVessels,
            vesselPob,
        ],
    );


    const discrepancyItems =
        useMemo(() => {
            return (
                data.operations ||
                []
            )
                .filter(
                    (operation) =>
                        operation.status ===
                        'attention',
                )
                .map(
                    (operation) => ({
                        id:
                        operation.id,

                        label:
                            operation.title ||
                            formatLabel(
                                operation.operationType,
                            ),

                        description:
                            `${formatLabel(
                                operation.operationType,
                            )} requires attention`,
                    }),
                );
        }, [data.operations]);


    /* =====================================================
       VESSEL FILTERING
       ===================================================== */

    const filteredVessels =
        useMemo(() => {
            return dashboardVessels.filter(
                (vessel) => {
                    if (
                        vesselStatusFilter &&
                        vessel.status !==
                        vesselStatusFilter
                    ) {
                        return false;
                    }

                    return true;
                },
            );
        }, [
            dashboardVessels,
            vesselStatusFilter,
        ]);


    const vesselPageCount =
        Math.max(
            1,
            Math.ceil(
                filteredVessels.length /
                VESSELS_PER_PAGE,
            ),
        );


    const paginatedVessels =
        useMemo(
            () =>
                getPageItems(
                    filteredVessels,
                    vesselPage,
                    VESSELS_PER_PAGE,
                ),
            [
                filteredVessels,
                vesselPage,
            ],
        );


    /* =====================================================
       MOVEMENT FILTERING
       ===================================================== */

    const filteredMovements =
        useMemo(() => {
            return [
                ...(data.movements ||
                    []),
            ]
                .filter(
                    (movement) => {
                        if (
                            movementStatusFilter &&
                            movement.status !==
                            movementStatusFilter
                        ) {
                            return false;
                        }

                        if (
                            movementTypeFilter &&
                            movement.movementType !==
                            movementTypeFilter
                        ) {
                            return false;
                        }

                        return true;
                    },
                )
                .sort(
                    (a, b) =>
                        new Date(
                            b.occurredAt ||
                            b.plannedAt ||
                            b.createdAt ||
                            0,
                        ) -
                        new Date(
                            a.occurredAt ||
                            a.plannedAt ||
                            a.createdAt ||
                            0,
                        ),
                );
        }, [
            data.movements,
            movementStatusFilter,
            movementTypeFilter,
        ]);


    const movementPageCount =
        Math.max(
            1,
            Math.ceil(
                filteredMovements.length /
                MOVEMENTS_PER_PAGE,
            ),
        );


    const paginatedMovements =
        useMemo(
            () =>
                getPageItems(
                    filteredMovements,
                    movementPage,
                    MOVEMENTS_PER_PAGE,
                ),
            [
                filteredMovements,
                movementPage,
            ],
        );


    /* =====================================================
       FILTER HANDLERS
       ===================================================== */

    const changeVesselStatus = (
        value,
    ) => {
        setVesselStatusFilter(
            value,
        );

        setVesselPage(1);
    };


    const changeMovementStatus = (
        value,
    ) => {
        setMovementStatusFilter(
            value,
        );

        setMovementPage(1);
    };


    const changeMovementType = (
        value,
    ) => {
        setMovementTypeFilter(
            value,
        );

        setMovementPage(1);
    };


    /* =====================================================
       RENDER
       ===================================================== */

    return (
        <>
            <header className="app-topbar">
                <div>
                    <p className="label">
                        Overview
                    </p>

                    <h1>
                        Dashboard
                    </h1>
                </div>

                <span className="app-plan-badge">
                    Free plan
                </span>
            </header>


            <section className="dashboard-summary">
                <article className="panel dashboard-stat">
                    <div className="dashboard-stat__header">
                        <span className="label">
                            Active vessels
                        </span>

                        <i
                            className="ti ti-ship"
                            aria-hidden="true"
                        />
                    </div>

                    <strong className="stat">
                        {
                            activeVesselCount
                        }
                    </strong>

                    <span className="dashboard-stat__meta">
                        {activeVesselCount ===
                        1
                            ? '1 active vessel'
                            : `${activeVesselCount} active vessels`}
                    </span>
                </article>


                <article className="panel dashboard-stat">
                    <div className="dashboard-stat__header">
                        <span className="label">
                            Current POB
                        </span>

                        <i
                            className="ti ti-users"
                            aria-hidden="true"
                        />
                    </div>

                    <strong className="stat">
                        {totalPob}
                    </strong>

                    <span className="dashboard-stat__meta">
                        {totalPob === 0
                            ? 'No personnel embarked'
                            : `${totalPob} ${
                                totalPob ===
                                1
                                    ? 'person'
                                    : 'people'
                            } currently onboard`}
                    </span>
                </article>


                <article className="panel dashboard-stat">
                    <div className="dashboard-stat__header">
                        <span className="label">
                            Discrepancies
                        </span>

                        <i
                            className="ti ti-alert-triangle"
                            aria-hidden="true"
                        />
                    </div>

                    <strong className="stat">
                        {
                            discrepancyItems.length
                        }
                    </strong>

                    <span className="dashboard-stat__meta">
                        {discrepancyItems.length ===
                        0
                            ? 'No active issues'
                            : `${discrepancyItems.length} ${
                                discrepancyItems.length ===
                                1
                                    ? 'item requires'
                                    : 'items require'
                            } attention`}
                    </span>
                </article>
            </section>


            <section className="dashboard-grid">

                {/* =========================================
                    FLEET
                    ========================================= */}

                <article className="panel dashboard-panel">
                    <div className="dashboard-panel__heading">
                        <div>
                            <p className="label">
                                Fleet
                            </p>

                            <h2>
                                Vessel status
                            </h2>
                        </div>

                        <Link
                            to="/vessels"
                            className="dashboard-panel__link"
                        >
                            View vessels
                        </Link>
                    </div>


                    <div className="dashboard-panel__filters">
                        <label className="dashboard-filter">
                            <span>
                                Status
                            </span>

                            <select
                                value={
                                    vesselStatusFilter
                                }
                                onChange={(
                                    event,
                                ) =>
                                    changeVesselStatus(
                                        event
                                            .target
                                            .value,
                                    )
                                }
                            >
                                <option value="">
                                    All statuses
                                </option>

                                <option value="active">
                                    Active
                                </option>

                                <option value="standby">
                                    Standby
                                </option>

                                <option value="maintenance">
                                    Maintenance
                                </option>

                                <option value="inactive">
                                    Inactive
                                </option>
                            </select>
                        </label>
                    </div>


                    {paginatedVessels.length >
                    0 ? (
                        <>
                            <div className="dashboard-vessel-list">
                                {paginatedVessels.map(
                                    (
                                        vessel,
                                    ) => {
                                        const pob =
                                            Number(
                                                vesselPob?.[
                                                    vessel
                                                        .id
                                                    ] ||
                                                0,
                                            );

                                        const capacity =
                                            vessel.maxPob ||
                                            vessel.maxPOB ||
                                            null;

                                        return (
                                            <div
                                                key={
                                                    vessel.id
                                                }
                                                className="dashboard-vessel-row"
                                            >
                                                <div className="dashboard-vessel-row__identity">
                                                    <span className="dashboard-vessel-row__icon">
                                                        <i
                                                            className="ti ti-ship"
                                                            aria-hidden="true"
                                                        />
                                                    </span>

                                                    <div>
                                                        <strong>
                                                            {
                                                                vessel.name
                                                            }
                                                        </strong>

                                                        <span>
                                                            {vessel.currentProject ||
                                                                vessel.currentLocation ||
                                                                'No project assigned'}
                                                        </span>
                                                    </div>
                                                </div>


                                                <div className="dashboard-vessel-row__pob">
                                                    <span className="label">
                                                        POB
                                                    </span>

                                                    <strong>
                                                        {
                                                            pob
                                                        }

                                                        {capacity
                                                            ? ` / ${capacity}`
                                                            : ''}
                                                    </strong>
                                                </div>


                                                <span
                                                    className={`status-pill ${
                                                        vessel.status ===
                                                        'active'
                                                            ? 'status-pill--success'
                                                            : vessel.status ===
                                                            'inactive'
                                                                ? 'status-pill--danger'
                                                                : 'status-pill--warning'
                                                    }`}
                                                >
                                                    {formatLabel(
                                                        vessel.status ||
                                                        'active',
                                                    )}
                                                </span>
                                            </div>
                                        );
                                    },
                                )}
                            </div>


                            <DashboardPagination
                                page={
                                    vesselPage
                                }
                                pageCount={
                                    vesselPageCount
                                }
                                total={
                                    filteredVessels.length
                                }
                                pageSize={
                                    VESSELS_PER_PAGE
                                }
                                onChange={
                                    setVesselPage
                                }
                            />
                        </>
                    ) : (
                        <div className="dashboard-empty dashboard-empty--compact">
                            <div className="dashboard-empty__icon">
                                <i
                                    className="ti ti-ship"
                                    aria-hidden="true"
                                />
                            </div>

                            <h3>
                                No vessels match
                            </h3>

                            <p>
                                Change the vessel
                                status filter to view
                                more records.
                            </p>
                        </div>
                    )}
                </article>


                {/* =========================================
                    MOVEMENTS
                    ========================================= */}

                <article className="panel dashboard-panel">
                    <div className="dashboard-panel__heading">
                        <div>
                            <p className="label">
                                Movements
                            </p>

                            <h2>
                                Recent activity
                            </h2>
                        </div>

                        <Link
                            to="/movements"
                            className="dashboard-panel__link"
                        >
                            View movements
                        </Link>
                    </div>


                    <div className="dashboard-panel__filters dashboard-panel__filters--two">
                        <label className="dashboard-filter">
                            <span>
                                Type
                            </span>

                            <select
                                value={
                                    movementTypeFilter
                                }
                                onChange={(
                                    event,
                                ) =>
                                    changeMovementType(
                                        event
                                            .target
                                            .value,
                                    )
                                }
                            >
                                <option value="">
                                    All types
                                </option>

                                <option value="embark">
                                    Embark
                                </option>

                                <option value="disembark">
                                    Disembark
                                </option>

                                <option value="transfer">
                                    Transfer
                                </option>

                                <option value="shore-transfer">
                                    Shore transfer
                                </option>
                            </select>
                        </label>


                        <label className="dashboard-filter">
                            <span>
                                Status
                            </span>

                            <select
                                value={
                                    movementStatusFilter
                                }
                                onChange={(
                                    event,
                                ) =>
                                    changeMovementStatus(
                                        event
                                            .target
                                            .value,
                                    )
                                }
                            >
                                <option value="">
                                    All statuses
                                </option>

                                <option value="planned">
                                    Planned
                                </option>

                                <option value="in-progress">
                                    In progress
                                </option>

                                <option value="completed">
                                    Completed
                                </option>

                                <option value="cancelled">
                                    Cancelled
                                </option>

                                <option value="voided">
                                    Voided
                                </option>
                            </select>
                        </label>
                    </div>


                    {paginatedMovements.length >
                    0 ? (
                        <>
                            <div className="dashboard-activity-list">
                                {paginatedMovements.map(
                                    (
                                        movement,
                                    ) => {
                                        const participantIds =
                                            getMovementParticipantIds(
                                                movement,
                                            );

                                        const from =
                                            movement.fromVesselId
                                                ? vesselMap[
                                                    movement
                                                        .fromVesselId
                                                    ]
                                                    ?.name ||
                                                'Unknown vessel'
                                                : movement.fromLocation ||
                                                'Shore';

                                        const to =
                                            movement.toVesselId
                                                ? vesselMap[
                                                    movement
                                                        .toVesselId
                                                    ]
                                                    ?.name ||
                                                'Unknown vessel'
                                                : movement.toLocation ||
                                                'Shore';

                                        const firstPerson =
                                            participantIds.length ===
                                            1
                                                ? personMap[
                                                    participantIds[
                                                        0
                                                        ]
                                                    ]
                                                : null;

                                        const participantLabel =
                                            participantIds.length ===
                                            1 &&
                                            firstPerson
                                                ? `${firstPerson.firstName} ${firstPerson.lastName}`
                                                : `${participantIds.length} ${
                                                    participantIds.length ===
                                                    1
                                                        ? 'person'
                                                        : 'people'
                                                }`;

                                        return (
                                            <div
                                                key={
                                                    movement.id
                                                }
                                                className="dashboard-activity-row"
                                            >
                                                <span className="dashboard-activity-row__icon">
                                                    <i
                                                        className={`ti ${
                                                            movement.movementType ===
                                                            'embark'
                                                                ? 'ti-login'
                                                                : movement.movementType ===
                                                                'disembark'
                                                                    ? 'ti-logout'
                                                                    : 'ti-arrows-exchange'
                                                        }`}
                                                        aria-hidden="true"
                                                    />
                                                </span>


                                                <div className="dashboard-activity-row__main">
                                                    <div className="dashboard-activity-row__heading">
                                                        <strong>
                                                            {movement.reference ||
                                                                `${formatLabel(
                                                                    movement.movementType,
                                                                )} movement`}
                                                        </strong>

                                                        <span
                                                            className={`status-pill ${
                                                                movement.status ===
                                                                'completed'
                                                                    ? 'status-pill--success'
                                                                    : movement.status ===
                                                                    'cancelled' ||
                                                                    movement.status ===
                                                                    'voided'
                                                                        ? 'status-pill--danger'
                                                                        : 'status-pill--warning'
                                                            }`}
                                                        >
                                                            {formatLabel(
                                                                movement.status,
                                                            )}
                                                        </span>
                                                    </div>


                                                    <div className="dashboard-activity-row__route">
                                                        <span>
                                                            {
                                                                from
                                                            }
                                                        </span>

                                                        <i
                                                            className="ti ti-arrow-right"
                                                            aria-hidden="true"
                                                        />

                                                        <span>
                                                            {
                                                                to
                                                            }
                                                        </span>
                                                    </div>


                                                    <div className="dashboard-activity-row__meta">
                                                        <span>
                                                            {
                                                                participantLabel
                                                            }
                                                        </span>

                                                        <span>
                                                            {formatDateTime(
                                                                movement.occurredAt ||
                                                                movement.plannedAt,
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    },
                                )}
                            </div>


                            <DashboardPagination
                                page={
                                    movementPage
                                }
                                pageCount={
                                    movementPageCount
                                }
                                total={
                                    filteredMovements.length
                                }
                                pageSize={
                                    MOVEMENTS_PER_PAGE
                                }
                                onChange={
                                    setMovementPage
                                }
                            />
                        </>
                    ) : (
                        <div className="dashboard-empty dashboard-empty--compact">
                            <div className="dashboard-empty__icon">
                                <i
                                    className="ti ti-route"
                                    aria-hidden="true"
                                />
                            </div>

                            <h3>
                                No movements match
                            </h3>

                            <p>
                                Change the movement
                                filters to view more
                                activity.
                            </p>
                        </div>
                    )}
                </article>
            </section>


            {/* =============================================
                ATTENTION
                ============================================= */}

            {discrepancyItems.length >
                0 && (
                    <section className="dashboard-attention">
                        <article className="panel dashboard-panel">
                            <div className="dashboard-panel__heading">
                                <div>
                                    <p className="label">
                                        Attention
                                    </p>

                                    <h2>
                                        Items requiring
                                        review
                                    </h2>
                                </div>

                                <Link
                                    to="/operations"
                                    className="dashboard-panel__link"
                                >
                                    View operations
                                </Link>
                            </div>


                            <div className="dashboard-attention-list">
                                {discrepancyItems
                                    .slice(
                                        0,
                                        4,
                                    )
                                    .map(
                                        (
                                            item,
                                        ) => (
                                            <div
                                                key={
                                                    item.id
                                                }
                                                className="dashboard-attention-row"
                                            >
                                            <span className="dashboard-attention-row__icon">
                                                <i
                                                    className="ti ti-alert-triangle"
                                                    aria-hidden="true"
                                                />
                                            </span>

                                                <div>
                                                    <strong>
                                                        {
                                                            item.label
                                                        }
                                                    </strong>

                                                    <span>
                                                    {
                                                        item.description
                                                    }
                                                </span>
                                                </div>

                                                <Link
                                                    to="/operations"
                                                    className="btn btn--secondary"
                                                >
                                                    Review
                                                </Link>
                                            </div>
                                        ),
                                    )}
                            </div>
                        </article>
                    </section>
                )}
        </>
    );
}


/* =========================================================
   DASHBOARD PAGINATION
   ========================================================= */

function DashboardPagination({
                                 page,
                                 pageCount,
                                 total,
                                 pageSize,
                                 onChange,
                             }) {
    if (
        pageCount <= 1
    ) {
        return null;
    }

    const firstRecord =
        (page - 1) *
        pageSize +
        1;

    const lastRecord =
        Math.min(
            page * pageSize,
            total,
        );

    return (
        <div className="dashboard-pagination">
            <span className="dashboard-pagination__meta">
                {firstRecord}–
                {lastRecord} of{' '}
                {total}
            </span>

            <div className="dashboard-pagination__controls">
                <button
                    type="button"
                    className="icon-btn"
                    disabled={
                        page === 1
                    }
                    onClick={() =>
                        onChange(
                            Math.max(
                                1,
                                page - 1,
                            ),
                        )
                    }
                    aria-label="Previous page"
                >
                    <i
                        className="ti ti-chevron-left"
                        aria-hidden="true"
                    />
                </button>

                <span className="dashboard-pagination__page">
                    {page} /{' '}
                    {pageCount}
                </span>

                <button
                    type="button"
                    className="icon-btn"
                    disabled={
                        page ===
                        pageCount
                    }
                    onClick={() =>
                        onChange(
                            Math.min(
                                pageCount,
                                page + 1,
                            ),
                        )
                    }
                    aria-label="Next page"
                >
                    <i
                        className="ti ti-chevron-right"
                        aria-hidden="true"
                    />
                </button>
            </div>
        </div>
    );
}


export default DashboardPage;