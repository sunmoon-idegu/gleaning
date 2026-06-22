import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy · Gleaning",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-semibold mb-2">Privacy Policy</h1>
        <p className="text-sm text-neutral-500 mb-12">Last updated: June 2026</p>

        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-3">Overview</h2>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Gleaning is a personal quote-saving app. We take your privacy seriously. This policy explains what data we collect, why we collect it, and how we use it.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-3">Data We Collect</h2>
          <ul className="space-y-4 text-neutral-600 dark:text-neutral-400 leading-relaxed">
            <li>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">Account information</span> — When you sign in with Google, we receive your email address and name via Clerk, our authentication provider. We use this solely to identify your account.
            </li>
            <li>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">User content</span> — Quotes, books, reflections, and any other content you save in the app. This content belongs to you.
            </li>
            <li>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">Preferences</span> — App settings such as theme, font size, and display mode, stored to sync your experience across devices.
            </li>
            <li>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">Feedback</span> — If you submit feedback through the app, we store the message and category you selected.
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-3">How We Use Your Data</h2>
          <ul className="space-y-2 text-neutral-600 dark:text-neutral-400 leading-relaxed list-disc list-inside">
            <li>To provide and maintain the app</li>
            <li>To sync your content across devices</li>
            <li>To respond to feedback you send us</li>
          </ul>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mt-4">
            We do not sell your data. We do not use your data for advertising. We do not share your data with third parties except as described below.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-3">Third-Party Services</h2>
          <ul className="space-y-4 text-neutral-600 dark:text-neutral-400 leading-relaxed">
            <li>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">Clerk</span> — Handles authentication. Your sign-in is processed by Clerk. See <a href="https://clerk.com/privacy" className="underline hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">clerk.com/privacy</a>.
            </li>
            <li>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">Neon</span> — Our database provider. Your content is stored on Neon's PostgreSQL infrastructure. See <a href="https://neon.tech/privacy" className="underline hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">neon.tech/privacy</a>.
            </li>
            <li>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">Anthropic</span> — When you use the OCR feature to extract text from a photo, the image is sent to Anthropic's Claude API for text recognition. Images are not stored by Anthropic after processing.
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-3">Data Retention</h2>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Your data is retained as long as your account is active. If you delete your account, your data is scheduled for permanent deletion within 30 days. You can cancel the deletion within this period by signing back in.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-3">Your Rights</h2>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            You can delete your account and all associated data at any time from the Settings screen in the app. For any other requests regarding your data, contact us at the email below.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-3">Children</h2>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Gleaning is not directed at children under 13. We do not knowingly collect data from children under 13.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-3">Changes to This Policy</h2>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            We may update this policy from time to time. The date at the top of this page reflects the most recent revision. Continued use of the app after changes constitutes acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Contact</h2>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            For privacy-related questions, contact us at <a href="mailto:sunmoon.idegu@gmail.com" className="underline hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">sunmoon.idegu@gmail.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
