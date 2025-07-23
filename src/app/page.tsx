"use client";

import { useState } from "react";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<string | null>(
    null
  );

  const startVerification = async () => {
    setLoading(true);
    setVerificationResult(null);

    try {
      if (!navigator.credentials || !navigator.credentials.get) {
        throw new Error("Browser does not support the Credential API.");
      }

      const startResponse = await fetch("/api/verify/start");
      const { challenge, presentationDefinition } = await startResponse.json();

      const credential = await (navigator.credentials as any).get({
        mediation: "required",
        digital: {
          requests: [
            {
              protocol: "openid-vc",
              data: {
                presentationDefinition,
                challenge,
              },
            },
          ],
        },
      });

      const verifyResponse = await fetch("/api/verify/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credential),
      });

      const result = await verifyResponse.json();

      if (verifyResponse.ok && result.verified) {
        setVerificationResult(`Success: ${result.message}`);
      } else {
        throw new Error(result.message || "Verification failed.");
      }
    } catch (err) {
      const error = err as Error;
      console.error(error);
      setVerificationResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 text-center">
      <h1 className="text-4xl font-bold mb-8">
        Verifiable Credential Verifier
      </h1>
      <p className="mb-4">
        Click the button below to verify your credentials using the browser's
        built-in Digital Credential API.
      </p>

      <button
        onClick={startVerification}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
      >
        {loading ? "Waiting for wallet..." : "Verify with Digital Identity"}
      </button>

      {verificationResult && (
        <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded">
          <p>{verificationResult}</p>
        </div>
      )}
    </main>
  );
}
