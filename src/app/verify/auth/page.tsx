"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface AuthData {
  clientId: string;
  redirectUri: string;
  responseType: string;
  scope: string;
  state: string;
  nonce: string;
  requestUri: string;
  verificationUrl: string;
  walletLinks: {
    openid4vci: string;
    sphereon: string;
    universal: string;
    appStore: string;
    playStore: string;
  };
}

export default function AuthPage() {
  const searchParams = useSearchParams();
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuthData = async () => {
      try {
        // Get the current URL parameters
        const params = new URLSearchParams(searchParams.toString());

        // Fetch auth data from our API
        const response = await fetch(
          `/api/verify/openid4vci/auth?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error("Failed to load verification data");
        }

        const data = await response.json();
        setAuthData(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchAuthData();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading verification...</p>
        </div>
      </div>
    );
  }

  if (error || !authData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
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
            Verification Error
          </h2>
          <p className="text-gray-600 mb-4">
            {error || "Failed to load verification data"}
          </p>
          <Link href="/verify" className="text-blue-600 hover:text-blue-500">
            ← Back to Verifier
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              🔐 OpenID4VCI Verification
            </h1>
            <p className="text-gray-600">
              Complete verification using your digital wallet
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">
              Verification Request Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Client ID:</span>
                <span className="font-mono text-gray-900">
                  {authData.clientId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Scope:</span>
                <span className="font-mono text-gray-900">
                  {authData.scope}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">
                  Response Type:
                </span>
                <span className="font-mono text-gray-900">
                  {authData.responseType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">State:</span>
                <span className="font-mono text-gray-900">
                  {authData.state}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Nonce:</span>
                <span className="font-mono text-gray-900">
                  {authData.nonce}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                // Try OpenID4VCI standard link format
                window.location.href = authData.walletLinks.openid4vci;
              }}
              className="flex items-center justify-center w-full px-4 py-3 border-2 border-purple-600 rounded-lg text-purple-600 hover:bg-purple-600 hover:text-white transition-colors font-medium"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                />
              </svg>
              Open with OpenID4VCI Standard
            </button>

            <div className="text-center mt-4">
              <p className="text-sm text-gray-600 mb-2">
                Or copy the verification URL:
              </p>
              <div className="flex">
                <input
                  type="text"
                  value={authData.verificationUrl}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-l-md bg-gray-50"
                />
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(authData.verificationUrl)
                  }
                  className="px-3 py-2 text-sm border border-l-0 border-gray-300 rounded-r-md bg-gray-50 hover:bg-gray-100"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">
                Troubleshooting:
              </h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>
                  • If the wallet doesn't open, try copying the URL and pasting
                  it in your wallet app
                </li>
                <li>• Make sure you have a compatible wallet app installed</li>
                <li>
                  • Try the OpenID4VCI Standard button for better compatibility
                </li>
                <li>• On mobile, the deep links should work automatically</li>
                <li>
                  • On desktop, you may need to manually open your wallet app
                </li>
              </ul>
            </div>
          </div>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Don't have a wallet app?{" "}
              <a
                href="https://play.google.com/store/apps/details?id=com.sphereon.ssi.wallet"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Download Sphereon Wallet
              </a>
            </p>
          </div>

          <div className="text-center mt-4">
            <Link
              href="/verify"
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ← Back to Verifier
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
