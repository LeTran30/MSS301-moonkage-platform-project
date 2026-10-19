package com.moonkage.storage;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.zip.CRC32;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;

/** Fixtures are real images written by ImageIO, with metadata inserted the way cameras and editors do. */
class ImageMetadataStripperTest {

    private static final String SECRET = "GPS 10.7769N 106.7009E Pixel-8 Nguyen Van A";
    private static final int ROTATE_90 = 6;

    @Test
    void jpegLosesExifXmpIptcAndCommentsButKeepsOrientationAndPixels() throws IOException {
        byte[] original = writeImage("jpg");
        byte[] withMetadata = insertAfterApp0(
                original,
                jpegSegment(0xE1, exif(ROTATE_90, ByteOrder.LITTLE_ENDIAN)),
                jpegSegment(0xE1, ascii("http://ns.adobe.com/xap/1.0/\0<x:xmpmeta>" + SECRET + "</x:xmpmeta>")),
                jpegSegment(0xED, ascii("Photoshop 3.0\0" + SECRET)),
                jpegSegment(0xFE, ascii(SECRET)));

        byte[] cleaned = ImageMetadataStripper.removeMetadata("image/jpeg", withMetadata);

        assertThat(contains(cleaned, ascii("GPS"))).isFalse();
        assertThat(contains(cleaned, ascii("xmpmeta"))).isFalse();
        assertThat(contains(cleaned, ascii("Photoshop"))).isFalse();
        assertThat(readOrientation(cleaned)).isEqualTo(ROTATE_90);
        assertSamePixels(original, cleaned);
        // JFIF must stay the first segment
        assertThat(Byte.toUnsignedInt(cleaned[3])).isEqualTo(0xE0);
    }

    @Test
    void jpegStoredUprightGetsNoExifAtAll() throws IOException {
        byte[] original = writeImage("jpg");
        byte[] withMetadata = insertAfterApp0(original, jpegSegment(0xE1, exif(1, ByteOrder.BIG_ENDIAN)));

        byte[] cleaned = ImageMetadataStripper.removeMetadata("image/jpeg", withMetadata);

        assertThat(contains(cleaned, ascii("Exif"))).isFalse();
        assertThat(cleaned).isEqualTo(original);
    }

    @Test
    void pngLosesExifAndTextChunksButKeepsPixels() throws IOException {
        byte[] original = writeImage("png");
        byte[] withMetadata = insertBeforeIend(
                original,
                pngChunk("tEXt", ascii("Author\0" + SECRET)),
                pngChunk("iTXt", ascii("Comment\0\0\0\0\0" + SECRET)),
                pngChunk("eXIf", exifTiff(ROTATE_90, ByteOrder.BIG_ENDIAN)));

        byte[] cleaned = ImageMetadataStripper.removeMetadata("image/png", withMetadata);

        assertThat(contains(cleaned, ascii("GPS"))).isFalse();
        assertThat(contains(cleaned, ascii("eXIf"))).isFalse();
        assertThat(cleaned).isEqualTo(original);
        assertSamePixels(original, cleaned);
    }

    @Test
    void webpLosesExifAndXmpChunksAndTheirFlags() {
        byte[] vp8x = new byte[10];
        vp8x[0] = 0x08 | 0x04 | 0x10; // EXIF, XMP and ALPHA flags
        byte[] image = ascii("fake-bitstream"); // the stripper never decodes it
        byte[] webp = riff(
                riffChunk("VP8X", vp8x),
                riffChunk("VP8L", image),
                riffChunk("EXIF", ascii(SECRET + "!")), // odd length: padded
                riffChunk("XMP ", ascii(SECRET)));

        byte[] cleaned = ImageMetadataStripper.removeMetadata("image/webp", webp);

        assertThat(contains(cleaned, ascii("GPS"))).isFalse();
        assertThat(cleaned).isEqualTo(riff(riffChunk("VP8X", flags(0x10)), riffChunk("VP8L", image)));
        int riffSize =
                ByteBuffer.wrap(cleaned, 4, 4).order(ByteOrder.LITTLE_ENDIAN).getInt();
        assertThat(riffSize).isEqualTo(cleaned.length - 8);
    }

