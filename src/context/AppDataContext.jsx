import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';

import { supabase } from '../lib/supabase';
import { useOrganization } from './OrganizationContext';

const AppDataContext = createContext(null);

const emptyData = {
    people: [],
    vessels: [],
    projects: [],
    movements: [],
    operations: [],
    reports: [],

    currentAssignments: {},
    vesselPob: {},
};

function emptyToNull(value) {
    if (
        value === undefined ||
        value === null ||
        value === ''
    ) {
        return null;
    }

    return value;
}

function toIsoOrNull(value) {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date.toISOString();
}

function mapPerson(row) {
    const privateDetails =
        row.person_private_details?.[0] ??
        null;

    const documents =
        row.person_documents ?? [];

    const certificates =
        row.person_certificates ?? [];

    const medicals =
        row.person_medicals ?? [];

    const passport =
        documents.find(
            (item) =>
                item.document_type ===
                'passport',
        );

    const seamansBook =
        documents.find(
            (item) =>
                item.document_type ===
                'seamans_book',
        );

    const gwo =
        certificates.find(
            (item) =>
                item.certificate_type ===
                'GWO / core training',
        );

    const medical =
        medicals.find(
            (item) =>
                item.medical_type ===
                'Offshore / seafarer medical',
        );

    return {
        id: row.id,
        organizationId:
        row.organization_id,

        firstName:
        row.first_name,

        lastName:
        row.last_name,

        preferredName:
        row.preferred_name,

        employeeNumber:
        row.employee_number,

        dateOfBirth:
            privateDetails?.date_of_birth ??
            '',

        nationality:
            privateDetails?.nationality ??
            '',

        placeOfBirth:
            privateDetails?.place_of_birth ??
            '',

        role:
        row.role_title,

        department:
        row.department,

        employer:
        row.employer,

        employmentStartDate:
        row.employment_start_date,

        employmentEndDate:
        row.employment_end_date,

        email:
        row.work_email,

        phone:
        row.phone,

        emergencyContactName:
            privateDetails?.emergency_contact_name ??
            '',

        emergencyContactRelationship:
            privateDetails?.emergency_contact_relationship ??
            '',

        emergencyContactPhone:
            privateDetails?.emergency_contact_phone ??
            '',

        passportNumber:
            passport?.document_number ??
            '',

        passportIssuingCountry:
            passport?.issuing_country ??
            '',

        passportExpiry:
            passport?.expires_at ??
            '',

        seamansBookNumber:
            seamansBook?.document_number ??
            '',

        seamansBookExpiry:
            seamansBook?.expires_at ??
            '',

        medicalExpiry:
            medical?.expires_at ??
            '',

        medicalProvider:
            medical?.provider ??
            '',

        gwoExpiry:
            gwo?.expires_at ??
            '',

        status:
        row.status,

        readinessStatus:
        row.readiness,

        notes:
        row.notes,

        archivedAt:
        row.archived_at,

        createdAt:
        row.created_at,

        createdBy:
        row.created_by,

        updatedAt:
        row.updated_at,

        updatedBy:
        row.updated_by,

        privateDetails,
        documents,
        certificates,
        medicals,
    };
}

