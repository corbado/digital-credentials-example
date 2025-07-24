import * as cbor from "cbor-web";

export async function decodeDigitalCredential(encodedCredential: string) {
  // 1. Convert Base64URL to standard Base64
  const base64UrlToBase64 = (input: string) => {
    let base64 = input.replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    if (pad) base64 += "=".repeat(4 - pad);
    return base64;
  };

  const base64 = base64UrlToBase64(encodedCredential);

  // 2. Decode Base64 to binary
  const binaryString = atob(base64);
  const byteArray = Uint8Array.from(binaryString, (char) => char.charCodeAt(0));

  // 3. Decode CBOR
  const decoded = await cbor.decodeFirst(byteArray);
  return decoded;
}

// @ts-ignore
export function decodeAllNamespaces(jsonObj) {
  const decoded = {};

  try {
    // @ts-ignore
    jsonObj.documents.forEach((doc, idx) => {
      // 1) issuerSigned.nameSpaces:
      const issuerNS = doc.issuerSigned?.nameSpaces || {};
      Object.entries(issuerNS).forEach(([nsName, entries]) => {
        // @ts-ignore
        decoded[nsName] = (entries as any).map(({ value }) => {
          const bytes = Uint8Array.from(value);
          return cbor.decodeFirstSync(bytes);
        });
      });

      // 2) deviceSigned.nameSpaces (if present):
      const deviceNS = doc.deviceSigned?.nameSpaces;
      if (deviceNS?.value?.data) {
        const bytes = Uint8Array.from(deviceNS.value);
        // @ts-ignore
        decoded[`deviceSigned_ns_${idx}`] = cbor.decodeFirstSync(bytes);
      }
    });
  } catch (e) {
    console.error(e);
  }

  return decoded;
}