    @Test
    void pdfIsLeftUnchanged() {
        byte[] pdf = ascii("%PDF-1.7\n" + SECRET);

        assertThat(ImageMetadataStripper.removeMetadata("application/pdf", pdf)).isSameAs(pdf);
    }

    @Test
    void truncatedOrForgedStructuresAreRefused() throws IOException {
        byte[] jpeg = writeImage("jpg");
        byte[] png = writeImage("png");
        byte[] badJpegLength = Arrays.copyOf(jpeg, jpeg.length);
        badJpegLength[4] = 0; // APP0 length 0x0000
        badJpegLength[5] = 0;

        for (Object[] input : new Object[][] {
            {"image/jpeg", Arrays.copyOf(jpeg, 20)},
            {"image/jpeg", badJpegLength},
            {"image/png", Arrays.copyOf(png, 30)},
            {"image/webp", riffWithSize(1_000_000)},
            {"image/webp", riff(riffChunkWithLength("VP8L", 1_000_000, new byte[4]))}
        }) {
            assertThatThrownBy(() -> ImageMetadataStripper.removeMetadata((String) input[0], (byte[]) input[1]))
                    .isInstanceOf(InvalidFileException.class)
                    .extracting("errorCode")
                    .isEqualTo(StorageErrorCode.CONTENT_MISMATCH);
        }
    }

    // ── fixtures ──

