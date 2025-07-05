/**
 * ENS Configuration for Base Network
 *
 * This file contains the configuration for ENS (Ethereum Name Service)
 * integration on the Base network.
 */

export const ENS_CONFIG = {
	// Configuration options
	OPTIONS: {
		// Debounce delay for real-time availability checking (in milliseconds)
		DEBOUNCE_DELAY: 500,

		// Minimum length for ENS names
		MIN_NAME_LENGTH: 3,

		// Maximum length for ENS names
		MAX_NAME_LENGTH: 20,
	},
} as const;

/**
 * Validate ENS name format
 * @param name - The ENS name to validate
 * @returns Object with validation result and error message
 */
export function validateENSName(name: string): { valid: boolean; error?: string } {
	if (!name || name.trim() === "") {
		return { valid: false, error: "ENS name cannot be empty" };
	}

	const trimmedName = name.trim();

	if (trimmedName.length < ENS_CONFIG.OPTIONS.MIN_NAME_LENGTH) {
		return {
			valid: false,
			error: `ENS name must be at least ${ENS_CONFIG.OPTIONS.MIN_NAME_LENGTH} characters long`,
		};
	}

	if (trimmedName.length > ENS_CONFIG.OPTIONS.MAX_NAME_LENGTH) {
		return {
			valid: false,
			error: `ENS name must be no more than ${ENS_CONFIG.OPTIONS.MAX_NAME_LENGTH} characters long`,
		};
	}

	if (trimmedName.startsWith("-") || trimmedName.endsWith("-")) {
		return {
			valid: false,
			error: "ENS name cannot start or end with a hyphen",
		};
	}

	return { valid: true };
}
