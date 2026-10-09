const SIGNATURE_BYTES_TO_READ = 8;
const IMAGE_SIGNATURES: ReadonlyArray<readonly number[]> = [
  [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], // PNG
  [0xff, 0xd8, 0xff], // JPEG
];

// Early feedback only (RN-06); the backend re-validates every upload.
export async function hasImageSignature(file: Blob): Promise<boolean> {
  const header = new Uint8Array(await file.slice(0, SIGNATURE_BYTES_TO_READ).arrayBuffer());
  return IMAGE_SIGNATURES.some((signature) =>
    signature.every((byte, index) => header[index] === byte),
  );
}
