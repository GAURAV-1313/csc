function validateDocuments(requiredDocuments, documents) {
  const providedDocs = (documents || []).map((doc) => doc.documentType);
  const mandatory = (requiredDocuments && requiredDocuments.mandatory) || [];
  const optional = (requiredDocuments && requiredDocuments.optional) || [];
  const acceptedGroups = (requiredDocuments && requiredDocuments.accepted_groups) || {};

  const missing = [];

  mandatory.forEach((docKey) => {
    if (isSatisfied(docKey, providedDocs, acceptedGroups)) {
      return;
    }
    missing.push(docKey);
  });

  return {
    missing,
    optional,
    provided: providedDocs
  };
}

function isSatisfied(docKey, providedDocs, acceptedGroups) {
  if (providedDocs.includes(docKey)) {
    return true;
  }
  const accepted = acceptedGroups[docKey] || [];
  return accepted.some((doc) => providedDocs.includes(doc));
}

module.exports = { validateDocuments };
