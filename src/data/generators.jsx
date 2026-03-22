import { stockLogo, cryptoLogo, flagUrl, forexLogo } from "./logos.js";

const _s = { v: 42 };
const rng = () => { _s.v = (_s.v * 16807 + 0) % 2147483647; return (_s.v - 1) / 2147483646; };
const rngR = (a, b) => a + rng() * (b - a);
const rngI = (a, b) => Math.floor(rngR(a, b + 1));
const pick = (a) => a[rngI(0, a.length - 1)];

const SECTORS = ["Technology","Healthcare","Finance","Energy","Consumer","Industrial","Materials","Telecom","Utilities","Real Estate","Automotive","Aerospace","Biotech","Pharma","Semiconductors","Software","E-Commerce","Fintech","AI/Data","Cloud","Cybersecurity","Gaming","Media","Luxury","Food","Retail","Mining","Insurance","Logistics","Defense"];
const EXCHANGES = [
  { pfx: "", w: 3000 }, // US
  { pfx: ".L", w: 800 }, // London
  { pfx: ".PA", w: 600 }, // Paris
  { pfx: ".DE", w: 600 }, // Frankfurt
  { pfx: ".T", w: 700 }, // Tokyo
  { pfx: ".HK", w: 500 }, // Hong Kong
  { pfx: ".SS", w: 400 }, // Shanghai
  { pfx: ".SZ", w: 300 }, // Shenzhen
  { pfx: ".TO", w: 400 }, // Toronto
  { pfx: ".AX", w: 300 }, // Sydney
  { pfx: ".KS", w: 300 }, // Seoul
  { pfx: ".BO", w: 300 }, // Mumbai
  { pfx: ".SA", w: 250 }, // São Paulo
  { pfx: ".MI", w: 200 }, // Milan
  { pfx: ".MC", w: 200 }, // Madrid
  { pfx: ".AS", w: 200 }, // Amsterdam
  { pfx: ".ST", w: 150 }, // Stockholm
  { pfx: ".OL", w: 100 }, // Oslo
  { pfx: ".HE", w: 100 }, // Helsinki
  { pfx: ".JK", w: 150 }, // Jakarta
  { pfx: ".BK", w: 150 }, // Bangkok
  { pfx: ".TW", w: 200 }, // Taipei
  { pfx: ".SG", w: 100 }, // Singapore
  { pfx: ".MX", w: 100 }, // Mexico
];
const PREFIXES = ["Alpha","Beta","Nova","Apex","Prime","Quantum","Vertex","Nexus","Pulse","Core","Titan","Zephyr","Prism","Atlas","Vortex","Flux","Omni","Helix","Astra","Zenith","Cryo","Hyper","Proto","Eco","Aero","Pyro","Terra","Aqua","Solar","Lunar","Stellar","Cosmo","Cyber","Nano","Micro","Macro","Ultra","Meta","Neo","Arch","Digi","Bio","Gen","Ion","Lux","Pax","Rex","Vis","Dyn","Orb"];
const SUFFIXES = ["Tech","Corp","Group","Industries","Holdings","Systems","Solutions","Partners","Capital","Global","Labs","Dynamics","Networks","Ventures","Robotics","Energy","Sciences","Pharma","Materials","Logistics","Digital","Bio","AI","Data","Media","Finance","Health","Motor","Works","Power"];
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// ── Index / Bourse mapping (suffix → index name) ──
const INDEX_MAP = {
    "": "S&P 500",
    ".PA": "CAC 40",
    ".DE": "DAX",
    ".L": "FTSE 100",
    ".MC": "IBEX 35",
    ".MI": "FTSE MIB",
    ".AS": "AEX",
    ".SW": "SMI",
    ".T": "Nikkei 225",
    ".HK": "Hang Seng",
    ".KS": "KOSPI",
    ".TW": "TWSE",
    ".BO": "BSE",
    ".SA": "B3",
    ".AX": "ASX 200",
    ".TO": "TSX",
    ".SS": "Shanghai",
    ".SZ": "Shenzhen",
    ".ST": "Stockholm",
    ".OL": "Oslo",
    ".HE": "Helsinki",
    ".JK": "Jakarta",
    ".BK": "Bangkok",
    ".SG": "SGX",
    ".MX": "BMV"
};
const getStockIndex = (sym) => {
    const dot = sym.indexOf(".");
    const sfx = dot >= 0 ? sym.slice(dot) : "";
    return INDEX_MAP[sfx] || "Autres";
};

// Sector labels for filter chips (French)
const SECTOR_LABELS = {
    "Luxury": "Luxe", "Technology": "Tech", "Finance": "Finance", "Healthcare": "Santé",
    "Pharma": "Pharma", "Energy": "Énergie", "Automotive": "Auto", "Consumer": "Conso",
    "Industrial": "Industrie", "Semiconductors": "Semi-cond.", "Software": "Software",
    "E-Commerce": "E-Commerce", "Materials": "Matériaux", "Telecom": "Télécom",
    "Food": "Aliment.", "Insurance": "Assurance", "Mining": "Mines",
    "Biotech": "Biotech", "Retail": "Retail", "Aerospace": "Aéro",
    "Defense": "Défense", "Media": "Média", "Utilities": "Utilities",
    "Real Estate": "Immo", "Gaming": "Gaming", "AI/Data": "IA/Data",
    "Cloud": "Cloud", "Cybersecurity": "Cyber", "Fintech": "Fintech",
    "Logistics": "Logistique"
};
const getSectorLabel = (s) => SECTOR_LABELS[s] || s;

// Priority order for index filter chips
const INDEX_PRIORITY = ["S&P 500","CAC 40","DAX","FTSE 100","IBEX 35","Nasdaq","FTSE MIB","SMI","AEX","Nikkei 225","Hang Seng","ASX 200","TSX","KOSPI","TWSE","BSE","B3","Shanghai","Shenzhen","Stockholm","Oslo","Helsinki","Jakarta","Bangkok","SGX","BMV","Autres"];
// Priority order for sector filter chips
const SECTOR_PRIORITY = ["Technology","Luxury","Finance","Pharma","Healthcare","Energy","Automotive","Semiconductors","Consumer","Industrial","Software","E-Commerce","Materials","Telecom","Food","Insurance","Biotech","Mining","Retail","Aerospace","Defense","Media","Gaming","AI/Data","Cloud","Cybersecurity","Fintech","Real Estate","Utilities","Logistics"];

