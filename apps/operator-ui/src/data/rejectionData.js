export const rejectionAnalyticsByRange = {
  this_month: {
    districts: [
      {
        name: "Raipur",
        totalApplications: 120,
        totalRejected: 32,
        services: [
          {
            serviceName: "Income Certificate",
            rejected: 12,
            reasons: [
              { reason: "Missing PAN Card", count: 5 },
              { reason: "Income proof not uploaded", count: 4 },
              { reason: "Invalid affidavit", count: 3 }
            ]
          },
          {
            serviceName: "OBC Certificate",
            rejected: 10,
            reasons: [
              { reason: "Caste proof missing", count: 6 },
              { reason: "Address mismatch", count: 4 }
            ]
          },
          {
            serviceName: "Domicile Certificate",
            rejected: 10,
            reasons: [
              { reason: "Residence proof incomplete", count: 6 },
              { reason: "Signature missing", count: 4 }
            ]
          }
        ]
      },
      {
        name: "Durg",
        totalApplications: 95,
        totalRejected: 14,
        services: [
          {
            serviceName: "Income Certificate",
            rejected: 7,
            reasons: [
              { reason: "Income declaration mismatch", count: 4 },
              { reason: "Old income document", count: 3 }
            ]
          },
          {
            serviceName: "SC/ST Certificate",
            rejected: 4,
            reasons: [
              { reason: "Caste document unreadable", count: 3 },
              { reason: "Guardian details mismatch", count: 1 }
            ]
          },
          {
            serviceName: "Birth Certificate Correction",
            rejected: 3,
            reasons: [
              { reason: "Hospital record missing", count: 2 },
              { reason: "Name mismatch", count: 1 }
            ]
          }
        ]
      },
      {
        name: "Bilaspur",
        totalApplications: 102,
        totalRejected: 19,
        services: [
          {
            serviceName: "Land Use Information",
            rejected: 8,
            reasons: [
              { reason: "Khasra mismatch", count: 4 },
              { reason: "Map copy missing", count: 4 }
            ]
          },
          {
            serviceName: "Income Certificate",
            rejected: 6,
            reasons: [
              { reason: "Income proof not uploaded", count: 3 },
              { reason: "Guardian information incomplete", count: 3 }
            ]
          },
          {
            serviceName: "Domicile Certificate",
            rejected: 5,
            reasons: [
              { reason: "15-year residence proof missing", count: 5 }
            ]
          }
        ]
      },
      {
        name: "Raigarh",
        totalApplications: 88,
        totalRejected: 9,
        services: [
          {
            serviceName: "OBC Certificate",
            rejected: 4,
            reasons: [
              { reason: "OBC proof expired", count: 2 },
              { reason: "Address mismatch", count: 2 }
            ]
          },
          {
            serviceName: "Domicile Certificate",
            rejected: 3,
            reasons: [
              { reason: "Education certificate missing", count: 3 }
            ]
          },
          {
            serviceName: "Income Certificate",
            rejected: 2,
            reasons: [
              { reason: "Affidavit invalid", count: 2 }
            ]
          }
        ]
      },
      {
        name: "Bastar",
        totalApplications: 76,
        totalRejected: 22,
        services: [
          {
            serviceName: "SC/ST Certificate",
            rejected: 11,
            reasons: [
              { reason: "Historical lineage proof missing", count: 7 },
              { reason: "Village verification pending", count: 4 }
            ]
          },
          {
            serviceName: "Land Use Information",
            rejected: 6,
            reasons: [
              { reason: "Owner declaration mismatch", count: 3 },
              { reason: "Challan copy missing", count: 3 }
            ]
          },
          {
            serviceName: "Income Certificate",
            rejected: 5,
            reasons: [
              { reason: "Income source not supported", count: 5 }
            ]
          }
        ]
      },
      {
        name: "Korba",
        totalApplications: 71,
        totalRejected: 6,
        services: [
          {
            serviceName: "Birth Certificate Correction",
            rejected: 3,
            reasons: [
              { reason: "Supporting correction proof missing", count: 2 },
              { reason: "Registration number mismatch", count: 1 }
            ]
          },
          {
            serviceName: "Income Certificate",
            rejected: 3,
            reasons: [
              { reason: "Class information missing", count: 2 },
              { reason: "Address incomplete", count: 1 }
            ]
          }
        ]
      },
      {
        name: "Janjgir Champa",
        totalApplications: 64,
        totalRejected: 4,
        services: [
          {
            serviceName: "Income Certificate",
            rejected: 2,
            reasons: [
              { reason: "Business details incomplete", count: 2 }
            ]
          },
          {
            serviceName: "Domicile Certificate",
            rejected: 2,
            reasons: [
              { reason: "District details mismatch", count: 2 }
            ]
          }
        ]
      },
      {
        name: "Kanker",
        totalApplications: 59,
        totalRejected: 17,
        services: [
          {
            serviceName: "SC/ST Certificate",
            rejected: 9,
            reasons: [
              { reason: "Category evidence missing", count: 5 },
              { reason: "Relation document mismatch", count: 4 }
            ]
          },
          {
            serviceName: "OBC Certificate",
            rejected: 5,
            reasons: [
              { reason: "Income proof invalid", count: 3 },
              { reason: "OBC register extract missing", count: 2 }
            ]
          },
          {
            serviceName: "Domicile Certificate",
            rejected: 3,
            reasons: [
              { reason: "Residence year proof incomplete", count: 3 }
            ]
          }
        ]
      }
    ]
  },
  last_month: {
    districts: []
  },
  last_3_months: {
    districts: []
  }
};

export function getMockRejectionData(range = "this_month") {
  const key = String(range || "this_month").toLowerCase();
  if (key === "last month") return rejectionAnalyticsByRange.last_month;
  if (key === "last 3 months") return rejectionAnalyticsByRange.last_3_months;
  return rejectionAnalyticsByRange[key] || rejectionAnalyticsByRange.this_month;
}
