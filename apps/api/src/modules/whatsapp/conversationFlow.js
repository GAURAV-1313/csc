const crypto = require("crypto");

// Service types supported by the WhatsApp pre-check flow
const SUPPORTED_SERVICES = [
  { key: "income-certificate", label: "Income Certificate" },
  { key: "domicile-certificate", label: "Domicile Certificate" },
  { key: "sc-st-certificate", label: "SC/ST Certificate" },
  { key: "land-use-information", label: "Land Use Information" },
  { key: "obc-ews-certificate", label: "OBC/EWS Certificate" },
  { key: "birth-certificate-correction", label: "Birth Certificate Correction" }
];

// Questions to collect per service type for pre-check
const SERVICE_QUESTIONS = {
  "income-certificate": [
    { key: "district", prompt: "Please enter your district name (Chhattisgarh):" },
    { key: "annual_income", prompt: "Please enter your annual family income (in ₹):" },
    { key: "purpose", prompt: "Purpose of the certificate? Reply with one:\nScholarship / Admission / Government scheme / Other" },
    { key: "category", prompt: "Please enter your category:\nSC / ST / OBC / General / EWS" }
  ],
  "domicile-certificate": [
    { key: "district", prompt: "Please enter your district name:" },
    { key: "permanent_resident", prompt: "Are you a permanent resident of this state? (Reply: Yes / No)" },
    { key: "years_at_address", prompt: "How many years have you been at your current address?" },
    { key: "applicant_type", prompt: "Who is the applicant? Reply with one:\nAdult / Minor child" }
  ],
  "sc-st-certificate": [
    { key: "district", prompt: "Please enter your district name:" },
    { key: "category", prompt: "Please enter your category:\nSC / ST" },
    { key: "prior_certificate", prompt: "Has any family member already received an SC/ST certificate? (Reply: Yes / No)" }
  ],
  "land-use-information": [
    { key: "district", prompt: "Please enter your district name:" },
    { key: "village_locality", prompt: "Please enter the village/locality of the land:" },
    { key: "relation_to_land", prompt: "Your relation to the land? Reply with one:\nOwner / Authorized applicant / Other" },
    { key: "recent_transfer", prompt: "Has there been a recent transfer or mutation of this land? (Reply: Yes / No)" }
  ],
  "obc-ews-certificate": [
    { key: "district", prompt: "Please enter your district name:" },
    { key: "category", prompt: "Please enter your category:\nOBC / EWS" },
    { key: "annual_income", prompt: "Please enter your annual family income (in ₹):" },
    { key: "general_category", prompt: "Does the applicant belong to the General category? (Reply: Yes / No)\n(Required for EWS applicants)" }
  ],
  "birth-certificate-correction": [
    { key: "district", prompt: "Please enter your district name:" },
    { key: "correction_type", prompt: "What needs to be corrected? Reply with one:\nName / Date of Birth / Gender / Parent Name / Address" },
    { key: "for_whom", prompt: "Who is the correction for? Reply with one:\nAdult / Minor child" }
  ]
};

// Required documents per service type
const SERVICE_DOCUMENTS = {
  "income-certificate": {
    mandatory: ["Aadhaar Card", "Ration Card", "Income Affidavit", "Residence Proof", "Passport Size Photo"],
    optional: []
  },
  "domicile-certificate": {
    mandatory: ["Aadhaar Card", "Residence Proof", "Ration Card or Voter ID", "Passport Size Photo"],
    optional: ["School Record or Birth Proof"]
  },
  "sc-st-certificate": {
    mandatory: ["Aadhaar Card", "Caste Affidavit", "Ration Card", "Passport Size Photo"],
    optional: ["Previous Caste Certificate (if any)"]
  },
  "land-use-information": {
    mandatory: ["Aadhaar Card", "Land Records / Khasra-Khatauni", "Residence Proof"],
    optional: ["Mutation Certificate"]
  },
  "obc-ews-certificate": {
    mandatory: ["Aadhaar Card", "Income Affidavit", "Ration Card", "Passport Size Photo"],
    optional: ["Property Documents (required for EWS)"]
  },
  "birth-certificate-correction": {
    mandatory: ["Original Birth Certificate", "Aadhaar Card", "Correction Affidavit", "Hospital Records"],
    optional: ["School Record (for Name correction)"]
  }
};