// ── Generate 10,000 Stocks ──
const generateStocks = () => {
    _s.v = 42; // reset seed
    const TOP = [
        { sym:"0005.HK",name:"HSBC Holdings",price:68.5,sector:"Finance",cap:"158B",color:"#DB0011" },
        { sym:"000660.KS",name:"SK Hynix",price:135000,sector:"Semiconductors",cap:"98B",color:"#003399" },
        { sym:"005380.KS",name:"Hyundai Motor",price:215000,sector:"Automotive",cap:"48B",color:"#002C5F" },
        { sym:"005930.KS",name:"Samsung Elec.",price:72500,sector:"Technology",cap:"385B",color:"#1428A0" },
        { sym:"035420.KS",name:"Naver Corp.",price:285000,sector:"Technology",cap:"42B",color:"#00C73C" },
        { sym:"051910.KS",name:"LG Chem",price:450000,sector:"Materials",cap:"32B",color:"#A50034" },
        { sym:"0700.HK",name:"Tencent Holdings",price:385.2,sector:"Technology",cap:"445B",color:"#1DA1F2" },
        { sym:"0941.HK",name:"China Mobile",price:72.5,sector:"Telecom",cap:"185B",color:"#003DA5" },
        { sym:"1299.HK",name:"AIA Group",price:72.5,sector:"Insurance",cap:"92B",color:"#003399" },
        { sym:"1810.HK",name:"Xiaomi Corp.",price:18.5,sector:"Technology",cap:"58B",color:"#FF6900" },
        { sym:"1COV.DE",name:"Covestro AG",price:55.4,sector:"Materials",cap:"10B",color:"#003399" },
        { sym:"2020.HK",name:"ANTA Sports",price:92.5,sector:"Consumer",cap:"28B",color:"#003399" },
        { sym:"2317.TW",name:"Hon Hai (Foxconn)",price:108.5,sector:"Technology",cap:"45B",color:"#003399" },
        { sym:"2318.HK",name:"Ping An Insurance",price:42.5,sector:"Insurance",cap:"78B",color:"#DA291C" },
        { sym:"2330.TW",name:"TSMC",price:615.4,sector:"Semiconductors",cap:"620B",color:"#003DA5" },
        { sym:"2454.TW",name:"MediaTek Inc.",price:985.0,sector:"Semiconductors",cap:"68B",color:"#003DA5" },
        { sym:"3690.HK",name:"Meituan",price:125.8,sector:"Technology",cap:"78B",color:"#FFD100" },
        { sym:"4063.T",name:"Shin-Etsu Chemical",price:5250,sector:"Materials",cap:"92B",color:"#003399" },
        { sym:"4502.T",name:"Takeda Pharma",price:4250,sector:"Pharma",cap:"42B",color:"#003DA5" },
        { sym:"4519.T",name:"Chugai Pharma",price:5450,sector:"Pharma",cap:"52B",color:"#003DA5" },
        { sym:"6098.T",name:"Recruit Holdings",price:5850,sector:"Technology",cap:"58B",color:"#003399" },
        { sym:"6367.T",name:"Daikin Industries",price:22500,sector:"Industrial",cap:"68B",color:"#003DA5" },
        { sym:"6501.T",name:"Hitachi Ltd",price:9850,sector:"Technology",cap:"82B",color:"#E60012" },
        { sym:"6758.T",name:"Sony Group",price:12850,sector:"Technology",cap:"125B",color:"#000000" },
        { sym:"6861.T",name:"Keyence Corp.",price:62500,sector:"Technology",cap:"145B",color:"#003399" },
        { sym:"6902.T",name:"Denso Corp.",price:2185,sector:"Automotive",cap:"32B",color:"#003399" },
        { sym:"6954.T",name:"Fanuc Corp.",price:4250,sector:"Industrial",cap:"42B",color:"#FFD100" },
        { sym:"7203.T",name:"Toyota Motor",price:2845,sector:"Automotive",cap:"285B",color:"#EB0A1E" },
        { sym:"7267.T",name:"Honda Motor",price:1650,sector:"Automotive",cap:"52B",color:"#CC0000" },
        { sym:"7741.T",name:"HOYA Corp.",price:18500,sector:"Healthcare",cap:"58B",color:"#003399" },
        { sym:"7974.T",name:"Nintendo Co.",price:7250,sector:"Gaming",cap:"72B",color:"#E60012" },
        { sym:"8035.T",name:"Tokyo Electron",price:28500,sector:"Semiconductors",cap:"98B",color:"#003399" },
        { sym:"8058.T",name:"Mitsubishi Corp.",price:2850,sector:"Industrial",cap:"58B",color:"#E60012" },
        { sym:"8306.T",name:"MUFG Bank",price:1285,sector:"Finance",cap:"118B",color:"#DA291C" },
        { sym:"9432.T",name:"NTT Corp.",price:172,sector:"Telecom",cap:"98B",color:"#003399" },
        { sym:"9433.T",name:"KDDI Corp.",price:4525,sector:"Telecom",cap:"85B",color:"#003399" },
        { sym:"9618.HK",name:"JD.com Inc.",price:128.5,sector:"E-Commerce",cap:"42B",color:"#E31937" },
        { sym:"9984.T",name:"SoftBank Group",price:8450,sector:"Finance",cap:"95B",color:"#F0F0F0" },
        { sym:"9988.HK",name:"Alibaba Group",price:82.4,sector:"E-Commerce",cap:"195B",color:"#FF6A00" },
        { sym:"9999.HK",name:"NetEase Inc.",price:158.4,sector:"Gaming",cap:"58B",color:"#CC0000" },
        { sym:"A",name:"Agilent Technologies",price:135.8,sector:"Healthcare",cap:"42B",color:"#003DA5" },
        { sym:"AAL.L",name:"Anglo American",price:28.5,sector:"Mining",cap:"38B",color:"#003366" },
        { sym:"AAPL",name:"Apple Inc.",price:198.5,sector:"Technology",cap:"3.08T",color:"#A2AAAD" },
        { sym:"ABBN.SW",name:"ABB Ltd",price:42.5,sector:"Industrial",cap:"82B",color:"#FF000F" },
        { sym:"ABEV3.SA",name:"Ambev SA",price:12.5,sector:"Food",cap:"28B",color:"#003DA5" },
        { sym:"ABF.L",name:"AB Foods",price:25.8,sector:"Food",cap:"22B",color:"#003366" },
        { sym:"ABNB",name:"Airbnb Inc.",price:152.3,sector:"Consumer",cap:"96B",color:"#FF5A5F" },
        { sym:"ABT",name:"Abbott Labs",price:112.5,sector:"Healthcare",cap:"195B",color:"#1C5BA2" },
        { sym:"ACA.PA",name:"Crédit Agricole",price:14.2,sector:"Finance",cap:"42B",color:"#003366" },
        { sym:"ACN",name:"Accenture Plc",price:345.6,sector:"Technology",cap:"218B",color:"#A100FF" },
        { sym:"ACS.MC",name:"ACS Group",price:38.5,sector:"Industrial",cap:"12B",color:"#003399" },
        { sym:"AD.AS",name:"Ahold Delhaize",price:32.5,sector:"Retail",cap:"32B",color:"#003DA5" },
        { sym:"ADBE",name:"Adobe Inc.",price:545.3,sector:"Software",cap:"243B",color:"#FF0000" },
        { sym:"ADI",name:"Analog Devices",price:205.8,sector:"Semiconductors",cap:"102B",color:"#004B87" },
        { sym:"ADM",name:"Archer-Daniels-Midland",price:72.4,sector:"Food",cap:"42B",color:"#003366" },
        { sym:"ADP",name:"Automatic Data Processing",price:245.6,sector:"Technology",cap:"102B",color:"#004B87" },
        { sym:"ADS.DE",name:"adidas AG",price:215.4,sector:"Consumer",cap:"38B",color:"#000000" },
        { sym:"ADSK",name:"Autodesk Inc",price:225.8,sector:"Software",cap:"48B",color:"#003DA5" },
        { sym:"AEP",name:"American Electric Power",price:88.5,sector:"Utilities",cap:"48B",color:"#003366" },
        { sym:"AFL",name:"Aflac Inc",price:82.5,sector:"Insurance",cap:"52B",color:"#003DA5" },
        { sym:"AGN.AS",name:"Aegon NV",price:5.85,sector:"Insurance",cap:"12B",color:"#003399" },
        { sym:"AI.PA",name:"Air Liquide",price:178.4,sector:"Materials",cap:"92B",color:"#003DA5" },
        { sym:"AIR.PA",name:"Airbus SE",price:148.5,sector:"Aerospace",cap:"118B",color:"#003399" },
        { sym:"AKZA.AS",name:"Akzo Nobel",price:68.5,sector:"Materials",cap:"15B",color:"#003DA5" },
        { sym:"ALV.DE",name:"Allianz SE",price:255.8,sector:"Insurance",cap:"108B",color:"#003399" },
        { sym:"AMAT",name:"Applied Materials",price:185.6,sector:"Semiconductors",cap:"152B",color:"#00599D" },
        { sym:"AMD",name:"AMD Inc.",price:165.4,sector:"Semiconductors",cap:"267B",color:"#ED1C24" },
        { sym:"AME",name:"AMETEK Inc",price:165.4,sector:"Industrial",cap:"38B",color:"#003DA5" },
        { sym:"AMGN",name:"Amgen Inc.",price:285.4,sector:"Biotech",cap:"152B",color:"#0063BE" },
        { sym:"AMS.MC",name:"Amadeus IT",price:62.5,sector:"Technology",cap:"28B",color:"#003DA5" },
        { sym:"AMT",name:"American Tower REIT",price:195.2,sector:"Real Estate",cap:"88B",color:"#0C2340" },
        { sym:"AMZN",name:"Amazon.com",price:185.6,sector:"E-Commerce",cap:"1.93T",color:"#FF9900" },
        { sym:"ANET",name:"Arista Networks",price:245.8,sector:"Technology",cap:"72B",color:"#003DA5" },
        { sym:"ANTO.L",name:"Antofagasta",price:18.5,sector:"Mining",cap:"18B",color:"#003399" },
        { sym:"ANZ.AX",name:"ANZ Group",price:28.5,sector:"Finance",cap:"65B",color:"#003DA5" },
        { sym:"AON",name:"Aon Plc",price:325.4,sector:"Insurance",cap:"72B",color:"#E31937" },
        { sym:"APD",name:"Air Products",price:285.4,sector:"Materials",cap:"62B",color:"#003DA5" },
        { sym:"APH",name:"Amphenol Corp",price:95.8,sector:"Technology",cap:"62B",color:"#003DA5" },
        { sym:"APO",name:"Apollo Global",price:105.8,sector:"Finance",cap:"62B",color:"#003366" },
        { sym:"APP",name:"AppLovin Corp",price:285.4,sector:"AI/Data",cap:"95B",color:"#003DA5" },
        { sym:"ASML.AS",name:"ASML Holding",price:845.2,sector:"Semiconductors",cap:"340B",color:"#003DA5" },
        { sym:"AVGO",name:"Broadcom Inc.",price:1285.6,sector:"Semiconductors",cap:"595B",color:"#CC092F" },
        { sym:"AXON",name:"Axon Enterprise",price:315.4,sector:"Technology",cap:"48B",color:"#FFD100" },
        { sym:"AXP",name:"American Express",price:215.4,sector:"Finance",cap:"158B",color:"#006FCF" },
        { sym:"AZN.L",name:"AstraZeneca",price:125.4,sector:"Pharma",cap:"195B",color:"#7D0096" },
        { sym:"AZO",name:"AutoZone Inc",price:2685.4,sector:"Retail",cap:"48B",color:"#003366" },
        { sym:"BA",name:"Boeing Co.",price:215.3,sector:"Aerospace",cap:"128B",color:"#0033A0" },
        { sym:"BA.L",name:"BAE Systems",price:12.85,sector:"Defense",cap:"38B",color:"#003399" },
        { sym:"BAC",name:"Bank of America",price:35.8,sector:"Finance",cap:"283B",color:"#012169" },
        { sym:"BALL",name:"Ball Corp",price:58.5,sector:"Materials",cap:"18B",color:"#003DA5" },
        { sym:"BARC.L",name:"Barclays plc",price:2.15,sector:"Finance",cap:"32B",color:"#00AEEF" },
        { sym:"BAS.DE",name:"BASF SE",price:48.5,sector:"Materials",cap:"42B",color:"#004A96" },
        { sym:"BATS.L",name:"BAT plc",price:28.4,sector:"Consumer",cap:"65B",color:"#003366" },
        { sym:"BBDC4.SA",name:"Bradesco",price:14.8,sector:"Finance",cap:"32B",color:"#CC0000" },
        { sym:"BBVA.MC",name:"BBVA",price:8.85,sector:"Finance",cap:"58B",color:"#004481" },
        { sym:"BBY",name:"Best Buy",price:82.5,sector:"Retail",cap:"18B",color:"#003DA5" },
        { sym:"BDX",name:"Becton Dickinson",price:245.8,sector:"Healthcare",cap:"72B",color:"#003DA5" },
        { sym:"BEI.DE",name:"Beiersdorf AG",price:132.5,sector:"Consumer",cap:"32B",color:"#003DA5" },
        { sym:"BHARTIARTL.BO",name:"Bharti Airtel",price:985,sector:"Telecom",cap:"62B",color:"#E31937" },
        { sym:"BHP.AX",name:"BHP Group",price:45.2,sector:"Mining",cap:"158B",color:"#003399" },
        { sym:"BK",name:"Bank of NY Mellon",price:58.5,sector:"Finance",cap:"42B",color:"#003DA5" },
        { sym:"BKG.L",name:"Berkeley Group",price:52.5,sector:"Real Estate",cap:"8B",color:"#003366" },
        { sym:"BKNG",name:"Booking Holdings",price:3685.2,sector:"Consumer",cap:"145B",color:"#003580" },
        { sym:"BKR",name:"Baker Hughes",price:32.5,sector:"Energy",cap:"32B",color:"#003366" },
        { sym:"BLDR",name:"Builders FirstSource",price:175.4,sector:"Materials",cap:"22B",color:"#003366" },
        { sym:"BLK",name:"BlackRock Inc.",price:785.4,sector:"Finance",cap:"118B",color:"#000000" },
        { sym:"BMO.TO",name:"Bank of Montreal",price:125.4,sector:"Finance",cap:"82B",color:"#0079C2" },
        { sym:"BMW.DE",name:"BMW AG",price:98.5,sector:"Automotive",cap:"65B",color:"#1C69D3" },
        { sym:"BMY",name:"Bristol Myers Squibb",price:52.3,sector:"Pharma",cap:"105B",color:"#773DBD" },
        { sym:"BN.PA",name:"Danone SA",price:62.3,sector:"Food",cap:"38B",color:"#0091DA" },
        { sym:"BN.TO",name:"Brookfield Corp.",price:58.4,sector:"Finance",cap:"78B",color:"#003366" },
        { sym:"BNP.PA",name:"BNP Paribas",price:68.4,sector:"Finance",cap:"82B",color:"#00915A" },
        { sym:"BP.L",name:"BP plc",price:5.25,sector:"Energy",cap:"98B",color:"#009900" },
        { sym:"BRK.B",name:"Berkshire Hathaway",price:412.3,sector:"Finance",cap:"895B",color:"#3B2F63" },
        { sym:"BSX",name:"Boston Scientific",price:65.8,sector:"Healthcare",cap:"92B",color:"#003DA5" },
        { sym:"BX",name:"Blackstone Inc.",price:128.4,sector:"Finance",cap:"158B",color:"#231F20" },
        { sym:"C",name:"Citigroup Inc",price:52.8,sector:"Finance",cap:"105B",color:"#003DA5" },
        { sym:"CAP.PA",name:"Capgemini SE",price:175.8,sector:"Technology",cap:"32B",color:"#0070AD" },
        { sym:"CARR",name:"Carrier Global",price:58.5,sector:"Industrial",cap:"52B",color:"#003DA5" },
        { sym:"CAT",name:"Caterpillar Inc",price:285.4,sector:"Industrial",cap:"142B",color:"#FFCD11" },
        { sym:"CB",name:"Chubb Ltd.",price:255.6,sector:"Insurance",cap:"108B",color:"#004B87" },
        { sym:"CBA.AX",name:"CommonwealthBank",price:115.8,sector:"Finance",cap:"145B",color:"#FFD100" },
        { sym:"CBK.DE",name:"Commerzbank",price:12.8,sector:"Finance",cap:"18B",color:"#FFCC00" },
        { sym:"CBRE",name:"CBRE Group",price:95.4,sector:"Real Estate",cap:"32B",color:"#003DA5" },
        { sym:"CCL",name:"Carnival Corp",price:18.5,sector:"Consumer",cap:"22B",color:"#003DA5" },
        { sym:"CDNS",name:"Cadence Design",price:275.4,sector:"Software",cap:"75B",color:"#FF6600" },
        { sym:"CEG",name:"Constellation Energy",price:185.4,sector:"Utilities",cap:"55B",color:"#003DA5" },
        { sym:"CI",name:"Cigna Group",price:325.6,sector:"Healthcare",cap:"95B",color:"#E21937" },
        { sym:"CL",name:"Colgate-Palmolive",price:82.5,sector:"Consumer",cap:"72B",color:"#E31937" },
        { sym:"CLNX.MC",name:"Cellnex Telecom",price:35.8,sector:"Telecom",cap:"25B",color:"#E60028" },
        { sym:"CMCSA",name:"Comcast Corp",price:42.3,sector:"Media",cap:"175B",color:"#003DA5" },
        { sym:"CME",name:"CME Group",price:215.4,sector:"Finance",cap:"78B",color:"#003366" },
        { sym:"CMG",name:"Chipotle Mexican Grill",price:2485.2,sector:"Food",cap:"68B",color:"#A81612" },
        { sym:"CMI",name:"Cummins Inc",price:255.8,sector:"Industrial",cap:"38B",color:"#E31937" },
        { sym:"CNR.TO",name:"CN Railway",price:165.8,sector:"Logistics",cap:"92B",color:"#003399" },
        { sym:"COF",name:"Capital One Financial",price:145.8,sector:"Finance",cap:"58B",color:"#003DA5" },
        { sym:"COIN",name:"Coinbase Global",price:205.4,sector:"Fintech",cap:"49B",color:"#0052FF" },
        { sym:"COP",name:"ConocoPhillips",price:115.2,sector:"Energy",cap:"135B",color:"#003366" },
        { sym:"COST",name:"Costco Wholesale",price:568.2,sector:"Retail",cap:"252B",color:"#E31837" },
        { sym:"CP.TO",name:"CP Kansas City",price:108.5,sector:"Logistics",cap:"78B",color:"#003399" },
        { sym:"CPG.L",name:"Compass Group",price:25.4,sector:"Food",cap:"48B",color:"#003366" },
        { sym:"CPRT",name:"Copart Inc",price:52.4,sector:"Industrial",cap:"48B",color:"#003366" },
        { sym:"CRH.L",name:"CRH plc",price:68.5,sector:"Materials",cap:"52B",color:"#003366" },
        { sym:"CRM",name:"Salesforce",price:265.8,sector:"Cloud",cap:"257B",color:"#00A1E0" },
        { sym:"CRWD",name:"CrowdStrike",price:285.4,sector:"Cybersecurity",cap:"68B",color:"#FF0000" },
        { sym:"CS.PA",name:"AXA SA",price:32.5,sector:"Insurance",cap:"72B",color:"#003399" },
        { sym:"CSCO",name:"Cisco Systems",price:52.3,sector:"Technology",cap:"213B",color:"#1BA0D7" },
        { sym:"CSL.AX",name:"CSL Limited",price:285.4,sector:"Biotech",cap:"118B",color:"#003DA5" },
        { sym:"CSX",name:"CSX Corp",price:35.8,sector:"Logistics",cap:"72B",color:"#003DA5" },
        { sym:"CTAS",name:"Cintas Corp",price:545.2,sector:"Industrial",cap:"55B",color:"#003DA5" },
        { sym:"CVNA",name:"Carvana Co",price:185.4,sector:"E-Commerce",cap:"35B",color:"#003DA5" },
        { sym:"CVX",name:"Chevron Corp.",price:155.4,sector:"Energy",cap:"293B",color:"#0066B2" },
        { sym:"DAL",name:"Delta Air Lines",price:42.5,sector:"Aerospace",cap:"28B",color:"#003366" },
        { sym:"DASH",name:"DoorDash Inc",price:145.8,sector:"Technology",cap:"55B",color:"#FF3008" },
        { sym:"DB1.DE",name:"Deutsche Börse",price:195.8,sector:"Finance",cap:"38B",color:"#003399" },
        { sym:"DBK.DE",name:"Deutsche Bank",price:14.5,sector:"Finance",cap:"32B",color:"#0018A8" },
        { sym:"DD",name:"DuPont",price:78.5,sector:"Materials",cap:"35B",color:"#003DA5" },
        { sym:"DDOG",name:"Datadog Inc.",price:125.6,sector:"Cloud",cap:"42B",color:"#632CA6" },
        { sym:"DE",name:"Deere & Company",price:385.4,sector:"Industrial",cap:"112B",color:"#367C2B" },
        { sym:"DELL",name:"Dell Technologies",price:115.4,sector:"Technology",cap:"82B",color:"#007DB8" },
        { sym:"DG",name:"Dollar General",price:135.2,sector:"Retail",cap:"28B",color:"#FFD100" },
        { sym:"DG.PA",name:"Vinci SA",price:115.8,sector:"Industrial",cap:"65B",color:"#003366" },
        { sym:"DGE.L",name:"Diageo plc",price:32.5,sector:"Food",cap:"72B",color:"#003399" },
        { sym:"DHI",name:"D.R. Horton",price:135.4,sector:"Real Estate",cap:"42B",color:"#003366" },
        { sym:"DHL.DE",name:"DHL Group",price:42.5,sector:"Logistics",cap:"52B",color:"#FFCC00" },
        { sym:"DHR",name:"Danaher Corp.",price:245.8,sector:"Healthcare",cap:"180B",color:"#004B87" },
        { sym:"DIS",name:"Walt Disney",price:112.5,sector:"Media",cap:"206B",color:"#113CCF" },
        { sym:"DOW",name:"Dow Inc",price:55.4,sector:"Materials",cap:"38B",color:"#E31937" },
        { sym:"DPZ",name:"Domino\'s Pizza",price:425.8,sector:"Food",cap:"15B",color:"#006491" },
        { sym:"DSM.AS",name:"DSM-Firmenich",price:108.5,sector:"Materials",cap:"28B",color:"#003399" },
        { sym:"DSY.PA",name:"Dassault Systèmes",price:42.8,sector:"Software",cap:"58B",color:"#005587" },
        { sym:"DTE.DE",name:"Deutsche Telekom",price:22.5,sector:"Telecom",cap:"118B",color:"#E20074" },
        { sym:"EA",name:"Electronic Arts",price:135.8,sector:"Gaming",cap:"38B",color:"#003DA5" },
        { sym:"EBAY",name:"eBay Inc",price:48.5,sector:"E-Commerce",cap:"28B",color:"#003DA5" },
        { sym:"ECL",name:"Ecolab Inc",price:205.4,sector:"Materials",cap:"58B",color:"#003DA5" },
        { sym:"EL.PA",name:"EssilorLuxottica",price:195.4,sector:"Healthcare",cap:"88B",color:"#003DA5" },
        { sym:"ELV",name:"Elevance Health",price:475.8,sector:"Healthcare",cap:"112B",color:"#003DA5" },
        { sym:"EMR",name:"Emerson Electric",price:105.4,sector:"Industrial",cap:"62B",color:"#003DA5" },
        { sym:"EN.PA",name:"Bouygues SA",price:35.8,sector:"Industrial",cap:"14B",color:"#003DA5" },
        { sym:"ENB.TO",name:"Enbridge Inc.",price:52.8,sector:"Energy",cap:"98B",color:"#003DA5" },
        { sym:"ENEL.MI",name:"Enel SpA",price:6.85,sector:"Utilities",cap:"68B",color:"#003399" },
        { sym:"ENG.MC",name:"Enagás SA",price:14.5,sector:"Utilities",cap:"3.8B",color:"#003399" },
        { sym:"ENI.MI",name:"Eni SpA",price:14.5,sector:"Energy",cap:"52B",color:"#003399" },
        { sym:"EOG",name:"EOG Resources",price:125.8,sector:"Energy",cap:"72B",color:"#003366" },
        { sym:"EQIX",name:"Equinix REIT",price:785.2,sector:"Real Estate",cap:"72B",color:"#E31937" },
        { sym:"ETN",name:"Eaton Corp",price:225.8,sector:"Industrial",cap:"92B",color:"#003DA5" },
        { sym:"EXPN.L",name:"Experian plc",price:35.8,sector:"Finance",cap:"38B",color:"#003366" },
        { sym:"F",name:"Ford Motor",price:12.8,sector:"Automotive",cap:"51B",color:"#003399" },
        { sym:"FAST",name:"Fastenal Co",price:62.5,sector:"Industrial",cap:"35B",color:"#003DA5" },
        { sym:"FBK.MI",name:"FinecoBank",price:14.5,sector:"Finance",cap:"8.8B",color:"#003DA5" },
        { sym:"FCX",name:"Freeport-McMoRan",price:42.5,sector:"Mining",cap:"62B",color:"#003DA5" },
        { sym:"FDX",name:"FedEx Corp",price:265.4,sector:"Logistics",cap:"68B",color:"#4D148C" },
        { sym:"FER.MC",name:"Ferrovial SE",price:35.2,sector:"Industrial",cap:"28B",color:"#003366" },
        { sym:"FI",name:"Fiserv Inc",price:148.5,sector:"Fintech",cap:"92B",color:"#003DA5" },
        { sym:"FICO",name:"Fair Isaac Corp",price:1185.4,sector:"Technology",cap:"35B",color:"#003DA5" },
        { sym:"FMG.AX",name:"Fortescue Metals",price:22.5,sector:"Mining",cap:"42B",color:"#003DA5" },
        { sym:"FRE.DE",name:"Fresenius SE",price:28.5,sector:"Healthcare",cap:"15B",color:"#003DA5" },
        { sym:"FTNT",name:"Fortinet Inc",price:72.5,sector:"Cybersecurity",cap:"55B",color:"#E31937" },
        { sym:"G.MI",name:"Assicurazioni Gen.",price:22.8,sector:"Insurance",cap:"38B",color:"#DA291C" },
        { sym:"GD",name:"General Dynamics",price:265.4,sector:"Defense",cap:"72B",color:"#003366" },
        { sym:"GE",name:"GE Aerospace",price:158.4,sector:"Aerospace",cap:"172B",color:"#003DA5" },
        { sym:"GEHC",name:"GE HealthCare",price:78.5,sector:"Healthcare",cap:"35B",color:"#003DA5" },
        { sym:"GEV",name:"GE Vernova",price:285.4,sector:"Utilities",cap:"78B",color:"#003DA5" },
        { sym:"GILD",name:"Gilead Sciences",price:82.3,sector:"Biotech",cap:"103B",color:"#003366" },
        { sym:"GIS",name:"General Mills",price:68.5,sector:"Food",cap:"38B",color:"#003366" },
        { sym:"GIVN.SW",name:"Givaudan SA",price:3850.2,sector:"Materials",cap:"35B",color:"#003366" },
        { sym:"GLE.PA",name:"Société Générale",price:28.5,sector:"Finance",cap:"22B",color:"#E60028" },
        { sym:"GLEN.L",name:"Glencore plc",price:5.15,sector:"Mining",cap:"65B",color:"#003366" },
        { sym:"GM",name:"General Motors",price:38.9,sector:"Automotive",cap:"53B",color:"#0170CE" },
        { sym:"GOOGL",name:"Alphabet Inc.",price:155.3,sector:"Technology",cap:"1.95T",color:"#4285F4" },
        { sym:"GRF.MC",name:"Grifols SA",price:12.8,sector:"Healthcare",cap:"8.5B",color:"#003DA5" },
        { sym:"GRMN",name:"Garmin Ltd",price:135.4,sector:"Technology",cap:"28B",color:"#003DA5" },
        { sym:"GS",name:"Goldman Sachs",price:385.4,sector:"Finance",cap:"128B",color:"#6DA0C9" },
        { sym:"GSK.L",name:"GSK plc",price:16.8,sector:"Pharma",cap:"72B",color:"#FF6900" },
        { sym:"GWW",name:"W.W. Grainger",price:885.4,sector:"Industrial",cap:"48B",color:"#003366" },
        { sym:"HCA",name:"HCA Healthcare",price:285.4,sector:"Healthcare",cap:"72B",color:"#003DA5" },
        { sym:"HD",name:"Home Depot",price:345.6,sector:"Retail",cap:"345B",color:"#F96302" },
        { sym:"HDFCBANK.BO",name:"HDFC Bank",price:1685,sector:"Finance",cap:"118B",color:"#004B87" },
        { sym:"HEI.DE",name:"HeidelbergCement",price:92.5,sector:"Materials",cap:"18B",color:"#003366" },
        { sym:"HEIA.AS",name:"Heineken NV",price:88.5,sector:"Food",cap:"48B",color:"#003DA5" },
        { sym:"HEN3.DE",name:"Henkel AG",price:82.4,sector:"Consumer",cap:"35B",color:"#E31937" },
        { sym:"HINDUNILVR.BO",name:"Hindustan Unilever",price:2450,sector:"Consumer",cap:"58B",color:"#1F36C7" },
        { sym:"HLT",name:"Hilton Worldwide",price:195.8,sector:"Consumer",cap:"55B",color:"#003366" },
        { sym:"HON",name:"Honeywell",price:205.6,sector:"Industrial",cap:"135B",color:"#E31937" },
        { sym:"HOOD",name:"Robinhood Markets",price:22.5,sector:"Fintech",cap:"18B",color:"#00C805" },
        { sym:"HPQ",name:"HP Inc",price:32.5,sector:"Technology",cap:"32B",color:"#003DA5" },
        { sym:"HSBA.L",name:"HSBC Holdings",price:7.85,sector:"Finance",cap:"158B",color:"#DB0011" },
        { sym:"HSY",name:"Hershey Company",price:195.8,sector:"Food",cap:"42B",color:"#391F01" },
        { sym:"IAG.MC",name:"IAG (Iberia)",price:2.15,sector:"Aerospace",cap:"12B",color:"#E31937" },
        { sym:"IBE.MC",name:"Iberdrola SA",price:12.5,sector:"Utilities",cap:"78B",color:"#00953A" },
        { sym:"IBM",name:"IBM Corp.",price:185.6,sector:"Technology",cap:"170B",color:"#1F70C1" },
        { sym:"ICE",name:"Intercontinental Exchange",price:112.5,sector:"Finance",cap:"68B",color:"#003DA5" },
        { sym:"ICICIBANK.BO",name:"ICICI Bank",price:985,sector:"Finance",cap:"72B",color:"#F47920" },
        { sym:"IDXX",name:"IDEXX Laboratories",price:505.4,sector:"Healthcare",cap:"42B",color:"#003DA5" },
        { sym:"IFX.DE",name:"Infineon Tech.",price:35.2,sector:"Semiconductors",cap:"42B",color:"#0063A3" },
        { sym:"INFY.BO",name:"Infosys Ltd",price:1585,sector:"Technology",cap:"68B",color:"#007CC3" },
        { sym:"INGA.AS",name:"ING Groep",price:14.8,sector:"Finance",cap:"52B",color:"#FF6200" },
        { sym:"INTC",name:"Intel Corp.",price:42.8,sector:"Semiconductors",cap:"181B",color:"#0071C5" },
        { sym:"INTU",name:"Intuit Inc.",price:625.4,sector:"Software",cap:"175B",color:"#365EBF" },
        { sym:"ISP.MI",name:"Intesa Sanpaolo",price:3.25,sector:"Finance",cap:"62B",color:"#009A44" },
        { sym:"ISRG",name:"Intuitive Surgical",price:385.2,sector:"Healthcare",cap:"135B",color:"#0072CE" },
        { sym:"ITC.BO",name:"ITC Limited",price:445,sector:"Consumer",cap:"55B",color:"#003DA5" },
        { sym:"ITUB4.SA",name:"Itaú Unibanco",price:32.5,sector:"Finance",cap:"62B",color:"#003399" },
        { sym:"ITW",name:"Illinois Tool Works",price:252.4,sector:"Industrial",cap:"72B",color:"#E31937" },
        { sym:"ITX.MC",name:"Inditex (Zara)",price:38.5,sector:"Retail",cap:"118B",color:"#000000" },
        { sym:"JCI",name:"Johnson Controls",price:65.8,sector:"Industrial",cap:"42B",color:"#003DA5" },
        { sym:"JNJ",name:"Johnson & Johnson",price:162.3,sector:"Healthcare",cap:"391B",color:"#D51900" },
        { sym:"JPM",name:"JPMorgan Chase",price:198.7,sector:"Finance",cap:"571B",color:"#003A70" },
        { sym:"KER.PA",name:"Kering SA",price:345.2,sector:"Luxury",cap:"42B",color:"#000000" },
        { sym:"KKR",name:"KKR & Co",price:92.5,sector:"Finance",cap:"82B",color:"#003366" },
        { sym:"KLAC",name:"KLA Corp.",price:625.8,sector:"Semiconductors",cap:"85B",color:"#003366" },
        { sym:"KMB",name:"Kimberly-Clark",price:132.5,sector:"Consumer",cap:"48B",color:"#003DA5" },
        { sym:"KMI",name:"Kinder Morgan",price:18.5,sector:"Energy",cap:"42B",color:"#003366" },
        { sym:"KO",name:"Coca-Cola Co.",price:61.2,sector:"Food",cap:"264B",color:"#F40009" },
        { sym:"KPN.AS",name:"KPN NV",price:3.45,sector:"Telecom",cap:"14B",color:"#00A651" },
        { sym:"LDO.MI",name:"Leonardo SpA",price:18.5,sector:"Defense",cap:"10B",color:"#003399" },
        { sym:"LHX",name:"L3Harris Technologies",price:215.4,sector:"Defense",cap:"42B",color:"#003366" },
        { sym:"LIN",name:"Linde plc",price:425.6,sector:"Materials",cap:"190B",color:"#003366" },
        { sym:"LLOY.L",name:"Lloyds Banking",price:0.55,sector:"Finance",cap:"35B",color:"#006B35" },
        { sym:"LLY",name:"Eli Lilly",price:782.3,sector:"Pharma",cap:"742B",color:"#D52B1E" },
        { sym:"LMT",name:"Lockheed Martin",price:445.2,sector:"Defense",cap:"107B",color:"#003366" },
        { sym:"LONN.SW",name:"Lonza Group",price:525.8,sector:"Healthcare",cap:"42B",color:"#003DA5" },
        { sym:"LOW",name:"Lowe\'s Companies",price:232.5,sector:"Retail",cap:"135B",color:"#004990" },
        { sym:"LR.PA",name:"Legrand SA",price:98.5,sector:"Industrial",cap:"28B",color:"#E31937" },
        { sym:"LRCX",name:"Lam Research",price:745.2,sector:"Semiconductors",cap:"98B",color:"#003366" },
        { sym:"LSEG.L",name:"London Stock Exch.",price:98.5,sector:"Finance",cap:"62B",color:"#003366" },
        { sym:"LULU",name:"Lululemon",price:385.4,sector:"Retail",cap:"48B",color:"#D31334" },
        { sym:"LYV",name:"Live Nation Entertainment",price:105.8,sector:"Media",cap:"22B",color:"#E31937" },
        { sym:"MA",name:"Mastercard Inc.",price:468.9,sector:"Fintech",cap:"435B",color:"#EB001B" },
        { sym:"MAP.MC",name:"MAPFRE SA",price:2.15,sector:"Insurance",cap:"6.5B",color:"#DA291C" },
        { sym:"MAR",name:"Marriott Int\'l",price:225.4,sector:"Consumer",cap:"72B",color:"#003366" },
        { sym:"MBG.DE",name:"Mercedes-Benz",price:72.4,sector:"Automotive",cap:"68B",color:"#000000" },
        { sym:"MC.PA",name:"LVMH",price:842.3,sector:"Luxury",cap:"385B",color:"#6B4F36" },
        { sym:"MCD",name:"McDonald\'s",price:292.3,sector:"Food",cap:"210B",color:"#FBC817" },
        { sym:"MCK",name:"McKesson Corp",price:485.2,sector:"Healthcare",cap:"68B",color:"#003DA5" },
        { sym:"MCO",name:"Moody\'s Corp",price:395.2,sector:"Finance",cap:"72B",color:"#003DA5" },
        { sym:"MDLZ",name:"Mondelez Int\'l",price:72.4,sector:"Food",cap:"98B",color:"#4F2170" },
        { sym:"MDT",name:"Medtronic plc",price:82.5,sector:"Healthcare",cap:"110B",color:"#003DA5" },
        { sym:"MELI",name:"MercadoLibre",price:1585.4,sector:"E-Commerce",cap:"78B",color:"#FFE600" },
        { sym:"MET",name:"MetLife Inc",price:72.4,sector:"Insurance",cap:"52B",color:"#003DA5" },
        { sym:"META",name:"Meta Platforms",price:505.2,sector:"AI/Data",cap:"1.29T",color:"#0668E1" },
        { sym:"ML.PA",name:"Michelin",price:35.2,sector:"Automotive",cap:"22B",color:"#002F6C" },
        { sym:"MMC",name:"Marsh McLennan",price:198.5,sector:"Finance",cap:"98B",color:"#003366" },
        { sym:"MMM",name:"3M Company",price:105.8,sector:"Industrial",cap:"58B",color:"#E31937" },
        { sym:"MNST",name:"Monster Beverage",price:55.8,sector:"Food",cap:"58B",color:"#00854A" },
        { sym:"MO",name:"Altria Group",price:42.5,sector:"Consumer",cap:"78B",color:"#003366" },
        { sym:"MONC.MI",name:"Moncler SpA",price:62.5,sector:"Luxury",cap:"16B",color:"#000000" },
        { sym:"MPC",name:"Marathon Petroleum",price:155.8,sector:"Energy",cap:"62B",color:"#003366" },
        { sym:"MRK",name:"Merck & Co",price:165.2,sector:"Pharma",cap:"292B",color:"#009A44" },
        { sym:"MRNA",name:"Moderna Inc",price:105.8,sector:"Biotech",cap:"42B",color:"#003DA5" },
        { sym:"MRVL",name:"Marvell Technology",price:68.5,sector:"Semiconductors",cap:"58B",color:"#8C001A" },
        { sym:"MS",name:"Morgan Stanley",price:92.3,sector:"Finance",cap:"158B",color:"#003986" },
        { sym:"MSCI",name:"MSCI Inc",price:535.8,sector:"Finance",cap:"45B",color:"#003DA5" },
        { sym:"MSFT",name:"Microsoft Corp.",price:425.8,sector:"Technology",cap:"3.15T",color:"#00A4EF" },
        { sym:"MSI",name:"Motorola Solutions",price:325.8,sector:"Technology",cap:"55B",color:"#003DA5" },
        { sym:"MTX.DE",name:"MTU Aero Engines",price:245.8,sector:"Aerospace",cap:"15B",color:"#003399" },
        { sym:"MU",name:"Micron Technology",price:85.2,sector:"Semiconductors",cap:"95B",color:"#003DA5" },
        { sym:"MUV2.DE",name:"Munich Re",price:445.2,sector:"Insurance",cap:"62B",color:"#003399" },
        { sym:"NAB.AX",name:"Natl Australia Bank",price:32.5,sector:"Finance",cap:"78B",color:"#DA291C" },
        { sym:"NCLH",name:"Norwegian Cruise Line",price:18.5,sector:"Consumer",cap:"8.5B",color:"#003DA5" },
        { sym:"NEE",name:"NextEra Energy",price:72.5,sector:"Utilities",cap:"148B",color:"#003366" },
        { sym:"NEM",name:"Newmont Corp",price:42.5,sector:"Mining",cap:"35B",color:"#003DA5" },
        { sym:"NESN.SW",name:"Nestlé SA",price:108.4,sector:"Food",cap:"295B",color:"#7B868C" },
        { sym:"NET",name:"Cloudflare Inc.",price:82.4,sector:"Cloud",cap:"28B",color:"#F6821F" },
        { sym:"NFLX",name:"Netflix Inc.",price:628.9,sector:"Media",cap:"272B",color:"#E50914" },
        { sym:"NG.L",name:"National Grid",price:11.2,sector:"Utilities",cap:"42B",color:"#003399" },
        { sym:"NKE",name:"Nike Inc.",price:108.4,sector:"Consumer",cap:"165B",color:"#111111" },
        { sym:"NOC",name:"Northrop Grumman",price:475.2,sector:"Defense",cap:"62B",color:"#003DA5" },
        { sym:"NOVN.SW",name:"Novartis AG",price:92.5,sector:"Pharma",cap:"215B",color:"#EC6602" },
        { sym:"NOW",name:"ServiceNow",price:725.8,sector:"Cloud",cap:"149B",color:"#293E40" },
        { sym:"NSC",name:"Norfolk Southern",price:235.8,sector:"Logistics",cap:"58B",color:"#003366" },
        { sym:"NUE",name:"Nucor Corp",price:168.5,sector:"Materials",cap:"42B",color:"#003366" },
        { sym:"NVDA",name:"NVIDIA Corp.",price:875.4,sector:"Semiconductors",cap:"2.16T",color:"#76B900" },
        { sym:"NXPI",name:"NXP Semiconductors",price:215.4,sector:"Semiconductors",cap:"55B",color:"#003DA5" },
        { sym:"OR.PA",name:"L\'Oréal SA",price:435.6,sector:"Consumer",cap:"235B",color:"#000000" },
        { sym:"ORA.PA",name:"Orange SA",price:11.2,sector:"Telecom",cap:"28B",color:"#FF6600" },
        { sym:"ORCL",name:"Oracle Corp.",price:125.4,sector:"Software",cap:"345B",color:"#F80000" },
        { sym:"ORLY",name:"O\'Reilly Automotive",price:935.2,sector:"Retail",cap:"58B",color:"#00854A" },
        { sym:"OXY",name:"Occidental Petroleum",price:62.5,sector:"Energy",cap:"52B",color:"#E31937" },
        { sym:"P911.DE",name:"Porsche SE",price:48.2,sector:"Automotive",cap:"15B",color:"#000000" },
        { sym:"PAH3.DE",name:"Porsche Auto",price:62.5,sector:"Automotive",cap:"55B",color:"#000000" },
        { sym:"PANW",name:"Palo Alto Networks",price:295.6,sector:"Cybersecurity",cap:"92B",color:"#FA582D" },
        { sym:"PCAR",name:"PACCAR Inc",price:98.5,sector:"Industrial",cap:"52B",color:"#003366" },
        { sym:"PEP",name:"PepsiCo Inc.",price:172.4,sector:"Food",cap:"237B",color:"#004B93" },
        { sym:"PETR4.SA",name:"Petrobras",price:35.8,sector:"Energy",cap:"98B",color:"#003DA5" },
        { sym:"PFE",name:"Pfizer Inc.",price:28.5,sector:"Pharma",cap:"161B",color:"#0093D0" },
        { sym:"PG",name:"Procter & Gamble",price:165.2,sector:"Consumer",cap:"389B",color:"#003DA5" },
        { sym:"PGR",name:"Progressive Corp",price:165.8,sector:"Insurance",cap:"95B",color:"#003DA5" },
        { sym:"PH",name:"Parker-Hannifin",price:445.8,sector:"Industrial",cap:"62B",color:"#003366" },
        { sym:"PHIA.AS",name:"Philips NV",price:22.5,sector:"Healthcare",cap:"22B",color:"#003DA5" },
        { sym:"PLTR",name:"Palantir Tech.",price:22.4,sector:"AI/Data",cap:"49B",color:"#101113" },
        { sym:"PM",name:"Philip Morris",price:98.5,sector:"Consumer",cap:"152B",color:"#C8102E" },
        { sym:"PNC",name:"PNC Financial",price:165.2,sector:"Finance",cap:"72B",color:"#003DA5" },
        { sym:"PPG",name:"PPG Industries",price:142.5,sector:"Materials",cap:"35B",color:"#003DA5" },
        { sym:"PRU.L",name:"Prudential plc",price:12.5,sector:"Insurance",cap:"32B",color:"#E31937" },
        { sym:"PRX.AS",name:"Prosus NV",price:32.5,sector:"Technology",cap:"58B",color:"#003366" },
        { sym:"PUB.PA",name:"Publicis Groupe",price:85.4,sector:"Media",cap:"22B",color:"#003399" },
        { sym:"PYPL",name:"PayPal Holdings",price:68.3,sector:"Fintech",cap:"73B",color:"#003087" },
        { sym:"QCOM",name:"Qualcomm",price:172.3,sector:"Semiconductors",cap:"192B",color:"#3253DC" },
        { sym:"QIA.DE",name:"QIAGEN N.V.",price:42.5,sector:"Biotech",cap:"18B",color:"#003DA5" },
        { sym:"RACE",name:"Ferrari N.V.",price:385.2,sector:"Luxury",cap:"70B",color:"#DA291C" },
        { sym:"RACE.MI",name:"Ferrari NV",price:385.2,sector:"Luxury",cap:"70B",color:"#DA291C" },
        { sym:"RAND.AS",name:"Randstad NV",price:52.5,sector:"Industrial",cap:"10B",color:"#003DA5" },
        { sym:"RCL",name:"Royal Caribbean",price:135.8,sector:"Consumer",cap:"35B",color:"#003366" },
        { sym:"REGN",name:"Regeneron Pharma",price:885.4,sector:"Biotech",cap:"98B",color:"#FF6600" },
        { sym:"REL.L",name:"RELX plc",price:32.8,sector:"Media",cap:"68B",color:"#FF6600" },
        { sym:"RELIANCE.BO",name:"Reliance Industries",price:2485,sector:"Energy",cap:"215B",color:"#003399" },
        { sym:"REP.MC",name:"Repsol SA",price:14.8,sector:"Energy",cap:"22B",color:"#FF6600" },
        { sym:"RI.PA",name:"Pernod Ricard",price:152.4,sector:"Food",cap:"38B",color:"#003366" },
        { sym:"RIO.L",name:"Rio Tinto",price:58.5,sector:"Mining",cap:"98B",color:"#003DA5" },
        { sym:"RMS.PA",name:"Hermès Int\'l",price:2145.3,sector:"Luxury",cap:"228B",color:"#FF6600" },
        { sym:"RNO.PA",name:"Renault SA",price:42.5,sector:"Automotive",cap:"12B",color:"#EFDF00" },
        { sym:"ROG.SW",name:"Roche Holding",price:265.8,sector:"Pharma",cap:"175B",color:"#003DA5" },
        { sym:"ROK",name:"Rockwell Automation",price:285.4,sector:"Industrial",cap:"32B",color:"#E31937" },
        { sym:"ROKU",name:"Roku Inc.",price:68.5,sector:"Media",cap:"9.5B",color:"#6C3C97" },
        { sym:"ROP",name:"Roper Technologies",price:525.4,sector:"Technology",cap:"58B",color:"#003366" },
        { sym:"ROST",name:"Ross Stores",price:142.5,sector:"Retail",cap:"48B",color:"#003366" },
        { sym:"RR.L",name:"Rolls-Royce",price:3.85,sector:"Aerospace",cap:"35B",color:"#003399" },
        { sym:"RSG",name:"Republic Services",price:175.4,sector:"Industrial",cap:"55B",color:"#003366" },
        { sym:"RTX",name:"RTX Corp",price:92.5,sector:"Defense",cap:"138B",color:"#003DA5" },
        { sym:"RWE.DE",name:"RWE AG",price:32.8,sector:"Utilities",cap:"22B",color:"#003DA5" },
        { sym:"RY.TO",name:"Royal Bank Canada",price:135.8,sector:"Finance",cap:"172B",color:"#003DA5" },
        { sym:"SAF.PA",name:"Safran SA",price:195.8,sector:"Aerospace",cap:"85B",color:"#003366" },
        { sym:"SAN.MC",name:"Banco Santander",price:4.25,sector:"Finance",cap:"72B",color:"#EC0000" },
        { sym:"SAN.PA",name:"Sanofi SA",price:92.5,sector:"Pharma",cap:"118B",color:"#7D00BE" },
        { sym:"SAP.DE",name:"SAP SE",price:185.6,sector:"Software",cap:"220B",color:"#0FAAFF" },
        { sym:"SBUX",name:"Starbucks",price:98.5,sector:"Food",cap:"112B",color:"#00704A" },
        { sym:"SCHW",name:"Charles Schwab",price:72.4,sector:"Finance",cap:"132B",color:"#00A0DF" },
        { sym:"SE",name:"Sea Limited",price:42.5,sector:"E-Commerce",cap:"25B",color:"#EE4D2D" },
        { sym:"SGO.PA",name:"Saint-Gobain",price:72.5,sector:"Materials",cap:"38B",color:"#003399" },
        { sym:"SHEL.L",name:"Shell PLC",price:28.5,sector:"Energy",cap:"215B",color:"#FFD500" },
        { sym:"SHL.DE",name:"Siemens Healthineers",price:52.8,sector:"Healthcare",cap:"58B",color:"#009999" },
        { sym:"SHOP",name:"Shopify Inc.",price:78.4,sector:"E-Commerce",cap:"98B",color:"#7AB55C" },
        { sym:"SHW",name:"Sherwin-Williams",price:295.8,sector:"Materials",cap:"78B",color:"#003DA5" },
        { sym:"SIE.DE",name:"Siemens AG",price:175.4,sector:"Industrial",cap:"148B",color:"#009999" },
        { sym:"SIKA.SW",name:"Sika AG",price:265.4,sector:"Materials",cap:"42B",color:"#CC0000" },
        { sym:"SLB",name:"Schlumberger NV",price:52.4,sector:"Energy",cap:"82B",color:"#003DA5" },
        { sym:"SMCI",name:"Super Micro Computer",price:42.5,sector:"Technology",cap:"22B",color:"#003DA5" },
        { sym:"SNOW",name:"Snowflake Inc.",price:165.8,sector:"Cloud",cap:"52B",color:"#29B5E8" },
        { sym:"SNPS",name:"Synopsys Inc.",price:525.8,sector:"Software",cap:"82B",color:"#A020F0" },
        { sym:"SO",name:"Southern Company",price:72.4,sector:"Utilities",cap:"78B",color:"#003366" },
        { sym:"SPG",name:"Simon Property REIT",price:148.5,sector:"Real Estate",cap:"48B",color:"#003366" },
        { sym:"SPGI",name:"S&P Global",price:445.2,sector:"Finance",cap:"142B",color:"#DA291C" },
        { sym:"SPOT",name:"Spotify Tech.",price:235.6,sector:"Media",cap:"46B",color:"#1DB954" },
        { sym:"SQ",name:"Block Inc.",price:72.5,sector:"Fintech",cap:"42B",color:"#3E4348" },
        { sym:"SRE",name:"Sempra Energy",price:78.5,sector:"Utilities",cap:"52B",color:"#003366" },
        { sym:"SREN.SW",name:"Swiss Re",price:108.5,sector:"Insurance",cap:"35B",color:"#003366" },
        { sym:"SSE.L",name:"SSE plc",price:18.5,sector:"Utilities",cap:"22B",color:"#003DA5" },
        { sym:"STM.MI",name:"STMicro",price:38.5,sector:"Semiconductors",cap:"35B",color:"#03234B" },
        { sym:"STM.PA",name:"STMicroelectronics",price:38.5,sector:"Semiconductors",cap:"35B",color:"#03234B" },
        { sym:"STZ",name:"Constellation Brands",price:245.8,sector:"Food",cap:"48B",color:"#003366" },
        { sym:"SU.PA",name:"Schneider Electric",price:185.4,sector:"Industrial",cap:"108B",color:"#3DCD58" },
        { sym:"SU.TO",name:"Suncor Energy",price:45.2,sector:"Energy",cap:"52B",color:"#003399" },
        { sym:"SY1.DE",name:"Symrise AG",price:108.5,sector:"Materials",cap:"14B",color:"#003399" },
        { sym:"SYK",name:"Stryker Corp.",price:328.5,sector:"Healthcare",cap:"125B",color:"#003366" },
        { sym:"SYY",name:"Sysco Corp",price:78.5,sector:"Food",cap:"38B",color:"#003DA5" },
        { sym:"T",name:"AT&T Inc.",price:17.5,sector:"Telecom",cap:"125B",color:"#009FDB" },
        { sym:"TCS.BO",name:"Tata Consultancy",price:3845,sector:"Technology",cap:"175B",color:"#0058A3" },
        { sym:"TD.TO",name:"TD Bank Group",price:82.5,sector:"Finance",cap:"135B",color:"#00B140" },
        { sym:"TDG",name:"TransDigm Group",price:1025.4,sector:"Aerospace",cap:"62B",color:"#003366" },
        { sym:"TEAM",name:"Atlassian Corp.",price:225.6,sector:"Software",cap:"58B",color:"#0052CC" },
        { sym:"TEF.MC",name:"Telefónica SA",price:4.15,sector:"Telecom",cap:"25B",color:"#0066FF" },
        { sym:"TEL",name:"TE Connectivity",price:145.2,sector:"Technology",cap:"48B",color:"#003DA5" },
        { sym:"TEP.PA",name:"Teleperformance",price:125.8,sector:"Technology",cap:"18B",color:"#003366" },
        { sym:"TGT",name:"Target Corp",price:148.5,sector:"Retail",cap:"68B",color:"#CC0000" },
        { sym:"TIT.MI",name:"Telecom Italia",price:0.28,sector:"Telecom",cap:"6.5B",color:"#003399" },
        { sym:"TJX",name:"TJX Companies",price:95.8,sector:"Retail",cap:"108B",color:"#E4002B" },
        { sym:"TMO",name:"Thermo Fisher",price:545.3,sector:"Healthcare",cap:"213B",color:"#003366" },
        { sym:"TMUS",name:"T-Mobile US",price:165.4,sector:"Telecom",cap:"198B",color:"#E20074" },
        { sym:"TRV",name:"Travelers Companies",price:195.8,sector:"Insurance",cap:"48B",color:"#E31937" },
        { sym:"TSCO.L",name:"Tesco PLC",price:3.15,sector:"Retail",cap:"28B",color:"#003399" },
        { sym:"TSLA",name:"Tesla Inc.",price:248.2,sector:"Automotive",cap:"789B",color:"#CC0000" },
        { sym:"TT",name:"Trane Technologies",price:255.4,sector:"Industrial",cap:"62B",color:"#003DA5" },
        { sym:"TTD",name:"The Trade Desk",price:78.5,sector:"AI/Data",cap:"38B",color:"#4DB849" },
        { sym:"TTE.PA",name:"TotalEnergies",price:62.5,sector:"Energy",cap:"152B",color:"#DA291C" },
        { sym:"TXN",name:"Texas Instruments",price:172.5,sector:"Semiconductors",cap:"155B",color:"#CC0000" },
        { sym:"UAL",name:"United Airlines",price:52.5,sector:"Aerospace",cap:"18B",color:"#003DA5" },
        { sym:"UBER",name:"Uber Technologies",price:72.4,sector:"Technology",cap:"150B",color:"#000000" },
        { sym:"UBSG.SW",name:"UBS Group",price:28.5,sector:"Finance",cap:"98B",color:"#E60000" },
        { sym:"UCG.MI",name:"UniCredit SpA",price:28.5,sector:"Finance",cap:"52B",color:"#E31937" },
        { sym:"ULTA",name:"Ulta Beauty",price:445.2,sector:"Retail",cap:"22B",color:"#003366" },
        { sym:"ULVR.L",name:"Unilever PLC",price:45.2,sector:"Consumer",cap:"118B",color:"#1F36C7" },
        { sym:"UNA.AS",name:"Unilever NV",price:52.4,sector:"Consumer",cap:"135B",color:"#1F36C7" },
        { sym:"UNH",name:"UnitedHealth",price:527.4,sector:"Healthcare",cap:"487B",color:"#002677" },
        { sym:"UNP",name:"Union Pacific",price:248.5,sector:"Logistics",cap:"152B",color:"#003764" },
        { sym:"UPS",name:"United Parcel Service",price:155.8,sector:"Logistics",cap:"132B",color:"#351C15" },
        { sym:"URI",name:"United Rentals",price:585.4,sector:"Industrial",cap:"42B",color:"#003366" },
        { sym:"URW.PA",name:"Unibail-Rodamco",price:68.4,sector:"Real Estate",cap:"18B",color:"#003399" },
        { sym:"USB",name:"US Bancorp",price:42.5,sector:"Finance",cap:"68B",color:"#003DA5" },
        { sym:"V",name:"Visa Inc.",price:282.4,sector:"Fintech",cap:"580B",color:"#1A1F71" },
        { sym:"VALE3.SA",name:"Vale SA",price:68.5,sector:"Mining",cap:"72B",color:"#003399" },
        { sym:"VIV.PA",name:"Vivendi SE",price:10.8,sector:"Media",cap:"14B",color:"#FF0000" },
        { sym:"VLO",name:"Valero Energy",price:142.5,sector:"Energy",cap:"48B",color:"#003366" },
        { sym:"VOD.L",name:"Vodafone Group",price:0.78,sector:"Telecom",cap:"22B",color:"#E60000" },
        { sym:"VOW3.DE",name:"Volkswagen AG",price:115.8,sector:"Automotive",cap:"58B",color:"#003399" },
        { sym:"VRSK",name:"Verisk Analytics",price:245.8,sector:"Finance",cap:"38B",color:"#003DA5" },
        { sym:"VRTX",name:"Vertex Pharma",price:425.6,sector:"Biotech",cap:"108B",color:"#014A82" },
        { sym:"VZ",name:"Verizon Communications",price:38.2,sector:"Telecom",cap:"160B",color:"#CD040B" },
        { sym:"WBC.AX",name:"Westpac Banking",price:25.8,sector:"Finance",cap:"68B",color:"#DA291C" },
        { sym:"WDAY",name:"Workday Inc.",price:258.4,sector:"Software",cap:"68B",color:"#0075C9" },
        { sym:"WDS.AX",name:"Woodside Energy",price:32.5,sector:"Energy",cap:"52B",color:"#003399" },
        { sym:"WEGE3.SA",name:"WEG SA",price:38.5,sector:"Industrial",cap:"28B",color:"#003399" },
        { sym:"WFC",name:"Wells Fargo",price:48.5,sector:"Finance",cap:"185B",color:"#CC0000" },
        { sym:"WKL.AS",name:"Wolters Kluwer",price:138.5,sector:"Media",cap:"38B",color:"#003366" },
        { sym:"WLN.PA",name:"Worldline SA",price:12.5,sector:"Fintech",cap:"5.5B",color:"#E60028" },
        { sym:"WM",name:"Waste Management",price:175.8,sector:"Industrial",cap:"72B",color:"#00854A" },
        { sym:"WMB",name:"Williams Companies",price:38.5,sector:"Energy",cap:"48B",color:"#003DA5" },
        { sym:"WMT",name:"Walmart Inc.",price:165.8,sector:"Retail",cap:"445B",color:"#0071CE" },
        { sym:"XOM",name:"Exxon Mobil",price:108.7,sector:"Energy",cap:"432B",color:"#ED1B2D" },
        { sym:"YUM",name:"Yum! Brands",price:135.8,sector:"Food",cap:"38B",color:"#E21937" },
        { sym:"ZAL.DE",name:"Zalando SE",price:25.8,sector:"E-Commerce",cap:"10B",color:"#FF6900" },
        { sym:"ZS",name:"Zscaler Inc.",price:195.2,sector:"Cybersecurity",cap:"28B",color:"#0090D4" },
        { sym:"ZTS",name:"Zoetis Inc",price:185.4,sector:"Healthcare",cap:"88B",color:"#003DA5" },
        { sym:"ZURN.SW",name:"Zurich Insurance",price:475.8,sector:"Insurance",cap:"72B",color:"#003399" }
    ];
    const topChg = () => +(rngR(-4, 6)).toFixed(2);
    const top = TOP.map(s => ({ ...s, chg: topChg(), logo: stockLogo(s.sym.split(".")[0]) }));

    // Generate remaining ~9,930 stocks
    const used = new Set(TOP.map(s => s.sym));
    const generated = [];
    const capTiers = [
        { label: "1T+", min: 800, max: 5000, w: 0.001 },
        { label: "100B+", min: 150, max: 800, w: 0.01 },
        { label: "10B+", min: 25, max: 200, w: 0.08 },
        { label: "1B+", min: 5, max: 80, w: 0.25 },
        { label: "500M+", min: 1, max: 30, w: 0.30 },
        { label: "100M+", min: 0.5, max: 15, w: 0.36 },
    ];
    const COLORS = ["#2196F3","#4CAF50","#FF5722","#9C27B0","#00BCD4","#FF9800","#607D8B","#E91E63","#3F51B5","#795548","#009688","#FFC107","#673AB7","#8BC34A","#F44336","#03A9F4","#CDDC39","#FF5252","#448AFF","#69F0AE"];
    const target = 10000 - top.length;
    let exIdx = 0;
    for (let i = 0; i < target; i++) {
        // Distribute across exchanges based on weights
        const ex = EXCHANGES[exIdx % EXCHANGES.length];
        if (rng() > ex.w / 3000) { exIdx++; i--; continue; }
        exIdx++;
        // Generate unique ticker
        let sym;
        do {
            const len = rngI(2, 5);
            sym = Array.from({ length: len }, () => LETTERS[rngI(0, 25)]).join("");
            if (ex.pfx) sym += ex.pfx;
        } while (used.has(sym));
        used.add(sym);
        // Cap tier
        const r = rng();
        let tier = capTiers[5], cum = 0;
        for (const t of capTiers) { cum += t.w; if (r < cum) { tier = t; break; } }
        const price = +rngR(tier.min, tier.max).toFixed(2);
        const chg = +(rngR(-8, 8)).toFixed(2);
        const name = pick(PREFIXES) + " " + pick(SUFFIXES);
        generated.push({
            sym, name, price, chg,
            sector: pick(SECTORS),
            cap: tier.label,
            color: pick(COLORS),
            logo: stockLogo(sym.split(".")[0])
        });
    }
    return [...top, ...generated];
};

