import { test, expect } from "@playwright/test";

const BASE_URL = process.env.UI_BASE_URL || "http://localhost:5173";

const OPERATOR = {
  id: process.env.TEST_OPERATOR_ID || "operator_demo",
  name: process.env.TEST_OPERATOR_NAME || "Test Operator",
  district: process.env.TEST_OPERATOR_DISTRICT || "Raipur"
};

test.describe("CSC Operator UI - Manual Flow", () => {
  test("login -> dashboard -> service intro -> form -> validate -> chat", async ({ page }) => {
    // Pre-authenticate to avoid API dependency for login
    await page.addInitScript((payload) => {
      localStorage.setItem("operator_id", payload.id);
      localStorage.setItem("operator_name", payload.name);
      localStorage.setItem("operator_district", payload.district);
    }, OPERATOR);

    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "domcontentloaded" });

    // Dashboard loaded
    await expect(page.locator(".services-grid")).toBeVisible();

    // Open first service card
    const firstCard = page.locator(".service-card").first();
    await expect(firstCard).toBeVisible();
    await firstCard.click();

    // Intro screen
    await expect(page.getByText(/introduction/i)).toBeVisible();
    await expect(page.getByText(/required documents/i)).toBeVisible();
    await page.getByRole("button", { name: /view form/i }).click();

    // Form screen
    await expect(page.getByText(/aadhaar \/ pan upload/i)).toBeVisible();

    // Optional: Aadhaar/PAN uploads if env files provided
    const aadhaar = process.env.AADHAAR_FILE;
    const pan = process.env.PAN_FILE;
    if (aadhaar) {
      await page.setInputFiles("label:has-text('Aadhaar Upload') input", aadhaar);
    }
    if (pan) {
      await page.setInputFiles("label:has-text('PAN Upload') input", pan);
    }

    // Fill a couple of fields if available
    const nameInput = page.locator("label:has-text('applicant name') + * input").first();
    if (await nameInput.count()) {
      await nameInput.fill("Ramesh Kumar");
    }

    // Validate
    await page.getByRole("button", { name: /validate application/i }).click();

    // Chat should auto-open after first validation
    await expect(page.locator(".csc-chat-panel")).toBeVisible({ timeout: 10000 });

    // Quick question to assistant
    await page.getByPlaceholder(/type your question|apna sawal/i).fill("What is missing?");
    await page.getByRole("button", { name: /send|भेजें/i }).click();
  });
});
