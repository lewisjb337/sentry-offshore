import { useAppData } from '../../context/AppDataContext';
import { entityDefinitions } from '../../data/entityDefinitions';

function DeleteConfirmModal({
                                entity,
                                record,
                                onClose,
                            }) {
    const {
        deleteRecord,
        getDeleteImpact,
    } = useAppData();

    const definition =
        entityDefinitions[entity];

    const impact =
        getDeleteImpact(
            entity,
            record.id,
        );

    const handleDelete = () => {
        deleteRecord(
            entity,
            record.id,
        );

        onClose();
    };

    return (
        <div className="modal-backdrop">
            <div
                className="delete-modal"
                role="dialog"
                aria-modal="true"
            >
                <div className="delete-modal__icon">
                    <i
                        className="ti ti-alert-triangle"
                        aria-hidden="true"
                    />
                </div>

                <h2>
                    {impact.shouldArchive
                        ? `Archive ${definition.singular.toLowerCase()}?`
                        : `Delete ${definition.singular.toLowerCase()}?`}
                </h2>

                <p>
                    {impact.shouldArchive
                        ? 'This record is referenced by operational history, so Sentry will archive it rather than permanently remove it.'
                        : 'This action cannot be undone.'}
                </p>

                {impact.effects.length >
                    0 && (
                        <div className="delete-impact">
                            {impact.effects.map(
                                (effect) => (
                                    <div
                                        key={effect}
                                        className="delete-impact__item"
                                    >
                                        <i
                                            className="ti ti-arrow-right"
                                            aria-hidden="true"
                                        />

                                        <span>
                                        {effect}
                                    </span>
                                    </div>
                                ),
                            )}
                        </div>
                    )}

                <div className="delete-modal__actions">
                    <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={onClose}
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        className="btn btn--danger"
                        onClick={handleDelete}
                    >
                        {impact.shouldArchive
                            ? 'Archive'
                            : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default DeleteConfirmModal;