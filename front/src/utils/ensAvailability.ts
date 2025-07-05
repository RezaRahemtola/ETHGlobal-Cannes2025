import { getContract, readContract } from "thirdweb";
import { base } from "thirdweb/chains";
import { thirdwebClient } from "@/config/thirdweb";

export interface ENSAvailabilityResult {
  available: boolean;
  error?: string;
}

/**
 * Check if an ENS name is available on Base network
 */
export async function checkENSAvailability(
  label: string,
  contractAddress: string
): Promise<ENSAvailabilityResult> {
  try {
    if (!label?.trim()) {
      return { available: false, error: "Label cannot be empty" };
    }

    if (!contractAddress?.trim()) {
      return { available: false, error: "Contract address is required" };
    }

    const contract = getContract({
      client: thirdwebClient,
      chain: base,
      address: contractAddress,
    });

    const isAvailable = await readContract({
      contract,
      method: "function available(string) view returns (bool)",
      params: [label.trim()],
    });

    return { available: isAvailable };
  } catch (error) {
    console.error("Error checking ENS availability:", error);
    return {
      available: false,
      error: "Failed to check availability",
    };
  }
}