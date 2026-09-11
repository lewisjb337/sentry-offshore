function safe(value) {
    if (
        value === undefined ||
        value === null ||
        value === ''
    ) {
        return '—';
    }

    return value;
}

function formatDate(value) {
    if (!value) return '—';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString('en-GB');
}

function formatDateTime(value) {
    if (!value) return '—';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString('en-GB');
}

function formatLabel(value) {
    if (!value) return '—';

    return String(value)
        .replaceAll('_', ' ')
        .replaceAll('-', ' ')
        .replace(/\b\w/g, (letter) =>
            letter.toUpperCase(),
        );
}

function inDateRange(
    value,
    from,
    to,
) {
    if (!value) {
        return false;
    }

    const date = new Date(value);

    if (
        Number.isNaN(
            date.getTime(),
        )
    ) {
        return false;
    }

    if (from) {
        const start =
            new Date(`${from}T00:00:00`);

        if (date < start) {
            return false;
        }
    }

    if (to) {
        const end =
            new Date(`${to}T23:59:59.999`);

        if (date > end) {
            return false;
        }
    }

    return true;
}

function vesselName(
    vessels,
    id,
) {
    if (!id) {
        return 'Shore';
    }

    return (
        vessels.find(
            (vessel) =>
                vessel.id === id,
        )?.name ||
        'Unknown vessel'
    );
}

function personName(
    people,
    id,
) {
    const person =
        people.find(
            (item) =>
                item.id === id,
        );

    if (!person) {
        return 'Unknown person';
    }

    return `${person.firstName} ${person.lastName}`;
}

function buildPobSnapshot({
                              data,
                              vesselPob,
                              currentAssignments,
                              vesselId,
                          }) {
    const vessels =
        vesselId
            ? data.vessels.filter(
                (vessel) =>
                    vessel.id ===
                    vesselId,
            )
            : data.vessels.filter(
                (vessel) =>
                    vessel.status !==
                    'archived',
            );

    const rows = [];

    vessels.forEach(
        (vessel) => {
            const people =
                data.people.filter(
                    (person) =>
                        currentAssignments[
                            person.id
                            ]?.vesselId ===
                        vessel.id,
                );

            if (
                people.length === 0
            ) {
                rows.push({
                    vessel:
                    vessel.name,

                    project:
                        vessel.currentProject ||
                        'Unassigned',

                    location:
                        vessel.currentLocation ||
                        '—',

                    person:
                        'No personnel onboard',

                    employeeNumber:
                        '—',

                    role:
                        '—',

                    employer:
                        '—',
                });

                return;
            }

            people.forEach(
                (person) => {
                    rows.push({
                        vessel:
                        vessel.name,

                        project:
                            vessel.currentProject ||
                            'Unassigned',

                        location:
                            vessel.currentLocation ||
                            '—',

                        person:
                            `${person.firstName} ${person.lastName}`,

                        employeeNumber:
                            person.employeeNumber ||
                            '—',

                        role:
                            person.role ||
                            '—',

                        employer:
                            person.employer ||
                            '—',
                    });
                },
            );
        },
    );

    return {
        title:
            vesselId
                ? `POB Snapshot — ${
                    vessels[0]?.name ||
                    'Vessel'
                }`
                : 'Fleet POB Snapshot',

        subtitle:
            'Current persons on board',

        generatedAt:
            new Date(),

        summary: [
            {
                label:
                    'Vessels',
                value:
                vessels.length,
            },
            {
                label:
                    'Total POB',
                value:
                    vessels.reduce(
                        (
                            total,
                            vessel,
                        ) =>
                            total +
                            Number(
                                vesselPob[
                                    vessel.id
                                    ] ||
                                0,
                            ),
                        0,
                    ),
            },
        ],

        columns: [
            {
                key:
                    'vessel',
                label:
                    'Vessel',
            },
            {
                key:
                    'project',
                label:
                    'Project',
            },
            {
                key:
                    'person',
                label:
                    'Person',
            },
            {
                key:
                    'employeeNumber',
                label:
                    'Crew No.',
            },
            {
                key:
                    'role',
                label:
                    'Role',
            },
            {
                key:
                    'employer',
                label:
                    'Employer',
            },
        ],

        rows,
    };
}

