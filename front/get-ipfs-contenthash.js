import { CID } from "multiformats/cid";

// ENS IPFS contenthash prefix
const IPFS_PREFIX_HEX = "e3010170";

// Your CIDv1
const cidStr = "QmbtghwGQitzuaSUQScznYYyJEgwKH44jKGaC2zqMaSqyi";

try {
	const cid = CID.parse(cidStr); // parse CIDv1
	const cidBytes = cid.bytes; // raw bytes of the CID

	// Convert prefix + CID bytes to hex string
	const prefix = Buffer.from(IPFS_PREFIX_HEX, "hex");
	const fullBytes = Buffer.concat([prefix, cidBytes]);
	const contenthashHex = "0x" + fullBytes.toString("hex");

	console.log("✅ ENS-compatible contenthash:");
	console.log(contenthashHex);
} catch (err) {
	console.error("❌ Error:", err.message);
}
