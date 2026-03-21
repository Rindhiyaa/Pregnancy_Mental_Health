export const ASSESSMENT_SECTIONS = [
    {
        id: 1,
        title: "Demographics",
        subtitle: "Basic patient information (7 questions)",
        questions: [
            { name: "patient_name", label: "Patient Name", type: "text", placeholder: "Auto-filled from selected patient", readOnly: true },
            { name: "age", label: "What is your Age? (18-50)", type: "number", placeholder: "18-50", min: 18, max: 50 },
            { name: "residence", label: "Where do you live?", type: "select", options: ["City", "Village"] },
            { name: "education_level", label: "Highest education level?", type: "select", options: ["University", "College", "High School", "Primary School"] },
            { name: "marital_status", label: "Marital status?", type: "select", options: ["Married", "Divorced/Unmarried"] },
            { name: "partner_education", label: "Husband's/Partner's education level?", type: "select", options: ["University", "College", "High School", "Primary School"] },
            { name: "partner_income", label: "Family's monthly income?", type: "select", options: ["5000-10000", "10000-20000", "20000-30000", ">30000"] },
            { name: "household_members", label: "How many people live in your household?", type: "select", options: ["2 to 5", "6 to 8", "9 or more"] },
        ]
    },
    {
        id: 2,
        title: "Relationships & Support",
        subtitle: "Information about your relationships and support system (6 questions)",
        questions: [
            { name: "relationship_inlaws", label: "Relationship with in-laws?", type: "select", options: ["Good", "Neutral", "Friendly", "Bad", "Poor"] },
            { name: "relationship_husband", label: "Relationship with husband/Partner?", type: "select", options: ["Good", "Neutral", "Friendly", "Bad", "Poor"] },
            { name: "support_during_pregnancy", label: "Support from family/friends during pregnancy?", type: "select", options: ["High", "Medium", "Low"] },
            { name: "need_more_support", label: "Do you feel you need more support?", type: "select", options: ["High", "Medium", "Low"] },
            { name: "trust_share_feelings", label: "Is there Someone you can trust and share your feelings with?", type: "select", options: ["Yes", "No"] },
            { name: "family_type", label: "What is your Family type?", type: "select", options: ["Nuclear", "Joint"] },
        ]
    },
    {
        id: 3,
        title: "Obstetric & Pregnancy Related Factors",
        subtitle: "Information about your pregnancy history (6 questions)",
        questions: [
            { name: "total_children_now", label: "How many total children do you have until now?", type: "select", options: ["Zero", "One", "Two"] },
            { name: "pregnancy_number", label: "What number pregnancy is this?", type: "select", options: ["1", "2", "3"] },
            { name: "pregnancy_planned", label: "Was this pregnancy planned?", type: "select", options: ["Yes", "No"] },
            { name: "regular_checkups", label: "Have you attended Regular antenatal checkups?", type: "select", options: ["Yes", "No"] },
            { name: "medical_conditions_pregnancy", label: "Did you have Medical conditions during pregnancy?", type: "select", options: ["None", "Non-Chronic conditions", "Chronic conditions"] },
            { name: "occupation_before_surgery", label: "What is your occupation during pregnancy?", type: "select", options: ["Housewife", "Student", "Others"] },
        ]
    },
    {
        id: 4,
        title: "Mental Health History",
        subtitle: "Information about your mental health history (5 questions)",
        questions: [
            { name: "depression_before_pregnancy", label: "Did you experience depression BEFORE this pregnancy?", type: "select", options: ["Positive", "Negative"] },
            { name: "depression_during_pregnancy", label: "Did you experience depression DURING this pregnancy?", type: "select", options: ["Positive", "Negative"] },
            { name: "fear_pregnancy_childbirth", label: "Do you have FEAR about pregnancy or childbirth?", type: "select", options: ["Yes", "No"] },
            { name: "major_life_changes_pregnancy", label: "Have you experienced Major life changes during pregnancy?", type: "select", options: ["Yes", "No"] },
            { name: "abuse_during_pregnancy", label: "Have you experienced any ABUSE during pregnancy?", type: "select", options: ["Yes", "No"] },
        ]
    },
    {
        id: 5,
        title: "EPDS Assessment",
        subtitle: "Edinburgh Postnatal Depression Scale - Answer based on how you felt during the past 7 days (10 questions)",
        questions: [
            {
                name: "epds_1",
                label: "1. I have been able to laugh and see the funny side of things",
                type: "select",
                options: [
                    { value: "3", label: "As much as I always could" },
                    { value: "2", label: "Not quite so much now" },
                    { value: "1", label: "Definitely not so much now" },
                    { value: "0", label: "Not at all" }
                ]
            },
            {
                name: "epds_2",
                label: "2. I have looked forward with enjoyment to things",
                type: "select",
                options: [
                    { value: "3", label: "As much as I ever did" },
                    { value: "2", label: "Rather less than I used to" },
                    { value: "1", label: "Definitely less than I used to" },
                    { value: "0", label: "Hardly at all" }
                ]
            },
            {
                name: "epds_3",
                label: "3. I have blamed myself unnecessarily when things went wrong",
                type: "select",
                options: [
                    { value: "3", label: "Yes, most of the time" },
                    { value: "2", label: "Yes, some of the time" },
                    { value: "1", label: "Not very often" },
                    { value: "0", label: "No, never" }
                ]
            },
            {
                name: "epds_4",
                label: "4. I have been anxious or worried for no good reason",
                type: "select",
                options: [
                    { value: "0", label: "No, not at all" },
                    { value: "1", label: "Hardly ever" },
                    { value: "2", label: "Yes, sometimes" },
                    { value: "3", label: "Yes, very often" }
                ]
            },
            {
                name: "epds_5",
                label: "5. I have felt scared or panicky for no very good reason",
                type: "select",
                options: [
                    { value: "3", label: "Yes, quite a lot" },
                    { value: "2", label: "Yes, sometimes" },
                    { value: "1", label: "No, not much" },
                    { value: "0", label: "No, not at all" }
                ]
            },
            {
                name: "epds_6",
                label: "6. Things have been getting on top of me",
                type: "select",
                options: [
                    { value: "3", label: "Yes, most of the time I haven't been able to cope at all" },
                    { value: "2", label: "Yes, sometimes I haven't been coping as well as usual" },
                    { value: "1", label: "No, most of the time I have coped quite well" },
                    { value: "0", label: "No, I have been coping as well as ever" }
                ]
            },
            {
                name: "epds_7",
                label: "7. I have been so unhappy that I have had difficulty sleeping",
                type: "select",
                options: [
                    { value: "3", label: "Yes, most of the time" },
                    { value: "2", label: "Yes, some of the time" },
                    { value: "1", label: "Not very often" },
                    { value: "0", label: "No, not at all" }
                ]
            },
            {
                name: "epds_8",
                label: "8. I have felt sad or miserable",
                type: "select",
                options: [
                    { value: "3", label: "Yes, most of the time" },
                    { value: "2", label: "Yes, quite often" },
                    { value: "1", label: "Not very often" },
                    { value: "0", label: "No, not at all" }
                ]
            },
            {
                name: "epds_9",
                label: "9. I have been so unhappy that I have been crying",
                type: "select",
                options: [
                    { value: "3", label: "Yes, most of the time" },
                    { value: "2", label: "Yes, quite often" },
                    { value: "1", label: "Only occasionally" },
                    { value: "0", label: "No, never" }
                ]
            },
            {
                name: "epds_10",
                label: "10. The thought of harming myself has occurred to me",
                type: "select",
                options: [
                    { value: "3", label: "Yes, quite often" },
                    { value: "2", label: "Sometimes" },
                    { value: "1", label: "Hardly ever" },
                    { value: "0", label: "Never" }
                ]
            },
        ]
    },
    {
        id: 7,
        title: "Submit Assessment",
        subtitle: "Assign this assessment to a doctor for clinical review",
        questions: []
    }
];

export const STEP_TITLES = {
    1: "Demographics",
    2: "Relationships & Support",
    3: "Obstetric & Pregnancy Related Factors",
    4: "Mental Health History",
    5: "EPDS Assessment",
    6: "Result",
    7: "Submit Assessment"
};

export const INITIAL_FORM_DATA = {
    patient_name: "",
    age: "",
    residence: "",
    education_level: "",
    marital_status: "",
    partner_education: "",
    partner_income: "",
    household_members: "",
    relationship_inlaws: "",
    relationship_husband: "",
    support_during_pregnancy: "",
    need_more_support: "",
    trust_share_feelings: "",
    family_type: "",
    total_children_now: "",
    pregnancy_number: "",
    pregnancy_planned: "",
    regular_checkups: "",
    medical_conditions_pregnancy: "",
    occupation_before_surgery: "",
    depression_before_pregnancy: "",
    depression_during_pregnancy: "",
    fear_pregnancy_childbirth: "",
    major_life_changes_pregnancy: "",
    abuse_during_pregnancy: "",
    epds_1: "",
    epds_2: "",
    epds_3: "",
    epds_4: "",
    epds_5: "",
    epds_6: "",
    epds_7: "",
    epds_8: "",
    epds_9: "",
    epds_10: "",
};
