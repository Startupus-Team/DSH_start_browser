/**
 * Pixel size of a PNG or JPEG from its header bytes, without decoding.
 *
 * The panel cannot always report the size of a capture (full-page shots have no
 * crop rect), so the host reads it from the file it just wrote.
 *
 * @module startapus-browser/image-size
 */

/** Width and height in pixels, or null for an unsupported or truncated image. */
export function imageSize(data: Uint8Array): { width: number; height: number } | null {
  // PNG: 8-byte signature, then IHDR with big-endian width/height at offsets 16 and 20.
  if (data.length >= 24 && data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47) {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
    const width = view.getUint32(16)
    const height = view.getUint32(20)
    return width > 0 && height > 0 ? { width, height } : null
  }
  // JPEG: walk the marker segments until a start-of-frame marker carries the size.
  if (data.length >= 4 && data[0] === 0xff && data[1] === 0xd8) {
    let offset = 2
    while (offset + 9 < data.length) {
      if (data[offset] !== 0xff) {
        offset += 1
        continue
      }
      const marker = data[offset + 1]
      if (marker === 0xff) {
        offset += 1
        continue
      }
      // Standalone markers have no length field.
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        offset += 2
        continue
      }
      const length = (data[offset + 2] << 8) | data[offset + 3]
      const isFrame = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc
      if (isFrame) {
        const height = (data[offset + 5] << 8) | data[offset + 6]
        const width = (data[offset + 7] << 8) | data[offset + 8]
        return width > 0 && height > 0 ? { width, height } : null
      }
      if (length < 2) return null
      offset += 2 + length
    }
  }
  return null
}
