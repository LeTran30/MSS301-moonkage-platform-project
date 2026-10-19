package com.moonkage.storage;

import java.io.ByteArrayOutputStream;
import java.nio.BufferUnderflowException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Set;

/**
 * Removes metadata a camera or editor writes into an image (EXIF with GPS position and device, XMP, IPTC, text
 * chunks) without re-encoding the pixels, so public product images leak nothing about where or how they were taken.
 *
 * <ul>
 *   <li>JPEG: drops APP1 (EXIF, XMP), APP13 (IPTC) and comments; keeps colour profile (APP2) and the EXIF orientation,
 *       rewritten as a minimal EXIF block, so phone photos are not shown sideways.
 *   <li>PNG: drops eXIf, tEXt, zTXt, iTXt and tIME chunks.
 *   <li>WebP: drops EXIF and XMP chunks and clears their flags in VP8X.
 * </ul>
 *
 * Other content types (PDF) are returned unchanged. A structure that cannot be walked is rejected as
 * {@link StorageErrorCode#CONTENT_MISMATCH}: a real image of the declared type always parses.
 */
public final class ImageMetadataStripper {

    private static final int MARKER_PREFIX = 0xFF;
    private static final int SOI = 0xD8;
    private static final int SOS = 0xDA;
    private static final int APP0 = 0xE0;
    private static final int APP1 = 0xE1;
    private static final int APP13 = 0xED;
    private static final int COM = 0xFE;
    private static final int TEM = 0x01;
    private static final int RST0 = 0xD0;
    private static final int RST7 = 0xD7;

    private static final byte[] EXIF_HEADER = {'E', 'x', 'i', 'f', 0, 0};
    private static final int BYTE_MASK = 0xFF;

    // TIFF inside EXIF: byte order mark (II/MM), magic 42, pointer to IFD0; IFD entries are tag, type, count, value
    private static final byte[] BIG_ENDIAN_MARK = {'M', 'M'};
    private static final int TIFF_MAGIC = 42;
    private static final int TIFF_MAGIC_OFFSET = 2;
    private static final int TIFF_IFD_POINTER_OFFSET = 4;
    private static final int TIFF_HEADER_LENGTH = 8;
    private static final int ORIENTATION_TAG = 0x0112;
    private static final int TIFF_SHORT = 3;
    private static final int IFD_ENTRY_LENGTH = 12;
    private static final int IFD_ENTRY_TYPE_OFFSET = 2;
    private static final int IFD_ENTRY_VALUE_OFFSET = 8;
    /** Orientation 1 is "as stored": no tag needed. */
    private static final int NORMAL_ORIENTATION = 1;

    private static final int PNG_SIGNATURE_LENGTH = 8;
    private static final Set<String> PNG_METADATA_CHUNKS = Set.of("eXIf", "tEXt", "zTXt", "iTXt", "tIME");
    private static final String PNG_END_CHUNK = "IEND";
    /** Length, type and CRC around each PNG chunk's data. */
    private static final int PNG_CHUNK_OVERHEAD = 12;

    private static final int RIFF_HEADER_LENGTH = 12;
    private static final int RIFF_CHUNK_HEADER_LENGTH = 8;
    private static final Set<String> WEBP_METADATA_CHUNKS = Set.of("EXIF", "XMP ");
    private static final String WEBP_EXTENDED_CHUNK = "VP8X";
    private static final int VP8X_EXIF_FLAG = 0x08;
    private static final int VP8X_XMP_FLAG = 0x04;

    private ImageMetadataStripper() {}

    /** Returns a copy without metadata, or content itself for types that carry none this class knows of. */
    public static byte[] removeMetadata(String contentType, byte[] content) {
        try {
            return switch (contentType) {
                case "image/jpeg" -> removeJpegMetadata(content);
                case "image/png" -> removePngMetadata(content);
                case "image/webp" -> removeWebpMetadata(content);
                default -> content;
            };
        } catch (IndexOutOfBoundsException
                | BufferUnderflowException
                | IllegalArgumentException
                | ArithmeticException e) {
            // truncated or forged structure: lengths that point outside the file, overflowing sizes…
            throw new InvalidFileException(StorageErrorCode.CONTENT_MISMATCH);
        }
    }

