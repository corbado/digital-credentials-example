"use client";

import { useState } from "react";

// Simple popover component
function CredentialPopover({
  credentialData,
  onClose,
}: {
  credentialData: any;
  onClose: () => void;
}) {
  if (!credentialData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Credential Data</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            {/* Credential Claims */}
            {credentialData.claims &&
              Object.keys(credentialData.claims).length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Credential Claims
                  </h3>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(credentialData.claims).map(
                        ([key, value]) => (
                          <div
                            key={key}
                            className="border-b border-gray-200 dark:border-gray-600 pb-2"
                          >
                            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
                              {key.replace(/_/g, " ")}
                            </div>
                            <div className="text-lg font-semibold">
                              {typeof value === "boolean"
                                ? value
                                  ? "Yes"
                                  : "No"
                                : String(value)}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}

            {/* Documents Information */}
            {credentialData.decoded_credential &&
              credentialData.decoded_credential.documents && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Documents</h3>
                  <div className="space-y-3">
                    {credentialData.decoded_credential.documents.map(
                      (doc: any, index: number) => (
                        <div
                          key={index}
                          className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <strong>Document Type:</strong>{" "}
                              {doc.docType || "Unknown"}
                            </div>
                            {doc.issuerSigned &&
                              doc.issuerSigned.nameSpaces && (
                                <div>
                                  <strong>Namespaces:</strong>{" "}
                                  {Object.keys(
                                    doc.issuerSigned.nameSpaces
                                  ).join(", ")}
                                </div>
                              )}
                            {doc.validityInfo && (
                              <>
                                <div>
                                  <strong>Valid From:</strong>{" "}
                                  {doc.validityInfo.validFrom
                                    ? new Date(
                                        doc.validityInfo.validFrom
                                      ).toLocaleDateString()
                                    : "N/A"}
                                </div>
                                <div>
                                  <strong>Valid Until:</strong>{" "}
                                  {doc.validityInfo.validUntil
                                    ? new Date(
                                        doc.validityInfo.validUntil
                                      ).toLocaleDateString()
                                    : "N/A"}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

            {/* Credential Metadata */}
            <div>
              <h3 className="font-semibold text-lg mb-3">
                Credential Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <strong>Credential ID:</strong> {credentialData.credential_id}
                </div>
                <div>
                  <strong>Format:</strong> {credentialData.format}
                </div>
                <div>
                  <strong>Document Type:</strong> {credentialData.doctype}
                </div>
                <div>
                  <strong>Extracted At:</strong>{" "}
                  {new Date(credentialData.extracted_at).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Error display */}
            {credentialData.error && (
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2 text-red-700 dark:text-red-300">
                  Decoding Error
                </h3>
                <p className="text-red-600 dark:text-red-400">
                  {credentialData.error}
                </p>
              </div>
            )}

            {/* Raw Credential Data (collapsible) */}
            <details className="border border-gray-200 dark:border-gray-600 rounded-lg">
              <summary className="cursor-pointer p-3 font-semibold bg-gray-50 dark:bg-gray-700 rounded-t-lg">
                Raw Credential Data (Click to expand)
              </summary>
              <div className="p-3">
                <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-x-auto">
                  {JSON.stringify(credentialData.raw_credential, null, 2)}
                </pre>
              </div>
            </details>

            {/* Decoded Credential Data (collapsible) */}
            {credentialData.decoded_credential && (
              <details className="border border-gray-200 dark:border-gray-600 rounded-lg">
                <summary className="cursor-pointer p-3 font-semibold bg-gray-50 dark:bg-gray-700 rounded-t-lg">
                  Decoded Credential Structure (Click to expand)
                </summary>
                <div className="p-3">
                  <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-x-auto">
                    {credentialData.decoded_credential.map(
                      (credential: any) =>
                        `${
                          credential.elementIdentifier
                        } : ${credential.elementValue.toString()} \n`
                    )}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<string | null>(
    null
  );
  const [credentialData, setCredentialData] = useState<any>(null);
  const [showPopover, setShowPopover] = useState(false);

  const startVerification = async () => {
    setLoading(true);
    setVerificationResult(null);
    setCredentialData(null);

    try {
      if (!navigator.credentials || !navigator.credentials.get) {
        throw new Error("Browser does not support the Credential API.");
      }

      const startResponse = await fetch("/api/verify/start");
      const response = await startResponse.json();

      console.log(response);

      const credential = await (navigator.credentials as any).get({
        mediation: "required",
        digital: {
          requests: [
            {
              protocol: response.protocol,
              data: response.request,
            },
          ],
        },
      });

      // 4. Forward the wallet response (from the browser) to our callback for server-side checks
      const verifyRes = await fetch("/api/verify/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: credential.data,
          protocol: credential.protocol,
          state: response.state,
        }),
      });

      const result = await verifyRes.json();

      if (verifyRes.ok && result.verified) {
        setVerificationResult(`Success: ${result.message}`);
        setCredentialData(result.credentialData);
      } else {
        throw new Error(result.message || "Verification failed.");
      }
    } catch (err) {
      const error = err as Error;
      console.error(error);
      setVerificationResult(`Error: ${error.message}`);
      setCredentialData(null);
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
          {credentialData && (
            <button
              onClick={() => setShowPopover(true)}
              className="mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              View Credential Data
            </button>
          )}
        </div>
      )}

      <div className="mt-8 text-center space-y-4">
        <div>
          <a
            href="/issue"
            className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors mr-4"
          >
            Issue New Credential
          </a>
          <a
            href="/verify"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            OpenID4VCI Verifier
          </a>
        </div>
        <p className="text-sm text-gray-600">
          Need a credential? Use our issuer to create a test PID credential,
          then verify it with our OpenID4VCI-compatible verifier.
        </p>
      </div>

      {showPopover && (
        <CredentialPopover
          credentialData={credentialData}
          onClose={() => setShowPopover(false)}
        />
      )}
    </main>
  );
}
