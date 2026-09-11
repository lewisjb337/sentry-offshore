import EntityPage from '../components/app/EntityPage';

function MovementsPage() {
    return (
        <EntityPage
            entity="movements"
            eyebrow="Personnel ledger"
            title="Movements"
            description="Maintain the chronological movement ledger that drives current vessel assignments and live POB."
        />
    );
}

export default MovementsPage;