function buildMovementLog({
                              data,
                              vesselId,
                              dateFrom,
                              dateTo,
                          }) {
    let movements =
        [...data.movements];

    if (vesselId) {
        movements =
            movements.filter(
                (movement) =>
                    movement.fromVesselId ===
                    vesselId ||
                    movement.toVesselId ===
                    vesselId,
            );
    }

    if (
        dateFrom ||
        dateTo
    ) {
        movements =
            movements.filter(
                (movement) =>
                    inDateRange(
                        movement.occurredAt ||
                        movement.plannedAt,
                        dateFrom,
                        dateTo,
                    ),
            );
    }

    movements.sort(
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
    );

    const rows = [];

    movements.forEach(
        (movement) => {
            const ids =
                movement.participantIds ||
                [];

            if (
                ids.length === 0
            ) {
                rows.push({
                    date:
                        formatDateTime(
                            movement.occurredAt ||
                            movement.plannedAt,
                        ),

                    reference:
                        safe(
                            movement.reference,
                        ),

                    type:
                        formatLabel(
                            movement.movementType,
                        ),

                    person:
                        '—',

                    from:
                        movement.fromVesselId
                            ? vesselName(
                                data.vessels,
                                movement.fromVesselId,
                            )
                            : movement.fromLocation ||
                            'Shore',

                    to:
                        movement.toVesselId
                            ? vesselName(
                                data.vessels,
                                movement.toVesselId,
                            )
                            : movement.toLocation ||
                            'Shore',

                    status:
                        formatLabel(
                            movement.status,
                        ),
                });

                return;
            }

            ids.forEach(
                (personId) => {
                    rows.push({
                        date:
                            formatDateTime(
                                movement.occurredAt ||
                                movement.plannedAt,
                            ),

                        reference:
                            safe(
                                movement.reference,
                            ),

                        type:
                            formatLabel(
                                movement.movementType,
                            ),

                        person:
                            personName(
                                data.people,
                                personId,
                            ),

                        from:
                            movement.fromVesselId
                                ? vesselName(
                                    data.vessels,
                                    movement.fromVesselId,
                                )
                                : movement.fromLocation ||
                                'Shore',

                        to:
                            movement.toVesselId
                                ? vesselName(
                                    data.vessels,
                                    movement.toVesselId,
                                )
                                : movement.toLocation ||
                                'Shore',

                        status:
                            formatLabel(
                                movement.status,
                            ),
                    });
                },
            );
        },
    );

    return {
        title:
            'Crew Movement Log',

        subtitle:
            vesselId
                ? vesselName(
                    data.vessels,
                    vesselId,
                )
                : 'All vessels',

        generatedAt:
            new Date(),

        summary: [
            {
                label:
                    'Movements',
                value:
                movements.length,
            },
            {
                label:
                    'Personnel records',
                value:
                rows.length,
            },
        ],

        columns: [
            {
                key:
                    'date',
                label:
                    'Date / Time',
            },
            {
                key:
                    'reference',
                label:
                    'Reference',
            },
            {
                key:
                    'type',
                label:
                    'Type',
            },
            {
                key:
                    'person',
                label:
                    'Person',
            },
            {
                key:
                    'from',
                label:
                    'From',
            },
            {
                key:
                    'to',
                label:
                    'To',
            },
            {
                key:
                    'status',
                label:
                    'Status',
            },
        ],

        rows,
    };
}

