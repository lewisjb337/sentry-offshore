import EntityPage from '../components/app/EntityPage';

function OperationsPage() {
    return (
        <EntityPage
            entity="operations"
            eyebrow="Vessel operations"
            title="Operations"
            description="Record musters, daily operational logs and personnel transfer activities with exceptions and sign-off."
        />
    );
}

export default OperationsPage;