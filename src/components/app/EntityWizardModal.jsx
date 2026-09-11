import {
    useEffect,
    useMemo,
    useState,
} from 'react';

import { useAppData } from '../../context/AppDataContext';
import { entityDefinitions } from '../../data/entityDefinitions';

function getApplicableSteps(definition, values) {
    return definition.steps.filter(
        (step) =>
            !step.showWhen ||
            step.showWhen(values),
    );
}

function getAllFields(definition) {
    return definition.steps.flatMap(
        (step) => step.fields,
    );
}

function toLocalDateTime(value) {
    if (!value) return '';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    const offset = date.getTimezoneOffset() * 60000;

    return new Date(date.getTime() - offset)
        .toISOString()
        .slice(0, 16);
}

function buildInitialValues(definition, record) {
    const values = record ? { ...record } : {};

    getAllFields(definition).forEach((field) => {
        if (record?.[field.name] !== undefined) {
            values[field.name] =
                field.type === 'datetime-local'
                    ? toLocalDateTime(record[field.name])
                    : field.type === 'date' && record[field.name]
                        ? String(record[field.name]).slice(0, 10)
                        : record[field.name];

            return;
        }

        if (
            field.type === 'people-multi-select' ||
            field.type === 'muster-checklist'
        ) {
            values[field.name] = [];
            return;
        }

        if (field.type === 'checkbox') {
            values[field.name] =
                field.defaultValue ?? false;
            return;
        }

        values[field.name] =
            field.defaultValue ?? '';
    });

    return values;
}

