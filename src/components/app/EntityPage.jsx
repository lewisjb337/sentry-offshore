import { useEffect, useMemo, useState } from 'react';

import { useAppData } from '../../context/AppDataContext';
import { useOrganization } from '../../context/OrganizationContext';
import { entityDefinitions } from '../../data/entityDefinitions';

import EntityWizardModal from './EntityWizardModal';
import DeleteConfirmModal from './DeleteConfirmModal';

function formatDate(value, includeTime = false) {
    if (!value) {
        return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return includeTime
        ? date.toLocaleString()
        : date.toLocaleDateString();
}

function formatLabel(value) {
    if (!value) {
        return '—';
    }

    return value
        .replaceAll('-', ' ')
        .replace(/\b\w/g, (letter) =>
            letter.toUpperCase(),
        );
}

function daysUntil(value) {
    if (!value) {
        return null;
    }

    const difference =
        new Date(value).getTime() -
        Date.now();

    return Math.ceil(
        difference /
        (1000 * 60 * 60 * 24),
    );
}

function expiryTone(value) {
    const days = daysUntil(value);

    if (days === null) {
        return '';
    }

    if (days < 0) {
        return 'status-pill--danger';
    }

    if (days <= 60) {
        return 'status-pill--warning';
    }

    return 'status-pill--success';
}

function getParticipantIds(movement) {
    if (
        Array.isArray(
            movement.participantIds,
        )
    ) {
        return movement.participantIds;
    }

    if (movement.personId) {
        return [movement.personId];
    }

    return [];
}


const PAGE_SIZES = {
    people: 8,
    vessels: 6,
    movements: 8,
    operations: 6,
    reports: 8,
};

function getProjectId(record) {
    return (
        record.projectId ||
        record.currentProjectId ||
        record.current_project_id ||
        record.project?.id ||
        record.currentProject?.id ||
        ''
    );
}

function getMovementVesselIds(record) {
    return [
        record.fromVesselId,
        record.toVesselId,
    ].filter(Boolean);
}

function getOperationExceptionDetails(operation) {
    const details = [];

    if (operation.operationType === 'muster') {
        const expected = Number(operation.expectedPob || 0);
        const accounted = Number(operation.accountedFor || 0);
        const missingCount = Math.max(expected - accounted, 0);

        if (missingCount > 0) {
            const accountedIds = new Set(operation.accountedPersonIds || []);
            const missingPeople = (operation.expectedPobSnapshot || [])
                .filter((person) => !accountedIds.has(person.personId))
                .map((person) =>
                    [person.firstName, person.lastName]
                        .filter(Boolean)
                        .join(' '),
                )
                .filter(Boolean);

            const visibleNames = missingPeople.slice(0, 3);
            const remaining = Math.max(missingPeople.length - visibleNames.length, 0);
            const peopleText = visibleNames.length
                ? `: ${visibleNames.join(', ')}${remaining ? ` +${remaining} more` : ''}`
                : '';

            details.push(
                `${missingCount} ${missingCount === 1 ? 'person' : 'people'} unaccounted for${peopleText}`,
            );
        }

        if (operation.exceptions?.trim()) {
            details.push(operation.exceptions.trim());
        }
    }

    if (operation.operationType === 'personnel-transfer' && operation.abortReason?.trim()) {
        details.push(operation.abortReason.trim());
    }

    if (operation.operationType === 'daily-log') {
        if (operation.incidents?.trim()) {
            details.push(`Incident / observation: ${operation.incidents.trim()}`);
        }

        if (operation.delays?.trim()) {
            details.push(`Delay / downtime: ${operation.delays.trim()}`);
        }
    }

    if (operation.status === 'attention' && details.length === 0) {
        details.push('Operation has been marked for attention.');
    }

    return details;
}

function operationHasException(operation) {
    return (
        operation.status === 'attention' ||
        (
            operation.operationType === 'muster' &&
            Number(operation.accountedFor || 0) < Number(operation.expectedPob || 0)
        )
    );
}


function VoidRecordModal({ entity, record, onClose, onVoid }) {
    const [reason, setReason] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const submit = async (event) => {
        event.preventDefault();
        setError('');

        if (reason.trim().length < 3) {
            setError('Enter a reason for voiding this record.');
            return;
        }

        setSaving(true);
        try {
            await onVoid(record.id, reason.trim());
            onClose();
        } catch (voidError) {
            setError(voidError?.message || 'Unable to void this record.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-backdrop">
            <form className="delete-modal" role="dialog" aria-modal="true" onSubmit={submit}>
                <div className="delete-modal__icon">
                    <i className="ti ti-history-off" aria-hidden="true" />
                </div>
                <h2>Void {entity === 'movements' ? 'movement' : 'operation'}?</h2>
                <p>The record will remain in the audit history but will no longer be treated as active operational data.</p>
                <label className="field">
                    <span className="label">Reason</span>
                    <textarea
                        className="input"
                        rows="4"
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        placeholder="Explain why this record is being voided…"
                        autoFocus
                    />
                </label>
                {error && <p className="field-error" role="alert">{error}</p>}
                <div className="delete-modal__actions">
                    <button type="button" className="btn btn--secondary" onClick={onClose} disabled={saving}>Cancel</button>
                    <button type="submit" className="btn btn--danger" disabled={saving}>
                        {saving ? 'Voiding…' : 'Void record'}
                    </button>
                </div>
            </form>
        </div>
    );
}

function EntityPage({
                        entity,
                        eyebrow,
                        title,
                        description,
                    }) {
    const {
        data,
        currentAssignments,
        vesselPob,
        updateOperation,
        voidMovement,
        voidOperation,
    } = useAppData();

    const {
        canVoidOperationalRecords,
        displayNameForUser,
    } = useOrganization();

    const definition =
        entityDefinitions[entity];

    const [creating, setCreating] =
        useState(false);

    const [
        editingRecord,
        setEditingRecord,
    ] = useState(null);

    const [
        deletingRecord,
        setDeletingRecord,
    ] = useState(null);

    const [operationError, setOperationError] = useState(null);
    const [operationSaving, setOperationSaving] = useState(null);
    const [voidingRecord, setVoidingRecord] = useState(null);

    const saveMuster = async (operation, ids) => {
        setOperationSaving(operation.id);
        setOperationError(null);
        try {
            await updateOperation(operation.id, {
                ...operation,
                accountedPersonIds: ids,
                status: operation.status === 'completed' &&
                ids.length !== operation.expectedPobSnapshot.length
                    ? 'attention' : operation.status,
            });
        } catch (error) {
            setOperationError({ id: operation.id, message: error.message || 'Unable to save muster.' });
        } finally {
            setOperationSaving(null);
        }
    };

    const [search, setSearch] =
        useState('');

    const [filters, setFilters] =
        useState({
            status: '',
            readiness: '',
            assignment: '',
            projectId: '',
            type: '',
            vesselId: '',
        });

    const [page, setPage] =
        useState(1);

    const activeRecords =
        (data[entity] || []).filter(
            (record) =>
                record.status !== 'archived',
        );

    const vesselMap = useMemo(
        () =>
            Object.fromEntries(
                data.vessels.map(
                    (vessel) => [
                        vessel.id,
                        vessel,
                    ],
                ),
            ),
        [data.vessels],
    );

    const peopleMap = useMemo(
        () =>
            Object.fromEntries(
                data.people.map(
                    (person) => [
                        person.id,
                        person,
                    ],
                ),
            ),
        [data.people],
    );

    const matchesSearch = (record) => {
        if (!search.trim()) {
            return true;
        }

        const haystack =
            JSON.stringify(record)
                .toLowerCase();

        return haystack.includes(
            search.toLowerCase(),
        );
    };

    const filteredRecords =
        activeRecords.filter((record) => {
            if (!matchesSearch(record)) {
                return false;
            }

            if (
                filters.status &&
                record.status !== filters.status
            ) {
                return false;
            }

            if (entity === 'people') {
                if (
                    filters.readiness &&
                    record.readinessStatus !==
                    filters.readiness
                ) {
                    return false;
                }

                const assignedVesselId =
                    currentAssignments[
                        record.id
                        ]?.vesselId;

                if (
                    filters.assignment ===
                    'onboard' &&
                    !assignedVesselId
                ) {
                    return false;
                }

                if (
                    filters.assignment ===
                    'ashore' &&
                    assignedVesselId
                ) {
                    return false;
                }

                if (
                    filters.vesselId &&
                    assignedVesselId !==
                    filters.vesselId
                ) {
                    return false;
                }
            }

            if (entity === 'vessels') {
                if (
                    filters.projectId &&
                    getProjectId(record) !==
                    filters.projectId
                ) {
                    return false;
                }
            }

            if (entity === 'movements') {
                if (
                    filters.type &&
                    record.movementType !==
                    filters.type
                ) {
                    return false;
                }

                if (
                    filters.vesselId &&
                    !getMovementVesselIds(
                        record,
                    ).includes(
                        filters.vesselId,
                    )
                ) {
                    return false;
                }
            }

            if (entity === 'operations') {
                if (
                    filters.type &&
                    record.operationType !==
                    filters.type
                ) {
                    return false;
                }

                if (
                    filters.vesselId &&
                    record.vesselId !==
                    filters.vesselId
                ) {
                    return false;
                }

                if (
                    filters.projectId &&
                    getProjectId(record) !==
                    filters.projectId
                ) {
                    return false;
                }
            }

            if (entity === 'reports') {
                if (
                    filters.type &&
                    record.reportType !==
                    filters.type
                ) {
                    return false;
                }
            }

            return true;
        });

    const pageSize =
        PAGE_SIZES[entity] || 8;

    const pageCount =
        Math.max(
            1,
            Math.ceil(
                filteredRecords.length /
                pageSize,
            ),
        );

    useEffect(() => {
        setPage(1);
    }, [
        search,
        filters,
        entity,
    ]);

    useEffect(() => {
        if (page > pageCount) {
            setPage(pageCount);
        }
    }, [
        page,
        pageCount,
    ]);

    const paginatedRecords =
        filteredRecords.slice(
            (page - 1) * pageSize,
            page * pageSize,
        );

    const updateFilter = (
        name,
        value,
    ) => {
        setFilters((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const clearFilters = () => {
        setSearch('');

        setFilters({
            status: '',
            readiness: '',
            assignment: '',
            projectId: '',
            type: '',
            vesselId: '',
        });
    };

    const hasActiveFilters =
        Boolean(search.trim()) ||
        Object.values(filters).some(
            Boolean,
        );

    const editActions = (record) => {
        const operational = entity === 'movements' || entity === 'operations';
        const immutable =
            (entity === 'movements' && ['completed', 'cancelled', 'voided'].includes(record.status)) ||
            (entity === 'operations' && ['completed', 'attention', 'cancelled', 'voided'].includes(record.status));

        if (operational) {
            return (
                <div className="record-actions">
                    {immutable ? (
                        <span className="record-lock" title="Completed operational records are immutable">
                            <i className="ti ti-lock" aria-hidden="true" />
                            Locked
                        </span>
                    ) : (
                        <button
                            type="button"
                            className="icon-btn"
                            onClick={() => setEditingRecord(record)}
                            aria-label="Edit"
                        >
                            <i className="ti ti-pencil" aria-hidden="true" />
                        </button>
                    )}

                    {canVoidOperationalRecords && !['voided', 'cancelled'].includes(record.status) && (
                        <button
                            type="button"
                            className="icon-btn icon-btn--danger"
                            onClick={() => setVoidingRecord(record)}
                            aria-label="Void record"
                            title="Void record"
                        >
                            <i className="ti ti-history-off" aria-hidden="true" />
                        </button>
                    )}
                </div>
            );
        }

        return (
            <div className="record-actions">
                <button
                    type="button"
                    className="icon-btn"
                    onClick={() => setEditingRecord(record)}
                    aria-label="Edit"
                >
                    <i className="ti ti-pencil" aria-hidden="true" />
                </button>

                <button
                    type="button"
                    className="icon-btn icon-btn--danger"
                    onClick={() => setDeletingRecord(record)}
                    aria-label="Delete"
                >
                    <i className="ti ti-trash" aria-hidden="true" />
                </button>
            </div>
        );
    };

    const renderSummary = () => {
        if (entity === 'people') {
            const active =
                activeRecords.filter(
                    (person) =>
                        person.status ===
                        'active',
                ).length;

            const onboard =
                Object.values(
                    currentAssignments,
                ).filter(
                    (assignment) =>
                        Boolean(
                            assignment?.vesselId,
                        ),
                ).length;

            const attention =
                activeRecords.filter(
                    (person) =>
                        person.readinessStatus ===
                        'attention' ||
                        person.readinessStatus ===
                        'not-ready' ||
                        [
                            person.medicalExpiry,
                            person.gwoExpiry,
                            person.passportExpiry,
                        ].some((date) => {
                            const days =
                                daysUntil(date);

                            return (
                                days !== null &&
                                days <= 60
                            );
                        }),
                ).length;

            return (
                <div className="entity-summary">
                    <SummaryCard
                        label="Active personnel"
                        value={active}
                        icon="ti-users"
                    />

                    <SummaryCard
                        label="Currently onboard"
                        value={onboard}
                        icon="ti-ship"
                    />

                    <SummaryCard
                        label="Readiness attention"
                        value={attention}
                        icon="ti-alert-triangle"
                        attention={
                            attention > 0
                        }
                    />
                </div>
            );
        }

        if (entity === 'vessels') {
            const totalPob =
                Object.values(
                    vesselPob,
                ).reduce(
                    (total, value) =>
                        total + value,
                    0,
                );

            return (
                <div className="entity-summary">
                    <SummaryCard
                        label="Active vessels"
                        value={
                            activeRecords.filter(
                                (vessel) =>
                                    vessel.status ===
                                    'active',
                            ).length
                        }
                        icon="ti-ship"
                    />

                    <SummaryCard
                        label="Fleet POB"
                        value={totalPob}
                        icon="ti-users"
                    />

                    <SummaryCard
                        label="Maintenance"
                        value={
                            activeRecords.filter(
                                (vessel) =>
                                    vessel.status ===
                                    'maintenance',
                            ).length
                        }
                        icon="ti-tool"
                    />
                </div>
            );
        }

        if (entity === 'movements') {
            return (
                <div className="entity-summary">
                    <SummaryCard
                        label="Completed"
                        value={
                            activeRecords.filter(
                                (movement) =>
                                    movement.status ===
                                    'completed',
                            ).length
                        }
                        icon="ti-circle-check"
                    />

                    <SummaryCard
                        label="Planned"
                        value={
                            activeRecords.filter(
                                (movement) =>
                                    movement.status ===
                                    'planned',
                            ).length
                        }
                        icon="ti-clock"
                    />

                    <SummaryCard
                        label="Personnel moved"
                        value={activeRecords.reduce(
                            (total, movement) =>
                                total +
                                getParticipantIds(
                                    movement,
                                ).length,
                            0,
                        )}
                        icon="ti-users"
                    />
                </div>
            );
        }

        if (entity === 'operations') {
            const exceptions =
                activeRecords.filter(operationHasException).length;

            return (
                <div className="entity-summary">
                    <SummaryCard
                        label="Open"
                        value={
                            activeRecords.filter(
                                (operation) =>
                                    operation.status ===
                                    'open' ||
                                    operation.status ===
                                    'planned',
                            ).length
                        }
                        icon="ti-activity"
                    />

                    <SummaryCard
                        label="Completed"
                        value={
                            activeRecords.filter(
                                (operation) =>
                                    operation.status ===
                                    'completed',
                            ).length
                        }
                        icon="ti-check"
                    />

                    <SummaryCard
                        label="Exceptions"
                        value={exceptions}
                        icon="ti-alert-triangle"
                        attention={
                            exceptions > 0
                        }
                    />
                </div>
            );
        }

        return (
            <div className="entity-summary">
                <SummaryCard
                    label="Generated"
                    value={
                        activeRecords.filter(
                            (report) =>
                                report.status ===
                                'generated',
                        ).length
                    }
                    icon="ti-file-check"
                />

                <SummaryCard
                    label="Drafts"
                    value={
                        activeRecords.filter(
                            (report) =>
                                report.status ===
                                'draft',
                        ).length
                    }
                    icon="ti-file-pencil"
                />

                <SummaryCard
                    label="Reports"
                    value={
                        activeRecords.length
                    }
                    icon="ti-file-export"
                />
            </div>
        );
    };

    const renderPeople = () => (
        <div className="people-list">
            {paginatedRecords.map((person) => {
                const vesselId =
                    currentAssignments[
                        person.id
                        ]?.vesselId;

                const vessel =
                    vesselMap[vesselId];

                const expiries = [
                    {
                        label: 'Medical',
                        value:
                        person.medicalExpiry,
                    },
                    {
                        label: 'Training',
                        value:
                        person.gwoExpiry,
                    },
                    {
                        label: 'Passport',
                        value:
                        person.passportExpiry,
                    },
                ].filter(
                    (item) => item.value,
                );

                const nextExpiry =
                    expiries.sort(
                        (a, b) =>
                            new Date(a.value) -
                            new Date(b.value),
                    )[0];

                return (
                    <article
                        key={person.id}
                        className="panel person-row"
                    >
                        <div className="person-row__identity">
                            <div className="person-avatar">
                                {person.firstName?.[0]}
                                {person.lastName?.[0]}
                            </div>

                            <div>
                                <strong>
                                    {person.firstName}{' '}
                                    {person.lastName}
                                </strong>

                                <span>
                                    {person.employeeNumber ||
                                        'No crew number'}
                                </span>
                            </div>
                        </div>

                        <RecordMetric
                            label="Role"
                            value={
                                person.role || '—'
                            }
                            subvalue={
                                person.employer ||
                                formatLabel(
                                    person.department,
                                )
                            }
                        />

                        <RecordMetric
                            label="Assignment"
                            value={
                                vessel
                                    ? vessel.name
                                    : 'Ashore'
                            }
                            subvalue={
                                vessel
                                    ? 'On board'
                                    : 'No active assignment'
                            }
                        />

                        <RecordMetric
                            label="Next expiry"
                            value={
                                nextExpiry
                                    ? formatDate(
                                        nextExpiry.value,
                                    )
                                    : 'No expiry recorded'
                            }
                            subvalue={
                                nextExpiry?.label
                            }
                            tone={
                                nextExpiry
                                    ? expiryTone(
                                        nextExpiry.value,
                                    )
                                    : ''
                            }
                        />

                        <span
                            className={`status-pill ${
                                person.readinessStatus ===
                                'ready'
                                    ? 'status-pill--success'
                                    : person.readinessStatus ===
                                    'not-ready'
                                        ? 'status-pill--danger'
                                        : 'status-pill--warning'
                            }`}
                        >
                            {formatLabel(
                                person.readinessStatus ||
                                person.status,
                            )}
                        </span>

                        {editActions(person)}
                    </article>
                );
            })}
        </div>
    );

    const renderVessels = () => (
        <div className="vessel-grid">
            {paginatedRecords.map((vessel) => {
                const pob =
                    vesselPob[
                        vessel.id
                        ] || 0;

                const capacity =
                    Number(
                        vessel.maxPob ||
                        0,
                    );

                const percentage =
                    capacity > 0
                        ? Math.min(
                            (pob / capacity) *
                            100,
                            100,
                        )
                        : 0;

                return (
                    <article
                        key={vessel.id}
                        className="panel vessel-card"
                    >
                        <header className="vessel-card__header">
                            <div className="vessel-card__identity">
                                <span className="vessel-card__icon">
                                    <i
                                        className="ti ti-ship"
                                        aria-hidden="true"
                                    />
                                </span>

                                <div>
                                    <span className="label">
                                        {vessel.fleetCode ||
                                            formatLabel(
                                                vessel.vesselType,
                                            )}
                                    </span>

                                    <h2>
                                        {vessel.name}
                                    </h2>

                                    <p>
                                        {vessel.imo
                                            ? `IMO ${vessel.imo}`
                                            : vessel.callSign ||
                                            'No IMO recorded'}
                                    </p>
                                </div>
                            </div>

                            <span
                                className={`status-pill ${
                                    vessel.status ===
                                    'active'
                                        ? 'status-pill--success'
                                        : 'status-pill--warning'
                                }`}
                            >
                                {formatLabel(
                                    vessel.status,
                                )}
                            </span>
                        </header>

                        <div className="vessel-card__pob">
                            <div>
                                <span className="label">
                                    Persons on board
                                </span>

                                <strong>
                                    {pob}
                                    <span>
                                        / {capacity || '—'}
                                    </span>
                                </strong>
                            </div>

                            <div
                                className="vessel-card__pob-track"
                                role="progressbar"
                                aria-valuenow={pob}
                                aria-valuemin={0}
                                aria-valuemax={
                                    capacity || 100
                                }
                            >
                                <span
                                    style={{
                                        width:
                                            `${percentage}%`,
                                    }}
                                />
                            </div>
                        </div>

                        <div className="vessel-card__details">
                            <RecordMetric
                                label="Project"
                                value={
                                    vessel.currentProject ||
                                    'Unassigned'
                                }
                            />

                            <RecordMetric
                                label="Location"
                                value={
                                    vessel.currentLocation ||
                                    '—'
                                }
                            />

                            <RecordMetric
                                label="Master"
                                value={
                                    vessel.masterName ||
                                    '—'
                                }
                            />
                        </div>

                        <footer className="vessel-card__footer">
                            <span className="audit-text">
                                Modified{' '}
                                {formatDate(
                                    vessel.updatedAt,
                                    true,
                                )}
                            </span>

                            {editActions(vessel)}
                        </footer>
                    </article>
                );
            })}
        </div>
    );

    const renderMovements = () => (
        <div className="movement-list">
            {paginatedRecords
                .slice()
                .sort(
                    (a, b) =>
                        new Date(
                            b.occurredAt ||
                            b.plannedAt ||
                            b.createdAt,
                        ) -
                        new Date(
                            a.occurredAt ||
                            a.plannedAt ||
                            a.createdAt,
                        ),
                )
                .map((movement) => {
                    const participantIds =
                        getParticipantIds(
                            movement,
                        );

                    const fromVessel =
                        vesselMap[
                            movement.fromVesselId
                            ];

                    const toVessel =
                        vesselMap[
                            movement.toVesselId
                            ];

                    const from =
                        fromVessel?.name ||
                        movement.fromLocation ||
                        'Shore';

                    const to =
                        toVessel?.name ||
                        movement.toLocation ||
                        'Shore';

                    return (
                        <article
                            key={movement.id}
                            className="panel movement-row"
                        >
                            <div className="movement-row__icon">
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
                            </div>

                            <div className="movement-row__main">
                                <div className="movement-row__heading">
                                    <span className="label">
                                        {formatLabel(
                                            movement.movementType,
                                        )}
                                    </span>

                                    <span
                                        className={`status-pill ${
                                            movement.status ===
                                            'completed'
                                                ? 'status-pill--success'
                                                : 'status-pill--warning'
                                        }`}
                                    >
                                        {formatLabel(
                                            movement.status,
                                        )}
                                    </span>
                                </div>

                                <h2>
                                    {movement.reference ||
                                        `${formatLabel(
                                            movement.movementType,
                                        )} movement`}
                                </h2>

                                <p>
                                    {participantIds.length}
                                    {' '}
                                    {participantIds.length === 1
                                        ? 'person'
                                        : 'people'}
                                    {' · '}
                                    {formatDate(
                                        movement.occurredAt ||
                                        movement.plannedAt,
                                        true,
                                    )}
                                </p>

                                <div className="movement-route">
                                    <span>
                                        {from}
                                    </span>

                                    <i
                                        className="ti ti-arrow-right"
                                        aria-hidden="true"
                                    />

                                    <span>
                                        {to}
                                    </span>
                                </div>

                                <div className="movement-participants">
                                    {participantIds
                                        .slice(0, 4)
                                        .map((id) => {
                                            const person =
                                                peopleMap[id];

                                            return (
                                                <span
                                                    key={id}
                                                    className="movement-participant"
                                                >
                                                    {person
                                                        ? `${person.firstName} ${person.lastName}`
                                                        : 'Unknown person'}
                                                </span>
                                            );
                                        })}

                                    {participantIds.length >
                                        4 && (
                                            <span className="movement-participant">
                                            +
                                                {participantIds.length -
                                                    4}
                                                {' '}more
                                        </span>
                                        )}
                                </div>
                            </div>

                            <div className="movement-row__side">
                                <span className="audit-text">
                                    {formatDate(
                                        movement.updatedAt,
                                        true,
                                    )}
                                </span>

                                {editActions(movement)}
                            </div>
                        </article>
                    );
                })}
        </div>
    );

    const renderOperationExceptions = () => {
        if (entity !== 'operations') {
            return null;
        }

        const exceptionOperations = activeRecords
            .filter(operationHasException)
            .sort(
                (a, b) =>
                    new Date(b.startAt || b.createdAt) -
                    new Date(a.startAt || a.createdAt),
            );

        if (exceptionOperations.length === 0) {
            return null;
        }

        return (
            <section className="operation-exception-overview" aria-label="Operation exceptions">
                <div className="operation-exception-overview__heading">
                    <div>
                        <span className="label">Requires attention</span>
                        <h2>Exception details</h2>
                    </div>

                    <span className="operation-exception-overview__count">
                        {exceptionOperations.length}{' '}
                        {exceptionOperations.length === 1 ? 'exception' : 'exceptions'}
                    </span>
                </div>

                <div className="operation-exception-list">
                    {exceptionOperations.map((operation) => {
                        const vessel = vesselMap[operation.vesselId];
                        const details = getOperationExceptionDetails(operation);

                        return (
                            <article key={operation.id} className="operation-exception-item">
                                <span className="operation-exception-item__icon" aria-hidden="true">
                                    <i className="ti ti-alert-triangle" />
                                </span>

                                <div className="operation-exception-item__main">
                                    <div className="operation-exception-item__title-row">
                                        <strong>{operation.title}</strong>
                                        <span className="label">
                                            {formatLabel(operation.operationType)}
                                        </span>
                                    </div>

                                    <p className="operation-exception-item__meta">
                                        {vessel?.name || 'Unknown vessel'}
                                        {' · '}
                                        {formatDate(operation.startAt, true)}
                                    </p>

                                    <div className="operation-exception-item__reasons">
                                        {details.map((detail, index) => (
                                            <p key={`${operation.id}-exception-${index}`}>
                                                {detail}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </section>
        );
    };

    const renderOperations = () => (
        <div className="operations-grid">
            {paginatedRecords
                .slice()
                .sort(
                    (a, b) =>
                        new Date(
                            b.startAt ||
                            b.createdAt,
                        ) -
                        new Date(
                            a.startAt ||
                            a.createdAt,
                        ),
                )
                .map((operation) => {
                    const vessel =
                        vesselMap[
                            operation.vesselId
                            ];

                    let primary = '';
                    let secondary = '';

                    if (
                        operation.operationType ===
                        'muster'
                    ) {
                        primary =
                            `${operation.accountedFor || 0} / ${operation.expectedPob || 0}`;

                        secondary =
                            'personnel accounted for';
                    }

                    if (
                        operation.operationType ===
                        'daily-log'
                    ) {
                        primary =
                            operation.weatherSummary ||
                            'Operational log';

                        secondary =
                            operation.activities
                                ? 'Activities recorded'
                                : 'No activities recorded';
                    }

                    if (
                        operation.operationType ===
                        'personnel-transfer'
                    ) {
                        primary =
                            `${operation.transferredCount || 0} / ${operation.plannedCount || 0}`;

                        secondary =
                            'personnel transferred';
                    }

                    return (
                        <article
                            key={operation.id}
                            className="panel operation-card"
                        >
                            <header className="operation-card__header">
                                <span className="operation-icon">
                                    <i
                                        className={`ti ${
                                            operation.operationType ===
                                            'muster'
                                                ? 'ti-users-check'
                                                : operation.operationType ===
                                                'daily-log'
                                                    ? 'ti-notebook'
                                                    : 'ti-transfer'
                                        }`}
                                        aria-hidden="true"
                                    />
                                </span>

                                <div>
                                    <span className="label">
                                        {formatLabel(
                                            operation.operationType,
                                        )}
                                    </span>

                                    <h2>
                                        {operation.title}
                                    </h2>

                                    <p>
                                        {vessel?.name ||
                                            'Unknown vessel'}
                                        {' · '}
                                        {formatDate(
                                            operation.startAt,
                                            true,
                                        )}
                                    </p>
                                </div>

                                <span
                                    className={`status-pill ${
                                        operation.status ===
                                        'completed'
                                            ? 'status-pill--success'
                                            : operation.status ===
                                            'attention'
                                                ? 'status-pill--danger'
                                                : 'status-pill--warning'
                                    }`}
                                >
                                    {formatLabel(
                                        operation.status,
                                    )}
                                </span>
                            </header>

                            <div className="operation-highlight">
                                <strong>
                                    {primary}
                                </strong>

                                <span>
                                    {secondary}
                                </span>
                            </div>

                            {operation.operationType === 'muster' && (
                                <div className="muster-checklist" style={{padding: '16px 0'}}>
                                    <span className="label">Frozen muster roster</span>
                                    {(operation.expectedPobSnapshot || []).map(person => {
                                        const selected = operation.accountedPersonIds || [];
                                        const checked = selected.includes(person.personId);
                                        return (
                                            <label key={person.personId} className="multi-select-item">
                                                <input type="checkbox" checked={checked}
                                                       disabled={Boolean(operationSaving) || ['completed', 'attention', 'voided', 'cancelled'].includes(operation.status)}
                                                       onChange={() => saveMuster(operation, checked
                                                           ? selected.filter(id => id !== person.personId)
                                                           : [...selected, person.personId])} />
                                                <span className="multi-select-item__copy">
                                                    <strong>{person.firstName} {person.lastName}</strong>
                                                    <small>{person.employeeNumber || person.role || 'Personnel'}</small>
                                                </span>
                                            </label>
                                        );
                                    })}
                                    {operationSaving === operation.id && <p className="record-subtext">Saving accountability…</p>}
                                    {operationError?.id === operation.id && <p role="alert" className="field-error">{operationError.message}</p>}
                                    <p className="record-subtext">This is the roster captured when the muster was created, not the current live POB.</p>
                                </div>
                            )}

                            <div className="operation-card__details">
                                <RecordMetric
                                    label="Project"
                                    value={
                                        operation.project ||
                                        '—'
                                    }
                                />

                                <RecordMetric
                                    label="Location"
                                    value={
                                        operation.location ||
                                        '—'
                                    }
                                />

                                <RecordMetric
                                    label="Recorded by"
                                    value={displayNameForUser(operation.recordedByUserId)}
                                />
                            </div>

                            <footer className="operation-card__footer">
                                <span className="audit-text">
                                    Modified{' '}
                                    {formatDate(
                                        operation.updatedAt,
                                        true,
                                    )}
                                </span>

                                {editActions(operation)}
                            </footer>
                        </article>
                    );
                })}
        </div>
    );

    const renderReports = () => (
        <div className="report-grid">
            {paginatedRecords.map((report) => {
                const vessel =
                    vesselMap[
                        report.vesselId
                        ];

                const person =
                    peopleMap[
                        report.personId
                        ];

                return (
                    <article
                        key={report.id}
                        className="panel report-card"
                    >
                        <div className="report-card__icon">
                            <i
                                className={
                                    report.format ===
                                    'csv'
                                        ? 'ti ti-table'
                                        : 'ti ti-file-type-pdf'
                                }
                                aria-hidden="true"
                            />
                        </div>

                        <div className="report-card__content">
                            <span className="label">
                                {formatLabel(
                                    report.reportType,
                                )}
                            </span>

                            <h2>
                                {report.title ||
                                    formatLabel(
                                        report.reportType,
                                    )}
                            </h2>

                            <p>
                                {vessel?.name ||
                                    (person
                                        ? `${person.firstName} ${person.lastName}`
                                        : 'Fleet-wide')}
                            </p>

                            <div className="report-card__meta">
                                <span>
                                    {report.dateFrom ||
                                    report.dateTo
                                        ? `${formatDate(
                                            report.dateFrom,
                                        )} – ${formatDate(
                                            report.dateTo,
                                        )}`
                                        : 'Current snapshot'}
                                </span>

                                <span>
                                    {String(
                                        report.format ||
                                        'PDF',
                                    ).toUpperCase()}
                                </span>

                                <span>
                                    Generated{' '}
                                    {formatDate(
                                        report.createdAt,
                                    )}
                                </span>
                            </div>
                        </div>

                        <div className="report-card__actions">
                            <span
                                className={`status-pill ${
                                    report.status ===
                                    'generated'
                                        ? 'status-pill--success'
                                        : ''
                                }`}
                            >
                                {formatLabel(
                                    report.status,
                                )}
                            </span>

                            {editActions(report)}
                        </div>
                    </article>
                );
            })}
        </div>
    );

    const renderRecords = () => {
        if (entity === 'people') {
            return renderPeople();
        }

        if (entity === 'vessels') {
            return renderVessels();
        }

        if (entity === 'movements') {
            return renderMovements();
        }

        if (entity === 'operations') {
            return renderOperations();
        }

        return renderReports();
    };

    return (
        <>
            <header className="app-topbar">
                <div>
                    <p className="label">
                        {eyebrow}
                    </p>

                    <h1>
                        {title}
                    </h1>
                </div>

                <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() =>
                        setCreating(true)
                    }
                >
                    <i
                        className="ti ti-plus"
                        aria-hidden="true"
                    />

                    New{' '}
                    {definition.singular.toLowerCase()}
                </button>
            </header>

            <section className="app-page">
                <div className="entity-page-heading">
                    <div className="app-page__intro">
                        <p>
                            {description}
                        </p>
                    </div>

                    {activeRecords.length > 0 && (
                        <div className="entity-search">
                            <i
                                className="ti ti-search"
                                aria-hidden="true"
                            />

                            <input
                                type="search"
                                placeholder={`Search ${definition.plural.toLowerCase()}...`}
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target.value,
                                    )
                                }
                            />
                        </div>
                    )}
                </div>

                {activeRecords.length > 0 && (
                    <EntityFilters
                        entity={entity}
                        filters={filters}
                        updateFilter={updateFilter}
                        clearFilters={clearFilters}
                        hasActiveFilters={
                            hasActiveFilters
                        }
                        vessels={data.vessels || []}
                        projects={data.projects || []}
                    />
                )}

                {renderSummary()}

                {renderOperationExceptions()}

                {activeRecords.length === 0 ? (
                    <article className="panel app-empty-panel">
                        <div className="app-empty-state">
                            <div className="app-empty-state__icon">
                                <i
                                    className={`ti ${definition.icon}`}
                                    aria-hidden="true"
                                />
                            </div>

                            <h2>
                                No{' '}
                                {definition.plural.toLowerCase()}{' '}
                                yet
                            </h2>

                            <p>
                                Create your first{' '}
                                {definition.singular.toLowerCase()}{' '}
                                to get started.
                            </p>

                            <button
                                type="button"
                                className="btn btn--primary"
                                onClick={() =>
                                    setCreating(true)
                                }
                            >
                                New{' '}
                                {definition.singular.toLowerCase()}
                            </button>
                        </div>
                    </article>
                ) : filteredRecords.length === 0 ? (
                    <div className="panel entity-no-results">
                        No records match the current search and filters.
                    </div>
                ) : (
                    <>
                        <div className="entity-results">
                            {renderRecords()}
                        </div>

                        <Pagination
                            page={page}
                            pageCount={pageCount}
                            pageSize={pageSize}
                            total={
                                filteredRecords.length
                            }
                            onChange={setPage}
                        />
                    </>
                )}
            </section>

            {creating && (
                <EntityWizardModal
                    entity={entity}
                    onClose={() =>
                        setCreating(false)
                    }
                />
            )}

            {editingRecord && (
                <EntityWizardModal
                    entity={entity}
                    record={editingRecord}
                    onClose={() =>
                        setEditingRecord(null)
                    }
                />
            )}

            {deletingRecord && (
                <DeleteConfirmModal
                    entity={entity}
                    record={deletingRecord}
                    onClose={() =>
                        setDeletingRecord(null)
                    }
                />
            )}

            {voidingRecord && (
                <VoidRecordModal
                    entity={entity}
                    record={voidingRecord}
                    onClose={() => setVoidingRecord(null)}
                    onVoid={entity === 'movements' ? voidMovement : voidOperation}
                />
            )}
        </>
    );
}


function EntityFilters({
                           entity,
                           filters,
                           updateFilter,
                           clearFilters,
                           hasActiveFilters,
                           vessels,
                           projects,
                       }) {
    const vesselOptions =
        vessels.filter(
            (vessel) =>
                vessel.status !== 'archived',
        );

    const projectOptions =
        projects.filter(
            (project) =>
                project.status !== 'archived',
        );

    return (
        <div className="entity-filter-bar">
            <div className="entity-filter-bar__controls">
                {entity === 'people' && (
                    <>
                        <FilterSelect
                            label="Status"
                            value={filters.status}
                            onChange={(value) =>
                                updateFilter(
                                    'status',
                                    value,
                                )
                            }
                            options={[
                                ['active', 'Active'],
                                ['leave', 'Leave'],
                                ['inactive', 'Inactive'],
                            ]}
                        />

                        <FilterSelect
                            label="Readiness"
                            value={
                                filters.readiness
                            }
                            onChange={(value) =>
                                updateFilter(
                                    'readiness',
                                    value,
                                )
                            }
                            options={[
                                ['ready', 'Ready'],
                                [
                                    'attention',
                                    'Attention',
                                ],
                                [
                                    'not-ready',
                                    'Not ready',
                                ],
                            ]}
                        />

                        <FilterSelect
                            label="Assignment"
                            value={
                                filters.assignment
                            }
                            onChange={(value) =>
                                updateFilter(
                                    'assignment',
                                    value,
                                )
                            }
                            options={[
                                [
                                    'onboard',
                                    'Onboard',
                                ],
                                [
                                    'ashore',
                                    'Ashore',
                                ],
                            ]}
                        />

                        <FilterSelect
                            label="Vessel"
                            value={
                                filters.vesselId
                            }
                            onChange={(value) =>
                                updateFilter(
                                    'vesselId',
                                    value,
                                )
                            }
                            options={vesselOptions.map(
                                (vessel) => [
                                    vessel.id,
                                    vessel.name,
                                ],
                            )}
                        />
                    </>
                )}

                {entity === 'vessels' && (
                    <>
                        <FilterSelect
                            label="Status"
                            value={filters.status}
                            onChange={(value) =>
                                updateFilter(
                                    'status',
                                    value,
                                )
                            }
                            options={[
                                ['active', 'Active'],
                                [
                                    'standby',
                                    'Standby',
                                ],
                                [
                                    'maintenance',
                                    'Maintenance',
                                ],
                                [
                                    'inactive',
                                    'Inactive',
                                ],
                            ]}
                        />

                        <FilterSelect
                            label="Project"
                            value={
                                filters.projectId
                            }
                            onChange={(value) =>
                                updateFilter(
                                    'projectId',
                                    value,
                                )
                            }
                            options={projectOptions.map(
                                (project) => [
                                    project.id,
                                    project.name,
                                ],
                            )}
                        />
                    </>
                )}

                {entity === 'movements' && (
                    <>
                        <FilterSelect
                            label="Type"
                            value={filters.type}
                            onChange={(value) =>
                                updateFilter(
                                    'type',
                                    value,
                                )
                            }
                            options={[
                                [
                                    'embark',
                                    'Embark',
                                ],
                                [
                                    'disembark',
                                    'Disembark',
                                ],
                                [
                                    'transfer',
                                    'Transfer',
                                ],
                                [
                                    'shore-transfer',
                                    'Shore transfer',
                                ],
                            ]}
                        />

                        <FilterSelect
                            label="Status"
                            value={filters.status}
                            onChange={(value) =>
                                updateFilter(
                                    'status',
                                    value,
                                )
                            }
                            options={[
                                [
                                    'planned',
                                    'Planned',
                                ],
                                [
                                    'in-progress',
                                    'In progress',
                                ],
                                [
                                    'completed',
                                    'Completed',
                                ],
                                [
                                    'cancelled',
                                    'Cancelled',
                                ],
                                [
                                    'voided',
                                    'Voided',
                                ],
                            ]}
                        />

                        <FilterSelect
                            label="Vessel"
                            value={
                                filters.vesselId
                            }
                            onChange={(value) =>
                                updateFilter(
                                    'vesselId',
                                    value,
                                )
                            }
                            options={vesselOptions.map(
                                (vessel) => [
                                    vessel.id,
                                    vessel.name,
                                ],
                            )}
                        />
                    </>
                )}

                {entity === 'operations' && (
                    <>
                        <FilterSelect
                            label="Type"
                            value={filters.type}
                            onChange={(value) =>
                                updateFilter(
                                    'type',
                                    value,
                                )
                            }
                            options={[
                                [
                                    'muster',
                                    'Muster',
                                ],
                                [
                                    'daily-log',
                                    'Daily log',
                                ],
                                [
                                    'personnel-transfer',
                                    'Personnel transfer',
                                ],
                            ]}
                        />

                        <FilterSelect
                            label="Status"
                            value={filters.status}
                            onChange={(value) =>
                                updateFilter(
                                    'status',
                                    value,
                                )
                            }
                            options={[
                                [
                                    'planned',
                                    'Planned',
                                ],
                                ['open', 'Open'],
                                [
                                    'completed',
                                    'Completed',
                                ],
                                [
                                    'attention',
                                    'Attention',
                                ],
                                [
                                    'cancelled',
                                    'Cancelled',
                                ],
                                [
                                    'voided',
                                    'Voided',
                                ],
                            ]}
                        />

                        <FilterSelect
                            label="Vessel"
                            value={
                                filters.vesselId
                            }
                            onChange={(value) =>
                                updateFilter(
                                    'vesselId',
                                    value,
                                )
                            }
                            options={vesselOptions.map(
                                (vessel) => [
                                    vessel.id,
                                    vessel.name,
                                ],
                            )}
                        />

                        <FilterSelect
                            label="Project"
                            value={
                                filters.projectId
                            }
                            onChange={(value) =>
                                updateFilter(
                                    'projectId',
                                    value,
                                )
                            }
                            options={projectOptions.map(
                                (project) => [
                                    project.id,
                                    project.name,
                                ],
                            )}
                        />
                    </>
                )}

                {entity === 'reports' && (
                    <>
                        <FilterSelect
                            label="Type"
                            value={filters.type}
                            onChange={(value) =>
                                updateFilter(
                                    'type',
                                    value,
                                )
                            }
                            options={[
                                [
                                    'pob-snapshot',
                                    'POB snapshot',
                                ],
                                [
                                    'crew-movement-log',
                                    'Crew movement log',
                                ],
                                [
                                    'muster-report',
                                    'Muster report',
                                ],
                                [
                                    'daily-operations',
                                    'Daily operations',
                                ],
                                [
                                    'crew-report',
                                    'Crew report',
                                ],
                                [
                                    'vessel-report',
                                    'Vessel report',
                                ],
                            ]}
                        />

                        <FilterSelect
                            label="Status"
                            value={filters.status}
                            onChange={(value) =>
                                updateFilter(
                                    'status',
                                    value,
                                )
                            }
                            options={[
                                [
                                    'draft',
                                    'Draft',
                                ],
                                [
                                    'generated',
                                    'Generated',
                                ],
                                [
                                    'failed',
                                    'Failed',
                                ],
                                [
                                    'superseded',
                                    'Superseded',
                                ],
                            ]}
                        />
                    </>
                )}
            </div>

            {hasActiveFilters && (
                <button
                    type="button"
                    className="entity-filter-clear"
                    onClick={clearFilters}
                >
                    <i
                        className="ti ti-filter-off"
                        aria-hidden="true"
                    />

                    Clear filters
                </button>
            )}
        </div>
    );
}

function FilterSelect({
                          label,
                          value,
                          onChange,
                          options,
                      }) {
    return (
        <label className="entity-filter">
            <span>
                {label}
            </span>

            <select
                value={value}
                onChange={(event) =>
                    onChange(
                        event.target.value,
                    )
                }
            >
                <option value="">
                    All
                </option>

                {options.map(
                    ([optionValue, optionLabel]) => (
                        <option
                            key={optionValue}
                            value={optionValue}
                        >
                            {optionLabel}
                        </option>
                    ),
                )}
            </select>
        </label>
    );
}

function Pagination({
                        page,
                        pageCount,
                        pageSize,
                        total,
                        onChange,
                    }) {
    if (total <= pageSize) {
        return null;
    }

    const first =
        (page - 1) * pageSize + 1;

    const last =
        Math.min(
            page * pageSize,
            total,
        );

    const pages = [];

    const start =
        Math.max(
            1,
            Math.min(
                page - 2,
                pageCount - 4,
            ),
        );

    const end =
        Math.min(
            pageCount,
            start + 4,
        );

    for (
        let value = start;
        value <= end;
        value += 1
    ) {
        pages.push(value);
    }

    return (
        <div className="entity-pagination">
            <span className="entity-pagination__meta">
                Showing {first}–{last} of{' '}
                {total}
            </span>

            <div className="entity-pagination__controls">
                <button
                    type="button"
                    className="icon-btn"
                    disabled={page === 1}
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

                {pages.map(
                    (value) => (
                        <button
                            key={value}
                            type="button"
                            className={`entity-pagination__page ${
                                value === page
                                    ? 'is-active'
                                    : ''
                            }`}
                            onClick={() =>
                                onChange(value)
                            }
                            aria-current={
                                value === page
                                    ? 'page'
                                    : undefined
                            }
                        >
                            {value}
                        </button>
                    ),
                )}

                <button
                    type="button"
                    className="icon-btn"
                    disabled={
                        page === pageCount
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

function SummaryCard({
                         label,
                         value,
                         icon,
                         attention = false,
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

            <span
                className={`entity-summary-card__icon ${
                    attention
                        ? 'is-attention'
                        : ''
                }`}
            >
                <i
                    className={`ti ${icon}`}
                    aria-hidden="true"
                />
            </span>
        </article>
    );
}

function RecordMetric({
                          label,
                          value,
                          subvalue,
                          tone = '',
                      }) {
    return (
        <div className="record-metric">
            <span className="label">
                {label}
            </span>

            <strong
                className={
                    tone
                        ? `record-metric__tone ${tone}`
                        : ''
                }
            >
                {value}
            </strong>

            {subvalue && (
                <span>
                    {subvalue}
                </span>
            )}
        </div>
    );
}

export default EntityPage;
