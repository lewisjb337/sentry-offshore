export const differentiators = [
    {
        title: 'Live, not logged',
        detail:
            'POB comes from actual crew movements, not a number someone typed and forgot to update.',
    },
    {
        title: 'Five concepts at the core',
        detail:
            'People, vessels, movements, operations and reports. Everything in Sentry is built around them.',
    },
    {
        title: 'Built for operators',
        detail:
            'Run a handful of vessels without needing procurement, training, or a rollout project.',
    },
];

export const features = [
    {
        number: '01',
        icon: 'ti-users',
        title: 'People',
        tagline: 'Know who you have, and what they can do.',
        description:
            'Crew records, roles, and contact details in one place, alongside certification types and expiry dates, so a lapsed ticket shows up before it becomes a problem, not after.',
        bullets: [
            'Role & contact details',
            'Certification expiry tracking',
            'Full assignment history',
        ],
        preview: {
            label: 'crew',
            rows: [
                {
                    a: 'J. Reid',
                    b: 'Master',
                    c: 'Cert exp. Mar 2027',
                },
                {
                    a: 'S. Okafor',
                    b: 'Deckhand',
                    c: 'Cert exp. Nov 2026',
                },
                {
                    a: 'M. Fenwick',
                    b: 'Engineer',
                    c: 'Cert exp. Jan 2027',
                },
            ],
        },
    },
    {
        number: '02',
        icon: 'ti-anchor',
        title: 'Vessels',
        tagline: 'Fleet status, without the spreadsheet.',
        description:
            "Each vessel shows its type, flag, home port, and status. Current POB is never a number someone typed in. It's derived live from who's actually assigned on board right now.",
        bullets: [
            'Type, flag & home port',
            'Live POB, derived not entered',
            'Status at a glance',
        ],
        preview: {
            label: 'fleet',
            rows: [
                {
                    a: 'MV Northern Star',
                    b: 'CTV',
                    c: 'POB 22',
                },
                {
                    a: 'MV Kestrel',
                    b: 'CTV',
                    c: 'POB 14',
                },
                {
                    a: 'MV Solan',
                    b: 'SOV',
                    c: 'POB 9',
                },
            ],
        },
    },
    {
        number: '03',
        icon: 'ti-route',
        title: 'Movements',
        tagline: 'Every crew change, logged as it happens.',
        description:
            'A single chronological ledger of crew changes, transfers, and port calls. This is the record everything else — POB, assignments, and history — is built from, not a separate list kept in sync by hand.',
        bullets: [
            'Crew changes & transfers',
            'Filterable by vessel or person',
            'Source of truth for POB',
        ],
        preview: {
            label: 'ledger',
            rows: [
                {
                    a: 'Crew change',
                    b: 'MV Kestrel',
                    c: '06:00Z',
                },
                {
                    a: 'Port call',
                    b: 'MV Solan',
                    c: 'Peterhead',
                },
                {
                    a: 'Transfer',
                    b: 'MV Northern Star',
                    c: '14:20Z',
                },
            ],
        },
    },
    {
        number: '04',
        icon: 'ti-clipboard-check',
        title: 'Operations',
        tagline: 'Daily logs and musters, without the paperwork.',
        description:
            'Run a muster against who the system says should be on board, and any mismatch is flagged the moment it happens, not discovered at the next audit.',
        bullets: [
            'Musters vs. live expected POB',
            'Mismatches flagged instantly',
            'Free-form daily logs',
        ],
        preview: {
            label: 'musters',
            rows: [
                {
                    a: 'MV Northern Star',
                    b: 'Expected 22 / Present 22',
                    c: 'Match',
                    tone: 'success',
                },
                {
                    a: 'MV Solan',
                    b: 'Expected 9 / Present 8',
                    c: 'Mismatch',
                    tone: 'error',
                },
            ],
        },
    },
    {
        number: '05',
        icon: 'ti-file-export',
        title: 'Reports',
        tagline: 'Everything exportable, when you need it.',
        description:
            'Pull a POB snapshot, movement log, or muster record for any date range as CSV or PDF, ready to hand to a charterer, an auditor, or your own records.',
        bullets: [
            'POB snapshots & movement logs',
            'Any date range, any vessel',
            'CSV or PDF exports',
        ],
        preview: {
            label: 'exports',
            rows: [
                {
                    a: 'POB Snapshot',
                    b: 'Sept 2026',
                    c: 'CSV',
                },
                {
                    a: 'Movement Log',
                    b: 'Q3 2026',
                    c: 'PDF',
                },
                {
                    a: 'Muster Record',
                    b: 'MV Solan',
                    c: 'PDF',
                },
            ],
        },
    },
];

export const pricingTiers = [
    {
        name: 'Free',
        description:
            'For small operators getting started with digital crew tracking.',
        price: 'Free',
        unit: '',
        features: [
            '1 vessel',
            'Up to 15 active personnel',
            'Basic embark / disembark movements',
            'Live POB view',
            '7-day reporting history',
        ],
        cta: 'Start free',
        highlight: false,
    },
    {
        name: 'Starter',
        description:
            'For small offshore operators running a growing fleet.',
        price: '£49',
        unit: '/ month',
        features: [
            'Up to 3 vessels',
            'Unlimited personnel',
            'Full crew movement tracking',
            'Live POB and vessel status',
            'Operations and reporting',
        ],
        cta: 'Choose Starter',
        highlight: true,
    },
    {
        name: 'Fleet',
        description:
            'For established operators managing multiple active vessels.',
        price: '£99',
        unit: '/ month',
        features: [
            'Unlimited vessels',
            'Unlimited personnel',
            'Full operational reporting',
            'Advanced vessel and crew controls',
            'Priority support',
        ],
        cta: 'Choose Fleet',
        highlight: false,
    },
];