function buildMusterReport({
                               data,
                               operationId,
                           }) {
    let musters =
        data.operations.filter(
            (operation) =>
                operation.operationType ===
                'muster',
        );

    if (operationId) {
        musters =
            musters.filter(
                (operation) =>
                    operation.id ===
                    operationId,
            );
    }

    const rows = [];

    musters.forEach(
        (muster) => {
            const accounted =
                muster.accountedPersonIds ||
                [];

            const roster =
                muster.expectedPobSnapshot ||
                [];

            roster.forEach(
                (person) => {
                    rows.push({
                        muster:
                        muster.title,

                        vessel:
                            vesselName(
                                data.vessels,
                                muster.vesselId,
                            ),

                        date:
                            formatDateTime(
                                muster.startAt,
                            ),

                        person:
                            `${person.firstName} ${person.lastName}`,

                        employeeNumber:
                            person.employeeNumber ||
                            '—',

                        role:
                            person.role ||
                            '—',

                        accounted:
                            accounted.includes(
                                person.personId,
                            )
                                ? 'Yes'
                                : 'No',

                        verifier:
                            muster.verifiedBy ||
                            '—',

                        exceptions:
                            muster.exceptions ||
                            '—',
                    });
                },
            );
        },
    );

    return {
        title:
            operationId
                ? `Muster Report — ${
                    musters[0]?.title ||
                    'Muster'
                }`
                : 'Muster Report',

        subtitle:
            'Personnel accountability',

        generatedAt:
            new Date(),

        summary: [
            {
                label:
                    'Musters',
                value:
                musters.length,
            },
            {
                label:
                    'Roster records',
                value:
                rows.length,
            },
        ],

        columns: [
            {
                key:
                    'muster',
                label:
                    'Muster',
            },
            {
                key:
                    'vessel',
                label:
                    'Vessel',
            },
            {
                key:
                    'date',
                label:
                    'Date / Time',
            },
            {
                key:
                    'person',
                label:
                    'Person',
            },
            {
                key:
                    'role',
                label:
                    'Role',
            },
            {
                key:
                    'accounted',
                label:
                    'Accounted',
            },
            {
                key:
                    'verifier',
                label:
                    'Verified By',
            },
            {
                key:
                    'exceptions',
                label:
                    'Exceptions',
            },
        ],

        rows,
    };
}

function buildDailyOperations({
                                  data,
                                  vesselId,
                                  dateFrom,
                                  dateTo,
                              }) {
    let logs =
        data.operations.filter(
            (operation) =>
                operation.operationType ===
                'daily-log',
        );

    if (vesselId) {
        logs =
            logs.filter(
                (operation) =>
                    operation.vesselId ===
                    vesselId,
            );
    }

    if (
        dateFrom ||
        dateTo
    ) {
        logs =
            logs.filter(
                (operation) =>
                    inDateRange(
                        operation.startAt,
                        dateFrom,
                        dateTo,
                    ),
            );
    }

    const rows =
        logs.map(
            (operation) => ({
                date:
                    formatDate(
                        operation.startAt,
                    ),

                vessel:
                    vesselName(
                        data.vessels,
                        operation.vesselId,
                    ),

                master:
                    operation.masterName ||
                    '—',

                weather:
                    operation.weatherSummary ||
                    '—',

                seaState:
                    operation.seaState ||
                    '—',

                activities:
                    operation.activities ||
                    '—',

                delays:
                    operation.delays ||
                    '—',

                incidents:
                    operation.incidents ||
                    '—',

                status:
                    formatLabel(
                        operation.status,
                    ),
            }),
        );

    return {
        title:
            'Daily Operations Report',

        subtitle:
            vesselId
                ? vesselName(
                    data.vessels,
                    vesselId,
                )
                : 'All vessels',

        generatedAt:
            new Date(),

        summary: [
            {
                label:
                    'Logs',
                value:
                rows.length,
            },
        ],

        columns: [
            {
                key:
                    'date',
                label:
                    'Date',
            },
            {
                key:
                    'vessel',
                label:
                    'Vessel',
            },
            {
                key:
                    'master',
                label:
                    'Master',
            },
            {
                key:
                    'weather',
                label:
                    'Weather',
            },
            {
                key:
                    'seaState',
                label:
                    'Sea State',
            },
            {
                key:
                    'activities',
                label:
                    'Activities',
            },
            {
                key:
                    'delays',
                label:
                    'Delays',
            },
            {
                key:
                    'incidents',
                label:
                    'Incidents',
            },
        ],

        rows,
    };
}