// Eligibility rules per service type.
// Each function returns { eligible: true } or { eligible: false, message: "..." }
const ELIGIBILITY_RULES = {
  "domicile-certificate": (data) => {
    const answer = (data.permanent_resident || "").trim().toLowerCase();
    if (answer !== "yes" && answer !== "y") {
      return {
        eligible: false,
        message:
          "❌ You are not eligible for a Domicile Certificate because you are not a permanent resident of this state. Please visit your home state's CSC for this service."
      };
    }
    return { eligible: true };
  },
  "sc-st-certificate": (data) => {
    const cat = (data.category || "").trim().toLowerCase();
    if (cat !== "sc" && cat !== "st") {
      return {
        eligible: false,
        message:
          "❌ SC/ST Certificate is only available for SC or ST category applicants. You do not qualify for this certificate."
      };
    }
    return { eligible: true };
  },
  "land-use-information": (data) => {
    const relation = (data.relation_to_land || "").trim().toLowerCase();
    if (relation === "other") {
      return {
        eligible: false,
        message:
          "❌ Only the Owner or an Authorized Applicant can apply for Land Use Information. You are not eligible to apply with your stated relationship to the land."
      };
    }
    return { eligible: true };
  },
  "obc-ews-certificate": (data) => {
    const income = parseFloat((data.annual_income || "0").replace(/[^0-9.]/g, ""));
    if (!isNaN(income) && income > 800000) {
      return {
        eligible: false,
        message: "❌ Annual family income exceeds ₹8,00,000. You are not eligible for OBC/EWS Certificate."
      };
    }
    const cat = (data.category || "").trim().toLowerCase();
    if (cat === "ews") {
      const genCat = (data.general_category || "").trim().toLowerCase();
      if (genCat !== "yes" && genCat !== "y") {
        return {
          eligible: false,
          message:
            "❌ EWS Certificate requires the applicant to belong to the General category. You do not appear to meet this requirement."
        };
      }
    }
    return { eligible: true };
  }
};

const STEPS = {
  WELCOME: "welcome",
  SELECT_SERVICE: "select_service",
  COLLECT_DATA: "collect_data",
  ELIGIBILITY_BLOCKED: "eligibility_blocked",
  SHOW_DOCUMENTS: "show_documents",
  CONFIRM: "confirm",
  COMPLETE: "complete"
};

function generateReferenceId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `REF-${timestamp}-${random}`;
}

function buildServiceMenu() {
  const lines = ["Welcome to CSC AI Copilot! 🏛️", "", "Please select a service by replying with the number:"];
  SUPPORTED_SERVICES.forEach((svc, i) => {
    lines.push(`${i + 1}. ${svc.label}`);
  });
  lines.push("", 'Type "cancel" at any time to restart.');
  return lines.join("\n");
}

function getServiceBySelection(input) {
  const trimmed = (input || "").trim();
  const index = parseInt(trimmed, 10) - 1;
  if (!isNaN(index) && index >= 0 && index < SUPPORTED_SERVICES.length) {
    return SUPPORTED_SERVICES[index];
  }
  return SUPPORTED_SERVICES.find(
    (svc) => svc.key === trimmed.toLowerCase() || svc.label.toLowerCase() === trimmed.toLowerCase()
  ) || null;
}

function getQuestionsForService(serviceType) {
  return SERVICE_QUESTIONS[serviceType] || [];
}

/**
 * Check whether a user's collected answers meet eligibility requirements
 * for the given service. Returns { eligible: true } or
 * { eligible: false, message: "..." }.
 */
function checkEligibility(serviceType, collectedData) {
  const rule = ELIGIBILITY_RULES[serviceType];
  if (!rule) {
    return { eligible: true };
  }
  return rule(collectedData);
}

/**
 * Return the list of required documents for a service.
 * The returned object has `mandatory` and `optional` arrays.
 */
function getRequiredDocuments(serviceType) {
  return SERVICE_DOCUMENTS[serviceType] || { mandatory: [], optional: [] };
}

