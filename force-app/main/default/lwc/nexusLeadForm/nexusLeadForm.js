import { LightningElement, track } from "lwc";
import createLead from "@salesforce/apex/LeadController.createLead";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

const REQUIRED = "This field is required.";

/* eslint-disable no-irregular-whitespace */
const COUNTRY_DATA = [
  {
    code: "DZ",
    name: "Algeria",
    dial: "+213",
    states: [
      "Adrar",
      "Aïn Defla",
      "Aïn Témouchent",
      "Alger",
      "Annaba",
      "Batna",
      "Béchar",
      "Béjaïa",
      "Biskra",
      "Blida",
      "Bordj Bou Arréridj",
      "Bouira",
      "Boumerdès",
      "Chlef",
      "Constantine",
      "Djelfa",
      "El Bayadh",
      "El Oued",
      "El Tarf",
      "Ghardaïa",
      "Guelma",
      "Illizi",
      "Jijel",
      "Khenchela",
      "Laghouat",
      "Mascara",
      "Médéa",
      "Mila",
      "Mostaganem",
      "MSila",
      "Naâma",
      "Oran",
      "Ouargla",
      "Oum El Bouaghi",
      "Relizane",
      "Saïda",
      "Sétif",
      "Sidi Bel Abbès",
      "Skikda",
      "Souk Ahras",
      "Tamanrasset",
      "Tébessa",
      "Tiaret",
      "Tindouf",
      "Tipaza",
      "Tissemsilt",
      "Tizi Ouzou",
      "Tlemcen"
    ]
  },
  {
    code: "MA",
    name: "Morocco",
    dial: "+212",
    states: [
      "Béni Mellal-Khénifra",
      "Casablanca-Settat",
      "Darâa-Tafilalet",
      "Fès-Meknès",
      "Guelmim-Oued Noun",
      "Laâyoune-Sakia El Hamra",
      "Marrakech-Safi",
      "Oriental",
      "Rabat-Salé-Kénitra",
      "Souss-Massa",
      "Tanger-Tétouan-Al Hoceïma",
      "Dakhla-Oued Ed-Dahab"
    ]
  },
  {
    code: "TN",
    name: "Tunisia",
    dial: "+216",
    states: [
      "Ariana",
      "Béja",
      "Ben Arous",
      "Bizerte",
      "Gabès",
      "Gafsa",
      "Jendouba",
      "Kairouan",
      "Kasserine",
      "Kébili",
      "Kef",
      "Mahdia",
      "Manouba",
      "Médenine",
      "Monastir",
      "Nabeul",
      "Sfax",
      "Sidi Bouzid",
      "Siliana",
      "Sousse",
      "Tataouine",
      "Tozeur",
      "Tunis",
      "Zaghouan"
    ]
  },
  { code: "LY", name: "Libya", dial: "+218" },
  {
    code: "EG",
    name: "Egypt",
    dial: "+20",
    states: [
      "Alexandria",
      "Assiut",
      "Aswan",
      "Beheira",
      "Beni Suef",
      "Cairo",
      "Dakahlia",
      "Damietta",
      "Faiyum",
      "Gharbia",
      "Giza",
      "Ismailia",
      "Kafr El Sheikh",
      "Luxor",
      "Matruh",
      "Minya",
      "Monufia",
      "New Valley",
      "North Sinai",
      "Port Said",
      "Qalyubia",
      "Qena",
      "Red Sea",
      "Sharqia",
      "Sohag",
      "South Sinai",
      "Suez"
    ]
  },
  { code: "SD", name: "Sudan", dial: "+249" },
  { code: "MR", name: "Mauritania", dial: "+222" },
  {
    code: "AE",
    name: "United Arab Emirates",
    dial: "+971",
    states: [
      "Abu Dhabi",
      "Ajman",
      "Dubai",
      "Fujairah",
      "Ras Al Khaimah",
      "Sharjah",
      "Umm Al Quwain"
    ]
  },
  {
    code: "SA",
    name: "Saudi Arabia",
    dial: "+966",
    states: [
      "Riyadh",
      "Makkah",
      "Madinah",
      "Eastern Province",
      "Asir",
      "Tabuk",
      "Hail",
      "Northern Borders",
      "Jazan",
      "Najran",
      "Al Bahah",
      "Al Jawf",
      "Qassim"
    ]
  },
  { code: "QA", name: "Qatar", dial: "+974" },
  { code: "KW", name: "Kuwait", dial: "+965" },
  { code: "BH", name: "Bahrain", dial: "+973" },
  { code: "OM", name: "Oman", dial: "+968" },
  { code: "JO", name: "Jordan", dial: "+962" },
  { code: "LB", name: "Lebanon", dial: "+961" },
  { code: "IQ", name: "Iraq", dial: "+964" },
  {
    code: "TR",
    name: "Turkey",
    dial: "+90",
    states: [
      "Adana",
      "Ankara",
      "Antalya",
      "Bursa",
      "Gaziantep",
      "Istanbul",
      "Izmir",
      "Kayseri",
      "Konya",
      "Mersin"
    ]
  },
  { code: "IL", name: "Israel", dial: "+972" },
  { code: "IR", name: "Iran", dial: "+98" },
  {
    code: "FR",
    name: "France",
    dial: "+33",
    states: [
      "Auvergne-Rhône-Alpes",
      "Bourgogne-Franche-Comté",
      "Bretagne",
      "Centre-Val de Loire",
      "Corse",
      "Grand Est",
      "Hauts-de-France",
      "Île-de-France",
      "Normandie",
      "Nouvelle-Aquitaine",
      "Occitanie",
      "Pays de la Loire",
      "Provence-Alpes-Côte Azur",
      "Guadeloupe",
      "Guyane",
      "La Réunion",
      "Martinique",
      "Mayotte"
    ]
  },
  {
    code: "DE",
    name: "Germany",
    dial: "+49",
    states: [
      "Baden-Württemberg",
      "Bavaria",
      "Berlin",
      "Brandenburg",
      "Bremen",
      "Hamburg",
      "Hesse",
      "Lower Saxony",
      "Mecklenburg-Vorpommern",
      "North Rhine-Westphalia",
      "Rhineland-Palatinate",
      "Saarland",
      "Saxony",
      "Saxony-Anhalt",
      "Schleswig-Holstein",
      "Thuringia"
    ]
  },
  {
    code: "GB",
    name: "United Kingdom",
    dial: "+44",
    states: ["England", "Northern Ireland", "Scotland", "Wales"]
  },
  {
    code: "IT",
    name: "Italy",
    dial: "+39",
    states: [
      "Abruzzo",
      "Basilicata",
      "Calabria",
      "Campania",
      "Emilia-Romagna",
      "Friuli-Venezia Giulia",
      "Lazio",
      "Liguria",
      "Lombardia",
      "Marche",
      "Molise",
      "Piemonte",
      "Puglia",
      "Sardegna",
      "Sicilia",
      "Toscana",
      "Trentino-Alto Adige",
      "Umbria",
      "Valle d Aosta",
      "Veneto"
    ]
  },
  {
    code: "ES",
    name: "Spain",
    dial: "+34",
    states: [
      "Andalusia",
      "Aragon",
      "Asturias",
      "Balearic Islands",
      "Basque Country",
      "Canary Islands",
      "Cantabria",
      "Castile-La Mancha",
      "Castile and León",
      "Catalonia",
      "Extremadura",
      "Galicia",
      "La Rioja",
      "Madrid",
      "Murcia",
      "Navarre",
      "Valencia"
    ]
  },
  {
    code: "BE",
    name: "Belgium",
    dial: "+32",
    states: ["Brussels", "Flanders", "Wallonia"]
  },
  {
    code: "NL",
    name: "Netherlands",
    dial: "+31",
    states: [
      "Drenthe",
      "Flevoland",
      "Friesland",
      "Gelderland",
      "Groningen",
      "Limburg",
      "North Brabant",
      "North Holland",
      "Overijssel",
      "South Holland",
      "Utrecht",
      "Zeeland"
    ]
  },
  {
    code: "CH",
    name: "Switzerland",
    dial: "+41",
    states: [
      "Aargau",
      "Basel",
      "Bern",
      "Fribourg",
      "Geneva",
      "Graubünden",
      "Jura",
      "Lucerne",
      "Neuchâtel",
      "Nidwalden",
      "Obwalden",
      "Schaffhausen",
      "Schwyz",
      "Solothurn",
      "St. Gallen",
      "Thurgau",
      "Ticino",
      "Uri",
      "Valais",
      "Vaud",
      "Zug",
      "Zürich"
    ]
  },
  {
    code: "PT",
    name: "Portugal",
    dial: "+351",
    states: [
      "Alentejo",
      "Algarve",
      "Azores",
      "Centro",
      "Lisboa",
      "Madeira",
      "Norte"
    ]
  },
  { code: "AT", name: "Austria", dial: "+43" },
  { code: "SE", name: "Sweden", dial: "+46" },
  { code: "NO", name: "Norway", dial: "+47" },
  { code: "DK", name: "Denmark", dial: "+45" },
  { code: "FI", name: "Finland", dial: "+358" },
  {
    code: "PL",
    name: "Poland",
    dial: "+48",
    states: [
      "Dolnoslaskie",
      "Kujawsko-Pomorskie",
      "Lodzkie",
      "Lubelskie",
      "Lubuskie",
      "Malopolskie",
      "Mazowieckie",
      "Opolskie",
      "Podkarpackie",
      "Podlaskie",
      "Pomorskie",
      "Slaskie",
      "Swietokrzyskie",
      "Warminsko-Mazurskie",
      "Wielkopolskie",
      "Zachodniopomorskie"
    ]
  },
  { code: "CZ", name: "Czech Republic", dial: "+420" },
  { code: "RO", name: "Romania", dial: "+40" },
  { code: "GR", name: "Greece", dial: "+30" },
  { code: "HU", name: "Hungary", dial: "+36" },
  { code: "RU", name: "Russia", dial: "+7" },
  { code: "UA", name: "Ukraine", dial: "+380" },
  {
    code: "US",
    name: "United States",
    dial: "+1",
    states: [
      "Alabama",
      "Alaska",
      "Arizona",
      "Arkansas",
      "California",
      "Colorado",
      "Connecticut",
      "Delaware",
      "Florida",
      "Georgia",
      "Hawaii",
      "Idaho",
      "Illinois",
      "Indiana",
      "Iowa",
      "Kansas",
      "Kentucky",
      "Louisiana",
      "Maine",
      "Maryland",
      "Massachusetts",
      "Michigan",
      "Minnesota",
      "Mississippi",
      "Missouri",
      "Montana",
      "Nebraska",
      "Nevada",
      "New Hampshire",
      "New Jersey",
      "New Mexico",
      "New York",
      "North Carolina",
      "North Dakota",
      "Ohio",
      "Oklahoma",
      "Oregon",
      "Pennsylvania",
      "Rhode Island",
      "South Carolina",
      "South Dakota",
      "Tennessee",
      "Texas",
      "Utah",
      "Vermont",
      "Virginia",
      "Washington",
      "West Virginia",
      "Wisconsin",
      "Wyoming",
      "Washington D.C."
    ]
  },
  {
    code: "CA",
    name: "Canada",
    dial: "+1",
    states: [
      "Alberta",
      "British Columbia",
      "Manitoba",
      "New Brunswick",
      "Newfoundland and Labrador",
      "Northwest Territories",
      "Nova Scotia",
      "Nunavut",
      "Ontario",
      "Prince Edward Island",
      "Quebec",
      "Saskatchewan",
      "Yukon"
    ]
  },
  {
    code: "BR",
    name: "Brazil",
    dial: "+55",
    states: [
      "Acre",
      "Alagoas",
      "Amapa",
      "Amazonas",
      "Bahia",
      "Ceara",
      "Distrito Federal",
      "Espirito Santo",
      "Goias",
      "Maranhao",
      "Mato Grosso",
      "Mato Grosso do Sul",
      "Minas Gerais",
      "Para",
      "Paraiba",
      "Parana",
      "Pernambuco",
      "Piaui",
      "Rio de Janeiro",
      "Rio Grande do Norte",
      "Rio Grande do Sul",
      "Rondonia",
      "Roraima",
      "Santa Catarina",
      "Sao Paulo",
      "Sergipe",
      "Tocantins"
    ]
  },
  {
    code: "MX",
    name: "Mexico",
    dial: "+52",
    states: [
      "Aguascalientes",
      "Baja California",
      "Baja California Sur",
      "Campeche",
      "Chiapas",
      "Chihuahua",
      "Coahuila",
      "Colima",
      "Durango",
      "Guanajuato",
      "Guerrero",
      "Hidalgo",
      "Jalisco",
      "Mexico City",
      "Michoacan",
      "Morelos",
      "Nayarit",
      "Nuevo Leon",
      "Oaxaca",
      "Puebla",
      "Queretaro",
      "Quintana Roo",
      "San Luis Potosi",
      "Sinaloa",
      "Sonora",
      "Tabasco",
      "Tamaulipas",
      "Tlaxcala",
      "Veracruz",
      "Yucatan",
      "Zacatecas"
    ]
  },
  { code: "AR", name: "Argentina", dial: "+54" },
  { code: "CL", name: "Chile", dial: "+56" },
  { code: "CO", name: "Colombia", dial: "+57" },
  { code: "PE", name: "Peru", dial: "+51" },
  {
    code: "IN",
    name: "India",
    dial: "+91",
    states: [
      "Andhra Pradesh",
      "Arunachal Pradesh",
      "Assam",
      "Bihar",
      "Chhattisgarh",
      "Delhi",
      "Goa",
      "Gujarat",
      "Haryana",
      "Himachal Pradesh",
      "Jharkhand",
      "Karnataka",
      "Kerala",
      "Madhya Pradesh",
      "Maharashtra",
      "Manipur",
      "Meghalaya",
      "Mizoram",
      "Nagaland",
      "Odisha",
      "Punjab",
      "Rajasthan",
      "Sikkim",
      "Tamil Nadu",
      "Telangana",
      "Tripura",
      "Uttar Pradesh",
      "Uttarakhand",
      "West Bengal"
    ]
  },
  {
    code: "CN",
    name: "China",
    dial: "+86",
    states: [
      "Anhui",
      "Beijing",
      "Chongqing",
      "Fujian",
      "Gansu",
      "Guangdong",
      "Guangxi",
      "Guizhou",
      "Hainan",
      "Hebei",
      "Heilongjiang",
      "Henan",
      "Hubei",
      "Hunan",
      "Inner Mongolia",
      "Jiangsu",
      "Jiangxi",
      "Jilin",
      "Liaoning",
      "Ningxia",
      "Qinghai",
      "Shaanxi",
      "Shandong",
      "Shanghai",
      "Shanxi",
      "Sichuan",
      "Tianjin",
      "Tibet",
      "Xinjiang",
      "Yunnan",
      "Zhejiang"
    ]
  },
  {
    code: "JP",
    name: "Japan",
    dial: "+81",
    states: [
      "Aichi",
      "Akita",
      "Aomori",
      "Chiba",
      "Ehime",
      "Fukui",
      "Fukuoka",
      "Fukushima",
      "Gifu",
      "Gunma",
      "Hiroshima",
      "Hokkaido",
      "Hyogo",
      "Ibaraki",
      "Ishikawa",
      "Iwate",
      "Kagawa",
      "Kagoshima",
      "Kanagawa",
      "Kochi",
      "Kumamoto",
      "Kyoto",
      "Mie",
      "Miyagi",
      "Miyazaki",
      "Nagano",
      "Nagasaki",
      "Nara",
      "Niigata",
      "Oita",
      "Okayama",
      "Okinawa",
      "Osaka",
      "Saga",
      "Saitama",
      "Shiga",
      "Shimane",
      "Shizuoka",
      "Tochigi",
      "Tokushima",
      "Tokyo",
      "Tottori",
      "Toyama",
      "Wakayama",
      "Yamagata",
      "Yamaguchi",
      "Yamanashi"
    ]
  },
  { code: "KR", name: "South Korea", dial: "+82" },
  { code: "PK", name: "Pakistan", dial: "+92" },
  { code: "BD", name: "Bangladesh", dial: "+880" },
  { code: "ID", name: "Indonesia", dial: "+62" },
  { code: "MY", name: "Malaysia", dial: "+60" },
  { code: "SG", name: "Singapore", dial: "+65" },
  { code: "TH", name: "Thailand", dial: "+66" },
  { code: "VN", name: "Vietnam", dial: "+84" },
  { code: "PH", name: "Philippines", dial: "+63" },
  {
    code: "ZA",
    name: "South Africa",
    dial: "+27",
    states: [
      "Eastern Cape",
      "Free State",
      "Gauteng",
      "KwaZulu-Natal",
      "Limpopo",
      "Mpumalanga",
      "North West",
      "Northern Cape",
      "Western Cape"
    ]
  },
  { code: "NG", name: "Nigeria", dial: "+234" },
  { code: "KE", name: "Kenya", dial: "+254" },
  { code: "GH", name: "Ghana", dial: "+233" },
  { code: "SN", name: "Senegal", dial: "+221" },
  { code: "CI", name: "Cote d Ivoire", dial: "+225" },
  { code: "CM", name: "Cameroon", dial: "+237" },
  { code: "ET", name: "Ethiopia", dial: "+251" },
  { code: "TZ", name: "Tanzania", dial: "+255" },
  {
    code: "AU",
    name: "Australia",
    dial: "+61",
    states: [
      "Australian Capital Territory",
      "New South Wales",
      "Northern Territory",
      "Queensland",
      "South Australia",
      "Tasmania",
      "Victoria",
      "Western Australia"
    ]
  },
  { code: "NZ", name: "New Zealand", dial: "+64" }
];