function buildCrewReport({
                             data,
                             currentAssignments,
                             personId,
                         }) {
    const person =
        data.people.find(
            (item) =>
                item.id ===
                personId,
        );

    if (!person) {
        return {
            title:
                'Crew Report',

            subtitle:
                'No person selected',

            generatedAt:
                new Date(),

            summary: [],

            columns: [],

            rows: [],
        };
    }

    const assignment =
        currentAssignments[
            person.id
            ];

    const movements =
        data.movements
            .filter(
                (movement) =>
                    (
                        movement.participantIds ||
                        []
                    ).includes(
                        person.id,
                    ),
            )
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
            );

    const rows =
        movements.map(
            (movement) => ({
                date:
                    formatDateTime(
                        movement.occurredAt ||
                        movement.plannedAt,
                    ),

                reference:
                    movement.reference ||
                    '—',

                type:
                    formatLabel(
                        movement.movementType,
                    ),

                from:
                    movement.fromVesselId
                        ? vesselName(
                            data.vessels,
                            movement.fromVesselId,
                        )
                        : movement.fromLocation ||
                        'Shore',

                to:
                    movement.toVesselId
                        ? vesselName(
                            data.vessels,
                            movement.toVesselId,
                        )
                        : movement.toLocation ||
                        'Shore',

                status:
                    formatLabel(
                        movement.status,
                    ),
            }),
        );

    return {
        title:
            `Crew Report — ${person.firstName} ${person.lastName}`,

        subtitle:
            person.role ||
            'Personnel record',

        generatedAt:
            new Date(),

        details: [
            {
                label:
                    'Crew number',
                value:
                    person.employeeNumber ||
                    '—',
            },
            {
                label:
                    'Employer',
                value:
                    person.employer ||
                    '—',
            },
            {
                label:
                    'Current vessel',
                value:
                    assignment?.vesselId
                        ? vesselName(
                            data.vessels,
                            assignment.vesselId,
                        )
                        : 'Ashore',
            },
            {
                label:
                    'Readiness',
                value:
                    formatLabel(
                        person.readinessStatus,
                    ),
            },
            {
                label:
                    'Medical expiry',
                value:
                    formatDate(
                        person.medicalExpiry,
                    ),
            },
            {
                label:
                    'Training expiry',
                value:
                    formatDate(
                        person.gwoExpiry,
                    ),
            },
        ],

        summary: [
            {
                label:
                    'Movements',
                value:
                movements.length,
            },
        ],

        columns: [
            {
                key:
                    'date',
                label:
                    'Date / Time',
            },
            {
                key:
                    'reference',
                label:
                    'Reference',
            },
            {
                key:
                    'type',
                label:
                    'Type',
            },
            {
                key:
                    'from',
                label:
                    'From',
            },
            {
                key:
                    'to',
                label:
                    'To',
            },
            {
                key:
                    'status',
                label:
                    'Status',
            },
        ],

        rows,
    };
}

function buildVesselReport({
                               data,
                               vesselPob,
                               currentAssignments,
                               vesselId,
                           }) {
    const vessel =
        data.vessels.find(
            (item) =>
                item.id ===
                vesselId,
        );

    if (!vessel) {
        return {
            title:
                'Vessel Report',

            subtitle:
                'No vessel selected',

            generatedAt:
                new Date(),

            summary: [],
            columns: [],
            rows: [],
        };
    }

    const onboard =
        data.people.filter(
            (person) =>
                currentAssignments[
                    person.id
                    ]?.vesselId ===
                vessel.id,
        );

    const rows =
        onboard.map(
            (person) => ({
                name:
                    `${person.firstName} ${person.lastName}`,

                employeeNumber:
                    person.employeeNumber ||
                    '—',

                role:
                    person.role ||
                    '—',

                employer:
                    person.employer ||
                    '—',

                readiness:
                    formatLabel(
                        person.readinessStatus,
                    ),
            }),
        );

    return {
        title:
            `Vessel Report — ${vessel.name}`,

        subtitle:
            formatLabel(
                vessel.vesselType,
            ),

        generatedAt:
            new Date(),

        details: [
            {
                label:
                    'Fleet code',
                value:
                    vessel.fleetCode ||
                    '—',
            },
            {
                label:
                    'IMO',
                value:
                    vessel.imo ||
                    '—',
            },
            {
                label:
                    'MMSI',
                value:
                    vessel.mmsi ||
                    '—',
            },
            {
                label:
                    'Call sign',
                value:
                    vessel.callSign ||
                    '—',
            },
            {
                label:
                    'Project',
                value:
                    vessel.currentProject ||
                    'Unassigned',
            },
            {
                label:
                    'Location',
                value:
                    vessel.currentLocation ||
                    '—',
            },
            {
                label:
                    'Master',
                value:
                    vessel.masterName ||
                    '—',
            },
            {
                label:
                    'Max POB',
                value:
                    vessel.maxPob ||
                    '—',
            },
        ],

        summary: [
            {
                label:
                    'Current POB',
                value:
                    vesselPob[
                        vessel.id
                        ] ||
                    0,
            },
            {
                label:
                    'Capacity',
                value:
                    vessel.maxPob ||
                    '—',
            },
        ],

        columns: [
            {
                key:
                    'name',
                label:
                    'Person',
            },
            {
                key:
                    'employeeNumber',
                label:
                    'Crew No.',
            },
            {
                key:
                    'role',
                label:
                    'Role',
            },
            {
                key:
                    'employer',
                label:
                    'Employer',
            },
            {
                key:
                    'readiness',
                label:
                    'Readiness',
            },
        ],

        rows,
    };
}