function EntityWizardModal({
                               entity,
                               record = null,
                               onClose,
                           }) {
    const definition = entityDefinitions[entity];

    const {
        data,
        createRecord,
        updateRecord,
    } = useAppData();

    const [values, setValues] = useState(() =>
        buildInitialValues(definition, record),
    );

    const [stepIndex, setStepIndex] = useState(0);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');

    const steps = useMemo(
        () => getApplicableSteps(definition, values),
        [definition, values],
    );

    useEffect(() => {
        if (stepIndex >= steps.length) {
            setStepIndex(
                Math.max(steps.length - 1, 0),
            );
        }
    }, [steps.length, stepIndex]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && !saving) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener(
                'keydown',
                handleKeyDown,
            );
        };
    }, [onClose, saving]);

    const step = steps[stepIndex];

    const visibleFields = useMemo(
        () =>
            step.fields.filter(
                (field) =>
                    !field.showWhen ||
                    field.showWhen(values),
            ),
        [step, values],
    );

    const setField = (name, value) => {
        setValues((current) => {
            const next = {
                ...current,
                [name]: value,
            };

            if (
                entity === 'operations' &&
                name === 'vesselId' &&
                !record
            ) {
                const vessel = data.vessels.find(
                    (item) => item.id === value,
                );

                next.projectId =
                    vessel?.currentProjectId || '';
            }

            return next;
        });

        setSaveError('');

        setErrors((current) => {
            const next = { ...current };
            delete next[name];
            return next;
        });
    };

    const validateFields = (fields) => {
        const nextErrors = {};

        fields.forEach((field) => {
            if (
                field.showWhen &&
                !field.showWhen(values)
            ) {
                return;
            }

            if (!field.validate) {
                return;
            }

            const error = field.validate(
                values[field.name],
                values,
            );

            if (error) {
                nextErrors[field.name] = error;
            }
        });

        return nextErrors;
    };

    const validateStep = () => {
        const nextErrors =
            validateFields(visibleFields);

        setErrors(nextErrors);

        return Object.keys(nextErrors).length === 0;
    };

    const validateAll = () => {
        let nextErrors = {};

        steps.forEach((candidateStep) => {
            nextErrors = {
                ...nextErrors,
                ...validateFields(candidateStep.fields),
            };
        });

        if (definition.validate) {
            nextErrors = {
                ...nextErrors,
                ...definition.validate(values, {
                    data,
                    record,
                }),
            };
        }

        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            const invalidStep = steps.findIndex(
                (candidateStep) =>
                    candidateStep.fields.some(
                        (field) =>
                            nextErrors[field.name],
                    ),
            );

            if (invalidStep >= 0) {
                setStepIndex(invalidStep);
            }

            return false;
        }

        return true;
    };

    const buildPayload = () => {
        const payload = {};

        getAllFields(definition).forEach((field) => {
            payload[field.name] =
                values[field.name];
        });

        return payload;
    };

    const handleNext = () => {
        if (!validateStep()) {
            return;
        }

        setStepIndex((current) =>
            Math.min(current + 1, steps.length - 1),
        );
    };

    const handleSubmit = async () => {
        if (saving || !validateAll()) {
            return;
        }

        setSaving(true);
        setSaveError('');

        try {
            const payload = buildPayload();

            if (record) {
                await updateRecord(
                    entity,
                    record.id,
                    payload,
                );
            } else {
                await createRecord(entity, payload);
            }

            onClose();
        } catch (error) {
            setSaveError(
                error.message ||
                'Unable to save this record.',
            );
        } finally {
            setSaving(false);
        }
    };

    const getOptions = (field) => {
        if (field.type === 'person-select') {
            return data.people
                .filter(
                    (person) =>
                        person.status !== 'archived',
                )
                .map((person) => ({
                    value: person.id,
                    label:
                        `${person.firstName} ${person.lastName}`,
                }));
        }

        if (field.type === 'vessel-select') {
            return data.vessels
                .filter(
                    (vessel) =>
                        vessel.status !== 'archived',
                )
                .map((vessel) => ({
                    value: vessel.id,
                    label: vessel.name,
                }));
        }

        if (field.type === 'project-select') {
            return (data.projects || []).map(
                (project) => ({
                    value: project.id,
                    label: project.siteName
                        ? `${project.name} — ${project.siteName}`
                        : project.name,
                }),
            );
        }

        if (field.type === 'movement-select') {
            return data.movements
                .filter(
                    (movement) =>
                        movement.status === 'completed',
                )
                .map((movement) => ({
                    value: movement.id,
                    label:
                        movement.reference ||
                        `${movement.movementType} — ${
                            movement.occurredAt ||
                            movement.createdAt
                        }`,
                }));
        }

        return field.options || [];
    };

    const renderField = (field) => {
        const value = values[field.name];

        if (field.type === 'muster-checklist') {
            const roster =
                record?.expectedPobSnapshot || [];

            const selected = Array.isArray(value)
                ? value
                : [];

            return (
                <div className="multi-select-list">
                    <p className="record-subtext">
                        Frozen expected POB: {roster.length}.
                        Changes to live POB do not change
                        this roster.
                    </p>

                    {roster.map((person) => {
                        const id = person.personId;
                        const checked =
                            selected.includes(id);

                        return (
                            <label
                                key={id}
                                className={`multi-select-item ${
                                    checked
                                        ? 'is-selected'
                                        : ''
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() =>
                                        setField(
                                            field.name,
                                            checked
                                                ? selected.filter(
                                                    (item) =>
                                                        item !== id,
                                                )
                                                : [
                                                    ...selected,
                                                    id,
                                                ],
                                        )
                                    }
                                />

                                <span className="multi-select-item__copy">
                                    <strong>
                                        {person.firstName}{' '}
                                        {person.lastName}
                                    </strong>

                                    <small>
                                        {person.employeeNumber ||
                                            person.role ||
                                            'Personnel'}
                                    </small>
                                </span>
                            </label>
                        );
                    })}

                    {!record && (
                        <p className="record-subtext">
                            The roster is frozen when you
                            create the muster. Save it first,
                            then open it to account for
                            personnel.
                        </p>
                    )}

                    <strong>
                        {selected.length} / {roster.length}
                        {' '}accounted for
                    </strong>
                </div>
            );
        }

        if (field.type === 'people-multi-select') {
            const selected = Array.isArray(value)
                ? value
                : [];

            const people = data.people.filter(
                (person) =>
                    person.status !== 'archived',
            );

            if (people.length === 0) {
                return (
                    <div className="wizard-empty-input">
                        Add personnel before creating this
                        record.
                    </div>
                );
            }

            return (
                <div className="multi-select-list">
                    {people.map((person) => {
                        const checked =
                            selected.includes(person.id);

                        return (
                            <label
                                key={person.id}
                                className={`multi-select-item ${
                                    checked
                                        ? 'is-selected'
                                        : ''
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => {
                                        const next = checked
                                            ? selected.filter(
                                                (id) =>
                                                    id !== person.id,
                                            )
                                            : [
                                                ...selected,
                                                person.id,
                                            ];

                                        setField(
                                            field.name,
                                            next,
                                        );
                                    }}
                                />

                                <span className="multi-select-item__avatar">
                                    {person.firstName?.[0]}
                                    {person.lastName?.[0]}
                                </span>

                                <span className="multi-select-item__copy">
                                    <strong>
                                        {person.firstName}{' '}
                                        {person.lastName}
                                    </strong>

                                    <small>
                                        {person.role ||
                                            'No role assigned'}
                                    </small>
                                </span>
                            </label>
                        );
                    })}
                </div>
            );
        }

        if (field.type === 'checkbox') {
            return (
                <label className="wizard-checkbox">
                    <input
                        type="checkbox"
                        checked={Boolean(value)}
                        onChange={(event) =>
                            setField(
                                field.name,
                                event.target.checked,
                            )
                        }
                    />

                    <span>Yes</span>
                </label>
            );
        }

        if (
            field.type === 'select' ||
            field.type === 'person-select' ||
            field.type === 'vessel-select' ||
            field.type === 'project-select' ||
            field.type === 'movement-select'
        ) {
            return (
                <select
                    id={field.name}
                    className={`input ${
                        errors[field.name]
                            ? 'input--error'
                            : ''
                    }`}
                    value={value ?? ''}
                    disabled={
                        saving ||
                        (
                            entity === 'operations' &&
                            Boolean(record) &&
                            field.name === 'operationType'
                        )
                    }
                    onChange={(event) =>
                        setField(
                            field.name,
                            event.target.value,
                        )
                    }
                >
                    <option value="">Select...</option>

                    {getOptions(field).map((option) => (
                        <option
                            key={option.value}
                            value={option.value}
                        >
                            {option.label}
                        </option>
                    ))}
                </select>
            );
        }

        if (field.type === 'textarea') {
            return (
                <textarea
                    id={field.name}
                    className={`input wizard-textarea ${
                        errors[field.name]
                            ? 'input--error'
                            : ''
                    }`}
                    value={value ?? ''}
                    rows="4"
                    onChange={(event) =>
                        setField(
                            field.name,
                            event.target.value,
                        )
                    }
                />
            );
        }

        return (
            <input
                id={field.name}
                className={`input ${
                    errors[field.name]
                        ? 'input--error'
                        : ''
                }`}
                type={field.type}
                min={field.min}
                value={value ?? ''}
                onChange={(event) =>
                    setField(
                        field.name,
                        event.target.value,
                    )
                }
            />
        );
    };

    const isLastStep =
        stepIndex === steps.length - 1;

    return (
        <div
            className="modal-backdrop"
            onMouseDown={(event) => {
                if (
                    event.target === event.currentTarget &&
                    !saving
                ) {
                    onClose();
                }
            }}
        >
            <div
                className="wizard-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="wizard-title"
            >
                <header className="wizard-modal__header">
                    <div>
                        <p className="label">
                            {record
                                ? `Edit ${definition.singular}`
                                : `New ${definition.singular}`}
                        </p>

                        <h2 id="wizard-title">
                            {step.title}
                        </h2>

                        <p>{step.description}</p>
                    </div>

                    <button
                        type="button"
                        className="wizard-modal__close"
                        onClick={onClose}
                        disabled={saving}
                        aria-label="Close"
                    >
                        <i
                            className="ti ti-x"
                            aria-hidden="true"
                        />
                    </button>
                </header>

                <div
                    className="wizard-progress"
                    style={{
                        gridTemplateColumns:
                            `repeat(${steps.length}, 1fr)`,
                    }}
                >
                    {steps.map((candidate, index) => (
                        <button
                            type="button"
                            key={candidate.title}
                            className={`wizard-progress__step ${
                                index === stepIndex
                                    ? 'is-active'
                                    : ''
                            } ${
                                index < stepIndex
                                    ? 'is-complete'
                                    : ''
                            }`}
                            onClick={() => {
                                if (index < stepIndex) {
                                    setStepIndex(index);
                                }
                            }}
                        >
                            <span>{index + 1}</span>
                            <small>{candidate.title}</small>
                        </button>
                    ))}
                </div>

                <div className="wizard-modal__body">
                    <div className="wizard-fields">
                        {visibleFields.map((field) => (
                            <div
                                key={field.name}
                                className={`field ${
                                    field.type === 'textarea' ||
                                    field.type ===
                                    'people-multi-select' ||
                                    field.type ===
                                    'muster-checklist'
                                        ? 'field--full'
                                        : ''
                                }`}
                            >
                                <label htmlFor={field.name}>
                                    {field.label}
                                </label>

                                {renderField(field)}

                                {errors[field.name] && (
                                    <span className="field-error">
                                        {errors[field.name]}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>

                    {saveError && (
                        <p
                            role="alert"
                            className="field-error"
                        >
                            {saveError}
                        </p>
                    )}

                    {record && (
                        <div className="wizard-audit">
                            <div>
                                <span className="label">
                                    Created
                                </span>

                                <span>
                                    {new Date(
                                        record.createdAt,
                                    ).toLocaleString()}
                                </span>
                            </div>

                            <div>
                                <span className="label">
                                    Last modified
                                </span>

                                <span>
                                    {new Date(
                                        record.updatedAt,
                                    ).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <footer className="wizard-modal__footer">
                    <button
                        type="button"
                        className="btn btn--secondary"
                        disabled={saving}
                        onClick={
                            stepIndex === 0
                                ? onClose
                                : () =>
                                    setStepIndex(
                                        (current) =>
                                            current - 1,
                                    )
                        }
                    >
                        {stepIndex === 0
                            ? 'Cancel'
                            : 'Back'}
                    </button>

                    {!isLastStep ? (
                        <button
                            type="button"
                            className="btn btn--primary"
                            onClick={handleNext}
                            disabled={saving}
                        >
                            Continue

                            <i
                                className="ti ti-arrow-right"
                                aria-hidden="true"
                            />
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="btn btn--primary"
                            disabled={saving}
                            onClick={handleSubmit}
                        >
                            {saving
                                ? 'Saving…'
                                : record
                                    ? 'Save changes'
                                    : `Create ${definition.singular.toLowerCase()}`}
                        </button>
                    )}
                </footer>
            </div>
        </div>
    );
}

export default EntityWizardModal;