// ── 100 Cryptos ──
const REAL_CRYPTOS = [
    { sym:"BTC",name:"Bitcoin",price:67250,cap:"1.32T" },{ sym:"ETH",name:"Ethereum",price:3520,cap:"423B" },
    { sym:"BNB",name:"BNB Chain",price:598.2,cap:"92B" },{ sym:"SOL",name:"Solana",price:148.6,cap:"66B" },
    { sym:"XRP",name:"Ripple",price:0.62,cap:"34B" },{ sym:"ADA",name:"Cardano",price:0.58,cap:"20B" },
    { sym:"DOGE",name:"Dogecoin",price:0.165,cap:"23B" },{ sym:"AVAX",name:"Avalanche",price:38.4,cap:"14B" },
    { sym:"DOT",name:"Polkadot",price:7.85,cap:"10B" },{ sym:"LINK",name:"Chainlink",price:15.2,cap:"9B" },
    { sym:"MATIC",name:"Polygon",price:0.92,cap:"8.5B" },{ sym:"UNI",name:"Uniswap",price:7.65,cap:"5.7B" },
    { sym:"LTC",name:"Litecoin",price:72.3,cap:"5.4B" },{ sym:"BCH",name:"Bitcoin Cash",price:245.8,cap:"4.8B" },
    { sym:"ETC",name:"Ethereum Classic",price:26.4,cap:"3.8B" },{ sym:"XLM",name:"Stellar",price:0.118,cap:"3.4B" },
    { sym:"ATOM",name:"Cosmos",price:9.85,cap:"3.6B" },{ sym:"ALGO",name:"Algorand",price:0.185,cap:"1.5B" },
    { sym:"ICP",name:"Internet Computer",price:12.4,cap:"5.7B" },{ sym:"VET",name:"VeChain",price:0.034,cap:"2.5B" },
    { sym:"FIL",name:"Filecoin",price:5.85,cap:"3.2B" },{ sym:"AAVE",name:"Aave",price:98.6,cap:"1.4B" },
    { sym:"MKR",name:"Maker",price:1520.4,cap:"1.4B" },{ sym:"SNX",name:"Synthetix",price:3.25,cap:"1.0B" },
    { sym:"CRV",name:"Curve DAO",price:0.62,cap:"0.8B" },{ sym:"GRT",name:"The Graph",price:0.185,cap:"1.7B" },
    { sym:"APE",name:"ApeCoin",price:1.45,cap:"0.5B" },{ sym:"SAND",name:"The Sandbox",price:0.445,cap:"0.9B" },
    { sym:"MANA",name:"Decentraland",price:0.485,cap:"0.9B" },{ sym:"SHIB",name:"Shiba Inu",price:0.0000245,cap:"14.5B" },
    { sym:"NEAR",name:"NEAR Protocol",price:5.85,cap:"5.8B" },{ sym:"FTM",name:"Fantom",price:0.72,cap:"2.0B" },
    { sym:"HBAR",name:"Hedera",price:0.095,cap:"3.4B" },{ sym:"APT",name:"Aptos",price:8.45,cap:"3.6B" },
    { sym:"SUI",name:"Sui",price:1.28,cap:"1.5B" },{ sym:"SEI",name:"Sei Network",price:0.52,cap:"1.8B" },
    { sym:"TON",name:"Toncoin",price:5.65,cap:"19.5B" },{ sym:"ARB",name:"Arbitrum",price:1.15,cap:"1.5B" },
    { sym:"OP",name:"Optimism",price:2.45,cap:"2.3B" },{ sym:"IMX",name:"ImmutableX",price:1.85,cap:"2.8B" },
    { sym:"PEPE",name:"Pepe",price:0.0000125,cap:"5.2B" },{ sym:"WLD",name:"Worldcoin",price:2.85,cap:"0.8B" },
    { sym:"INJ",name:"Injective",price:28.5,cap:"2.7B" },{ sym:"TIA",name:"Celestia",price:12.8,cap:"2.1B" },
    { sym:"STX",name:"Stacks",price:2.15,cap:"3.0B" },{ sym:"RENDER",name:"Render",price:7.25,cap:"2.8B" },
    { sym:"FET",name:"Fetch.ai",price:2.35,cap:"2.0B" },{ sym:"THETA",name:"Theta Network",price:1.45,cap:"1.4B" },
    { sym:"RUNE",name:"THORChain",price:5.85,cap:"2.0B" },{ sym:"EGLD",name:"MultiversX",price:42.5,cap:"1.1B" },
];
const CRYPTO_PREFIXES = ["Flux","Orion","Zenon","Akash","Quasar","Plasma","Nexo","Drift","Radix","Aura","Pyth","Kava","Mina","Osmosis","Juno","Secret","Oasis","Celo","Harmony","Flow","Kadena","Elrond","Waves","Icon","Zilliqa","Enjin","Gala","Axie","Loom","Sushi","Comp","Yearn","Badger","Convex","Ribbon","Balancer","Bancor","Amp","Spell","Dusk","Ergo","Nervos","Wax","Telos","EOS","IOTA","Qtum","ZCash","Dash","Monero","NEM","Tezos","Kusama","Polyx","Arweave","Livepeer","Audius","Rally","Bone","Floki"];
const generateCryptos = () => {
    _s.v = 777;
    const real = REAL_CRYPTOS.map(c => ({ ...c, chg: +(rngR(-8, 12)).toFixed(2), logo: cryptoLogo(c.sym.toLowerCase()) }));
    const extra = [];
    const usedSym = new Set(REAL_CRYPTOS.map(c => c.sym));
    for (let i = 0; i < 100 - REAL_CRYPTOS.length; i++) {
        const name = CRYPTO_PREFIXES[i] || (pick(["Meta","Quantum","Hyper","Proto","Neo","Dark","Star","Zero","Cross","Multi"]) + pick(["Chain","Swap","Fi","Verse","Yield","Node","Mint","Vault","Link","Pay"]));
        let sym;
        do { sym = name.slice(0, rngI(3, 5)).toUpperCase(); } while (usedSym.has(sym));
        usedSym.add(sym);
        const price = rng() < 0.3 ? +(rngR(0.001, 0.5)).toFixed(4) : rng() < 0.6 ? +(rngR(0.5, 20)).toFixed(2) : +(rngR(20, 500)).toFixed(2);
        extra.push({ sym, name, price, chg: +(rngR(-12, 15)).toFixed(2), logo: cryptoLogo(sym.toLowerCase()), cap: (rngR(0.05, 5)).toFixed(1) + "B" });
    }
    return [...real, ...extra];
};

