import EntityPage from '../components/app/EntityPage';

function VesselsPage() {
    return (
        <EntityPage
            entity="vessels"
            eyebrow="Fleet"
            title="Vessels"
            description="Manage vessel identity, fleet status, operational assignments, compliance dates and live personnel on board."
        />
    );
}

export default VesselsPage;