    private static byte[] removeJpegMetadata(byte[] content) {
        ByteBuffer in = ByteBuffer.wrap(content);
        requireMarker(in, SOI);
        ByteArrayOutputStream out = new ByteArrayOutputStream(content.length);
        out.write(MARKER_PREFIX);
        out.write(SOI);

        int orientation = NORMAL_ORIENTATION;
        boolean orientationWritten = false;
        while (true) {
            int marker = readMarker(in);
            if (marker == SOS) {
                // entropy-coded image data and EOI follow; copy them as they are
                writeOrientationIfNeeded(out, orientation, orientationWritten);
                out.write(MARKER_PREFIX);
                out.write(SOS);
                out.write(content, in.position(), content.length - in.position());
                return out.toByteArray();
            }
            if (marker == TEM || (marker >= RST0 && marker <= RST7)) {
                throw new IllegalArgumentException("Unexpected standalone JPEG marker before SOS");
            }
            int segmentLength = Short.toUnsignedInt(in.getShort());
            if (segmentLength < Short.BYTES) {
                throw new IllegalArgumentException("JPEG segment shorter than its own length field");
            }
            byte[] payload = new byte[segmentLength - Short.BYTES];
            in.get(payload);

            if (marker == APP1 || marker == APP13 || marker == COM) {
                if (marker == APP1 && startsWith(payload, EXIF_HEADER)) {
                    orientation = readOrientation(payload);
                }
                continue;
            }
            if (marker != APP0) {
                // JFIF (APP0) must stay first; the orientation goes right after it
                orientationWritten = writeOrientationIfNeeded(out, orientation, orientationWritten);
            }
            writeSegmentHeader(out, marker, segmentLength);
            out.write(payload, 0, payload.length);
        }
    }

    /** Writes a minimal EXIF block holding only the orientation, once, when the image is not stored upright. */
    private static boolean writeOrientationIfNeeded(ByteArrayOutputStream out, int orientation, boolean written) {
        if (written || orientation == NORMAL_ORIENTATION) {
            return written;
        }
        ByteBuffer exif = ByteBuffer.allocate(
                        EXIF_HEADER.length + TIFF_HEADER_LENGTH + Short.BYTES + IFD_ENTRY_LENGTH + Integer.BYTES)
                .order(ByteOrder.BIG_ENDIAN);
        exif.put(EXIF_HEADER);
        exif.put(BIG_ENDIAN_MARK).putShort((short) TIFF_MAGIC).putInt(TIFF_HEADER_LENGTH);
        exif.putShort((short) 1); // one IFD entry
        exif.putShort((short) ORIENTATION_TAG).putShort((short) TIFF_SHORT).putInt(1);
        exif.putShort((short) orientation).putShort((short) 0); // SHORT value, left-aligned in the 4-byte field
        exif.putInt(0); // no next IFD
        writeSegmentHeader(out, APP1, exif.capacity() + Short.BYTES);
        out.write(exif.array(), 0, exif.capacity());
        return true;
    }

    /** Marker and big-endian length (which counts its own two bytes). */
    private static void writeSegmentHeader(ByteArrayOutputStream out, int marker, int segmentLength) {
        out.write(MARKER_PREFIX);
        out.write(marker);
        out.write(segmentLength >> Byte.SIZE);
        out.write(segmentLength & BYTE_MASK);
    }

    /** Orientation from IFD0 of an EXIF APP1 payload; unreadable or missing means upright. */
    private static int readOrientation(byte[] app1Payload) {
        try {
            ByteBuffer tiff = ByteBuffer.wrap(app1Payload, EXIF_HEADER.length, app1Payload.length - EXIF_HEADER.length)
                    .slice();
            byte first = tiff.get(0);
            tiff.order(first == 'I' ? ByteOrder.LITTLE_ENDIAN : ByteOrder.BIG_ENDIAN);
            if (Short.toUnsignedInt(tiff.getShort(TIFF_MAGIC_OFFSET)) != TIFF_MAGIC) {
                return NORMAL_ORIENTATION;
            }
            int ifd = tiff.getInt(TIFF_IFD_POINTER_OFFSET);
            int entries = Short.toUnsignedInt(tiff.getShort(ifd));
            for (int i = 0; i < entries; i++) {
                int entry = ifd + Short.BYTES + i * IFD_ENTRY_LENGTH;
                if (Short.toUnsignedInt(tiff.getShort(entry)) == ORIENTATION_TAG
                        && Short.toUnsignedInt(tiff.getShort(entry + IFD_ENTRY_TYPE_OFFSET)) == TIFF_SHORT) {
                    return Short.toUnsignedInt(tiff.getShort(entry + IFD_ENTRY_VALUE_OFFSET));
                }
            }
        } catch (IndexOutOfBoundsException e) {
            // a broken EXIF block is dropped anyway; the image just loses its rotation hint
        }
        return NORMAL_ORIENTATION;
    }