export function buildReport({
                                reportType,
                                data,
                                vesselPob,
                                currentAssignments,
                                filters = {},
                            }) {
    const args = {
        data,
        vesselPob,
        currentAssignments,
        ...filters,
    };

    switch (reportType) {
        case 'pob-snapshot':
            return buildPobSnapshot(
                args,
            );

        case 'crew-movement-log':
            return buildMovementLog(
                args,
            );

        case 'muster-report':
            return buildMusterReport(
                args,
            );

        case 'daily-operations':
            return buildDailyOperations(
                args,
            );

        case 'crew-report':
            return buildCrewReport(
                args,
            );

        case 'vessel-report':
            return buildVesselReport(
                args,
            );

        default:
            throw new Error(
                `Unknown report type: ${reportType}`,
            );
    }
}

function escapeCsv(value) {
    const string =
        value === undefined ||
        value === null
            ? ''
            : String(value);

    if (
        string.includes(',') ||
        string.includes('"') ||
        string.includes('\n')
    ) {
        return `"${string.replaceAll(
            '"',
            '""',
        )}"`;
    }

    return string;
}

export function exportReportCsv(
    report,
) {
    const headers =
        report.columns.map(
            (column) =>
                escapeCsv(
                    column.label,
                ),
        );

    const rows =
        report.rows.map(
            (row) =>
                report.columns
                    .map(
                        (column) =>
                            escapeCsv(
                                row[
                                    column.key
                                    ],
                            ),
                    )
                    .join(','),
        );

    const csv = [
        headers.join(','),
        ...rows,
    ].join('\n');

    const blob =
        new Blob(
            [csv],
            {
                type:
                    'text/csv;charset=utf-8;',
            },
        );

    const url =
        URL.createObjectURL(
            blob,
        );

    const anchor =
        document.createElement(
            'a',
        );

    const filename =
        report.title
            .toLowerCase()
            .replace(
                /[^a-z0-9]+/g,
                '-',
            )
            .replace(
                /^-|-$|/g,
                '',
            );

    anchor.href = url;
    anchor.download =
        `${filename || 'sentry-report'}.csv`;

    document.body.appendChild(
        anchor,
    );

    anchor.click();

    anchor.remove();

    URL.revokeObjectURL(
        url,
    );
}

function escapeHtml(value) {
    return String(
        value ?? '',
    )
        .replaceAll(
            '&',
            '&amp;',
        )
        .replaceAll(
            '<',
            '&lt;',
        )
        .replaceAll(
            '>',
            '&gt;',
        )
        .replaceAll(
            '"',
            '&quot;',
        )
        .replaceAll(
            "'",
            '&#039;',
        );
}

