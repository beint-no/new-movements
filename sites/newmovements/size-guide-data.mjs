// Brand sizing reference. Commerce variants and stock remain owned by ReAI.
export const SIZE_GUIDE_SOURCE = {
  "file": "SHOE LASTS + SIZE CHART + LACE LENGTH. CM, EU, US, UK 15.53.20.xlsx",
  "sheet": "Last Sizes",
  "sha256": "7a9d58fb60188a8ead2b141a936314c3e22620de8534297b32e3aa6d16dd73cb",
  "importedOn": "2026-10-15",
  "lengthMeaning": "foot",
  "lengthConfirmed": false,
  "lengthAssumption": "Merchant authorized publication on 2026-10-14 using approximate heel-to-toe foot lengths. Existing public Original/Allrounder guide labels matching CM values as foot measurements; this interpretation is provisionally applied to all five workbook charts pending the New Movements team review.",
  "unitNotes": "Classic and Sandals numeric values are cm; Sneakers, Boots and Loafers numeric values are mm, despite inconsistent source headings. The new workbook is semantically unchanged from the previously published size rows; values are preserved by converting mm to cm. No missing conversions or sizes extrapolated. Lace-length tables remain source-only until the team confirms they should be published."
};

export const SIZE_CHARTS = [
  {
    "id": "sneakers",
    "label": "Original & Allrounder",
    "models": [
      "Original",
      "Allrounder",
      "Allrounder Y",
      "Allrounder E",
      "The Norwegian Sneaker",
      "Zen"
    ],
    "range": "A21:G37",
    "rows": [
      {
        "eu": 36.0,
        "lengthCm": 23.6,
        "usWomen": "5–5.5",
        "usMen": null,
        "ukWomen": "3",
        "ukMen": null
      },
      {
        "eu": 37.0,
        "lengthCm": 24.2,
        "usWomen": "6–6.5",
        "usMen": null,
        "ukWomen": "4",
        "ukMen": null
      },
      {
        "eu": 38.0,
        "lengthCm": 24.9,
        "usWomen": "7–7.5",
        "usMen": null,
        "ukWomen": "5",
        "ukMen": null
      },
      {
        "eu": 39.0,
        "lengthCm": 25.5,
        "usWomen": "8–8.5",
        "usMen": null,
        "ukWomen": "6",
        "ukMen": null
      },
      {
        "eu": 40.0,
        "lengthCm": 26.2,
        "usWomen": "9–9.5",
        "usMen": null,
        "ukWomen": "7",
        "ukMen": null
      },
      {
        "eu": 41.0,
        "lengthCm": 26.8,
        "usWomen": "10–10.5",
        "usMen": null,
        "ukWomen": "8",
        "ukMen": null
      },
      {
        "eu": 41.5,
        "lengthCm": 27.15,
        "usWomen": null,
        "usMen": "8",
        "ukWomen": null,
        "ukMen": "6.5"
      },
      {
        "eu": 42.0,
        "lengthCm": 27.5,
        "usWomen": null,
        "usMen": "8.5",
        "ukWomen": null,
        "ukMen": "7"
      },
      {
        "eu": 42.5,
        "lengthCm": 27.85,
        "usWomen": null,
        "usMen": "9",
        "ukWomen": null,
        "ukMen": "7.5"
      },
      {
        "eu": 43.0,
        "lengthCm": 28.2,
        "usWomen": null,
        "usMen": "9.5",
        "ukWomen": null,
        "ukMen": "8"
      },
      {
        "eu": 43.5,
        "lengthCm": 28.55,
        "usWomen": null,
        "usMen": "10",
        "ukWomen": null,
        "ukMen": "8.5"
      },
      {
        "eu": 44.0,
        "lengthCm": 28.8,
        "usWomen": null,
        "usMen": "10.5",
        "ukWomen": null,
        "ukMen": "9"
      },
      {
        "eu": 44.5,
        "lengthCm": 29.15,
        "usWomen": null,
        "usMen": "11",
        "ukWomen": null,
        "ukMen": "9.5"
      },
      {
        "eu": 45.0,
        "lengthCm": 29.5,
        "usWomen": null,
        "usMen": "11.5",
        "ukWomen": null,
        "ukMen": "10"
      },
      {
        "eu": 45.5,
        "lengthCm": 29.85,
        "usWomen": null,
        "usMen": "12",
        "ukWomen": null,
        "ukMen": "10.5"
      },
      {
        "eu": 46.0,
        "lengthCm": 30.2,
        "usWomen": null,
        "usMen": "12.5",
        "ukWomen": null,
        "ukMen": "11"
      },
      {
        "eu": 46.5,
        "lengthCm": 30.5,
        "usWomen": null,
        "usMen": "13",
        "ukWomen": null,
        "ukMen": "11.5"
      }
    ]
  },
  {
    "id": "boots",
    "label": "Boots",
    "models": [
      "Flow Boot",
      "Cloud Boot",
      "Space Boot",
      "High Space Boot",
      "Moss",
      "Low Cloud"
    ],
    "range": "A41:G64",
    "rows": [
      {
        "eu": 35.0,
        "lengthCm": 22.95,
        "usWomen": "4",
        "usMen": null,
        "ukWomen": "2",
        "ukMen": null
      },
      {
        "eu": 35.5,
        "lengthCm": 23.2,
        "usWomen": "4.5",
        "usMen": null,
        "ukWomen": "2.5",
        "ukMen": null
      },
      {
        "eu": 36.0,
        "lengthCm": 23.55,
        "usWomen": "5",
        "usMen": null,
        "ukWomen": "3",
        "ukMen": null
      },
      {
        "eu": 36.5,
        "lengthCm": 23.9,
        "usWomen": "5.5",
        "usMen": null,
        "ukWomen": "3.5",
        "ukMen": null
      },
      {
        "eu": 37.0,
        "lengthCm": 24.25,
        "usWomen": "6",
        "usMen": null,
        "ukWomen": "4",
        "ukMen": null
      },
      {
        "eu": 37.5,
        "lengthCm": 24.5,
        "usWomen": "6.5",
        "usMen": null,
        "ukWomen": "4.5",
        "ukMen": null
      },
      {
        "eu": 38.0,
        "lengthCm": 24.85,
        "usWomen": "7",
        "usMen": null,
        "ukWomen": "5",
        "ukMen": null
      },
      {
        "eu": 38.5,
        "lengthCm": 25.2,
        "usWomen": "7.5",
        "usMen": null,
        "ukWomen": "5.5",
        "ukMen": null
      },
      {
        "eu": 39.0,
        "lengthCm": 25.55,
        "usWomen": "8",
        "usMen": null,
        "ukWomen": "6",
        "ukMen": null
      },
      {
        "eu": 39.5,
        "lengthCm": 25.8,
        "usWomen": "8.5",
        "usMen": null,
        "ukWomen": "6.5",
        "ukMen": null
      },
      {
        "eu": 40.0,
        "lengthCm": 26.15,
        "usWomen": "9",
        "usMen": null,
        "ukWomen": "7",
        "ukMen": null
      },
      {
        "eu": 40.5,
        "lengthCm": 27.2,
        "usWomen": null,
        "usMen": "7",
        "ukWomen": null,
        "ukMen": "6.5"
      },
      {
        "eu": 41.0,
        "lengthCm": 27.55,
        "usWomen": null,
        "usMen": "7.5",
        "ukWomen": null,
        "ukMen": "7"
      },
      {
        "eu": 41.5,
        "lengthCm": 27.8,
        "usWomen": null,
        "usMen": "8",
        "ukWomen": null,
        "ukMen": "7.5"
      },
      {
        "eu": 42.0,
        "lengthCm": 28.15,
        "usWomen": null,
        "usMen": "8.5",
        "ukWomen": null,
        "ukMen": "8"
      },
      {
        "eu": 42.5,
        "lengthCm": 28.5,
        "usWomen": null,
        "usMen": "9",
        "ukWomen": null,
        "ukMen": "8.5"
      },
      {
        "eu": 43.0,
        "lengthCm": 28.85,
        "usWomen": null,
        "usMen": "9.5",
        "ukWomen": null,
        "ukMen": "9"
      },
      {
        "eu": 43.5,
        "lengthCm": 29.1,
        "usWomen": null,
        "usMen": "10",
        "ukWomen": null,
        "ukMen": "9.5"
      },
      {
        "eu": 44.0,
        "lengthCm": 29.45,
        "usWomen": null,
        "usMen": "10.5",
        "ukWomen": null,
        "ukMen": "10"
      },
      {
        "eu": 44.5,
        "lengthCm": 29.8,
        "usWomen": null,
        "usMen": "11",
        "ukWomen": null,
        "ukMen": "10.5"
      },
      {
        "eu": 45.0,
        "lengthCm": 30.25,
        "usWomen": null,
        "usMen": "11.5",
        "ukWomen": null,
        "ukMen": "11"
      },
      {
        "eu": 45.5,
        "lengthCm": 30.5,
        "usWomen": null,
        "usMen": "12",
        "ukWomen": null,
        "ukMen": "11.5"
      },
      {
        "eu": 46.0,
        "lengthCm": 30.85,
        "usWomen": null,
        "usMen": "12.5",
        "ukWomen": null,
        "ukMen": "12"
      },
      {
        "eu": 46.5,
        "lengthCm": 31.2,
        "usWomen": null,
        "usMen": "13",
        "ukWomen": null,
        "ukMen": "12.5"
      }
    ]
  },
  {
    "id": "loafers",
    "label": "Loafers",
    "models": [
      "Loafers"
    ],
    "range": "I42:O65",
    "rows": [
      {
        "eu": 35.0,
        "lengthCm": 22.9,
        "usWomen": "4",
        "usMen": null,
        "ukWomen": "2",
        "ukMen": null
      },
      {
        "eu": 35.5,
        "lengthCm": 23.25,
        "usWomen": "4.5",
        "usMen": null,
        "ukWomen": "2.5",
        "ukMen": null
      },
      {
        "eu": 36.0,
        "lengthCm": 23.6,
        "usWomen": "5",
        "usMen": null,
        "ukWomen": "3",
        "ukMen": null
      },
      {
        "eu": 36.5,
        "lengthCm": 23.95,
        "usWomen": "5.5",
        "usMen": null,
        "ukWomen": "3.5",
        "ukMen": null
      },
      {
        "eu": 37.0,
        "lengthCm": 24.2,
        "usWomen": "6",
        "usMen": null,
        "ukWomen": "4",
        "ukMen": null
      },
      {
        "eu": 37.5,
        "lengthCm": 24.55,
        "usWomen": "6.5",
        "usMen": null,
        "ukWomen": "4.5",
        "ukMen": null
      },
      {
        "eu": 38.0,
        "lengthCm": 24.9,
        "usWomen": "7",
        "usMen": null,
        "ukWomen": "5",
        "ukMen": null
      },
      {
        "eu": 38.5,
        "lengthCm": 25.25,
        "usWomen": "7.5",
        "usMen": null,
        "ukWomen": "5.5",
        "ukMen": null
      },
      {
        "eu": 39.0,
        "lengthCm": 25.5,
        "usWomen": "8",
        "usMen": null,
        "ukWomen": "6",
        "ukMen": null
      },
      {
        "eu": 39.5,
        "lengthCm": 25.85,
        "usWomen": "8.5",
        "usMen": null,
        "ukWomen": "6.5",
        "ukMen": null
      },
      {
        "eu": 40.0,
        "lengthCm": 26.2,
        "usWomen": "9",
        "usMen": null,
        "ukWomen": "7",
        "ukMen": null
      },
      {
        "eu": 40.5,
        "lengthCm": 26.9,
        "usWomen": null,
        "usMen": "7",
        "ukWomen": null,
        "ukMen": "6.5"
      },
      {
        "eu": 41.0,
        "lengthCm": 27.25,
        "usWomen": null,
        "usMen": "7.5",
        "ukWomen": null,
        "ukMen": "7"
      },
      {
        "eu": 41.5,
        "lengthCm": 27.5,
        "usWomen": null,
        "usMen": "8",
        "ukWomen": null,
        "ukMen": "7.5"
      },
      {
        "eu": 42.0,
        "lengthCm": 27.85,
        "usWomen": null,
        "usMen": "8.5",
        "ukWomen": null,
        "ukMen": "8"
      },
      {
        "eu": 42.5,
        "lengthCm": 28.2,
        "usWomen": null,
        "usMen": "9",
        "ukWomen": null,
        "ukMen": "8.5"
      },
      {
        "eu": 43.0,
        "lengthCm": 28.55,
        "usWomen": null,
        "usMen": "9.5",
        "ukWomen": null,
        "ukMen": "9"
      },
      {
        "eu": 43.5,
        "lengthCm": 28.8,
        "usWomen": null,
        "usMen": "10",
        "ukWomen": null,
        "ukMen": "9.5"
      },
      {
        "eu": 44.0,
        "lengthCm": 29.15,
        "usWomen": null,
        "usMen": "10.5",
        "ukWomen": null,
        "ukMen": "10"
      },
      {
        "eu": 44.5,
        "lengthCm": 29.5,
        "usWomen": null,
        "usMen": "11",
        "ukWomen": null,
        "ukMen": "10.5"
      },
      {
        "eu": 45.0,
        "lengthCm": 29.85,
        "usWomen": null,
        "usMen": "11.5",
        "ukWomen": null,
        "ukMen": "11"
      },
      {
        "eu": 45.5,
        "lengthCm": 30.2,
        "usWomen": null,
        "usMen": "12",
        "ukWomen": null,
        "ukMen": "11.5"
      },
      {
        "eu": 46.0,
        "lengthCm": 30.55,
        "usWomen": null,
        "usMen": "12.5",
        "ukWomen": null,
        "ukMen": "12"
      },
      {
        "eu": 46.5,
        "lengthCm": 30.9,
        "usWomen": null,
        "usMen": "13",
        "ukWomen": null,
        "ukMen": "12.5"
      }
    ]
  },
  {
    "id": "classic",
    "label": "Classic & Cruiser",
    "models": [
      "Classic",
      "Cruiser"
    ],
    "range": "A3:G13",
    "rows": [
      {
        "eu": 36.0,
        "lengthCm": 23.3,
        "usWomen": "5–5.5",
        "usMen": null,
        "ukWomen": "3",
        "ukMen": null
      },
      {
        "eu": 37.0,
        "lengthCm": 24.0,
        "usWomen": "6–6.5",
        "usMen": null,
        "ukWomen": "4",
        "ukMen": null
      },
      {
        "eu": 38.0,
        "lengthCm": 24.6,
        "usWomen": "7–7.5",
        "usMen": null,
        "ukWomen": "5",
        "ukMen": null
      },
      {
        "eu": 39.0,
        "lengthCm": 25.4,
        "usWomen": "8–8.5",
        "usMen": null,
        "ukWomen": "6",
        "ukMen": null
      },
      {
        "eu": 40.0,
        "lengthCm": 26.0,
        "usWomen": "9–9.5",
        "usMen": "6.5–7",
        "ukWomen": "7",
        "ukMen": "6"
      },
      {
        "eu": 41.0,
        "lengthCm": 26.6,
        "usWomen": "10–10.5",
        "usMen": "7.5–8",
        "ukWomen": "8",
        "ukMen": "7"
      },
      {
        "eu": 42.0,
        "lengthCm": 27.3,
        "usWomen": null,
        "usMen": "8.5–9",
        "ukWomen": null,
        "ukMen": "8"
      },
      {
        "eu": 43.0,
        "lengthCm": 28.0,
        "usWomen": null,
        "usMen": "9.5–10",
        "ukWomen": null,
        "ukMen": "9"
      },
      {
        "eu": 44.0,
        "lengthCm": 28.6,
        "usWomen": null,
        "usMen": "10.5–11",
        "ukWomen": null,
        "ukMen": "10"
      },
      {
        "eu": 45.0,
        "lengthCm": 29.3,
        "usWomen": null,
        "usMen": "11.5–12",
        "ukWomen": null,
        "ukMen": "11"
      },
      {
        "eu": 46.0,
        "lengthCm": 30.0,
        "usWomen": null,
        "usMen": "12.5–13",
        "ukWomen": null,
        "ukMen": "12"
      }
    ]
  },
  {
    "id": "sandals",
    "ukShared": true,
    "label": "Everyday Sandals",
    "models": [
      "The Everyday Sandal",
      "The Everyday Sandal – Strappy"
    ],
    "range": "I2:O14",
    "rows": [
      {
        "eu": 35.0,
        "lengthCm": 22.8,
        "usWomen": "5",
        "usMen": "4.5",
        "ukWomen": "2.5",
        "ukMen": "2.5"
      },
      {
        "eu": 36.0,
        "lengthCm": 23.5,
        "usWomen": "6",
        "usMen": "5",
        "ukWomen": "3.5",
        "ukMen": "3.5"
      },
      {
        "eu": 37.0,
        "lengthCm": 23.8,
        "usWomen": "6.5",
        "usMen": "6",
        "ukWomen": "4",
        "ukMen": "4"
      },
      {
        "eu": 38.0,
        "lengthCm": 24.5,
        "usWomen": "7.5",
        "usMen": "6.5",
        "ukWomen": "5",
        "ukMen": "5"
      },
      {
        "eu": 39.0,
        "lengthCm": 25.1,
        "usWomen": "8.5",
        "usMen": "7",
        "ukWomen": "6",
        "ukMen": "6"
      },
      {
        "eu": 40.0,
        "lengthCm": 25.4,
        "usWomen": "9",
        "usMen": "7.5",
        "ukWomen": "6.5",
        "ukMen": "6.5"
      },
      {
        "eu": 41.0,
        "lengthCm": 25.7,
        "usWomen": "9.5",
        "usMen": "8",
        "ukWomen": "7.5",
        "ukMen": "7.5"
      },
      {
        "eu": 42.0,
        "lengthCm": 26.0,
        "usWomen": "10",
        "usMen": "8.5",
        "ukWomen": "8",
        "ukMen": "8"
      },
      {
        "eu": 43.0,
        "lengthCm": 26.7,
        "usWomen": "10.5",
        "usMen": "9",
        "ukWomen": "9",
        "ukMen": "9"
      },
      {
        "eu": 44.0,
        "lengthCm": 27.3,
        "usWomen": "11",
        "usMen": "10.5",
        "ukWomen": "9.5",
        "ukMen": "9.5"
      },
      {
        "eu": 45.0,
        "lengthCm": 27.9,
        "usWomen": "11.5",
        "usMen": "11.5",
        "ukWomen": "10.5",
        "ukMen": "10.5"
      },
      {
        "eu": 46.0,
        "lengthCm": 28.6,
        "usWomen": "12",
        "usMen": "12",
        "ukWomen": "11.5",
        "ukMen": "11.5"
      }
    ]
  }
];
