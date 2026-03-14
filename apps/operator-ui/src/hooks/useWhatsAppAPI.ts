import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export interface PrecheckResult {
  success: boolean;
  precheckId?: string;
  botNumber?: string;
  message?: string;
  error?: string;
  validation?: {
    warnings: string[];
    missingDocuments: string[];
  } | null;
}

function getOperatorId() {
  return localStorage.getItem("operator_id") || "operator_demo";
}

/**
 * useWhatsAppAPI
 *
 * React hook that calls the CSC API `/whatsapp-integration/initiate-precheck`
 * endpoint and opens a WhatsApp deep-link so the citizen can start the
 * pre-check conversation with the bot by sending "hii".
 *
 * Flow:
 *   1. callAPI(applicationData) → POST /whatsapp-integration/initiate-precheck
 *   2. CSC API validates application & stores precheck session in bot
 *   3. CSC API returns { precheckId, botNumber }
 *   4. Hook opens: https://wa.me/<botNumber>?text=hii
 *   5. Citizen sends "hii" → bot starts language & service selection flow
 */
export const useWhatsAppAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [precheckId, setPrecheckId] = useState<string | null>(null);

  const callAPI = async (
    applicationData?: Record<string, unknown>
  ): Promise<PrecheckResult | undefined> => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    setPrecheckId(null);

    try {
      const response = await fetch(`${API_BASE}/whatsapp-integration/initiate-precheck`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-operator-id": getOperatorId()
        },
        body: JSON.stringify({ applicationData: applicationData || {} })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`API error ${response.status}: ${text}`);
      }

      const data: PrecheckResult = await response.json();

      if (data.success && data.botNumber) {
        setSuccess(true);
        setPrecheckId(data.precheckId || null);

        // Strip non-digit characters for wa.me format (e.g. +14155238886 → 14155238886)
        const cleanNumber = data.botNumber.replace(/\D/g, "");

        // Validate that the cleaned number looks like a real E.164 phone number
        // (between 7 and 15 digits as per ITU-T E.164 standard)
        if (!/^\d{7,15}$/.test(cleanNumber)) {
          setError("Invalid WhatsApp bot number received from server");
          setSuccess(false);
          return data;
        }

        // Send "hii" so the bot triggers its saved language/service selection flow
        window.open(`https://wa.me/${cleanNumber}?text=hii`, "_blank", "noopener,noreferrer");
      } else {
        setError(data.error || "Failed to initiate WhatsApp pre-check");
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("WhatsApp API Error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { callAPI, loading, error, success, precheckId };
};
