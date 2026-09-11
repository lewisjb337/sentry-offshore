import EntityPage from '../components/app/EntityPage';

function PeoplePage() {
    return (
        <EntityPage
            entity="people"
            eyebrow="Personnel"
            title="People"
            description="Maintain your personnel register, monitor operational readiness and see where every crew member is currently assigned."
        />
    );
}

export default PeoplePage;