    private static void requireMarker(ByteBuffer in, int expected) {
        if (Byte.toUnsignedInt(in.get()) != MARKER_PREFIX || Byte.toUnsignedInt(in.get()) != expected) {
            throw new IllegalArgumentException("Not a JPEG");
        }
    }

    /** Next marker code; 0xFF fill bytes before it are allowed by the JPEG standard. */
    private static int readMarker(ByteBuffer in) {
        if (Byte.toUnsignedInt(in.get()) != MARKER_PREFIX) {
            throw new IllegalArgumentException("JPEG segment does not start with a marker");
        }
        int marker = Byte.toUnsignedInt(in.get());
        while (marker == MARKER_PREFIX) {
            marker = Byte.toUnsignedInt(in.get());
        }
        return marker;
    }

    private static byte[] removePngMetadata(byte[] content) {
        ByteBuffer in = ByteBuffer.wrap(content).order(ByteOrder.BIG_ENDIAN);
        ByteArrayOutputStream out = new ByteArrayOutputStream(content.length);
        out.write(content, 0, PNG_SIGNATURE_LENGTH);
        in.position(PNG_SIGNATURE_LENGTH);
        while (true) {
            int start = in.position();
            int dataLength = in.getInt();
            if (dataLength < 0) {
                throw new IllegalArgumentException("Negative PNG chunk length");
            }
            String type = readAscii(in, start + Integer.BYTES);
            int chunkLength = dataLength + PNG_CHUNK_OVERHEAD;
            in.position(Math.addExact(start, chunkLength));
            if (!PNG_METADATA_CHUNKS.contains(type)) {
                out.write(content, start, chunkLength);
            }
            if (PNG_END_CHUNK.equals(type)) {
                return out.toByteArray();
            }
        }
    }

    private static byte[] removeWebpMetadata(byte[] content) {
        ByteBuffer in = ByteBuffer.wrap(content).order(ByteOrder.LITTLE_ENDIAN);
        int riffEnd = Math.addExact(RIFF_CHUNK_HEADER_LENGTH, in.getInt(Integer.BYTES));
        if (riffEnd > content.length) {
            throw new IllegalArgumentException("RIFF size beyond end of file");
        }
        ByteArrayOutputStream out = new ByteArrayOutputStream(content.length);
        out.write(content, 0, RIFF_HEADER_LENGTH);
        int position = RIFF_HEADER_LENGTH;
        while (position < riffEnd) {
            String fourCc = readAscii(in, position);
            int dataLength = in.getInt(position + Integer.BYTES);
            if (dataLength < 0) {
                throw new IllegalArgumentException("Negative RIFF chunk length");
            }
            // chunk data is padded to an even length
            int chunkLength = RIFF_CHUNK_HEADER_LENGTH + dataLength + (dataLength & 1);
            int chunkEnd = Math.addExact(position, chunkLength);
            if (chunkEnd > riffEnd) {
                throw new IllegalArgumentException("RIFF chunk beyond end of file");
            }
            if (!WEBP_METADATA_CHUNKS.contains(fourCc)) {
                byte[] chunk = Arrays.copyOfRange(content, position, chunkEnd);
                if (WEBP_EXTENDED_CHUNK.equals(fourCc)) {
                    chunk[RIFF_CHUNK_HEADER_LENGTH] &= (byte) ~(VP8X_EXIF_FLAG | VP8X_XMP_FLAG);
                }
                out.write(chunk, 0, chunk.length);
            }
            position = chunkEnd;
        }
        byte[] result = out.toByteArray();
        ByteBuffer.wrap(result)
                .order(ByteOrder.LITTLE_ENDIAN)
                .putInt(Integer.BYTES, result.length - RIFF_CHUNK_HEADER_LENGTH);
        return result;
    }

    private static String readAscii(ByteBuffer in, int offset) {
        byte[] fourCc = new byte[Integer.BYTES];
        in.get(offset, fourCc);
        return new String(fourCc, StandardCharsets.US_ASCII);
    }

    private static boolean startsWith(byte[] content, byte[] prefix) {
        return content.length >= prefix.length && Arrays.equals(content, 0, prefix.length, prefix, 0, prefix.length);
    }
}
