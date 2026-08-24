"""Approved, curated facts used to ground the farming assistant.

Keep this material concise and traceable to the linked RRDI/IRRI pages. The
assistant never browses the open web at request time and cannot cite other URLs.
"""

SOURCES = {
    "rrdi-diagnosis": {
        "title": "RRDI — Diagnosing a rice disease",
        "publisher": "Sri Lanka Rice Research and Development Institute (RRDI)",
        "url": "https://doa.gov.lk/rrdi_ricediseases_diagnose/",
    },
    "rrdi-blb": {
        "title": "RRDI — Bacterial leaf blight",
        "publisher": "Sri Lanka Rice Research and Development Institute (RRDI)",
        "url": "https://doa.gov.lk/rrdi_ricediseases_bacterialleafblight/",
    },
    "rrdi-brown-spot": {
        "title": "RRDI — Brown spot",
        "publisher": "Sri Lanka Rice Research and Development Institute (RRDI)",
        "url": "https://doa.gov.lk/rrdi_ricediseases_brownspot/",
    },
    "rrdi-blast": {
        "title": "RRDI — Rice blast",
        "publisher": "Sri Lanka Rice Research and Development Institute (RRDI)",
        "url": "https://doa.gov.lk/rrdi_ricediseases_riceblast/",
    },
    "rrdi-leaf-scald": {
        "title": "RRDI — Leaf scald",
        "publisher": "Sri Lanka Rice Research and Development Institute (RRDI)",
        "url": "https://doa.gov.lk/rrdi_ricediseases_leafscald/",
    },
    "rrdi-narrow-brown-spot": {
        "title": "RRDI — Narrow brown leaf spot",
        "publisher": "Sri Lanka Rice Research and Development Institute (RRDI)",
        "url": "https://doa.gov.lk/rrdi_ricediseases_narrowbrownleafspot/",
    },
    "rrdi-leaffolder": {
        "title": "RRDI — Rice leaffolders",
        "publisher": "Sri Lanka Rice Research and Development Institute (RRDI)",
        "url": "https://doa.gov.lk/rrdi_pests_riceleaffolders/",
    },
    "irri-tungro": {
        "title": "IRRI Rice Knowledge Bank — Tungro",
        "publisher": "International Rice Research Institute (IRRI)",
        "url": "https://www.knowledgebank.irri.org/training/fact-sheets/pest-management/diseases/item/tungro",
    },
    "irri-rice-stripe": {
        "title": "IRRI Rice Doctor — Rice stripe",
        "publisher": "International Rice Research Institute (IRRI)",
        "url": "https://www.knowledgebank.irri.org/decision-tools/rice-doctor/rice-doctor-fact-sheets/item/rice-stripe",
    },
}