export default class NexusLeadForm extends LightningElement {
  @track step = 1;
  @track submitted = false;
  @track isLoading = false;
  @track errors = {};

  // Custom dropdown state
  @track countryOpen = false;
  @track dialOpen = false;
  @track countrySearch = "";
  @track dialSearch = "";

  @track gender = "";
  @track firstName = "";
  @track lastName = "";
  @track email = "";
  @track phoneDialCode = "";
  @track phoneDialCountry = "";
  @track phoneNumber = "";
  @track responsibility = "";
  @track companyName = "";
  @track industry = "";
  @track employeeCount = "";
  @track annualRevenue = "";
  @track country = "";
  @track city = "";
  @track state = "";
  @track zip = "";
  @track domain = "";
  @track intent = "";

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  connectedCallback() {
    this._closeAll = () => {
      this.countryOpen = false;
      this.dialOpen = false;
    };
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    document.addEventListener("click", this._closeAll);

    this._scrollSelf = () => {
      this.template.host.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    window.addEventListener("nexusscrolltoleadform", this._scrollSelf);
  }
  disconnectedCallback() {
    document.removeEventListener("click", this._closeAll);
    window.removeEventListener("nexusscrolltoleadform", this._scrollSelf);
  }

  // ── Computed ──────────────────────────────────────────────────────────────
  get isStep1() {
    return this.step === 1;
  }
  get isStep2() {
    return this.step === 2;
  }
  get isSubmitted() {
    return this.submitted;
  }
  get stepLabel() {
    return `Step ${this.step} / 2`;
  }
  get stepTitle() {
    return this.step === 1 ? "Personal Information" : "Your Company";
  }
  get stepDesc() {
    return this.step === 1
      ? "Tell us about yourself to personalise your experience."
      : "Tell us about your company so we can tailor our offerings.";
  }
  get anyDropdownOpen() {
    return this.countryOpen || this.dialOpen;
  }

  // ── Custom dropdown — country ─────────────────────────────────────────────
  get selectedCountryLabel() {
    if (!this.country) return "";
    const f = COUNTRY_DATA.find((c) => c.code === this.country);
    return f ? f.name : "";
  }
  get countryTriggerCls() {
    let base = "nlf-custom-select";
    if (this.errors.country) base += " nlf-cs-error";
    else if (this.country) base += " nlf-cs-valid";
    if (this.countryOpen) base += " nlf-cs-open";
    return base;
  }
  get filteredCountries() {
    const q = (this.countrySearch || "").toLowerCase();
    const list = q
      ? COUNTRY_DATA.filter((c) => c.name.toLowerCase().includes(q))
      : COUNTRY_DATA;
    return list.map((c) => ({
      value: c.code,
      label: c.name,
      cls:
        c.code === this.country
          ? "nlf-dropdown-item nlf-di-selected"
          : "nlf-dropdown-item"
    }));
  }

  // ── Custom dropdown — phone dial ──────────────────────────────────────────
  get selectedDialLabel() {
    if (!this.phoneDialCode || !this.phoneDialCountry) return "";
    const f = COUNTRY_DATA.find((c) => c.code === this.phoneDialCountry);
    return f ? this.phoneDialCode + "  " + f.name : this.phoneDialCode;
  }
  get dialTriggerCls() {
    let base = "nlf-custom-select nlf-phone-dial";
    if (this.errors.phone && !this.phoneDialCode) base += " nlf-cs-error";
    else if (this.phoneDialCode) base += " nlf-cs-valid";
    if (this.dialOpen) base += " nlf-cs-open";
    return base;
  }
  get filteredDialCodes() {
    const q = (this.dialSearch || "").toLowerCase();
    const list = q
      ? COUNTRY_DATA.filter(
          (c) => c.name.toLowerCase().includes(q) || c.dial.includes(q)
        )
      : COUNTRY_DATA;
    return list.map((c) => ({
      value: c.code + ":" + c.dial,
      label: c.dial + "   " + c.name,
      cls:
        c.code === this.phoneDialCountry
          ? "nlf-dropdown-item nlf-di-selected"
          : "nlf-dropdown-item"
    }));
  }

  // ── Country / state data ──────────────────────────────────────────────────
  get countryStates() {
    const f = COUNTRY_DATA.find((c) => c.code === this.country);
    return f && f.states ? f.states : [];
  }
  get hasCountryStates() {
    return this.countryStates.length > 0;
  }
  get noCountry() {
    return !this.country;
  }
  get cityPlaceholder() {
    if (!this.country) return "Select a country first";
    const f = COUNTRY_DATA.find((c) => c.code === this.country);
    return f ? "City in " + f.name : "Enter city";
  }
  get statePlaceholder() {
    return this.country ? "Enter state / province" : "Select a country first";
  }

  industryOptions = [
    { label: "Technology", value: "Technologie" },
    { label: "Industry", value: "Industrie" },
    { label: "Services", value: "Services" },
    { label: "Healthcare", value: "Santé" },
    { label: "Finance", value: "Finance" }
  ];

  // ── Field wrapper class helpers ───────────────────────────────────────────
  _fc(val, field) {
    if (this.errors[field]) return "nlf-field nlf-field--error";
    if (val !== undefined && val !== "") return "nlf-field nlf-field--valid";
    return "nlf-field";
  }
  get firstNameFc() {
    return this._fc(this.firstName, "firstName");
  }
  get lastNameFc() {
    return this._fc(this.lastName, "lastName");
  }
  get emailFc() {
    return this._fc(this.email, "email");
  }
  get phoneFc() {
    if (this.errors.phone) return "nlf-field nlf-field--error";
    if (this.phoneDialCode && this.phoneNumber)
      return "nlf-field nlf-field--valid";
    return "nlf-field";
  }
  get responsibilityFc() {
    return this._fc(this.responsibility, "responsibility");
  }
  get companyNameFc() {
    return this._fc(this.companyName, "companyName");
  }
  get industryFc() {
    return this._fc(this.industry, "industry");
  }
  get employeeCountFc() {
    return this._fc(this.employeeCount, "employeeCount");
  }
  get domainFc() {
    return this._fc(this.domain, "domain");
  }
  get intentFc() {
    return this._fc(this.intent, "intent");
  }
  get annualRevenueFc() {
    return this._fc(this.annualRevenue, "annualRevenue");
  }
  get countryFc() {
    return this._fc(this.country, "country");
  }
  get cityFc() {
    return this._fc(this.city, "city");
  }
  get stateFc() {
    return this._fc(this.state, "state");
  }
  get zipFc() {
    return this._fc(this.zip, "zip");
  }

  // ── Custom dropdown handlers ──────────────────────────────────────────────
  toggleCountryDropdown(e) {
    e.stopPropagation();
    this.countryOpen = !this.countryOpen;
    this.dialOpen = false;
  }
  toggleDialDropdown(e) {
    e.stopPropagation();
    this.dialOpen = !this.dialOpen;
    this.countryOpen = false;
  }
  stopProp(e) {
    e.stopPropagation();
  }

  handleCountrySearch(e) {
    e.stopPropagation();
    this.countrySearch = e.target.value;
  }
  handleDialSearch(e) {
    e.stopPropagation();
    this.dialSearch = e.target.value;
  }

  selectCountry(e) {
    e.stopPropagation();
    this.country = e.currentTarget.dataset.value;
    this.countryOpen = false;
    this.countrySearch = "";
    this.state = "";
    this.city = "";
    this.zip = "";
    this._clearErr("country");
    this._clearErr("state");
    this._clearErr("city");
    this._clearErr("zip");
  }
  selectDial(e) {
    e.stopPropagation();
    const val = e.currentTarget.dataset.value; // "FR:+33"
    const parts = val.split(":");
    this.phoneDialCountry = parts[0];
    this.phoneDialCode = parts[1];
    this.dialOpen = false;
    this.dialSearch = "";
    this._clearErr("phone");
  }
  closeDropdowns() {
    this.countryOpen = false;
    this.dialOpen = false;
  }

  // ── Field change handlers ─────────────────────────────────────────────────
  handleGender(e) {
    this.gender = e.target.value;
  }
  handleFirstName(e) {
    this.firstName = e.target.value;
    this._clearErr("firstName");
  }
  handleLastName(e) {
    this.lastName = e.target.value;
    this._clearErr("lastName");
  }
  handleEmail(e) {
    this.email = e.target.value;
    this._clearErr("email");
  }
  handlePhoneNumber(e) {
    this.phoneNumber = e.target.value;
    this._clearErr("phone");
  }
  handleResponsibility(e) {
    this.responsibility = e.target.value;
    this._clearErr("responsibility");
  }
  handleCompanyName(e) {
    this.companyName = e.target.value;
    this._clearErr("companyName");
  }
  handleIndustry(e) {
    this.industry = e.target.value;
    this._clearErr("industry");
  }
  handleEmployeeCount(e) {
    this.employeeCount = e.target.value;
    this._clearErr("employeeCount");
  }
  handleAnnualRevenue(e) {
    this.annualRevenue = e.target.value;
    this._clearErr("annualRevenue");
  }
  handleCity(e) {
    this.city = e.target.value;
    this._clearErr("city");
  }
  handleState(e) {
    this.state = e.target.value;
    this._clearErr("state");
  }
  handleZip(e) {
    this.zip = e.target.value;
    this._clearErr("zip");
  }
  handleDomain(e) {
    this.domain = e.target.value;
    this._clearErr("domain");
  }
  handleIntent(e) {
    this.intent = e.target.value;
    this._clearErr("intent");
  }

  _clearErr(field) {
    if (this.errors[field]) this.errors = { ...this.errors, [field]: "" };
  }

  // ── Blur validation ───────────────────────────────────────────────────────
  handleBlur(e) {
    const field = e.target.dataset.field;
    if (field === "phoneNumber") this._validatePhone();
    else if (field) this._validateField(field, e.target.value);
  }

  _validateField(field, value) {
    const v = (value || "").trim();
    let err = "";
    switch (field) {
      case "firstName":
      case "lastName":
      case "responsibility":
      case "companyName":
      case "country":
      case "city":
      case "state":
      case "zip":
      case "domain":
        err = v ? "" : REQUIRED;
        break;
      case "email":
        if (!v) err = REQUIRED;
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
          err = "Invalid email address.";
        break;
      case "industry":
      case "intent":
        err = v ? "" : REQUIRED;
        break;
      case "employeeCount":
        if (!v) err = REQUIRED;
        else if (isNaN(v) || Number(v) <= 0)
          err = "Please enter a valid number.";
        break;
      case "annualRevenue":
        if (!v) err = REQUIRED;
        else if (isNaN(v) || Number(v) < 0)
          err = "Please enter a valid amount.";
        break;
      default:
        break;
    }
    this.errors = { ...this.errors, [field]: err };
    return !err;
  }

  _validatePhone() {
    if (!this.phoneDialCode) {
      this.errors = { ...this.errors, phone: "Please select a country code." };
      return false;
    }
    const num = (this.phoneNumber || "").trim();
    if (!num) {
      this.errors = { ...this.errors, phone: "Phone number is required." };
      return false;
    }
    if (num.replace(/[\s\-()+]/g, "").length < 4) {
      this.errors = {
        ...this.errors,
        phone: "Please enter a valid phone number."
      };
      return false;
    }
    this.errors = { ...this.errors, phone: "" };
    return true;
  }

  // ── Step validation ───────────────────────────────────────────────────────
  _validateStep1() {
    const fields = ["firstName", "lastName", "email", "responsibility"];
    const valid = fields.reduce((ok, f) => {
      const el = this.template.querySelector(`[data-field="${f}"]`);
      return this._validateField(f, el ? el.value : this[f]) && ok;
    }, true);
    return this._validatePhone() && valid;
  }

  _validateStep2() {
    const fields = [
      "companyName",
      "industry",
      "employeeCount",
      "domain",
      "intent",
      "annualRevenue",
      "country",
      "state",
      "city",
      "zip"
    ];
    return fields.reduce((ok, f) => {
      const el = this.template.querySelector(`[data-field="${f}"]`);
      return this._validateField(f, el ? el.value : this[f]) && ok;
    }, true);
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  handleNext() {
    if (this._validateStep1()) this.step = 2;
  }
  handleBack() {
    this.step = 1;
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async handleSubmit(event) {
    event.preventDefault();
    if (!this._validateStep2()) return;
    this.isLoading = true;
    const salutation =
      this.gender === "M" ? "Mr." : this.gender === "F" ? "Ms." : "";
    try {
      await createLead({
        salutation,
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email,
        phone: this.phoneDialCode + " " + this.phoneNumber,
        title: this.responsibility,
        company: this.companyName,
        industry: this.industry,
        employees: this.employeeCount,
        annualRevenue: this.annualRevenue
          ? parseFloat(this.annualRevenue)
          : null,
        country: this.country,
        city: this.city,
        state: this.state,
        zip: this.zip,
        description: "",
        website: this.domain,
        intent: this.intent
      });
      this.submitted = true;
    } catch (e) {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Error",
          message: e.body.message,
          variant: "error"
        })
      );
    } finally {
      this.isLoading = false;
    }
  }
}