// ── 50 Forex Pairs ──
const FOREX_PAIRS = [
    ["EUR","USD","eu","us",1.0862],["GBP","USD","gb","us",1.2715],["USD","JPY","us","jp",151.42],
    ["USD","CHF","us","ch",0.8812],["AUD","USD","au","us",0.6534],["USD","CAD","us","ca",1.3625],
    ["NZD","USD","nz","us",0.6145],["EUR","GBP","eu","gb",0.8545],["EUR","JPY","eu","jp",164.38],
    ["GBP","JPY","gb","jp",192.45],["EUR","CHF","eu","ch",0.9578],["EUR","AUD","eu","au",1.6625],
    ["EUR","CAD","eu","ca",1.4802],["GBP","CHF","gb","ch",1.1215],["AUD","JPY","au","jp",98.85],
    ["AUD","NZD","au","nz",1.0632],["EUR","NZD","eu","nz",1.7685],["GBP","AUD","gb","au",1.9465],
    ["GBP","CAD","gb","ca",1.7345],["GBP","NZD","gb","nz",2.0695],["CHF","JPY","ch","jp",171.85],
    ["CAD","JPY","ca","jp",111.15],["CAD","CHF","ca","ch",0.6468],["AUD","CAD","au","ca",0.8905],
    ["NZD","JPY","nz","jp",93.05],["NZD","CAD","nz","ca",0.8345],["USD","SGD","us","sg",1.3412],
    ["USD","HKD","us","hk",7.8245],["USD","TRY","us","tr",32.15],["USD","ZAR","us","za",18.92],
    ["USD","MXN","us","mx",17.28],["USD","SEK","us","se",10.45],["USD","NOK","us","no",10.68],
    ["USD","DKK","us","dk",6.88],["USD","PLN","us","pl",4.02],["USD","CZK","us","cz",22.85],
    ["USD","HUF","us","hu",356.20],["USD","THB","us","th",35.42],["USD","IDR","us","id",15685],
    ["USD","MYR","us","my",4.72],["USD","PHP","us","ph",56.25],["USD","INR","us","in",83.12],
    ["USD","KRW","us","kr",1328.5],["USD","TWD","us","tw",31.45],["USD","BRL","us","br",4.97],
    ["USD","CLP","us","cl",892.5],["USD","COP","us","co",3945],["USD","ARS","us","ar",855.2],
    ["USD","EGP","us","eg",30.90],["EUR","TRY","eu","tr",34.92],
];
const generateForex = () => {
    _s.v = 333;
    return FOREX_PAIRS.map(([c1,c2,f1,f2,price]) => ({
        sym: `${c1}/${c2}`, name: `${c1} / ${c2}`, price, chg: +(rngR(-0.5, 0.5)).toFixed(2),
        f1: flagUrl(f1), f2: flagUrl(f2),
        logo1: forexLogo(c1), logo2: forexLogo(c2)
    }));
};