function buildDocumentChecklist(serviceType) {
  const docs = getRequiredDocuments(serviceType);
  const lines = ["📋 *Required Documents:*", ""];
  docs.mandatory.forEach((doc) => lines.push(`✅ ${doc}`));
  if (docs.optional.length > 0) {
    lines.push("");
    lines.push("📌 *Optional / Supporting Documents:*");
    docs.optional.forEach((doc) => lines.push(`📎 ${doc}`));
  }
  return lines.join("\n");
}

function buildConfirmationMessage(conversation) {
  const lines = ["Please confirm your details:", ""];
  const data = conversation.collected_data || {};
  Object.entries(data).forEach(([key, value]) => {
    const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    lines.push(`• ${label}: ${value}`);
  });
  lines.push("");
  lines.push(buildDocumentChecklist(conversation.service_type));
  lines.push("", 'Reply "yes" to confirm or "no" to restart.');
  return lines.join("\n");
}

/**
 * Process an incoming WhatsApp message and return the next bot reply.
 * Returns { reply, conversation, precheckRecord } where precheckRecord is set
 * only when the pre-check flow is complete.
 */
function processMessage(phoneNumber, incomingText, existingConversation) {
  const text = (incomingText || "").trim();

  // Allow user to cancel/restart at any time
  if (text.toLowerCase() === "cancel" || text.toLowerCase() === "restart") {
    const freshConversation = {
      phone_number: phoneNumber,
      step: STEPS.SELECT_SERVICE,
      service_type: null,
      collected_data: {}
    };
    return {
      reply: buildServiceMenu(),
      conversation: freshConversation,
      precheckRecord: null
    };
  }

  // No existing conversation or welcome step → start fresh
  if (!existingConversation || existingConversation.step === STEPS.WELCOME) {
    const conversation = {
      phone_number: phoneNumber,
      step: STEPS.SELECT_SERVICE,
      service_type: null,
      collected_data: {}
    };
    return {
      reply: buildServiceMenu(),
      conversation,
      precheckRecord: null
    };
  }

  const conversation = { ...existingConversation, collected_data: { ...(existingConversation.collected_data || {}) } };

  // Step: select service
  if (conversation.step === STEPS.SELECT_SERVICE) {
    const selected = getServiceBySelection(text);
    if (!selected) {
      return {
        reply: `I didn't understand that. ${buildServiceMenu()}`,
        conversation,
        precheckRecord: null
      };
    }
    conversation.service_type = selected.key;
    const questions = getQuestionsForService(selected.key);
    if (questions.length === 0) {
      conversation.step = STEPS.CONFIRM;
      return {
        reply: buildConfirmationMessage(conversation),
        conversation,
        precheckRecord: null
      };
    }
    conversation.step = STEPS.COLLECT_DATA;
    return {
      reply: `Great! You selected *${selected.label}*.\n\n${questions[0].prompt}`,
      conversation,
      precheckRecord: null
    };
  }

  // Step: collect data
  if (conversation.step === STEPS.COLLECT_DATA) {
    const questions = getQuestionsForService(conversation.service_type);
    const answeredCount = Object.keys(conversation.collected_data).length;
    const currentQuestion = questions[answeredCount];

    if (!currentQuestion) {
      // All answered — run eligibility check before moving to confirm
      const eligibilityResult = checkEligibility(conversation.service_type, conversation.collected_data);
      if (!eligibilityResult.eligible) {
        conversation.step = STEPS.ELIGIBILITY_BLOCKED;
        conversation.eligibility_status = "blocked";
        conversation.eligibility_message = eligibilityResult.message;
        return {
          reply: [
            eligibilityResult.message,
            "",
            'Type "restart" to start over with a different service.'
          ].join("\n"),
          conversation,
          precheckRecord: null
        };
      }
      conversation.step = STEPS.CONFIRM;
      conversation.eligibility_status = "approved";
      conversation.eligibility_message = "";
      return {
        reply: buildConfirmationMessage(conversation),
        conversation,
        precheckRecord: null
      };
    }

    // Save the answer
    conversation.collected_data[currentQuestion.key] = text;
    const nextQuestion = questions[answeredCount + 1];

    if (!nextQuestion) {
      // Last question answered — run eligibility check
      const eligibilityResult = checkEligibility(conversation.service_type, conversation.collected_data);
      if (!eligibilityResult.eligible) {
        conversation.step = STEPS.ELIGIBILITY_BLOCKED;
        conversation.eligibility_status = "blocked";
        conversation.eligibility_message = eligibilityResult.message;
        return {
          reply: [
            eligibilityResult.message,
            "",
            'Type "restart" to start over with a different service.'
          ].join("\n"),
          conversation,
          precheckRecord: null
        };
      }
      conversation.step = STEPS.CONFIRM;
      conversation.eligibility_status = "approved";
      conversation.eligibility_message = "";
      return {
        reply: buildConfirmationMessage(conversation),
        conversation,
        precheckRecord: null
      };
    }

    return {
      reply: nextQuestion.prompt,
      conversation,
      precheckRecord: null
    };
  }

  // Step: confirm
  if (conversation.step === STEPS.CONFIRM) {
    if (text.toLowerCase() === "yes" || text.toLowerCase() === "y") {
      const referenceId = generateReferenceId();
      const docs = getRequiredDocuments(conversation.service_type);
      const precheckRecord = {
        reference_id: referenceId,
        phone_number: phoneNumber,
        service_type: conversation.service_type,
        precheck_data: conversation.collected_data,
        required_documents: docs.mandatory,
        eligibility_status: conversation.eligibility_status || "approved",
        eligibility_message: conversation.eligibility_message || "",
        status: "completed"
      };
      conversation.step = STEPS.COMPLETE;
      const serviceName = (SUPPORTED_SERVICES.find((s) => s.key === conversation.service_type) || {}).label || conversation.service_type;
      const reply = [
        "✅ *Pre-check completed!*",
        "",
        `Your Reference ID is: *${referenceId}*`,
        "",
        `Please share this Reference ID with the CSC operator when you visit for *${serviceName}*.`,
        "",
        "The operator will use this ID to retrieve your pre-filled details and generate your application.",
        "",
        'Type "restart" to start a new pre-check.'
      ].join("\n");
      return { reply, conversation, precheckRecord };
    }

    if (text.toLowerCase() === "no" || text.toLowerCase() === "n") {
      const freshConversation = {
        phone_number: phoneNumber,
        step: STEPS.SELECT_SERVICE,
        service_type: null,
        collected_data: {}
      };
      return {
        reply: `No problem! Let\'s start over.\n\n${buildServiceMenu()}`,
        conversation: freshConversation,
        precheckRecord: null
      };
    }

    return {
      reply: 'Please reply with "yes" to confirm or "no" to restart.',
      conversation,
      precheckRecord: null
    };
  }

  // Step: eligibility blocked — allow restart
  if (conversation.step === STEPS.ELIGIBILITY_BLOCKED) {
    const freshConversation = {
      phone_number: phoneNumber,
      step: STEPS.SELECT_SERVICE,
      service_type: null,
      collected_data: {}
    };
    return {
      reply: buildServiceMenu(),
      conversation: freshConversation,
      precheckRecord: null
    };
  }

  // Step: complete (conversation finished)
  if (conversation.step === STEPS.COMPLETE) {
    const freshConversation = {
      phone_number: phoneNumber,
      step: STEPS.SELECT_SERVICE,
      service_type: null,
      collected_data: {}
    };
    return {
      reply: buildServiceMenu(),
      conversation: freshConversation,
      precheckRecord: null
    };
  }

  // Fallback
  const freshConversation = {
    phone_number: phoneNumber,
    step: STEPS.SELECT_SERVICE,
    service_type: null,
    collected_data: {}
  };
  return {
    reply: buildServiceMenu(),
    conversation: freshConversation,
    precheckRecord: null
  };
}

module.exports = {
  processMessage,
  generateReferenceId,
  STEPS,
  SUPPORTED_SERVICES,
  SERVICE_DOCUMENTS,
  getQuestionsForService,
  checkEligibility,
  getRequiredDocuments
};
