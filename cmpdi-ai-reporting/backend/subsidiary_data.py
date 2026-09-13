"""
Subsidiary Data — Centralized Single Source of Truth
SIH26023 Compliance: Coal India Limited Subsidiary Records & Statistics
Consolidates subsidiary records previously duplicated across report_generator.py and main.py.
"""
from typing import Dict, List, Any

# Primary subsidiary specifications including production, targets, stripping ratio, and geological basins
SUBSIDIARY_DATA: Dict[str, Dict[str, Any]] = {
    "MCL": {
        "name": "Mahanadi Coalfields Ltd",
        "oc": 181.50,
        "ug": 11.80,
        "total": 193.30,
        "target": 190.00,
        "growth": "+11.9%",
        "basin": "Talcher / Ib Valley (Odisha)",
        "sr": "1.18 m³/t"
    },
    "SECL": {
        "name": "South Eastern Coalfields Ltd",
        "oc": 155.80,
        "ug": 11.20,
        "total": 167.00,
        "target": 170.00,
        "growth": "+13.2%",
        "basin": "Korba / Mand-Raigarh (Chhattisgarh)",
        "sr": "2.35 m³/t"
    },
    "NCL": {
        "name": "Northern Coalfields Ltd",
        "oc": 131.00,
        "ug": 0.00,
        "total": 131.00,
        "target": 131.00,
        "growth": "+6.8%",
        "basin": "Singrauli / Moher (MP/UP)",
        "sr": "3.10 m³/t"
    },
    "CCL": {
        "name": "Central Coalfields Ltd",
        "oc": 82.90,
        "ug": 1.10,
        "total": 84.00,
        "target": 84.00,
        "growth": "+14.2%",
        "basin": "North & South Karanpura (Jharkhand)",
        "sr": "2.85 m³/t"
    },
    "WCL": {
        "name": "Western Coalfields Ltd",
        "oc": 57.10,
        "ug": 3.20,
        "total": 60.30,
        "target": 62.00,
        "growth": "+4.5%",
        "basin": "Wardha Valley / Umrer (Maharashtra)",
        "sr": "4.21 m³/t"
    },
    "BCCL": {
        "name": "Bharat Coking Coal Ltd",
        "oc": 39.80,
        "ug": 1.30,
        "total": 41.10,
        "target": 41.00,
        "growth": "+17.4%",
        "basin": "Jharia Coalfield (Jharkhand)",
        "sr": "3.85 m³/t"
    },
    "ECL": {
        "name": "Eastern Coalfields Ltd",
        "oc": 25.90,
        "ug": 9.20,
        "total": 35.10,
        "target": 37.00,
        "growth": "+4.8%",
        "basin": "Raniganj / Rajmahal (WB/Jharkhand)",
        "sr": "3.40 m³/t"
    },
    "CMPDI": {
        "name": "Central Mine Planning & Design Institute",
        "oc": 0.0,
        "ug": 0.0,
        "total": 0.0,
        "target": 0.0,
        "growth": "N/A",
        "basin": "Ranchi HQ & 7 Regional Institutes",
        "sr": "Geological Exploration"
    }
}

# Regional mapping for analytics dashboard
SUBSIDIARY_REGIONS: Dict[str, str] = {
    "MCL": "Odisha",
    "SECL": "Chhattisgarh/MP",
    "NCL": "Singrauli, MP/UP",
    "CCL": "Jharkhand",
    "WCL": "Maharashtra/MP",
    "BCCL": "Dhanbad, Jharkhand",
    "ECL": "Raniganj, WB/Jharkhand",
}

# Derived list for analytics endpoints
SUBSIDIARY_STATS: List[Dict[str, Any]] = [
    {
        "name": code,
        "fullName": data["name"].replace(" Ltd", "").replace(" Limited", ""),
        "opencast": data["oc"],
        "underground": data["ug"],
        "total": data["total"],
        "target": data["target"],
        "growth": float(data["growth"].replace("+", "").replace("%", "")) if data["growth"] != "N/A" else 0.0,
        "region": SUBSIDIARY_REGIONS.get(code, data["basin"])
    }
    for code, data in SUBSIDIARY_DATA.items()
    if code != "CMPDI"
]

# 5-year historical production and OBR series (FY20 to FY24)
HISTORICAL_DATA: Dict[str, Dict[str, List[float]]] = {
    "MCL":  {"production": [148.0, 157.0, 168.0, 173.0, 193.3], "obr": [210.0, 235.0, 260.0, 290.0, 320.0]},
    "SECL": {"production": [127.0, 134.0, 142.0, 147.5, 167.0], "obr": [295.0, 310.0, 330.0, 345.0, 390.0]},
    "NCL":  {"production": [108.0, 112.0, 118.0, 122.6, 131.0], "obr": [340.0, 355.0, 370.0, 380.0, 406.0]},
    "CCL":  {"production": [62.0, 66.0, 70.5, 73.6, 84.0],     "obr": [175.0, 185.0, 195.0, 210.0, 239.0]},
    "WCL":  {"production": [48.0, 50.0, 53.0, 57.7, 60.3],     "obr": [195.0, 205.0, 215.0, 240.0, 254.0]},
    "BCCL": {"production": [28.0, 30.0, 32.5, 35.0, 41.1],     "obr": [105.0, 112.0, 120.0, 130.0, 158.0]},
    "ECL":  {"production": [28.5, 30.0, 31.5, 33.5, 35.1],     "obr": [95.0, 100.0, 105.0, 110.0, 119.0]},
}
