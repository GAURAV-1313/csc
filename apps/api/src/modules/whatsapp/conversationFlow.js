const crypto = require("crypto");

// Service types supported by the WhatsApp pre-check flow
const SUPPORTED_SERVICES = [
  { key: "income_certificate", label: "Income Certificate" },
  { key: "domicile_certificate", label: "Domicile Certificate" },
  { key: "caste_certificate", label: "Caste Certificate" },
  { key: "birth_certificate", label: "Birth Certificate" },
  { key: "marriage_certificate", label: "Marriage Certificate" }
];

// Questions to collect per service type for pre-check
const SERVICE_QUESTIONS = {
  income_certificate: [
    { key: "applicant_name", prompt: "Please enter your full name:" },
    { key: "age_of_beneficiary", prompt: "Please enter the beneficiary's age:" },
    { key: "annual_income", prompt: "Please enter your approximate annual income (in INR):" },
    { key: "district", prompt: "Please enter your district:" },
    { key: "address", prompt: "Please enter your full address:" }
  ],
  domicile_certificate: [
    { key: "applicant_name", prompt: "Please enter your full name:" },
    { key: "date_of_birth", prompt: "Please enter your date of birth (DD/MM/YYYY):" },
    { key: "place_of_birth", prompt: "Please enter your place of birth:" },
    { key: "district", prompt: "Please enter your current district of residence:" },
    { key: "years_of_residence", prompt: "How many years have you lived in this state?" }
  ],
  caste_certificate: [
    { key: "applicant_name", prompt: "Please enter your full name:" },
    { key: "date_of_birth", prompt: "Please enter your date of birth (DD/MM/YYYY):" },
    { key: "caste", prompt: "Please enter your caste category (SC/ST/OBC):" },
    { key: "district", prompt: "Please enter your district:" },
    { key: "address", prompt: "Please enter your full address:" }
  ],
  birth_certificate: [
    { key: "child_name", prompt: "Please enter the child's full name:" },
    { key: "date_of_birth", prompt: "Please enter the date of birth (DD/MM/YYYY):" },
    { key: "place_of_birth", prompt: "Please enter the place of birth (hospital/home):" },
    { key: "father_name", prompt: "Please enter the father's name:" },
    { key: "mother_name", prompt: "Please enter the mother's name:" },
    { key: "district", prompt: "Please enter the district:" }
  ],
  marriage_certificate: [
    { key: "groom_name", prompt: "Please enter the groom's full name:" },
    { key: "bride_name", prompt: "Please enter the bride's full name:" },
    { key: "date_of_marriage", prompt: "Please enter the date of marriage (DD/MM/YYYY):" },
    { key: "place_of_marriage", prompt: "Please enter the place of marriage:" },
    { key: "district", prompt: "Please enter the district:" }
  ]
};

const STEPS = {
  WELCOME: "welcome",
  SELECT_SERVICE: "select_service",
  COLLECT_DATA: "collect_data",
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

function getCurrentQuestion(conversation) {
  const questions = getQuestionsForService(conversation.service_type);
  const answeredCount = Object.keys(conversation.collected_data || {}).length;
  return questions[answeredCount] || null;
}

function buildConfirmationMessage(conversation) {
  const lines = ["Please confirm your details:", ""];
  const data = conversation.collected_data || {};
  Object.entries(data).forEach(([key, value]) => {
    const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    lines.push(`• ${label}: ${value}`);
  });
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
      // All answered, move to confirm
      conversation.step = STEPS.CONFIRM;
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
      // Last question answered, move to confirm
      conversation.step = STEPS.CONFIRM;
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
      const precheckRecord = {
        reference_id: referenceId,
        phone_number: phoneNumber,
        service_type: conversation.service_type,
        precheck_data: conversation.collected_data,
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
  getQuestionsForService
};
