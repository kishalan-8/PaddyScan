const RRDI_DISEASES_URL = 'https://doa.gov.lk/rrdi_commonricediseases/'
const RRDI_PESTS_URL = 'https://doa.gov.lk/rrdi_pests/'

export const DISEASE_GUIDANCE = {
  bacterial_leaf_blight: {
    name: 'Bacterial Leaf Blight',
    cause: 'Bacterium: Xanthomonas oryzae pv. oryzae',
    affected: [
      'Leaves are affected at both the seedling and maturity stages.',
      'Young plants can develop the severe wilting form known as kresek.',
    ],
    symptoms: [
      'Seedlings wilt and yellow. Yellowish bacterial ooze may appear from squeezed cut leaf ends.',
      'On mature plants, water-soaked orange stripes begin on leaf blades or tips, have wavy margins, and progress toward the leaf base.',
      'Unlike stem-borer-damaged plants, plants with kresek are not easily pulled from the soil.',
    ],
    conditions: [
      'Irrigated and rainfed lowland fields, especially at 25–34°C.',
      'Strong winds, continuous heavy rain, and high humidity.',
      'Excessive nitrogen fertilizer.',
    ],
    management: [
      'Apply urea only at the recommended rate or according to a leaf colour chart.',
      'Maintain good field drainage.',
      'When symptoms first appear, stop the water supply and let the field dry where practical.',
      'If complete drainage is not possible, drain through field channels and avoid sending water from infected fields into disease-free fields.',
      'The RRDI advises potassium fertilizer after detection to help limit further spread; confirm the appropriate rate locally.',
    ],
    sources: [{ label: 'Sri Lanka RRDI — Bacterial leaf blight', url: 'https://doa.gov.lk/rrdi_ricediseases_bacterialleafblight/' }],
  },

  brown_spot: {
    name: 'Brown Spot',
    cause: 'Fungus: Cochliobolus miyabeanus (Bipolaris oryzae)',
    affected: [
      'Coleoptiles, leaves, leaf sheaths, immature florets, panicle branches, glumes, and grains can be affected.',
      'Spots may be present from emergence, but disease is usually more prevalent as plants approach maturity and leaves begin to age.',
      'The disease is seed-borne; economic loss is most important when panicles and grain are attacked.',
    ],
    symptoms: [
      'Brown circular or oval spots on coleoptiles can cause seedling blight, weak plants, and a sparse stand.',
      'Leaf spots range from minute dark-brown or reddish-brown marks to larger oval lesions with a dark margin and light reddish-brown or grey centre.',
      'Leaf-sheath and hull spots resemble leaf lesions; infected glumes can become generally black.',
      'Infected immature florets may produce poorly developed, light, or chalky kernels.',
    ],
    conditions: [
      'Temperatures from 16–36°C and high humidity of about 86–100%.',
      'Nutrient-poor or problem soils, including saline soils and soils affected by iron toxicity.',
      'Drought stress.',
    ],
    management: [
      'Use recommended urea rates or a leaf colour chart, and control weeds during the crop season.',
      'Improve soil quality with organic fertilizer for the following season.',
      'Use certified, disease-free seed paddy and do not return infected straw to the field.',
      'Add burnt paddy husk at 250 kg per acre during land preparation, as advised by RRDI.',
      'Treat seed in hot water at 53–54°C for 10–12 minutes, or use a registered seed-protectant fungicide.',
      'Use crop rotation and level the land properly.',
    ],
    sources: [{ label: 'Sri Lanka RRDI — Brown spot', url: 'https://doa.gov.lk/rrdi_ricediseases_brownspot/' }],
  },

  leaf_blast: {
    name: 'Rice Blast (Leaf Blast)',
    cause: 'Fungus: Magnaporthe grisea (Pyricularia grisea)',
    note: 'Leaf blast is rice blast affecting the leaves. The same disease is named node, panicle, or neck blast when those parts are infected.',
    affected: [
      'Plants can be infected at any life stage.',
      'Leaves, nodes, panicles, and seeds can be affected.',
    ],
    symptoms: [
      'Typical leaf lesions are spindle-shaped, with pointed ends, brown or reddish/yellowish-brown margins, and ash-coloured centres.',
      'Fully developed leaf lesions are commonly about 1–1.5 cm long and 0.3–0.5 cm wide.',
      'Infected nodes blacken and rot; infection at the panicle base causes neck rot and can make the panicle fall.',
      'Severe panicle infection can produce partly filled grain and whiteheads.',
    ],
    conditions: [
      'Cool nights around 17–20°C, high humidity, and foggy or dark weather.',
      'Excessive nitrogen fertilizer and dense plant populations.',
      'Susceptible varieties.',
    ],
    management: [
      'Apply urea only at recommended rates or according to a leaf colour chart, and manage weeds.',
      'If disease spreads rapidly, RRDI lists tebuconazole 250 g/L EC (10 ml/16 L), isoprothiolane 400 g/L EC (20 ml/16 L), carbendazim 50% WP/WG (11 g or 11 ml/16 L), or tricyclazole 75% WP (10 g/16 L), using 8–10 tanks per acre. Use only a currently registered product and follow its label.',
      'For the next season, choose a resistant variety and certified disease-free seed.',
      'During land preparation, RRDI recommends 250 kg of burnt paddy husk per acre.',
      'Do not return blast-infected straw to the field.',
    ],
    sources: [{ label: 'Sri Lanka RRDI — Rice blast', url: 'https://doa.gov.lk/rrdi_ricediseases_riceblast/' }],
  },

  leaf_scald: {
    name: 'Leaf Scald',
    cause: 'Fungus: Monographella albescens (Microdochium oryzae)',
    affected: [
      'Mature leaves, panicles, and seedlings are affected.',
      'The disease is seed-borne and can survive between seasons in infected seed.',
    ],
    symptoms: [
      'Lesions begin at leaf tips or leaf-blade edges.',
      'Lesions show a chevron pattern of light tan and darker reddish-brown areas, often with a yellow-to-gold leading edge.',
      'Affected leaves dry and become straw-coloured.',
      'Panicle infection discolours florets or developing grain hulls and can cause sterility or kernel abortion.',
    ],
    conditions: [
      'Infected seed carries the fungus between crops and seasons.',
      'RRDI describes the disease as common and sometimes severe in Sri Lanka’s major rice-growing districts, but does not publish a separate weather or soil conditions list on this page.',
    ],
    management: [
      'Apply urea only at recommended rates or according to a leaf colour chart.',
      'For the next season, use certified seed paddy free from disease and control weeds.',
      'Add burnt paddy husk at 250 kg per acre during land preparation, as advised by RRDI.',
      'Do not add disease-infected crop material to the field.',
    ],
    sources: [{ label: 'Sri Lanka RRDI — Leaf scald', url: 'https://doa.gov.lk/rrdi_ricediseases_leafscald/' }],
  },

  narrow_brown_spot: {
    name: 'Narrow Brown Leaf Spot',
    cause: 'Fungus: Sphaerulina oryzina (Cercospora janseana)',
    affected: [
      'Leaf blades, leaf sheaths, pedicels, and glumes are affected.',
      'Disease becomes more severe as plants approach maturity and can cause leaf death, premature ripening, yield reduction, and lodging.',
    ],
    symptoms: [
      'Light- to dark-brown linear lesions run parallel to leaf veins, usually 2–10 mm long and 1–1.5 mm wide.',
      'On susceptible varieties, lesions may enlarge and join into brown linear dead areas.',
      'Glume lesions are often shorter and wider; brown lesions can also occur on pedicels.',
      'Leaf sheaths can develop a netlike pattern of brown and light-brown-to-yellow areas known as net blotch.',
    ],
    conditions: [
      'Disease is more severe during late growth as plants approach maturity.',
      'Severity varies by year and by the susceptibility of the variety.',
      'RRDI does not publish a separate weather or soil conditions list on this page.',
    ],
    management: [
      'Apply urea only at recommended rates or according to a leaf colour chart.',
      'Improve soil with organic fertilizer for the following season.',
      'Use certified disease-free seed paddy and control weeds.',
      'Add burnt paddy husk at 250 kg per acre during land preparation, as advised by RRDI.',
      'Do not return infected straw to the field.',
    ],
    sources: [{ label: 'Sri Lanka RRDI — Narrow brown leaf spot', url: 'https://doa.gov.lk/rrdi_ricediseases_narrowbrownleafspot/' }],
  },

  rice_leaf_folder: {
    name: 'Rice Leaffolder',
    cause: 'Insect pest: leaf-folding caterpillars',
    affected: [
      'The caterpillar (larval) stage attacks leaves and feeds on the mesophyll inside a folded leaf.',
      'Feeding reduces productive leaf area and can restrict plant growth.',
    ],
    symptoms: [
      'Leaf edges are fastened together, forming a rolled or folded shelter containing the caterpillar.',
      'Feeding removes green tissue and leaves scraped, pale, or transparent areas along the blade.',
    ],
    conditions: [
      'Cloudy, humid, and shady conditions.',
      'High nitrogen-fertilizer application.',
    ],
    management: [
      'Establish the crop at the recommended spacing and use only the recommended nitrogen rate.',
      'Monitor the crop regularly.',
      'RRDI gives an economic threshold of 25% of leaves showing more than 50% damage before control action.',
      'If control is required, RRDI recommends a safer insect growth regulator (IGR); use only a currently registered product and follow its label.',
    ],
    sources: [{ label: 'Sri Lanka RRDI — Rice leaffolders', url: 'https://doa.gov.lk/rrdi_pests_riceleaffolders/' }],
  },

  rice_stripes: {
    name: 'Rice Stripe Virus Disease',
    cause: 'Virus: rice stripe virus, transmitted mainly by the small brown planthopper',
    note: 'This disease is not listed on RRDI’s common rice-diseases page. Treat an apparent Sri Lankan case as uncommon and seek RRDI or plant-pathology confirmation because nutrient disorders and other viruses can also cause striping.',
    affected: [
      'Leaves and leaf sheaths show the clearest damage; the whole plant and panicles may be affected.',
      'Seedling to early-tillering plants are most vulnerable. Later infection is usually less severe.',
    ],
    symptoms: [
      'Chlorotic to yellowish-white stripes, mottling, and grey or brown necrotic streaks develop along leaves.',
      'Early-infected leaves may remain folded, twist, wilt, and droop; plants are stunted and produce few tillers.',
      'Severe early infection can kill plants. Surviving plants may produce few, poorly exserted panicles with deformed or unfilled spikelets.',
    ],
    conditions: [
      'Presence of viruliferous small brown planthoppers and nearby infected rice, ratoons, stubble, or grassy weeds.',
      'Young crops are at greatest risk when vector movement peaks.',
      'Classic rice stripe virus is primarily reported in temperate East Asia, so local laboratory confirmation is especially important.',
    ],
    management: [
      'There is no curative treatment for an infected plant; focus on prevention and vector management.',
      'Use locally recommended resistant varieties where available and plant synchronously across the area.',
      'Remove infected plants, ratoons, previous-crop stubble, and grassy weeds that can maintain the virus or vector.',
      'Adjust planting time to avoid peak movement of viruliferous planthoppers where local surveillance data are available.',
      'Use insecticides only on local extension advice and according to the label; indiscriminate use promotes vector resistance.',
    ],
    sources: [
      { label: 'IRRI Rice Doctor — Rice stripe', url: 'https://www.knowledgebank.irri.org/decision-tools/rice-doctor/rice-doctor-fact-sheets/item/rice-stripe' },
      { label: 'Sri Lanka RRDI — Common rice diseases index', url: RRDI_DISEASES_URL },
    ],
  },

  tungro: {
    name: 'Rice Tungro Disease',
    cause: 'Virus complex: rice tungro bacilliform and spherical viruses, transmitted by leafhoppers',
    note: 'Tungro is not listed on RRDI’s common-diseases page, but Sri Lankan rice-disease literature reports tungro-associated viruses. It is uncommon enough that suspected cases should be confirmed by RRDI or a plant-pathology laboratory.',
    affected: [
      'Plants can be infected at any growth stage, most often during the vegetative phase.',
      'Plants are most vulnerable at tillering; leaves, tillers, panicles, and grain development are affected.',
    ],
    symptoms: [
      'Yellow to orange-yellow discoloration begins at the leaf tip and extends down the blade.',
      'Leaves may be mottled or striped with rust-coloured spots and dead tissue between veins.',
      'Plants become stunted, flower late, and produce fewer tillers.',
      'Panicles may be small and incompletely exserted, with sterile or partly filled grains carrying dark-brown blotches.',
    ],
    conditions: [
      'Green leafhoppers, especially where virus sources are already present.',
      'Infected stubble and regrowth, volunteer rice, nearby infected fields, and infected nursery seedlings.',
      'Young plants and late-planted fields are at greater risk when leafhopper populations are active.',
    ],
    management: [
      'An infected plant cannot be cured; preventive measures are more effective than direct treatment.',
      'Use locally recommended tungro- or leafhopper-resistant varieties where available.',
      'Plant synchronously with nearby farms and avoid late planting relative to the local season.',
      'Plough infected stubble immediately after harvest and remove volunteer rice to reduce virus sources and leafhopper breeding sites.',
      'Do not rely on routine insecticide spraying alone: mobile leafhoppers can spread the virus after very short feeding periods. Follow local extension advice.',
    ],
    sources: [
      { label: 'IRRI Rice Knowledge Bank — Tungro', url: 'https://www.knowledgebank.irri.org/training/fact-sheets/pest-management/diseases/item/tungro' },
      { label: 'Rice diseases in Sri Lanka — research review', url: 'https://dl.nsf.gov.lk/server/api/core/bitstreams/f5826835-a109-4da5-bc11-381a3497ded0/content' },
      { label: 'Sri Lanka RRDI — Common rice diseases index', url: RRDI_DISEASES_URL },
    ],
  },
}

export function getDiseaseName(value = '') {
  if (value === 'healthy') return 'Healthy'
  return DISEASE_GUIDANCE[value]?.name || value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export const GUIDANCE_INDEX_SOURCES = [
  { label: 'RRDI common rice diseases', url: RRDI_DISEASES_URL },
  { label: 'RRDI pests of rice', url: RRDI_PESTS_URL },
]
