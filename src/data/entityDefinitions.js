const required = (label) => (value) => {
    if (
        value === undefined ||
        value === null ||
        String(value).trim() === ''
    ) {
        return `${label} is required.`;
    }

    return null;
};

const email = (value) => {
    if (!value) {
        return null;
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ? null
        : 'Enter a valid email address.';
};

const positiveInteger = (label, allowZero = true) => (value) => {
    if (value === '' || value === undefined || value === null) {
        return null;
    }

    const number = Number(value);

    if (
        !Number.isInteger(number) ||
        number < (allowZero ? 0 : 1)
    ) {
        return `${label} must be a valid whole number.`;
    }

    return null;
};

const requiredArray = (label) => (value) => {
    if (!Array.isArray(value) || value.length === 0) {
        return `${label} is required.`;
    }

    return null;
};

export const entityDefinitions = {
    people: {
        singular: 'Person',
        plural: 'People',
        icon: 'ti-users',

        steps: [
            {
                title: 'Identity',
                description:
                    'Core personnel and identification information.',

                fields: [
                    {
                        name: 'firstName',
                        label: 'First name',
                        type: 'text',
                        validate: required('First name'),
                    },
                    {
                        name: 'lastName',
                        label: 'Last name',
                        type: 'text',
                        validate: required('Last name'),
                    },
                    {
                        name: 'preferredName',
                        label: 'Preferred name',
                        type: 'text',
                    },
                    {
                        name: 'employeeNumber',
                        label: 'Crew / employee number',
                        type: 'text',
                        validate: required('Crew / employee number'),
                    },
                    {
                        name: 'dateOfBirth',
                        label: 'Date of birth',
                        type: 'date',
                    },
                    {
                        name: 'nationality',
                        label: 'Nationality',
                        type: 'text',
                    },
                    {
                        name: 'placeOfBirth',
                        label: 'Place of birth',
                        type: 'text',
                    },
                ],
            },

            {
                title: 'Employment',
                description:
                    'Role, employer and operational availability.',

                fields: [
                    {
                        name: 'role',
                        label: 'Primary role / rank',
                        type: 'text',
                        validate: required('Primary role / rank'),
                    },
                    {
                        name: 'department',
                        label: 'Department',
                        type: 'select',
                        options: [
                            { value: 'deck', label: 'Deck' },
                            { value: 'engine', label: 'Engineering' },
                            { value: 'marine', label: 'Marine' },
                            { value: 'offshore', label: 'Offshore' },
                            { value: 'technical', label: 'Technical' },
                            { value: 'client', label: 'Client / contractor' },
                            { value: 'other', label: 'Other' },
                        ],
                    },
                    {
                        name: 'employer',
                        label: 'Employer',
                        type: 'text',
                    },
                    {
                        name: 'employmentStartDate',
                        label: 'Employment start date',
                        type: 'date',
                    },
                    {
                        name: 'status',
                        label: 'Personnel status',
                        type: 'select',
                        defaultValue: 'active',
                        options: [
                            { value: 'active', label: 'Active' },
                            { value: 'leave', label: 'On leave' },
                            { value: 'inactive', label: 'Inactive' },
                        ],
                        validate: required('Personnel status'),
                    },
                ],
            },

            {
                title: 'Contact',
                description:
                    'Contact and emergency contact information.',

                fields: [
                    {
                        name: 'email',
                        label: 'Work email',
                        type: 'email',
                        validate: email,
                    },
                    {
                        name: 'phone',
                        label: 'Phone',
                        type: 'tel',
                    },
                    {
                        name: 'emergencyContactName',
                        label: 'Emergency contact',
                        type: 'text',
                    },
                    {
                        name: 'emergencyContactRelationship',
                        label: 'Relationship',
                        type: 'text',
                    },
                    {
                        name: 'emergencyContactPhone',
                        label: 'Emergency contact phone',
                        type: 'tel',
                    },
                ],
            },

            {
                title: 'Documents',
                description:
                    'Travel and seafarer document information.',

                fields: [
                    {
                        name: 'passportNumber',
                        label: 'Passport number',
                        type: 'text',
                    },
                    {
                        name: 'passportIssuingCountry',
                        label: 'Passport issuing country',
                        type: 'text',
                    },
                    {
                        name: 'passportExpiry',
                        label: 'Passport expiry',
                        type: 'date',
                    },
                    {
                        name: 'seamansBookNumber',
                        label: "Seaman's book number",
                        type: 'text',
                    },
                    {
                        name: 'seamansBookExpiry',
                        label: "Seaman's book expiry",
                        type: 'date',
                    },
                ],
            },

            {
                title: 'Readiness',
                description:
                    'Important medical and training expiry dates.',

                fields: [
                    {
                        name: 'medicalExpiry',
                        label: 'Offshore / seafarer medical expiry',
                        type: 'date',
                    },
                    {
                        name: 'gwoExpiry',
                        label: 'GWO / core training expiry',
                        type: 'date',
                    },
                    {
                        name: 'medicalProvider',
                        label: 'Medical provider / issuing authority',
                        type: 'text',
                    },
                    {
                        name: 'readinessStatus',
                        label: 'Operational readiness',
                        type: 'select',
                        defaultValue: 'ready',
                        options: [
                            { value: 'ready', label: 'Ready' },
                            { value: 'attention', label: 'Attention required' },
                            { value: 'not-ready', label: 'Not ready' },
                        ],
                    },
                    {
                        name: 'notes',
                        label: 'Internal notes',
                        type: 'textarea',
                    },
                ],
            },
        ],

        validate(values, context = {}) {
            const errors = {};
            const { data, record } = context;

            if (
                data?.people?.some(
                    (person) =>
                        person.employeeNumber &&
                        values.employeeNumber &&
                        person.employeeNumber
                            .trim()
                            .toLowerCase() ===
                        values.employeeNumber
                            .trim()
                            .toLowerCase() &&
                        person.id !== record?.id,
                )
            ) {
                errors.employeeNumber =
                    'This crew / employee number is already in use.';
            }

            return errors;
        },
    },

    vessels: {
        singular: 'Vessel',
        plural: 'Vessels',
        icon: 'ti-ship',

        steps: [
            {
                title: 'Identity',
                description:
                    'Core vessel identity and fleet information.',

                fields: [
                    {
                        name: 'name',
                        label: 'Vessel name',
                        type: 'text',
                        validate: required('Vessel name'),
                    },
                    {
                        name: 'fleetCode',
                        label: 'Internal fleet code',
                        type: 'text',
                    },
                    {
                        name: 'vesselType',
                        label: 'Vessel type',
                        type: 'select',
                        options: [
                            { value: 'ctv', label: 'CTV' },
                            { value: 'sov', label: 'SOV' },
                            { value: 'csov', label: 'CSOV' },
                            { value: 'workboat', label: 'Workboat' },
                            { value: 'daughter-craft', label: 'Daughter craft' },
                            { value: 'survey', label: 'Survey vessel' },
                            { value: 'other', label: 'Other' },
                        ],
                        validate: required('Vessel type'),
                    },
                    {
                        name: 'imo',
                        label: 'IMO number',
                        type: 'text',
                    },
                    {
                        name: 'mmsi',
                        label: 'MMSI',
                        type: 'text',
                    },
                    {
                        name: 'callSign',
                        label: 'Call sign',
                        type: 'text',
                    },
                ],
            },

            {
                title: 'Registry',
                description:
                    'Registry, ownership and operating information.',

                fields: [
                    {
                        name: 'flag',
                        label: 'Flag state',
                        type: 'text',
                    },
                    {
                        name: 'portOfRegistry',
                        label: 'Port of registry',
                        type: 'text',
                    },
                    {
                        name: 'officialNumber',
                        label: 'Official number',
                        type: 'text',
                    },
                    {
                        name: 'owner',
                        label: 'Owner',
                        type: 'text',
                    },
                    {
                        name: 'operator',
                        label: 'Operator',
                        type: 'text',
                    },
                    {
                        name: 'homePort',
                        label: 'Home port',
                        type: 'text',
                    },
                ],
            },

            {
                title: 'Specifications',
                description:
                    'Capacity and key vessel characteristics.',

                fields: [
                    {
                        name: 'yearBuilt',
                        label: 'Year built',
                        type: 'number',
                        min: 1900,
                    },
                    {
                        name: 'lengthMetres',
                        label: 'Length overall (m)',
                        type: 'number',
                        min: 0,
                    },
                    {
                        name: 'beamMetres',
                        label: 'Beam (m)',
                        type: 'number',
                        min: 0,
                    },
                    {
                        name: 'grossTonnage',
                        label: 'Gross tonnage',
                        type: 'number',
                        min: 0,
                    },
                    {
                        name: 'maxPob',
                        label: 'Maximum POB',
                        type: 'number',
                        min: 1,
                        validate:
                            positiveInteger('Maximum POB', false),
                    },
                ],
            },

            {
                title: 'Operations',
                description:
                    'Current operational assignment and status.',

                fields: [
                    {
                        name: 'status',
                        label: 'Operational status',
                        type: 'select',
                        defaultValue: 'active',
                        options: [
                            { value: 'active', label: 'Active' },
                            { value: 'standby', label: 'Standby' },
                            { value: 'maintenance', label: 'Maintenance' },
                            { value: 'inactive', label: 'Inactive' },
                        ],
                        validate: required('Operational status'),
                    },
                    {
                        name: 'currentProject',
                        label: 'Current project / wind farm',
                        type: 'text',
                    },
                    {
                        name: 'currentLocation',
                        label: 'Current location',
                        type: 'text',
                    },
                    {
                        name: 'masterName',
                        label: 'Current master',
                        type: 'text',
                    },
                ],
            },

            {
                title: 'Compliance',
                description:
                    'Key compliance dates and internal notes.',

                fields: [
                    {
                        name: 'codingCertificateExpiry',
                        label: 'Coding / statutory certificate expiry',
                        type: 'date',
                    },
                    {
                        name: 'insuranceExpiry',
                        label: 'Insurance expiry',
                        type: 'date',
                    },
                    {
                        name: 'radioCertificateExpiry',
                        label: 'Radio certificate expiry',
                        type: 'date',
                    },
                    {
                        name: 'nextInspectionDate',
                        label: 'Next inspection / survey',
                        type: 'date',
                    },
                    {
                        name: 'notes',
                        label: 'Internal notes',
                        type: 'textarea',
                    },
                ],
            },
        ],

        validate(values, context = {}) {
            const errors = {};
            const { data, record } = context;

            if (
                values.imo &&
                data?.vessels?.some(
                    (vessel) =>
                        vessel.imo &&
                        vessel.imo === values.imo &&
                        vessel.id !== record?.id,
                )
            ) {
                errors.imo =
                    'A vessel with this IMO number already exists.';
            }

            if (
                values.mmsi &&
                data?.vessels?.some(
                    (vessel) =>
                        vessel.mmsi &&
                        vessel.mmsi === values.mmsi &&
                        vessel.id !== record?.id,
                )
            ) {
                errors.mmsi =
                    'A vessel with this MMSI already exists.';
            }

            return errors;
        },
    },

    movements: {
        singular: 'Movement',
        plural: 'Movements',
        icon: 'ti-route',

        steps: [
            {
                title: 'Movement',
                description:
                    'Define the type of personnel movement.',

                fields: [
                    {
                        name: 'reference',
                        label: 'Movement reference',
                        type: 'text',
                    },
                    {
                        name: 'movementType',
                        label: 'Movement type',
                        type: 'select',
                        options: [
                            { value: 'embark', label: 'Embark' },
                            { value: 'disembark', label: 'Disembark' },
                            { value: 'transfer', label: 'Vessel transfer' },
                            { value: 'shore-transfer', label: 'Shore transfer' },
                        ],
                        validate: required('Movement type'),
                    },
                    {
                        name: 'status',
                        label: 'Status',
                        type: 'select',
                        defaultValue: 'completed',
                        options: [
                            { value: 'planned', label: 'Planned' },
                            { value: 'in-progress', label: 'In progress' },
                            { value: 'completed', label: 'Completed' },
                            { value: 'cancelled', label: 'Cancelled' },
                        ],
                        validate: required('Status'),
                    },
                ],
            },

            {
                title: 'Personnel',
                description:
                    'Select everyone included in this movement event.',

                fields: [
                    {
                        name: 'participantIds',
                        label: 'Personnel',
                        type: 'people-multi-select',
                        validate: requiredArray('At least one person'),
                    },
                ],
            },

            {
                title: 'Route',
                description:
                    'Record the source, destination and transfer method.',

                fields: [
                    {
                        name: 'fromVesselId',
                        label: 'From vessel',
                        type: 'vessel-select',
                        showWhen: (values) =>
                            values.movementType === 'disembark' ||
                            values.movementType === 'transfer',
                    },
                    {
                        name: 'toVesselId',
                        label: 'To vessel',
                        type: 'vessel-select',
                        showWhen: (values) =>
                            values.movementType === 'embark' ||
                            values.movementType === 'transfer',
                    },
                    {
                        name: 'fromLocation',
                        label: 'From location',
                        type: 'text',
                    },
                    {
                        name: 'toLocation',
                        label: 'To location',
                        type: 'text',
                    },
                    {
                        name: 'transferMethod',
                        label: 'Transfer method',
                        type: 'select',
                        options: [
                            { value: 'gangway', label: 'Gangway' },
                            { value: 'walk-to-work', label: 'Walk-to-work' },
                            { value: 'daughter-craft', label: 'Daughter craft' },
                            { value: 'personnel-basket', label: 'Personnel basket' },
                            { value: 'helicopter', label: 'Helicopter' },
                            { value: 'port', label: 'Port embarkation' },
                            { value: 'other', label: 'Other' },
                        ],
                    },
                ],
            },

            {
                title: 'Timing',
                description:
                    'Planned and actual movement timings.',

                fields: [
                    {
                        name: 'plannedAt',
                        label: 'Planned date & time',
                        type: 'datetime-local',
                    },
                    {
                        name: 'occurredAt',
                        label: 'Actual date & time',
                        type: 'datetime-local',
                        validate: (value, values) =>
                            values.status === 'completed' && !value
                                ? 'Actual date and time is required for completed movements.'
                                : null,
                    },
                    {
                        name: 'project',
                        label: 'Project / site',
                        type: 'text',
                    },
                    {
                        name: 'operationReference',
                        label: 'Operation / voyage reference',
                        type: 'text',
                    },
                ],
            },

            {
                title: 'Record',
                description:
                    'Operational context and authorisation.',

                fields: [
                    {
                        name: 'authorisedBy',
                        label: 'Authorised / confirmed by',
                        type: 'text',
                    },
                    {
                        name: 'reason',
                        label: 'Reason / purpose',
                        type: 'text',
                    },
                    {
                        name: 'checksComplete',
                        label: 'Operational checks complete',
                        type: 'checkbox',
                    },
                    {
                        name: 'notes',
                        label: 'Movement notes',
                        type: 'textarea',
                    },
                ],
            },
        ],

        validate(values) {
            const errors = {};

            if (
                values.movementType === 'embark' &&
                !values.toVesselId
            ) {
                errors.toVesselId =
                    'A destination vessel is required.';
            }

            if (
                values.movementType === 'disembark' &&
                !values.fromVesselId
            ) {
                errors.fromVesselId =
                    'A source vessel is required.';
            }

            if (values.movementType === 'transfer') {
                if (!values.fromVesselId) {
                    errors.fromVesselId =
                        'A source vessel is required.';
                }

                if (!values.toVesselId) {
                    errors.toVesselId =
                        'A destination vessel is required.';
                }

                if (
                    values.fromVesselId &&
                    values.toVesselId &&
                    values.fromVesselId === values.toVesselId
                ) {
                    errors.toVesselId =
                        'Source and destination vessels must be different.';
                }
            }

            if (
                values.plannedAt &&
                values.occurredAt &&
                new Date(values.occurredAt) <
                new Date(values.plannedAt) &&
                values.status === 'planned'
            ) {
                errors.occurredAt =
                    'A planned movement cannot have an actual time before its planned time.';
            }

            return errors;
        },
    },

    operations: {
        singular: 'Operation',
        plural: 'Operations',
        icon: 'ti-clipboard-check',

        steps: [
            {
                title: 'Operation',
                description:
                    'Choose the operational record type.',

                fields: [
                    {
                        name: 'operationType',
                        label: 'Operation type',
                        type: 'select',
                        options: [
                            {
                                value: 'muster',
                                label: 'Personnel muster',
                            },
                            {
                                value: 'daily-log',
                                label: 'Daily operational log',
                            },
                            {
                                value: 'personnel-transfer',
                                label: 'Personnel transfer operation',
                            },
                        ],
                        validate: required('Operation type'),
                    },
                    {
                        name: 'title',
                        label: 'Title / reference',
                        type: 'text',
                        validate: required('Title / reference'),
                    },
                    {
                        name: 'status',
                        label: 'Status',
                        type: 'select',
                        defaultValue: 'open',
                        options: [
                            { value: 'planned', label: 'Planned' },
                            { value: 'open', label: 'In progress' },
                            { value: 'completed', label: 'Completed' },
                            {
                                value: 'attention',
                                label: 'Attention required',
                            },
                            { value: 'cancelled', label: 'Cancelled' },
                        ],
                        validate: required('Status'),
                    },
                ],
            },

            {
                title: 'Context',
                description:
                    'Associate the operation with a vessel and location.',

                fields: [
                    {
                        name: 'vesselId',
                        label: 'Vessel',
                        type: 'vessel-select',
                        validate: required('Vessel'),
                    },
                    {
                        name: 'projectId',
                        label: 'Project / site',
                        type: 'project-select',
                    },
                    {
                        name: 'location',
                        label: 'Location',
                        type: 'text',
                    },
                    {
                        name: 'startAt',
                        label: 'Start date & time',
                        type: 'datetime-local',
                        validate:
                            required('Start date and time'),
                    },
                    {
                        name: 'endAt',
                        label: 'Completion date & time',
                        type: 'datetime-local',
                    },
                ],
            },

            {
                title: 'Muster',
                description:
                    'Capture personnel accountability and exceptions.',

                showWhen: (values) =>
                    values.operationType === 'muster',

                fields: [
                    {
                        name: 'accountedPersonIds',
                        label: 'Personnel accounted for',
                        type: 'muster-checklist',
                    },
                    {
                        name: 'musterReason',
                        label: 'Muster reason',
                        type: 'select',
                        options: [
                            {
                                value: 'routine',
                                label: 'Routine muster',
                            },
                            {
                                value: 'drill',
                                label: 'Drill',
                            },
                            {
                                value: 'emergency',
                                label: 'Emergency',
                            },
                            {
                                value: 'crew-change',
                                label: 'Crew change verification',
                            },
                        ],
                    },
                    {
                        name: 'exceptions',
                        label:
                            'Exceptions / unaccounted personnel',
                        type: 'textarea',
                    },
                    {
                        name: 'verifiedBy',
                        label: 'Verified by',
                        type: 'text',
                    },
                ],
            },

            {
                title: 'Daily log',
                description:
                    'Capture the vessel’s operational day.',

                showWhen: (values) =>
                    values.operationType === 'daily-log',

                fields: [
                    {
                        name: 'masterName',
                        label: 'Master / OIM',
                        type: 'text',
                    },
                    {
                        name: 'weatherSummary',
                        label: 'Weather',
                        type: 'text',
                    },
                    {
                        name: 'seaState',
                        label: 'Sea state',
                        type: 'text',
                    },
                    {
                        name: 'activities',
                        label: 'Operational activities',
                        type: 'textarea',
                    },
                    {
                        name: 'delays',
                        label: 'Delays / downtime',
                        type: 'textarea',
                    },
                    {
                        name: 'incidents',
                        label: 'Incidents / observations',
                        type: 'textarea',
                    },
                    {
                        name: 'handoverNotes',
                        label: 'Handover notes',
                        type: 'textarea',
                    },
                ],
            },

            {
                title: 'Transfer',
                description:
                    'Capture personnel transfer performance.',

                showWhen: (values) =>
                    values.operationType ===
                    'personnel-transfer',

                fields: [
                    {
                        name: 'participantIds',
                        label: 'Personnel involved',
                        type: 'people-multi-select',
                        validate:
                            requiredArray('At least one person'),
                    },
                    {
                        name: 'transferMethod',
                        label: 'Transfer method',
                        type: 'select',
                        options: [
                            {
                                value: 'gangway',
                                label: 'Gangway',
                            },
                            {
                                value: 'walk-to-work',
                                label: 'Walk-to-work',
                            },
                            {
                                value: 'daughter-craft',
                                label: 'Daughter craft',
                            },
                            {
                                value: 'personnel-basket',
                                label: 'Personnel basket',
                            },
                            {
                                value: 'helicopter',
                                label: 'Helicopter',
                            },
                            {
                                value: 'other',
                                label: 'Other',
                            },
                        ],
                    },
                    {
                        name: 'linkedMovementEventId',
                        label: 'Linked movement',
                        type: 'movement-select',
                    },
                    {
                        name: 'checksComplete',
                        label: 'Transfer checks complete',
                        type: 'checkbox',
                    },
                    {
                        name: 'abortReason',
                        label: 'Abort / exception reason',
                        type: 'textarea',
                    },
                ],
            },

            {
                title: 'Sign-off',
                description:
                    'Complete the operational record.',

                fields: [
                    {
                        name: 'notes',
                        label: 'General notes',
                        type: 'textarea',
                    },
                ],
            },
        ],

        validate(values, context = {}) {
            const errors = {};

            if (
                values.startAt &&
                values.endAt &&
                new Date(values.endAt) <
                new Date(values.startAt)
            ) {
                errors.endAt =
                    'Completion time cannot be before the start time.';
            }

            if (
                values.operationType === 'muster' &&
                values.status === 'completed' &&
                !context.record
            ) {
                errors.status =
                    'Create the muster first, then complete its frozen roster.';
            }

            if (
                values.operationType === 'muster' &&
                values.status === 'completed' &&
                context.record &&
                !values.verifiedBy?.trim()
            ) {
                errors.verifiedBy =
                    'Enter the person verifying this muster.';
            }

            if (
                values.operationType === 'muster' &&
                values.status === 'completed' &&
                context.record &&
                values.expectedPobSnapshot?.length !==
                values.accountedPersonIds?.length
            ) {
                errors.accountedPersonIds =
                    'Account for every person before completing the muster.';
            }

            if (
                values.operationType ===
                'personnel-transfer' &&
                values.status === 'completed' &&
                !values.linkedMovementEventId
            ) {
                errors.linkedMovementEventId =
                    'Link the completed movement before completing this operation.';
            }

            if (
                values.operationType ===
                'personnel-transfer' &&
                values.linkedMovementEventId &&
                !values.participantIds?.length
            ) {
                errors.participantIds =
                    'Select the personnel involved.';
            }

            return errors;
        },
    },

    reports: {
        singular: 'Report',
        plural: 'Reports',
        icon: 'ti-file-export',

        steps: [
            {
                title: 'Report',
                description:
                    'Choose the operational report you want to generate.',

                fields: [
                    {
                        name: 'reportType',
                        label: 'Report type',
                        type: 'select',
                        options: [
                            {
                                value: 'pob-snapshot',
                                label: 'POB snapshot',
                            },
                            {
                                value: 'crew-movement-log',
                                label: 'Crew movement log',
                            },
                            {
                                value: 'muster-report',
                                label: 'Muster report',
                            },
                            {
                                value: 'daily-operations',
                                label: 'Daily operations report',
                            },
                            {
                                value: 'crew-report',
                                label: 'Crew report',
                            },
                            {
                                value: 'vessel-report',
                                label: 'Vessel report',
                            },
                        ],
                        validate: required('Report type'),
                    },
                    {
                        name: 'title',
                        label: 'Report title',
                        type: 'text',
                    },
                ],
            },

            {
                title: 'Scope',
                description:
                    'Choose the data included in the report.',

                fields: [
                    {
                        name: 'vesselId',
                        label: 'Vessel',
                        type: 'vessel-select',
                    },
                    {
                        name: 'personId',
                        label: 'Person',
                        type: 'person-select',
                        showWhen: (values) =>
                            values.reportType ===
                            'crew-report',
                    },
                    {
                        name: 'dateFrom',
                        label: 'From',
                        type: 'date',
                    },
                    {
                        name: 'dateTo',
                        label: 'To',
                        type: 'date',
                    },
                ],
            },

            {
                title: 'Output',
                description:
                    'Choose export settings.',

                fields: [
                    {
                        name: 'format',
                        label: 'Format',
                        type: 'select',
                        defaultValue: 'pdf',
                        options: [
                            { value: 'pdf', label: 'PDF' },
                            { value: 'csv', label: 'CSV' },
                        ],
                        validate: required('Format'),
                    },
                    {
                        name: 'status',
                        label: 'Report status',
                        type: 'select',
                        defaultValue: 'generated',
                        options: [
                            { value: 'draft', label: 'Draft' },
                            {
                                value: 'generated',
                                label: 'Generated',
                            },
                        ],
                    },
                    {
                        name: 'notes',
                        label: 'Report notes',
                        type: 'textarea',
                    },
                ],
            },
        ],

        validate(values) {
            const errors = {};

            if (
                values.dateFrom &&
                values.dateTo &&
                values.dateFrom > values.dateTo
            ) {
                errors.dateTo =
                    'End date must be on or after the start date.';
            }

            if (
                values.reportType === 'crew-report' &&
                !values.personId
            ) {
                errors.personId =
                    'Select a person for a crew report.';
            }

            return errors;
        },
    },
};