    private static byte[] writeImage(String format) throws IOException {
        BufferedImage image = new BufferedImage(8, 4, BufferedImage.TYPE_INT_RGB);
        for (int x = 0; x < 8; x++) {
            for (int y = 0; y < 4; y++) {
                image.setRGB(x, y, (x < 4 ? Color.RED : Color.BLUE).getRGB());
            }
        }
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, format, out);
        return out.toByteArray();
    }

    private static void assertSamePixels(byte[] expected, byte[] actual) throws IOException {
        BufferedImage a = ImageIO.read(new ByteArrayInputStream(expected));
        BufferedImage b = ImageIO.read(new ByteArrayInputStream(actual));
        assertThat(b).isNotNull();
        assertThat(b.getWidth()).isEqualTo(a.getWidth());
        assertThat(b.getHeight()).isEqualTo(a.getHeight());
        for (int x = 0; x < a.getWidth(); x++) {
            for (int y = 0; y < a.getHeight(); y++) {
                assertThat(b.getRGB(x, y)).isEqualTo(a.getRGB(x, y));
            }
        }
    }

    /** "Exif\0\0" + TIFF with IFD0 holding a GPS-looking string and the orientation. */
    private static byte[] exif(int orientation, ByteOrder order) {
        byte[] tiff = exifTiff(orientation, order);
        return concat(new byte[] {'E', 'x', 'i', 'f', 0, 0}, tiff);
    }

    private static byte[] exifTiff(int orientation, ByteOrder order) {
        byte[] text = ascii(SECRET + "\0");
        ByteBuffer tiff = ByteBuffer.allocate(8 + 2 + 2 * 12 + 4 + text.length).order(order);
        tiff.put(order == ByteOrder.LITTLE_ENDIAN ? ascii("II") : ascii("MM"));
        tiff.putShort((short) 42).putInt(8);
        tiff.putShort((short) 2);
        // ImageDescription (ASCII) pointing at the text after the IFD
        tiff.putShort((short) 0x010E).putShort((short) 2).putInt(text.length).putInt(8 + 2 + 2 * 12 + 4);
        // a SHORT value sits in the first two bytes of the 4-byte value field, in the file's byte order
        tiff.putShort((short) 0x0112).putShort((short) 3).putInt(1);
        tiff.putShort((short) orientation).putShort((short) 0);
        tiff.putInt(0);
        tiff.put(text);
        return tiff.array();
    }

    private static int readOrientation(byte[] jpeg) {
        int app1 = indexOf(jpeg, new byte[] {(byte) 0xFF, (byte) 0xE1});
        assertThat(app1).as("APP1 with orientation").isPositive();
        ByteBuffer tiff = ByteBuffer.wrap(jpeg, app1 + 4 + 6, jpeg.length - app1 - 10)
                .slice()
                .order(jpeg[app1 + 10] == 'I' ? ByteOrder.LITTLE_ENDIAN : ByteOrder.BIG_ENDIAN);
        int ifd = tiff.getInt(4);
        assertThat(Short.toUnsignedInt(tiff.getShort(ifd))).isEqualTo(1);
        assertThat(Short.toUnsignedInt(tiff.getShort(ifd + 2))).isEqualTo(0x0112);
        return Short.toUnsignedInt(tiff.getShort(ifd + 10));
    }

    private static byte[] jpegSegment(int marker, byte[] payload) {
        int length = payload.length + 2;
        return concat(new byte[] {(byte) 0xFF, (byte) marker, (byte) (length >> 8), (byte) length}, payload);
    }

    private static byte[] insertAfterApp0(byte[] jpeg, byte[]... segments) {
        int app0Length = ((jpeg[4] & 0xFF) << 8) | (jpeg[5] & 0xFF);
        int insertAt = 4 + app0Length;
        List<byte[]> parts = new ArrayList<>();
        parts.add(Arrays.copyOfRange(jpeg, 0, insertAt));
        parts.addAll(List.of(segments));
        parts.add(Arrays.copyOfRange(jpeg, insertAt, jpeg.length));
        return concat(parts.toArray(byte[][]::new));
    }

    private static byte[] pngChunk(String type, byte[] data) {
        ByteBuffer chunk = ByteBuffer.allocate(12 + data.length);
        chunk.putInt(data.length).put(ascii(type)).put(data);
        CRC32 crc = new CRC32();
        crc.update(ascii(type));
        crc.update(data);
        chunk.putInt((int) crc.getValue());
        return chunk.array();
    }

    private static byte[] insertBeforeIend(byte[] png, byte[]... chunks) {
        int iend = png.length - 12;
        List<byte[]> parts = new ArrayList<>();
        parts.add(Arrays.copyOfRange(png, 0, iend));
        parts.addAll(List.of(chunks));
        parts.add(Arrays.copyOfRange(png, iend, png.length));
        return concat(parts.toArray(byte[][]::new));
    }

    private static byte[] riffChunk(String fourCc, byte[] data) {
        return riffChunkWithLength(fourCc, data.length, data);
    }

    private static byte[] riffChunkWithLength(String fourCc, int declaredLength, byte[] data) {
        ByteBuffer chunk =
                ByteBuffer.allocate(8 + data.length + (data.length & 1)).order(ByteOrder.LITTLE_ENDIAN);
        chunk.put(ascii(fourCc)).putInt(declaredLength).put(data);
        return chunk.array();
    }

    private static byte[] riff(byte[]... chunks) {
        byte[] body = concat(chunks);
        ByteBuffer riff = ByteBuffer.allocate(12 + body.length).order(ByteOrder.LITTLE_ENDIAN);
        riff.put(ascii("RIFF")).putInt(4 + body.length).put(ascii("WEBP")).put(body);
        return riff.array();
    }

    private static byte[] riffWithSize(int declaredSize) {
        byte[] webp = riff(riffChunk("VP8L", new byte[4]));
        ByteBuffer.wrap(webp).order(ByteOrder.LITTLE_ENDIAN).putInt(4, declaredSize);
        return webp;
    }

    private static byte[] flags(int first) {
        byte[] vp8x = new byte[10];
        vp8x[0] = (byte) first;
        return vp8x;
    }

    private static byte[] ascii(String text) {
        return text.getBytes(StandardCharsets.ISO_8859_1);
    }

    private static byte[] concat(byte[]... parts) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        for (byte[] part : parts) {
            out.write(part, 0, part.length);
        }
        return out.toByteArray();
    }

    private static boolean contains(byte[] haystack, byte[] needle) {
        return indexOf(haystack, needle) >= 0;
    }

    private static int indexOf(byte[] haystack, byte[] needle) {
        outer:
        for (int i = 0; i <= haystack.length - needle.length; i++) {
            for (int j = 0; j < needle.length; j++) {
                if (haystack[i + j] != needle[j]) {
                    continue outer;
                }
            }
            return i;
        }
        return -1;
    }
}
