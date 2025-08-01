"use client";

import { useState, useEffect } from "react";
import QRCode from "qrcode";
import Link from "next/link";

interface VerificationSession {
  sessionId: string;
  qrCodeDataUrl: string | null;
  verificationUrl: string;
  status: "pending" | "verified" | "failed";
  credentialData?: any;
  error?: string;
}

export default function VerifyPage() {
  const [verificationSession, setVerificationSession] =
    useState<VerificationSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null
  );

  // Start verification session
  const startVerification = async () => {
    setLoading(true);
    setError(null);
    setVerificationSession(null);

    try {
      const response = await fetch("/api/verify/openid4vci/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to start verification");
      }

      const result = await response.json();

      // Generate QR code for the verification URL
      const qrCodeDataUrl = await QRCode.toDataURL(
        result.verificationUrl.replace(
          "https://3e9a04fb62a1.ngrok-free.app/verify/auth",
          "openid4vp://"
        ),
        {
          width: 256,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        }
      );

      const session: VerificationSession = {
        sessionId: result.sessionId,
        qrCodeDataUrl,
        verificationUrl: result.verificationUrl,
        status: "pending",
      };

      setVerificationSession(session);

      // Start polling for verification status
      startPolling(result.sessionId);
    } catch (err) {
      const errorMessage = (err as Error).message || "Unknown error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Poll for verification status
  const startPolling = (sessionId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/verify/openid4vci/status/${sessionId}`
        );
        if (response.ok) {
          const result = await response.json();

          if (result.status === "verified" || result.status === "failed") {
            clearInterval(interval);
            setPollingInterval(null);

            setVerificationSession((prev) =>
              prev
                ? {
                    ...prev,
                    status: result.status,
                    credentialData: result.credentialData,
                    error: result.error,
                  }
                : null
            );
          }
        }
      } catch (error) {
        console.error("Error polling verification status:", error);
      }
    }, 2000); // Poll every 2 seconds

    setPollingInterval(interval);
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const resetVerification = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    setVerificationSession(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            OpenID4VCI Credential Verifier
          </h1>
          <p className="text-gray-600 mb-8">
            Verify your digital credentials using OpenID4VCI standards
          </p>
        </div>

        {!verificationSession ? (
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Start Verification
              </h2>
              <p className="text-gray-600 mb-4">
                Click the button below to start a new verification session. A QR
                code will be generated that you can scan with your wallet.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={startVerification}
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Starting Verification..." : "Start Verification"}
            </button>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-center mb-6">
              {verificationSession.status === "pending" && (
                <>
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-yellow-600 animate-spin"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Verification in Progress
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Scan the QR code below with your wallet to complete
                    verification
                  </p>
                </>
              )}

              {verificationSession.status === "verified" && (
                <>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Verification Successful!
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Your credential has been verified successfully
                  </p>
                </>
              )}

              {verificationSession.status === "failed" && (
                <>
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Verification Failed
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {verificationSession.error ||
                      "Verification could not be completed"}
                  </p>
                </>
              )}
            </div>

            <div className="space-y-4">
              {verificationSession.qrCodeDataUrl &&
                verificationSession.status === "pending" && (
                  <div className="text-center">
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Scan QR Code with Your Wallet
                    </label>
                    <div className="flex justify-center mb-4">
                      <img
                        src={verificationSession.qrCodeDataUrl}
                        alt="Verification QR Code"
                        className="border border-gray-300 rounded-lg shadow-sm"
                      />
                    </div>
                    <div className="mb-4">
                      <a
                        href={verificationSession.verificationUrl}
                        className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                      >
                        Open in Wallet (for mobile)
                      </a>
                    </div>
                    <p className="text-sm text-gray-600 mb-6">
                      Scan this QR code with any OpenID4VCI-compatible wallet
                    </p>
                  </div>
                )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification URL
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={verificationSession.verificationUrl}
                    readOnly
                    className="flex-1 px-3 py-2 text-black border border-gray-300 rounded-l-md bg-gray-50 text-xs"
                  />
                  <button
                    onClick={() =>
                      copyToClipboard(verificationSession.verificationUrl)
                    }
                    className="px-3 py-2 text-black border border-l-0 border-gray-300 rounded-r-md bg-gray-50 hover:bg-gray-100 text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {verificationSession.status === "verified" &&
                verificationSession.credentialData && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <h3 className="text-sm font-medium text-green-800 mb-2">
                      Verified Credential Details:
                    </h3>
                    <div className="text-sm text-green-700 space-y-1">
                      <div>
                        <strong>Credential ID:</strong>{" "}
                        {verificationSession.credentialData.credential_id}
                      </div>
                      <div>
                        <strong>Format:</strong>{" "}
                        {verificationSession.credentialData.format}
                      </div>
                      <div>
                        <strong>Document Type:</strong>{" "}
                        {verificationSession.credentialData.doctype}
                      </div>
                      <div>
                        <strong>Issuer:</strong>{" "}
                        {
                          verificationSession.credentialData.decoded_credential
                            ?.issuer
                        }
                      </div>
                      <div>
                        <strong>Subject:</strong>{" "}
                        {
                          verificationSession.credentialData.decoded_credential
                            ?.subject
                        }
                      </div>
                      <div>
                        <strong>Issued At:</strong>{" "}
                        {
                          verificationSession.credentialData.decoded_credential
                            ?.issued_at
                        }
                      </div>
                    </div>
                  </div>
                )}

              {verificationSession.status === "failed" && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <h3 className="text-sm font-medium text-red-800 mb-2">
                    Verification Error:
                  </h3>
                  <p className="text-sm text-red-700">
                    {verificationSession.error ||
                      "Unknown error occurred during verification"}
                  </p>
                </div>
              )}

              <button
                onClick={resetVerification}
                className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Start New Verification
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/" className="text-blue-600 hover:text-blue-500 text-sm">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