// ── 50 Commodities ──
const COMMODITIES_RAW = [
    ["XAU/USD","Gold",2345.6,"🥇"],["XAG/USD","Silver",28.45,"🥈"],["XPT/USD","Platinum",985.4,"⬜"],
    ["XPD/USD","Palladium",1045.2,"🔘"],["CL","Crude Oil WTI",78.92,"🛢️"],["BRN","Brent Crude",83.15,"🛢️"],
    ["NG","Natural Gas",2.34,"🔥"],["HG","Copper",4.12,"🔶"],["ALU","Aluminium",2285.5,"🔩"],
    ["ZN","Zinc",2545.3,"⚙️"],["NI","Nickel",16850,"🔧"],["TIN","Tin",25480,"📎"],["PB","Lead",2085.4,"⚫"],
    ["IRON","Iron Ore",118.5,"🪨"],["U","Uranium",82.4,"☢️"],["LI","Lithium",15250,"🔋"],
    ["CO","Cobalt",28450,"💎"],["ZW","Wheat",612.5,"🌾"],["ZC","Corn",485.3,"🌽"],
    ["ZS","Soybeans",1245.8,"🫘"],["KC","Coffee",185.3,"☕"],["SB","Sugar",22.45,"🍬"],
    ["CT","Cotton",82.6,"🧶"],["CC","Cocoa",5420.8,"🍫"],["OJ","Orange Juice",342.5,"🍊"],
    ["LB","Lumber",585.4,"🪵"],["RS","Canola",645.2,"🌻"],["RR","Rice",17.85,"🍚"],
    ["ZO","Oats",385.6,"🌾"],["LH","Lean Hogs",72.45,"🐷"],["LC","Live Cattle",185.3,"🐄"],
    ["FC","Feeder Cattle",245.6,"🐂"],["DC","Milk Class III",18.25,"🥛"],["RB","Gasoline RBOB",2.45,"⛽"],
    ["HO","Heating Oil",2.68,"🏠"],["CNG","LNG",8.45,"💨"],["ETH_C","Ethanol",1.72,"🧪"],
    ["PA","Propane",0.85,"🔵"],["WPU","Wood Pulp",845.3,"📄"],["RUB","Rubber",1.65,"⚫"],
    ["PALM","Palm Oil",3845,"🌴"],["TEA","Tea",2.85,"🍵"],["TOBA","Tobacco",4.25,"🚬"],
    ["WOOL","Wool",12.45,"🐑"],["SILK","Silk",42.5,"🎀"],["SALT","Salt",0.045,"🧂"],
    ["FISH","Fish Index",1.25,"🐟"],["PORK","Pork Bellies",125.4,"🥓"],["EGGS","Egg Futures",2.85,"🥚"],
    ["HONEY","Honey Index",8.45,"🍯"],
];
const generateCommodities = () => {
    _s.v = 555;
    return COMMODITIES_RAW.map(([sym, name, price, emoji]) => ({
        sym, name, price, emoji, chg: +(rngR(-4, 6)).toFixed(2)
    }));
};

const STOCKS = generateStocks();
const CRYPTOS = generateCryptos();
const FOREX = generateForex();
const COMMODITIES = generateCommodities();
export { STOCKS, CRYPTOS, FOREX, COMMODITIES };