KNOWLEDGE = [
    {
        "topic": "Responsible rice-problem diagnosis",
        "sourceIds": ["rrdi-diagnosis"],
        "facts": (
            "A reliable diagnosis should combine field history, field symptoms, plant symptoms, "
            "and crop growth stage. Different diseases, pests, nutrient disorders, herbicide injury, "
            "and environmental stress can produce similar symptoms or occur together. When the cause "
            "is uncertain or damage is severe, package symptomatic plants and relevant soil samples "
            "carefully and submit them with field information to a trained agricultural expert."
        ),
    },
    {
        "topic": "Bacterial leaf blight (BLB, kresek)",
        "sourceIds": ["rrdi-blb"],
        "facts": (
            "Caused by Xanthomonas oryzae pv. oryzae. Seedlings can wilt and yellow (kresek); squeezed "
            "cut leaf ends may show yellowish bacterial ooze, and affected plants are not easily pulled "
            "from soil. Mature leaves develop water-soaked orange stripes from tips or blades with wavy "
            "margins progressing toward the base. Favoured by 25–34°C, strong wind, continuous heavy "
            "rain, high humidity, and excess nitrogen. Use recommended urea rates or a leaf-colour chart, "
            "maintain drainage, stop water and let the field dry when first observed where practical, and "
            "do not route drainage from infected fields through disease-free fields. RRDI also advises "
            "potassium after detection; confirm the locally appropriate rate."
        ),
    },
    {
        "topic": "Brown spot",
        "sourceIds": ["rrdi-brown-spot"],
        "facts": (
            "Caused by Cochliobolus miyabeanus (Bipolaris oryzae) and is seed-borne. It affects leaves, "
            "sheaths, panicles, glumes, and grain. Lesions range from minute dark-brown marks to oval spots "
            "with a dark margin and light reddish-brown or grey centre; panicle infection can produce light "
            "or chalky grain. Favoured by 16–36°C, 86–100% humidity, nutrient-poor/problem soils including "
            "salinity or iron toxicity, and drought. Use recommended nitrogen, control weeds, improve soil "
            "with organic fertilizer, use certified disease-free seed, avoid infected straw, rotate crops, "
            "level land, and use RRDI-recommended seed treatment such as 53–54°C hot water for 10–12 minutes "
            "or a currently registered seed-protectant fungicide according to its label."
        ),
    },
    {
        "topic": "Rice blast / leaf blast / neck blast",
        "sourceIds": ["rrdi-blast"],
        "facts": (
            "Caused by Magnaporthe grisea (Pyricularia grisea) and can affect leaves, nodes, panicles, and "
            "seeds at any stage. Leaf lesions are spindle-shaped with pointed ends, brown or reddish margins, "
            "and ash-coloured centres. Infected nodes blacken and rot; neck infection can make panicles fall "
            "and severe disease produces partly filled grain or whiteheads. Favoured by cool 17–20°C nights, "
            "high humidity, foggy/dark conditions, excess nitrogen, dense stands, and susceptible varieties. "
            "Use recommended nitrogen, manage weeds, use resistant varieties and certified seed next season, "
            "and do not return infected straw. RRDI lists fungicide options for rapid spread, but registration "
            "and labels can change: confirm the product and rate with a Sri Lankan agriculture officer and "
            "follow the current label."
        ),
    },
    {
        "topic": "Leaf scald",
        "sourceIds": ["rrdi-leaf-scald"],
        "facts": (
            "Caused by Monographella albescens (Microdochium oryzae). It is seed-borne and affects mature "
            "leaves, panicles, and seedlings. Lesions begin at leaf tips or edges and show a chevron pattern "
            "of tan and darker reddish-brown areas, often with a yellow-to-gold leading edge; leaves dry and "
            "turn straw-coloured. Panicle infection discolours florets or hulls and may cause sterility or "
            "kernel abortion. Apply nitrogen only at recommended rates. For the next season use certified "
            "disease-free seed, manage weeds, add burnt paddy husk at 250 kg per acre during land preparation "
            "as advised by RRDI, and avoid returning infected crop material."
        ),
    },
    {
        "topic": "Narrow brown leaf spot",
        "sourceIds": ["rrdi-narrow-brown-spot"],
        "facts": (
            "Caused by Sphaerulina oryzina (Cercospora janseana). Light-to-dark brown linear lesions run "
            "parallel to veins, usually 2–10 mm long and 1–1.5 mm wide. Susceptible varieties may develop "
            "joined linear dead areas; leaf sheaths can show a netlike brown/yellow net blotch. Severity often "
            "increases near maturity and can contribute to early ripening, yield loss, and lodging. Use "
            "recommended nitrogen, improve soil with organic fertilizer, use certified disease-free seed, "
            "manage weeds, add burnt paddy husk at 250 kg per acre during land preparation as advised by RRDI, "
            "and avoid infected straw."
        ),
    },
    {
        "topic": "Rice leaffolder",
        "sourceIds": ["rrdi-leaffolder"],
        "facts": (
            "Leaffolder caterpillars fasten leaf edges together, live inside the rolled leaf, and eat the "
            "mesophyll, reducing productive leaf area. Cloudy, humid, shady conditions and high nitrogen "
            "favour damage. Establish the recommended spacing, use the recommended nitrogen dose, and monitor "
            "regularly. RRDI gives an economic threshold of 25% of leaves showing more than 50% damage before "
            "control action and recommends a safer insect growth regulator when control is justified. Use only "
            "a currently registered product and follow its label or local extension advice."
        ),
    },
    {
        "topic": "Rice tungro disease",
        "sourceIds": ["irri-tungro"],
        "facts": (
            "Tungro is caused by two viruses transmitted by leafhoppers, especially green leafhoppers. It "
            "causes yellow to orange-yellow discoloration from the leaf tip downward, mottling or striping, "
            "stunting, delayed flowering, fewer tillers, small or incompletely exserted panicles, and sterile "
            "or partly filled grains. Plants are most vulnerable at tillering. Virus sources include infected "
            "rice, stubble, regrowth, volunteer rice, nearby fields, and infected nursery seedlings. Infected "
            "plants cannot be cured. Use locally recommended resistant varieties, plant synchronously, avoid "
            "late planting, adjust timing around leafhopper abundance where known, and plough infected stubble "
            "after harvest. Routine insecticide use alone is often ineffective; seek local advice."
        ),
    },
    {
        "topic": "Rice stripe virus disease",
        "sourceIds": ["irri-rice-stripe", "rrdi-diagnosis"],
        "facts": (
            "Rice stripe virus is mainly transmitted by the small brown planthopper. Typical signs include "
            "chlorotic or yellowish-white stripes, mottling, grey or brown streaks, twisting or drooping young "
            "leaves, stunting, fewer tillers, and poorly developed panicles. Young plants are most vulnerable. "
            "There is no curative treatment; prevention focuses on resistant varieties where locally available, "
            "synchronous planting, removal of infected plants, ratoons, stubble and grassy weeds, and locally "
            "guided vector management. Because classic rice stripe is primarily reported in temperate East Asia "
            "and similar symptoms have other causes, suspected Sri Lankan cases need expert or laboratory confirmation."
        ),
    },
]