export function printReport(report) {
    const summary = (report.summary || [])
        .map(
            (item) => `
                <div class="summary">
                    <span>${escapeHtml(item.label)}</span>
                    <strong>${escapeHtml(item.value)}</strong>
                </div>
            `,
        )
        .join('');

    const details = (report.details || [])
        .map(
            (item) => `
                <div class="detail">
                    <span>${escapeHtml(item.label)}</span>
                    <strong>${escapeHtml(item.value)}</strong>
                </div>
            `,
        )
        .join('');

    const headers = report.columns
        .map(
            (column) =>
                `<th>${escapeHtml(column.label)}</th>`,
        )
        .join('');

    const rows = report.rows
        .map(
            (row) => `
                <tr>
                    ${report.columns
                .map(
                    (column) =>
                        `<td>${escapeHtml(
                            row[column.key],
                        )}</td>`,
                )
                .join('')}
                </tr>
            `,
        )
        .join('');

    const iframe = document.createElement('iframe');

    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';

    document.body.appendChild(iframe);

    const printDocument =
        iframe.contentDocument ||
        iframe.contentWindow.document;

    printDocument.open();

    printDocument.write(`
        <!doctype html>
        <html>
        <head>
            <title>${escapeHtml(report.title)}</title>

            <style>
                * {
                    box-sizing: border-box;
                }

                body {
                    margin: 0;
                    padding: 32px;

                    font-family:
                        Arial,
                        sans-serif;

                    color: #152026;
                    background: white;
                }

                header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;

                    gap: 24px;

                    padding-bottom: 20px;

                    border-bottom:
                        2px solid #152026;
                }

                h1 {
                    margin: 0 0 6px;

                    font-size: 25px;
                }

                .subtitle {
                    color: #607078;
                    font-size: 13px;
                }

                .generated {
                    text-align: right;

                    color: #607078;

                    font-size: 11px;
                }

                .brand {
                    margin-bottom: 5px;

                    font-size: 10px;
                    font-weight: 700;

                    letter-spacing: 1.2px;
                    text-transform: uppercase;
                }

                .summaries,
                .details {
                    display: grid;

                    grid-template-columns:
                        repeat(
                            4,
                            minmax(0, 1fr)
                        );

                    gap: 12px;

                    margin: 20px 0;
                }

                .summary,
                .detail {
                    padding: 12px;

                    border:
                        1px solid #d9e0e3;
                }

                .summary span,
                .detail span {
                    display: block;

                    margin-bottom: 5px;

                    color: #697980;

                    font-size: 9px;
                    letter-spacing: 0.8px;
                    text-transform: uppercase;
                }

                .summary strong,
                .detail strong {
                    font-size: 13px;
                }

                table {
                    width: 100%;

                    border-collapse:
                        collapse;

                    margin-top: 20px;

                    font-size: 10px;
                }

                th {
                    padding: 9px;

                    text-align: left;

                    border-bottom:
                        2px solid #152026;

                    font-size: 9px;

                    text-transform:
                        uppercase;
                }

                td {
                    padding: 9px;

                    vertical-align: top;

                    border-bottom:
                        1px solid #d9e0e3;
                }

                footer {
                    margin-top: 24px;

                    color: #74838a;

                    font-size: 9px;
                }

                @page {
                    size: A4 landscape;
                    margin: 14mm;
                }

                @media print {
                    body {
                        padding: 0;
                    }
                }
            </style>
        </head>

        <body>
            <header>
                <div>
                    <div class="brand">
                        Sentry Offshore
                    </div>

                    <h1>
                        ${escapeHtml(report.title)}
                    </h1>

                    <div class="subtitle">
                        ${escapeHtml(report.subtitle || '')}
                    </div>
                </div>

                <div class="generated">
                    Generated<br />
                    ${escapeHtml(
        formatDateTime(
            report.generatedAt,
        ),
    )}
                </div>
            </header>

            ${
        summary
            ? `<div class="summaries">${summary}</div>`
            : ''
    }

            ${
        details
            ? `<div class="details">${details}</div>`
            : ''
    }

            <table>
                <thead>
                    <tr>
                        ${headers}
                    </tr>
                </thead>

                <tbody>
                    ${
        rows ||
        `
                            <tr>
                                <td colspan="${Math.max(
            report.columns.length,
            1,
        )}">
                                    No records found.
                                </td>
                            </tr>
                        `
    }
                </tbody>
            </table>

            <footer>
                Generated from Sentry Offshore operational data.
            </footer>
        </body>
        </html>
    `);

    printDocument.close();

    iframe.onload = () => {
        const printWindow =
            iframe.contentWindow;

        printWindow.focus();
        printWindow.print();

        setTimeout(() => {
            iframe.remove();
        }, 1000);
    };
}