function mapProject(row) {
    return {
        id: row.id,
        organizationId: row.organization_id,
        name: row.name,
        clientName: row.client_name,
        siteName: row.site_name,
        status: row.status,
        startDate: row.start_date,
        endDate: row.end_date,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function mapVessel(row) {
    const certificates =
        row.vessel_certificates ?? [];

    const findCertificate =
        (type) =>
            certificates.find(
                (item) =>
                    item.certificate_type ===
                    type,
            );

    return {
        id: row.id,
        organizationId:
        row.organization_id,

        name:
        row.name,

        fleetCode:
        row.fleet_code,

        vesselType:
        row.vessel_type,

        imo:
        row.imo,

        mmsi:
        row.mmsi,

        callSign:
        row.call_sign,

        flag:
        row.flag_state,

        portOfRegistry:
        row.port_of_registry,

        officialNumber:
        row.official_number,

        owner:
        row.owner_name,

        operator:
        row.operator_name,

        homePort:
        row.home_port,

        yearBuilt:
        row.year_built,

        lengthMetres:
        row.length_metres,

        beamMetres:
        row.beam_metres,

        grossTonnage:
        row.gross_tonnage,

        maxPob:
        row.max_pob,

        status:
        row.status,

        currentProjectId:
        row.current_project_id,

        currentProject:
            row.current_project?.name ?? '',

        currentProjectName:
            row.current_project?.name ?? '',

        currentProjectSite:
            row.current_project?.site_name ?? '',

        currentLocation:
        row.current_location,

        masterName:
        row.master_name,

        codingCertificateExpiry:
            findCertificate(
                'Coding / statutory certificate',
            )?.expires_at ?? '',

        insuranceExpiry:
            findCertificate(
                'Insurance',
            )?.expires_at ?? '',

        radioCertificateExpiry:
            findCertificate(
                'Radio certificate',
            )?.expires_at ?? '',

        nextInspectionDate:
            findCertificate(
                'Inspection / survey',
            )?.expires_at ?? '',

        notes:
        row.notes,

        archivedAt:
        row.archived_at,

        createdAt:
        row.created_at,

        createdBy:
        row.created_by,

        updatedAt:
        row.updated_at,

        updatedBy:
        row.updated_by,

        certificates,
    };
}

function mapMovement(
    row,
    participantRows,
) {
    const participants =
        participantRows.filter(
            (participant) =>
                participant.movement_event_id ===
                row.id,
        );

    return {
        id: row.id,
        organizationId:
        row.organization_id,

        reference:
        row.reference,

        movementType:
            String(
                row.movement_type,
            ).replaceAll('_', '-'),

        status:
            String(row.status).replaceAll(
                '_',
                '-',
            ),

        participantIds:
            participants.map(
                (participant) =>
                    participant.person_id,
            ),

        participants,

        fromVesselId:
        row.from_vessel_id,

        toVesselId:
        row.to_vessel_id,

        fromLocation:
        row.from_location,

        toLocation:
        row.to_location,

        transferMethod:
            row.transfer_method
                ? String(
                    row.transfer_method,
                ).replaceAll('_', '-')
                : '',

        projectId:
        row.project_id,

        plannedAt:
        row.planned_at,

        occurredAt:
        row.occurred_at,

        operationReference:
        row.operation_reference,

        reason:
        row.reason,

        authorisedBy:
        row.authorised_by,

        checksComplete:
        row.checks_complete,

        notes:
        row.notes,

        voidReason:
        row.void_reason,

        voidedAt:
        row.voided_at,

        voidedBy:
        row.voided_by,

        createdAt:
        row.created_at,

        createdBy:
        row.created_by,

        updatedAt:
        row.updated_at,

        updatedBy:
        row.updated_by,
    };
}


function mapReport(row) {
    return {
        id: row.id,
        organizationId: row.organization_id,
        reportType: String(row.report_type || '').replaceAll('_', '-'),
        title: row.title || '',
        status: String(row.status || '').replaceAll('_', '-'),
        format: String(row.format || '').replaceAll('_', '-'),
        vesselId: row.vessel_id,
        personId: row.person_id,
        projectId: row.project_id,
        dateFrom: row.date_from,
        dateTo: row.date_to,
        parameters: row.parameters ?? {},
        snapshot: row.snapshot ?? {},
        generatedAt: row.generated_at,
        generatedBy: row.generated_by,
        storagePath: row.storage_path,
        errorMessage: row.error_message,
        notes: row.notes,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedBy: row.updated_by,
        updatedAt: row.updated_at,
    };
}

function mapOperation(row) {
    const muster =
        Array.isArray(row.musters)
            ? row.musters[0] ?? null
            : row.musters ?? null;

    const dailyLog =
        Array.isArray(row.daily_operation_logs)
            ? row.daily_operation_logs[0] ?? null
            : row.daily_operation_logs ?? null;

    const transfer =
        Array.isArray(row.personnel_transfer_operations)
            ? row.personnel_transfer_operations[0] ?? null
            : row.personnel_transfer_operations ?? null;

    const musterParticipants =
        muster?.muster_participants ?? [];

    const transferParticipants =
        transfer?.personnel_transfer_participants ?? [];

    return {
        id: row.id,
        organizationId: row.organization_id,

        operationType:
            String(row.operation_type).replaceAll('_', '-'),

        title: row.title,

        status:
            String(row.status).replaceAll('_', '-'),

        vesselId: row.vessel_id,
        projectId: row.project_id,
        project: row.current_project?.name ?? '',
        location: row.location,

        startAt: row.start_at,
        endAt: row.end_at,

        recordedByUserId: row.recorded_by_user_id,
        signedOffByUserId: row.signed_off_by_user_id,
        signedOffAt: row.signed_off_at,

        notes: row.notes,

        voidReason: row.void_reason,
        voidedAt: row.voided_at,
        voidedBy: row.voided_by,

        createdAt: row.created_at,
        updatedAt: row.updated_at,

        musterReason: muster?.muster_reason ?? '',
        expectedPob: muster?.expected_pob ?? 0,
        accountedFor: muster?.accounted_for ?? 0,
        exceptions: muster?.exceptions ?? '',
        verifiedBy: muster?.verified_by ?? '',
        expectedPobSnapshot:
            muster?.expected_pob_snapshot ?? [],

        accountedPersonIds:
            musterParticipants
                .filter(
                    (participant) =>
                        participant.accounted_for,
                )
                .map(
                    (participant) =>
                        participant.person_id,
                ),

        musterParticipants,

        masterName: dailyLog?.master_name ?? '',
        weatherSummary: dailyLog?.weather_summary ?? '',
        windSpeedKnots: dailyLog?.wind_speed_knots ?? '',
        windDirection: dailyLog?.wind_direction ?? '',
        seaState: dailyLog?.sea_state ?? '',
        visibility: dailyLog?.visibility ?? '',
        activities: dailyLog?.activities ?? '',
        delays: dailyLog?.delays ?? '',
        incidents: dailyLog?.incidents_observations ?? '',
        handoverNotes: dailyLog?.handover_notes ?? '',
        departureAt: dailyLog?.departure_at ?? '',
        arrivalAt: dailyLog?.arrival_at ?? '',

        participantIds:
            transferParticipants.map(
                (participant) =>
                    participant.person_id,
            ),

        transferParticipants,

        transferMethod:
            transfer?.transfer_method
                ? String(
                    transfer.transfer_method,
                ).replaceAll('_', '-')
                : '',

        plannedCount: transfer?.planned_count ?? 0,
        transferredCount:
            transfer?.transferred_count ?? 0,
        checksComplete:
            transfer?.checks_complete ?? false,
        abortReason: transfer?.abort_reason ?? '',

        linkedMovementEventId:
            transfer?.linked_movement_event_id ?? null,

        linkedMovementReference: '',
    };
}
function operationToRpcValues(
    values,
    organizationId,
) {
    return {
        p_organization_id:
        organizationId,

        p_operation_type:
            String(
                values.operationType,
            ).replaceAll('-', '_'),

        p_title:
            values.title?.trim() ||
            'Untitled operation',

        p_status:
            String(
                values.status ||
                'planned',
            ).replaceAll('-', '_'),

        p_vessel_id:
            emptyToNull(
                values.vesselId,
            ),

        p_project_id:
            emptyToNull(
                values.projectId,
            ),

        p_location:
            emptyToNull(
                values.location,
            ),

        p_start_at:
            toIsoOrNull(
                values.startAt,
            ) ||
            new Date().toISOString(),

        p_end_at:
            toIsoOrNull(
                values.endAt,
            ),

        p_notes:
            emptyToNull(
                values.notes,
            ),

        p_muster_reason:
            emptyToNull(
                values.musterReason,
            ),

        p_verified_by:
            emptyToNull(
                values.verifiedBy,
            ),

        p_exceptions:
            emptyToNull(
                values.exceptions,
            ),

        p_master_name:
            emptyToNull(
                values.masterName,
            ),

        p_weather_summary:
            emptyToNull(
                values.weatherSummary,
            ),

        p_wind_speed_knots:
            values.windSpeedKnots === '' ||
            values.windSpeedKnots === undefined ||
            values.windSpeedKnots === null
                ? null
                : Number(
                    values.windSpeedKnots,
                ),

        p_wind_direction:
            emptyToNull(
                values.windDirection,
            ),

        p_sea_state:
            emptyToNull(
                values.seaState,
            ),

        p_visibility:
            emptyToNull(
                values.visibility,
            ),

        p_activities:
            emptyToNull(
                values.activities,
            ),

        p_delays:
            emptyToNull(
                values.delays,
            ),

        p_incidents_observations:
            emptyToNull(
                values.incidentsObservations ??
                values.incidents,
            ),

        p_handover_notes:
            emptyToNull(
                values.handoverNotes,
            ),

        p_departure_at:
            toIsoOrNull(
                values.departureAt,
            ),

        p_arrival_at:
            toIsoOrNull(
                values.arrivalAt,
            ),

        p_transfer_method:
            values.transferMethod
                ? String(
                    values.transferMethod,
                ).replaceAll('-', '_')
                : null,

        p_participant_ids:
            Array.isArray(
                values.participantIds,
            )
                ? values.participantIds
                : [],

        p_checks_complete:
            Boolean(
                values.checksComplete,
            ),

        p_abort_reason:
            emptyToNull(
                values.abortReason,
            ),

        p_linked_movement_event_id:
            emptyToNull(
                values.linkedMovementEventId,
            ),
    };
}

function personToRow(
    values,
    organizationId,
) {
    return {
        organization_id:
        organizationId,

        first_name:
            values.firstName?.trim(),

        last_name:
            values.lastName?.trim(),

        preferred_name:
            values.preferredName?.trim() ||
            null,

        employee_number:
            values.employeeNumber?.trim() ||
            null,

        role_title:
            values.role?.trim(),

        department:
            values.department ||
            null,

        employer:
            values.employer?.trim() ||
            null,

        employment_start_date:
            values.employmentStartDate ||
            null,

        employment_end_date:
            values.employmentEndDate ||
            null,

        work_email:
            values.email?.trim() ||
            null,

        phone:
            values.phone?.trim() ||
            null,

        status:
            values.status ||
            'active',

        readiness:
            values.readinessStatus ||
            'ready',

        notes:
            values.notes?.trim() ||
            null,
    };
}

function vesselToRow(
    values,
    organizationId,
) {
    return {
        organization_id:
        organizationId,

        name:
            values.name?.trim(),

        fleet_code:
            values.fleetCode?.trim() ||
            null,

        vessel_type:
        values.vesselType,

        imo:
            values.imo?.trim() ||
            null,

        mmsi:
            values.mmsi?.trim() ||
            null,

        call_sign:
            values.callSign?.trim() ||
            null,

        flag_state:
            values.flag?.trim() ||
            null,

        port_of_registry:
            values.portOfRegistry?.trim() ||
            null,

        official_number:
            values.officialNumber?.trim() ||
            null,

        owner_name:
            values.owner?.trim() ||
            null,

        operator_name:
            values.operator?.trim() ||
            null,

        home_port:
            values.homePort?.trim() ||
            null,

        year_built:
            values.yearBuilt
                ? Number(
                    values.yearBuilt,
                )
                : null,

        length_metres:
            values.lengthMetres
                ? Number(
                    values.lengthMetres,
                )
                : null,

        beam_metres:
            values.beamMetres
                ? Number(
                    values.beamMetres,
                )
                : null,

        gross_tonnage:
            values.grossTonnage
                ? Number(
                    values.grossTonnage,
                )
                : null,

        max_pob:
            values.maxPob
                ? Number(
                    values.maxPob,
                )
                : null,

        status:
            values.status ||
            'active',

        current_project_id:
            values.currentProjectId ||
            null,

        current_location:
            values.currentLocation?.trim() ||
            null,

        master_name:
            values.masterName?.trim() ||
            null,

        notes:
            values.notes?.trim() ||
            null,
    };
}

function movementToRpcValues(
    values,
    organizationId,
) {
    return {
        p_organization_id:
        organizationId,

        p_reference:
            emptyToNull(
                values.reference,
            ),

        p_movement_type:
            String(
                values.movementType,
            ).replaceAll('-', '_'),

        p_status:
            String(
                values.status ||
                'planned',
            ).replaceAll('-', '_'),

        p_participant_ids:
            Array.isArray(
                values.participantIds,
            )
                ? values.participantIds
                : [],

        p_from_vessel_id:
            emptyToNull(
                values.fromVesselId,
            ),

        p_to_vessel_id:
            emptyToNull(
                values.toVesselId,
            ),

        p_from_location:
            emptyToNull(
                values.fromLocation,
            ),

        p_to_location:
            emptyToNull(
                values.toLocation,
            ),

        p_transfer_method:
            values.transferMethod
                ? String(
                    values.transferMethod,
                ).replaceAll('-', '_')
                : null,

        p_project_id:
            emptyToNull(
                values.projectId,
            ),

        p_planned_at:
            toIsoOrNull(
                values.plannedAt,
            ),

        p_occurred_at:
            toIsoOrNull(
                values.occurredAt,
            ),

        p_operation_reference:
            emptyToNull(
                values.operationReference,
            ),

        p_reason:
            emptyToNull(
                values.reason,
            ),

        p_authorised_by:
            emptyToNull(
                values.authorisedBy,
            ),

        p_checks_complete:
            Boolean(
                values.checksComplete,
            ),

        p_notes:
            emptyToNull(
                values.notes,
            ),
    };
}

export function AppDataProvider({
                                    children,
                                }) {
    const {
        organization,
        loading:
            organizationLoading,
    } = useOrganization();

    const [data, setData] =
        useState(emptyData);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState(null);

    const loadPeople =
        useCallback(async () => {
            if (!organization?.id) {
                return [];
            }

            const {
                data: rows,
                error: queryError,
            } = await supabase
                .from('people')
                .select(`
                    *,
                    person_private_details (*),
                    person_documents (*),
                    person_certificates (*),
                    person_medicals (*)
                `)
                .eq(
                    'organization_id',
                    organization.id,
                )
                .order(
                    'last_name',
                    {
                        ascending: true,
                    },
                );

            if (queryError) {
                throw queryError;
            }

            return rows.map(
                mapPerson,
            );
        }, [
            organization?.id,
        ]);

    const loadVessels =
        useCallback(async () => {
            if (!organization?.id) {
                return [];
            }

            const {
                data: rows,
                error: queryError,
            } = await supabase
                .from('vessels')
                .select(`
                    *,
                    current_project:projects (
                        id,
                        name,
                        client_name,
                        site_name
                    ),
                    vessel_certificates (*)
                `)
                .eq(
                    'organization_id',
                    organization.id,
                )
                .order(
                    'name',
                    {
                        ascending: true,
                    },
                );

            if (queryError) {
                throw queryError;
            }

            return rows.map(
                mapVessel,
            );
        }, [
            organization?.id,
        ]);

    const loadProjects =
        useCallback(async () => {
            if (!organization?.id) {
                return [];
            }

            const {
                data: rows,
                error: queryError,
            } = await supabase
                .from('projects')
                .select('*')
                .eq(
                    'organization_id',
                    organization.id,
                )
                .order(
                    'name',
                    {
                        ascending: true,
                    },
                );

            if (queryError) {
                throw queryError;
            }

            return rows.map(
                mapProject,
            );
        }, [
            organization?.id,
        ]);

    const loadMovements =
        useCallback(async () => {
            if (!organization?.id) {
                return [];
            }

            const [
                eventsResult,
                participantsResult,
            ] =
                await Promise.all([
                    supabase
                        .from(
                            'movement_events',
                        )
                        .select('*')
                        .eq(
                            'organization_id',
                            organization.id,
                        )
                        .order(
                            'occurred_at',
                            {
                                ascending:
                                    false,

                                nullsFirst:
                                    false,
                            },
                        ),

                    supabase
                        .from(
                            'movement_participants',
                        )
                        .select('*')
                        .eq(
                            'organization_id',
                            organization.id,
                        ),
                ]);

            if (
                eventsResult.error
            ) {
                throw eventsResult.error;
            }

            if (
                participantsResult.error
            ) {
                throw participantsResult.error;
            }

            return eventsResult.data.map(
                (movement) =>
                    mapMovement(
                        movement,
                        participantsResult.data,
                    ),
            );
        }, [
            organization?.id,
        ]);

    const loadOperations =
        useCallback(async () => {
            if (!organization?.id) {
                return [];
            }

            const {
                data: rows,
                error: queryError,
            } = await supabase
                .from('operations')
                .select(`
                    *,
                    current_project:projects (
                        id,
                        name,
                        site_name
                    ),
                    musters (
                        *,
                        muster_participants (*)
                    ),
                    daily_operation_logs (*),
                    personnel_transfer_operations (
                        *,
                        personnel_transfer_participants (*)
                    )
                `)
                .eq(
                    'organization_id',
                    organization.id,
                )
                .order(
                    'start_at',
                    {
                        ascending: false,
                    },
                );

            if (queryError) {
                throw queryError;
            }

            return rows.map(
                mapOperation,
            );
        }, [
            organization?.id,
        ]);


    const loadReports =
        useCallback(async () => {
            if (!organization?.id) {
                return [];
            }

            const {
                data: rows,
                error: queryError,
            } = await supabase
                .from('reports')
                .select('*')
                .eq(
                    'organization_id',
                    organization.id,
                )
                .order(
                    'generated_at',
                    {
                        ascending: false,
                        nullsFirst: false,
                    },
                )
                .order(
                    'created_at',
                    {
                        ascending: false,
                    },
                );

            if (queryError) {
                throw queryError;
            }

            return (rows || []).map(
                mapReport,
            );
        }, [
            organization?.id,
        ]);

    const loadAssignments =
        useCallback(async () => {
            if (!organization?.id) {
                return {};
            }

            const {
                data: rows,
                error: queryError,
            } = await supabase
                .from(
                    'current_person_assignments',
                )
                .select(`
                    person_id,
                    current_vessel_id,
                    last_movement_at,
                    movement_event_id
                `)
                .eq(
                    'organization_id',
                    organization.id,
                );

            if (queryError) {
                throw queryError;
            }

            return Object.fromEntries(
                rows.map(
                    (assignment) => [
                        assignment.person_id,
                        {
                            vesselId:
                            assignment.current_vessel_id,

                            movementId:
                            assignment.movement_event_id,

                            lastMovementAt:
                            assignment.last_movement_at,
                        },
                    ],
                ),
            );
        }, [
            organization?.id,
        ]);

    const loadVesselPob =
        useCallback(async () => {
            if (!organization?.id) {
                return {};
            }

            const {
                data: rows,
                error: queryError,
            } = await supabase
                .from(
                    'current_vessel_pob',
                )
                .select(`
                    vessel_id,
                    current_pob
                `)
                .eq(
                    'organization_id',
                    organization.id,
                );

            if (queryError) {
                throw queryError;
            }

            return Object.fromEntries(
                rows.map(
                    (row) => [
                        row.vessel_id,

                        Number(
                            row.current_pob,
                        ),
                    ],
                ),
            );
        }, [
            organization?.id,
        ]);

    const refreshData =
        useCallback(async () => {
            if (!organization?.id) {
                setData(
                    emptyData,
                );

                setLoading(false);

                return;
            }

            setLoading(true);
            setError(null);

            try {
                const [
                    people,
                    vessels,
                    projects,
                    movements,
                    operations,
                    reports,
                    currentAssignments,
                    vesselPob,
                ] =
                    await Promise.all([
                        loadPeople(),
                        loadVessels(),
                        loadProjects(),
                        loadMovements(),
                        loadOperations(),
                        loadReports(),
                        loadAssignments(),
                        loadVesselPob(),
                    ]);

                setData(
                    (current) => ({
                        ...current,

                        people,
                        vessels,
                        projects,
                        movements,
                        operations,
                        reports,
                        currentAssignments,
                        vesselPob,
                    }),
                );
            } catch (loadError) {
                console.error(
                    'Unable to load Sentry data:',
                    loadError,
                );

                setError(
                    loadError,
                );

                throw loadError;
            } finally {
                setLoading(false);
            }
        }, [
            organization?.id,
            loadPeople,
            loadVessels,
            loadProjects,
            loadMovements,
            loadOperations,
            loadReports,
            loadAssignments,
            loadVesselPob,
        ]);

    useEffect(() => {
        if (
            organizationLoading
        ) {
            return;
        }

        refreshData();
    }, [
        organizationLoading,
        refreshData,
    ]);

    // =====================================================
    // PEOPLE
    // =====================================================

    const createPerson =
        useCallback(
            async (values) => {
                if (!organization?.id) {
                    throw new Error(
                        'No active organization.',
                    );
                }

                const {
                    data:
                        createdPerson,

                    error:
                        personError,
                } = await supabase
                    .from('people')
                    .insert(
                        personToRow(
                            values,
                            organization.id,
                        ),
                    )
                    .select()
                    .single();

                if (personError) {
                    throw personError;
                }

                const privatePayload = {
                    organization_id:
                    organization.id,

                    person_id:
                    createdPerson.id,

                    date_of_birth:
                        values.dateOfBirth ||
                        null,

                    nationality:
                        values.nationality?.trim() ||
                        null,

                    place_of_birth:
                        values.placeOfBirth?.trim() ||
                        null,

                    emergency_contact_name:
                        values.emergencyContactName?.trim() ||
                        null,

                    emergency_contact_relationship:
                        values.emergencyContactRelationship?.trim() ||
                        null,

                    emergency_contact_phone:
                        values.emergencyContactPhone?.trim() ||
                        null,
                };

                const hasPrivateData =
                    Object.entries(
                        privatePayload,
                    ).some(
                        ([key, value]) =>
                            ![
                                'organization_id',
                                'person_id',
                            ].includes(
                                key,
                            ) &&
                            value,
                    );

                if (hasPrivateData) {
                    const {
                        error:
                            privateError,
                    } = await supabase
                        .from(
                            'person_private_details',
                        )
                        .insert(
                            privatePayload,
                        );

                    if (
                        privateError
                    ) {
                        throw privateError;
                    }
                }

                if (
                    values.passportNumber ||
                    values.passportExpiry
                ) {
                    const {
                        error:
                            documentError,
                    } = await supabase
                        .from(
                            'person_documents',
                        )
                        .insert({
                            organization_id:
                            organization.id,

                            person_id:
                            createdPerson.id,

                            document_type:
                                'passport',

                            document_number:
                                values.passportNumber ||
                                null,

                            issuing_country:
                                values.passportIssuingCountry ||
                                null,

                            expires_at:
                                values.passportExpiry ||
                                null,
                        });

                    if (
                        documentError
                    ) {
                        throw documentError;
                    }
                }

                if (
                    values.seamansBookNumber ||
                    values.seamansBookExpiry
                ) {
                    const {
                        error:
                            seamansBookError,
                    } = await supabase
                        .from(
                            'person_documents',
                        )
                        .insert({
                            organization_id:
                            organization.id,

                            person_id:
                            createdPerson.id,

                            document_type:
                                'seamans_book',

                            document_number:
                                values.seamansBookNumber ||
                                null,

                            expires_at:
                                values.seamansBookExpiry ||
                                null,
                        });

                    if (
                        seamansBookError
                    ) {
                        throw seamansBookError;
                    }
                }

                if (
                    values.gwoExpiry
                ) {
                    const {
                        error:
                            certificateError,
                    } = await supabase
                        .from(
                            'person_certificates',
                        )
                        .insert({
                            organization_id:
                            organization.id,

                            person_id:
                            createdPerson.id,

                            certificate_type:
                                'GWO / core training',

                            expires_at:
                            values.gwoExpiry,
                        });

                    if (
                        certificateError
                    ) {
                        throw certificateError;
                    }
                }

                if (
                    values.medicalExpiry
                ) {
                    const {
                        error:
                            medicalError,
                    } = await supabase
                        .from(
                            'person_medicals',
                        )
                        .insert({
                            organization_id:
                            organization.id,

                            person_id:
                            createdPerson.id,

                            medical_type:
                                'Offshore / seafarer medical',

                            provider:
                                values.medicalProvider ||
                                null,

                            expires_at:
                            values.medicalExpiry,

                            fitness_status:
                                'fit',
                        });

                    if (
                        medicalError
                    ) {
                        throw medicalError;
                    }
                }

                await refreshData();

                return createdPerson;
            },
            [
                organization?.id,
                refreshData,
            ],
        );

    const updatePerson =
        useCallback(
            async (
                id,
                values,
            ) => {
                if (!organization?.id) {
                    throw new Error(
                        'No active organization.',
                    );
                }

                const organizationId =
                    organization.id;

                const {
                    error:
                        personError,
                } = await supabase
                    .from('people')
                    .update(
                        personToRow(
                            values,
                            organizationId,
                        ),
                    )
                    .eq(
                        'id',
                        id,
                    )
                    .eq(
                        'organization_id',
                        organizationId,
                    );

                if (
                    personError
                ) {
                    throw personError;
                }

                const privateDetails = {
                    organization_id:
                    organizationId,

                    person_id:
                    id,

                    date_of_birth:
                        values.dateOfBirth ||
                        null,

                    nationality:
                        values.nationality?.trim() ||
                        null,

                    place_of_birth:
                        values.placeOfBirth?.trim() ||
                        null,

                    emergency_contact_name:
                        values.emergencyContactName?.trim() ||
                        null,

                    emergency_contact_relationship:
                        values.emergencyContactRelationship?.trim() ||
                        null,

                    emergency_contact_phone:
                        values.emergencyContactPhone?.trim() ||
                        null,
                };

                const {
                    error:
                        privateError,
                } = await supabase
                    .from(
                        'person_private_details',
                    )
                    .upsert(
                        privateDetails,
                        {
                            onConflict:
                                'organization_id,person_id',
                        },
                    );

                if (
                    privateError
                ) {
                    throw privateError;
                }

                const {
                    data:
                        existingPassport,

                    error:
                        passportLookupError,
                } = await supabase
                    .from(
                        'person_documents',
                    )
                    .select(
                        'id',
                    )
                    .eq(
                        'organization_id',
                        organizationId,
                    )
                    .eq(
                        'person_id',
                        id,
                    )
                    .eq(
                        'document_type',
                        'passport',
                    )
                    .maybeSingle();

                if (
                    passportLookupError
                ) {
                    throw passportLookupError;
                }

                const passportPayload = {
                    organization_id:
                    organizationId,

                    person_id:
                    id,

                    document_type:
                        'passport',

                    document_number:
                        values.passportNumber?.trim() ||
                        null,

                    issuing_country:
                        values.passportIssuingCountry?.trim() ||
                        null,

                    expires_at:
                        values.passportExpiry ||
                        null,
                };

                if (
                    existingPassport
                ) {
                    const {
                        error:
                            passportUpdateError,
                    } = await supabase
                        .from(
                            'person_documents',
                        )
                        .update(
                            passportPayload,
                        )
                        .eq(
                            'id',
                            existingPassport.id,
                        );

                    if (
                        passportUpdateError
                    ) {
                        throw passportUpdateError;
                    }
                } else if (
                    values.passportNumber ||
                    values.passportExpiry ||
                    values.passportIssuingCountry
                ) {
                    const {
                        error:
                            passportInsertError,
                    } = await supabase
                        .from(
                            'person_documents',
                        )
                        .insert(
                            passportPayload,
                        );

                    if (
                        passportInsertError
                    ) {
                        throw passportInsertError;
                    }
                }

                const {
                    data:
                        existingSeamansBook,

                    error:
                        seamansLookupError,
                } = await supabase
                    .from(
                        'person_documents',
                    )
                    .select(
                        'id',
                    )
                    .eq(
                        'organization_id',
                        organizationId,
                    )
                    .eq(
                        'person_id',
                        id,
                    )
                    .eq(
                        'document_type',
                        'seamans_book',
                    )
                    .maybeSingle();

                if (
                    seamansLookupError
                ) {
                    throw seamansLookupError;
                }

                const seamansBookPayload = {
                    organization_id:
                    organizationId,

                    person_id:
                    id,

                    document_type:
                        'seamans_book',

                    document_number:
                        values.seamansBookNumber?.trim() ||
                        null,

                    expires_at:
                        values.seamansBookExpiry ||
                        null,
                };

                if (
                    existingSeamansBook
                ) {
                    const {
                        error:
                            seamansUpdateError,
                    } = await supabase
                        .from(
                            'person_documents',
                        )
                        .update(
                            seamansBookPayload,
                        )
                        .eq(
                            'id',
                            existingSeamansBook.id,
                        );

                    if (
                        seamansUpdateError
                    ) {
                        throw seamansUpdateError;
                    }
                } else if (
                    values.seamansBookNumber ||
                    values.seamansBookExpiry
                ) {
                    const {
                        error:
                            seamansInsertError,
                    } = await supabase
                        .from(
                            'person_documents',
                        )
                        .insert(
                            seamansBookPayload,
                        );

                    if (
                        seamansInsertError
                    ) {
                        throw seamansInsertError;
                    }
                }

                const {
                    data:
                        existingGwo,

                    error:
                        gwoLookupError,
                } = await supabase
                    .from(
                        'person_certificates',
                    )
                    .select(
                        'id',
                    )
                    .eq(
                        'organization_id',
                        organizationId,
                    )
                    .eq(
                        'person_id',
                        id,
                    )
                    .eq(
                        'certificate_type',
                        'GWO / core training',
                    )
                    .maybeSingle();

                if (
                    gwoLookupError
                ) {
                    throw gwoLookupError;
                }

                const gwoPayload = {
                    organization_id:
                    organizationId,

                    person_id:
                    id,

                    certificate_type:
                        'GWO / core training',

                    expires_at:
                        values.gwoExpiry ||
                        null,
                };

                if (
                    existingGwo
                ) {
                    const {
                        error:
                            gwoUpdateError,
                    } = await supabase
                        .from(
                            'person_certificates',
                        )
                        .update(
                            gwoPayload,
                        )
                        .eq(
                            'id',
                            existingGwo.id,
                        );

                    if (
                        gwoUpdateError
                    ) {
                        throw gwoUpdateError;
                    }
                } else if (
                    values.gwoExpiry
                ) {
                    const {
                        error:
                            gwoInsertError,
                    } = await supabase
                        .from(
                            'person_certificates',
                        )
                        .insert(
                            gwoPayload,
                        );

                    if (
                        gwoInsertError
                    ) {
                        throw gwoInsertError;
                    }
                }

                const {
                    data:
                        existingMedical,

                    error:
                        medicalLookupError,
                } = await supabase
                    .from(
                        'person_medicals',
                    )
                    .select(
                        'id',
                    )
                    .eq(
                        'organization_id',
                        organizationId,
                    )
                    .eq(
                        'person_id',
                        id,
                    )
                    .eq(
                        'medical_type',
                        'Offshore / seafarer medical',
                    )
                    .maybeSingle();

                if (
                    medicalLookupError
                ) {
                    throw medicalLookupError;
                }

                const medicalPayload = {
                    organization_id:
                    organizationId,

                    person_id:
                    id,

                    medical_type:
                        'Offshore / seafarer medical',

                    provider:
                        values.medicalProvider?.trim() ||
                        null,

                    expires_at:
                        values.medicalExpiry ||
                        null,

                    fitness_status:
                        'fit',
                };

                if (
                    existingMedical
                ) {
                    const {
                        error:
                            medicalUpdateError,
                    } = await supabase
                        .from(
                            'person_medicals',
                        )
                        .update(
                            medicalPayload,
                        )
                        .eq(
                            'id',
                            existingMedical.id,
                        );

                    if (
                        medicalUpdateError
                    ) {
                        throw medicalUpdateError;
                    }
                } else if (
                    values.medicalExpiry ||
                    values.medicalProvider
                ) {
                    const {
                        error:
                            medicalInsertError,
                    } = await supabase
                        .from(
                            'person_medicals',
                        )
                        .insert(
                            medicalPayload,
                        );

                    if (
                        medicalInsertError
                    ) {
                        throw medicalInsertError;
                    }
                }

                await refreshData();
            },
            [
                organization?.id,
                refreshData,
            ],
        );

    const resolveProjectId =
        useCallback(
            async (
                values,
            ) => {
                if (!organization?.id) {
                    throw new Error(
                        'No active organization.',
                    );
                }

                if (
                    values.currentProjectId
                ) {
                    return values.currentProjectId;
                }

                const projectName =
                    values.currentProject?.trim();

                if (
                    !projectName
                ) {
                    return null;
                }

                const {
                    data:
                        existingProject,

                    error:
                        lookupError,
                } = await supabase
                    .from(
                        'projects',
                    )
                    .select(
                        'id',
                    )
                    .eq(
                        'organization_id',
                        organization.id,
                    )
                    .ilike(
                        'name',
                        projectName,
                    )
                    .limit(
                        1,
                    )
                    .maybeSingle();

                if (
                    lookupError
                ) {
                    throw lookupError;
                }

                if (
                    existingProject?.id
                ) {
                    return existingProject.id;
                }

                const {
                    data:
                        createdProject,

                    error:
                        createError,
                } = await supabase
                    .from(
                        'projects',
                    )
                    .insert({
                        organization_id:
                        organization.id,

                        name:
                        projectName,

                        site_name:
                        projectName,

                        status:
                            'active',
                    })
                    .select(
                        'id',
                    )
                    .single();

                if (
                    createError
                ) {
                    throw createError;
                }

                return createdProject.id;
            },
            [
                organization?.id,
            ],
        );

    // =====================================================
    // VESSELS
    // =====================================================

    const createVessel =
        useCallback(
            async (
                values,
            ) => {
                if (!organization?.id) {
                    throw new Error(
                        'No active organization.',
                    );
                }

                const currentProjectId =
                    await resolveProjectId(
                        values,
                    );

                const vesselValues = {
                    ...values,
                    currentProjectId,
                };

                const {
                    data:
                        createdVessel,

                    error:
                        vesselError,
                } = await supabase
                    .from(
                        'vessels',
                    )
                    .insert(
                        vesselToRow(
                            vesselValues,
                            organization.id,
                        ),
                    )
                    .select()
                    .single();

                if (
                    vesselError
                ) {
                    throw vesselError;
                }

                const certificates =
                    [
                        {
                            type:
                                'Coding / statutory certificate',

                            expiry:
                            values.codingCertificateExpiry,
                        },
                        {
                            type:
                                'Insurance',

                            expiry:
                            values.insuranceExpiry,
                        },
                        {
                            type:
                                'Radio certificate',

                            expiry:
                            values.radioCertificateExpiry,
                        },
                        {
                            type:
                                'Inspection / survey',

                            expiry:
                            values.nextInspectionDate,
                        },
                    ].filter(
                        (item) =>
                            item.expiry,
                    );

                if (
                    certificates.length >
                    0
                ) {
                    const {
                        error:
                            certificateError,
                    } = await supabase
                        .from(
                            'vessel_certificates',
                        )
                        .insert(
                            certificates.map(
                                (
                                    certificate,
                                ) => ({
                                    organization_id:
                                    organization.id,

                                    vessel_id:
                                    createdVessel.id,

                                    certificate_type:
                                    certificate.type,

                                    expires_at:
                                    certificate.expiry,
                                }),
                            ),
                        );

                    if (
                        certificateError
                    ) {
                        throw certificateError;
                    }
                }

                await refreshData();

                return createdVessel;
            },
            [
                organization?.id,
                refreshData,
                resolveProjectId,
            ],
        );

    const updateVessel =
        useCallback(
            async (
                id,
                values,
            ) => {
                if (!organization?.id) {
                    throw new Error(
                        'No active organization.',
                    );
                }

                const organizationId =
                    organization.id;

                const currentProjectId =
                    await resolveProjectId(
                        values,
                    );

                const vesselValues = {
                    ...values,
                    currentProjectId,
                };

                const {
                    error:
                        vesselError,
                } = await supabase
                    .from(
                        'vessels',
                    )
                    .update(
                        vesselToRow(
                            vesselValues,
                            organizationId,
                        ),
                    )
                    .eq(
                        'id',
                        id,
                    )
                    .eq(
                        'organization_id',
                        organizationId,
                    );

                if (
                    vesselError
                ) {
                    throw vesselError;
                }

                const certificates = [
                    {
                        type:
                            'Coding / statutory certificate',

                        expiry:
                        values.codingCertificateExpiry,
                    },
                    {
                        type:
                            'Insurance',

                        expiry:
                        values.insuranceExpiry,
                    },
                    {
                        type:
                            'Radio certificate',

                        expiry:
                        values.radioCertificateExpiry,
                    },
                    {
                        type:
                            'Inspection / survey',

                        expiry:
                        values.nextInspectionDate,
                    },
                ];

                for (
                    const certificate
                    of certificates
                    ) {
                    const {
                        data:
                            existingCertificate,

                        error:
                            lookupError,
                    } = await supabase
                        .from(
                            'vessel_certificates',
                        )
                        .select(
                            'id',
                        )
                        .eq(
                            'organization_id',
                            organizationId,
                        )
                        .eq(
                            'vessel_id',
                            id,
                        )
                        .eq(
                            'certificate_type',
                            certificate.type,
                        )
                        .maybeSingle();

                    if (
                        lookupError
                    ) {
                        throw lookupError;
                    }

                    if (
                        existingCertificate
                    ) {
                        const {
                            error:
                                updateError,
                        } = await supabase
                            .from(
                                'vessel_certificates',
                            )
                            .update({
                                expires_at:
                                    certificate.expiry ||
                                    null,
                            })
                            .eq(
                                'id',
                                existingCertificate.id,
                            );

                        if (
                            updateError
                        ) {
                            throw updateError;
                        }
                    } else if (
                        certificate.expiry
                    ) {
                        const {
                            error:
                                insertError,
                        } = await supabase
                            .from(
                                'vessel_certificates',
                            )
                            .insert({
                                organization_id:
                                organizationId,

                                vessel_id:
                                id,

                                certificate_type:
                                certificate.type,

                                expires_at:
                                certificate.expiry,
                            });

                        if (
                            insertError
                        ) {
                            throw insertError;
                        }
                    }
                }

                await refreshData();
            },
            [
                organization?.id,
                refreshData,
                resolveProjectId,
            ],
        );

    // =====================================================
    // MOVEMENTS
    // =====================================================

    const createMovement =
        useCallback(
            async (
                values,
            ) => {
                if (!organization?.id) {
                    throw new Error(
                        'No active organization.',
                    );
                }

                const payload =
                    movementToRpcValues(
                        values,
                        organization.id,
                    );

                const {
                    data:
                        movementId,

                    error:
                        movementError,
                } = await supabase.rpc(
                    'create_movement',
                    payload,
                );

                if (
                    movementError
                ) {
                    throw movementError;
                }

                await refreshData();

                return movementId;
            },
            [
                organization?.id,
                refreshData,
            ],
        );

    const updateMovement =
        useCallback(
            async (
                id,
                values,
            ) => {
                if (!organization?.id) {
                    throw new Error(
                        'No active organization.',
                    );
                }

                const payload = {
                    p_movement_id:
                    id,

                    ...movementToRpcValues(
                        values,
                        organization.id,
                    ),
                };

                const {
                    error:
                        movementError,
                } = await supabase.rpc(
                    'update_movement',
                    payload,
                );

                if (
                    movementError
                ) {
                    throw movementError;
                }

                await refreshData();
            },
            [
                organization?.id,
                refreshData,
            ],
        );

    const voidMovement =
        useCallback(
            async (
                id,
                reason,
            ) => {
                if (!organization?.id) {
                    throw new Error(
                        'No active organization.',
                    );
                }

                const {
                    error:
                        movementError,
                } = await supabase.rpc(
                    'void_movement',
                    {
                        p_movement_id:
                        id,

                        p_organization_id:
                        organization.id,

                        p_reason:
                        reason,
                    },
                );

                if (
                    movementError
                ) {
                    throw movementError;
                }

                await refreshData();
            },
            [
                organization?.id,
                refreshData,
            ],
        );

    // =====================================================
    // OPERATIONS
    // =====================================================

    const createOperation =
        useCallback(
            async (
                values,
            ) => {
                if (!organization?.id) {
                    throw new Error(
                        'No active organization.',
                    );
                }

                const payload =
                    operationToRpcValues(
                        values,
                        organization.id,
                    );

                const {
                    data:
                        operationId,

                    error:
                        operationError,
                } = await supabase.rpc(
                    'create_operation',
                    payload,
                );

                if (
                    operationError
                ) {
                    throw operationError;
                }

                await refreshData();

                return operationId;
            },
            [
                organization?.id,
                refreshData,
            ],
        );

    const updateOperation =
        useCallback(
            async (
                id,
                values,
            ) => {
                if (!organization?.id) {
                    throw new Error(
                        'No active organization.',
                    );
                }

                const commonPayload =
                    operationToRpcValues(
                        values,
                        organization.id,
                    );

                const payload = {
                    p_operation_id:
                    id,

                    p_organization_id:
                    organization.id,

                    p_title:
                    commonPayload.p_title,

                    p_status:
                    commonPayload.p_status,

                    p_vessel_id:
                    commonPayload.p_vessel_id,

                    p_project_id:
                    commonPayload.p_project_id,

                    p_location:
                    commonPayload.p_location,

                    p_start_at:
                    commonPayload.p_start_at,

                    p_end_at:
                    commonPayload.p_end_at,

                    p_notes:
                    commonPayload.p_notes,

                    p_muster_reason:
                    commonPayload.p_muster_reason,

                    p_verified_by:
                    commonPayload.p_verified_by,

                    p_exceptions:
                    commonPayload.p_exceptions,

                    p_accounted_person_ids:
                        Array.isArray(
                            values.accountedPersonIds,
                        )
                            ? values.accountedPersonIds
                            : [],

                    p_master_name:
                    commonPayload.p_master_name,

                    p_weather_summary:
                    commonPayload.p_weather_summary,

                    p_wind_speed_knots:
                    commonPayload.p_wind_speed_knots,

                    p_wind_direction:
                    commonPayload.p_wind_direction,

                    p_sea_state:
                    commonPayload.p_sea_state,

                    p_visibility:
                    commonPayload.p_visibility,

                    p_activities:
                    commonPayload.p_activities,

                    p_delays:
                    commonPayload.p_delays,

                    p_incidents_observations:
                    commonPayload.p_incidents_observations,

                    p_handover_notes:
                    commonPayload.p_handover_notes,

                    p_departure_at:
                    commonPayload.p_departure_at,

                    p_arrival_at:
                    commonPayload.p_arrival_at,

                    p_transfer_method:
                    commonPayload.p_transfer_method,

                    p_participant_ids:
                    commonPayload.p_participant_ids,

                    p_checks_complete:
                    commonPayload.p_checks_complete,

                    p_abort_reason:
                    commonPayload.p_abort_reason,

                    p_linked_movement_event_id:
                    commonPayload.p_linked_movement_event_id,
                };

                const {
                    error:
                        operationError,
                } = await supabase.rpc(
                    'update_operation',
                    payload,
                );

                if (
                    operationError
                ) {
                    throw operationError;
                }

                await refreshData();
            },
            [
                organization?.id,
                refreshData,
            ],
        );

    const voidOperation =
        useCallback(
            async (
                id,
                reason,
            ) => {
                if (!organization?.id) {
                    throw new Error(
                        'No active organization.',
                    );
                }

                const {
                    error:
                        operationError,
                } = await supabase.rpc(
                    'void_operation',
                    {
                        p_operation_id:
                        id,

                        p_organization_id:
                        organization.id,

                        p_reason:
                        reason,
                    },
                );

                if (
                    operationError
                ) {
                    throw operationError;
                }

                await refreshData();
            },
            [
                organization?.id,
                refreshData,
            ],
        );

    // =====================================================
    // DELETE
    // =====================================================

    const deletePerson =
        useCallback(
            async (
                id,
            ) => {
                if (!organization?.id) {
                    return;
                }

                const {
                    error:
                        deleteError,
                } = await supabase
                    .from(
                        'people',
                    )
                    .delete()
                    .eq(
                        'id',
                        id,
                    )
                    .eq(
                        'organization_id',
                        organization.id,
                    );

                if (
                    deleteError
                ) {
                    throw deleteError;
                }

                await refreshData();
            },
            [
                organization?.id,
                refreshData,
            ],
        );

    const deleteVessel =
        useCallback(
            async (
                id,
            ) => {
                if (!organization?.id) {
                    return;
                }

                const {
                    error:
                        deleteError,
                } = await supabase
                    .from(
                        'vessels',
                    )
                    .delete()
                    .eq(
                        'id',
                        id,
                    )
                    .eq(
                        'organization_id',
                        organization.id,
                    );

                if (
                    deleteError
                ) {
                    throw deleteError;
                }

                await refreshData();
            },
            [
                organization?.id,
                refreshData,
            ],
        );

    // =====================================================
    // GENERIC UI ADAPTER
    // =====================================================

    const createRecord =
        useCallback(
            async (
                entity,
                values,
            ) => {
                switch (
                    entity
                    ) {
                    case 'people':
                        return createPerson(
                            values,
                        );

                    case 'vessels':
                        return createVessel(
                            values,
                        );

                    case 'movements':
                        return createMovement(
                            values,
                        );

                    case 'operations':
                        return createOperation(
                            values,
                        );

                    default:
                        throw new Error(
                            `${entity} has not yet been connected to Supabase.`,
                        );
                }
            },
            [
                createPerson,
                createVessel,
                createMovement,
                createOperation,
            ],
        );

    const updateRecord =
        useCallback(
            async (
                entity,
                id,
                values,
            ) => {
                switch (
                    entity
                    ) {
                    case 'people':
                        return updatePerson(
                            id,
                            values,
                        );

                    case 'vessels':
                        return updateVessel(
                            id,
                            values,
                        );

                    case 'movements':
                        return updateMovement(
                            id,
                            values,
                        );

                    case 'operations':
                        return updateOperation(
                            id,
                            values,
                        );

                    default:
                        throw new Error(
                            `${entity} has not yet been connected to Supabase.`,
                        );
                }
            },
            [
                updatePerson,
                updateVessel,
                updateMovement,
                updateOperation,
            ],
        );

    const deleteRecord =
        useCallback(
            async (
                entity,
                id,
            ) => {
                switch (
                    entity
                    ) {
                    case 'people':
                        return deletePerson(
                            id,
                        );

                    case 'vessels':
                        return deleteVessel(
                            id,
                        );

                    case 'movements':
                        throw new Error(
                            'Recorded movements should be voided rather than permanently deleted.',
                        );

                    case 'operations':
                        throw new Error(
                            'Recorded operations should be voided rather than permanently deleted.',
                        );

                    default:
                        throw new Error(
                            `${entity} has not yet been connected to Supabase.`,
                        );
                }
            },
            [
                deletePerson,
                deleteVessel,
            ],
        );


    const createReport =
        useCallback(
            async ({
                       reportType,
                       title,
                       format = 'pdf',
                       vesselId = null,
                       personId = null,
                       projectId = null,
                       dateFrom = null,
                       dateTo = null,
                       parameters = {},
                       snapshot = {},
                       notes = null,
                   }) => {
                if (!organization?.id) {
                    throw new Error(
                        'No active organization.',
                    );
                }

                const {
                    data: authData,
                    error: authError,
                } = await supabase.auth.getUser();

                if (authError) {
                    throw authError;
                }

                const userId =
                    authData?.user?.id ?? null;

                const snapshotValue =
                    JSON.parse(
                        JSON.stringify(
                            snapshot || {},
                        ),
                    );

                const generatedAt =
                    snapshotValue.generatedAt ||
                    new Date().toISOString();

                const {
                    data: createdRow,
                    error: insertError,
                } = await supabase
                    .from('reports')
                    .insert({
                        organization_id:
                        organization.id,

                        report_type:
                            String(
                                reportType,
                            ).replaceAll(
                                '-',
                                '_',
                            ),

                        title:
                            title?.trim() ||
                            snapshotValue.title ||
                            'Generated report',

                        status:
                            'generated',

                        format:
                            String(
                                format ||
                                'pdf',
                            ).replaceAll(
                                '-',
                                '_',
                            ),

                        vessel_id:
                            emptyToNull(
                                vesselId,
                            ),

                        person_id:
                            emptyToNull(
                                personId,
                            ),

                        project_id:
                            emptyToNull(
                                projectId,
                            ),

                        date_from:
                            dateFrom
                                ? toIsoOrNull(
                                    `${dateFrom}T00:00:00`,
                                )
                                : null,

                        date_to:
                            dateTo
                                ? toIsoOrNull(
                                    `${dateTo}T23:59:59.999`,
                                )
                                : null,

                        parameters:
                            parameters || {},

                        snapshot:
                            snapshotValue,

                        generated_at:
                            generatedAt,

                        generated_by:
                            userId,

                        notes:
                            notes?.trim() ||
                            null,

                        created_by:
                            userId,

                        updated_by:
                            userId,
                    })
                    .select('*')
                    .single();

                if (insertError) {
                    throw insertError;
                }

                const createdReport =
                    mapReport(
                        createdRow,
                    );

                setData(
                    (current) => ({
                        ...current,
                        reports: [
                            createdReport,
                            ...(current.reports || []).filter(
                                (report) =>
                                    report.id !==
                                    createdReport.id,
                            ),
                        ],
                    }),
                );

                return createdReport;
            },
            [
                organization?.id,
            ],
        );

    const getDeleteImpact =
        useCallback(
            (
                entity,
                id,
            ) => {
                if (
                    entity ===
                    'movements'
                ) {
                    const movement =
                        data.movements.find(
                            (item) =>
                                item.id ===
                                id,
                        );

                    if (
                        movement?.status ===
                        'completed'
                    ) {
                        return {
                            referenced:
                                true,

                            shouldArchive:
                                true,

                            effects: [
                                'This completed movement contributes to current personnel assignments and vessel POB.',
                                'Removing it would change the operational movement ledger.',
                                'Recorded movements should be voided with a reason rather than permanently deleted.',
                            ],
                        };
                    }

                    return {
                        referenced:
                            true,

                        shouldArchive:
                            true,

                        effects: [
                            'Movement records are retained as part of the operational ledger.',
                            'Void the movement rather than permanently deleting it.',
                        ],
                    };
                }

                if (
                    entity ===
                    'operations'
                ) {
                    return {
                        referenced:
                            true,

                        shouldArchive:
                            true,

                        effects: [
                            'Operation records are retained as part of the operational history.',
                            'Void the operation with a reason rather than permanently deleting it.',
                        ],
                    };
                }

                if (
                    entity ===
                    'people'
                ) {
                    return {
                        referenced:
                            false,

                        shouldArchive:
                            false,

                        effects: [
                            'If this person has movement or operational history, PostgreSQL will prevent destructive deletion.',
                        ],
                    };
                }

                if (
                    entity ===
                    'vessels'
                ) {
                    return {
                        referenced:
                            false,

                        shouldArchive:
                            false,

                        effects: [
                            'If this vessel is referenced by movement or operational history, PostgreSQL will prevent destructive deletion.',
                        ],
                    };
                }

                return {
                    referenced:
                        false,

                    shouldArchive:
                        false,

                    effects: [],
                };
            },
            [
                data.movements,
            ],
        );

    const value =
        useMemo(
            () => ({
                data,
                loading,
                error,

                currentAssignments:
                data.currentAssignments,

                vesselPob:
                data.vesselPob,

                refreshData,

                createRecord,
                updateRecord,
                deleteRecord,

                createMovement,
                updateMovement,
                voidMovement,

                createOperation,
                updateOperation,
                voidOperation,

                createReport,

                getDeleteImpact,
            }),
            [
                data,
                loading,
                error,
                refreshData,
                createRecord,
                updateRecord,
                deleteRecord,
                createMovement,
                updateMovement,
                voidMovement,
                createOperation,
                updateOperation,
                voidOperation,
                createReport,
                getDeleteImpact,
            ],
        );

    return (
        <AppDataContext.Provider
            value={value}
        >
            {children}
        </AppDataContext.Provider>
    );
}

export function useAppData() {
    const context =
        useContext(
            AppDataContext,
        );

    if (!context) {
        throw new Error(
            'useAppData must be used inside an AppDataProvider',
        );
    }

    return context;
}