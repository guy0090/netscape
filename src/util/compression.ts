import zlib from "zlib";

/**
 * Brotli (de)compression utility
 */
export const Brotli = {
  /**
   * Compress a buffer with Brotli compression.
   * @param {Buffer} buffer The buffer to compress
   * @returns {Promise<Buffer>} A promise that resolves to the compressed buffer
   */
  compress(buffer: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      zlib.brotliCompress(
        buffer,
        {
          params: {
            [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
          },
        },
        (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        }
      );
    });
  },

  /**
   * Compress a string with Brotli compression.
   * @param {string} string The string to compress
   * @returns {Promise<Buffer>} The compressed string
   */
  compressString(string: string, encoding = "utf8"): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const buffer = Buffer.from(string, encoding as BufferEncoding);
      zlib.brotliCompress(
        buffer,
        {
          params: {
            [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
          },
        },
        (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        }
      );
    });
  },

  /**
   * Decompress a buffer to string format.
   * @param {Buffer} buffer The buffer to decompress.
   * @returns {Promise<String>} A promise that resolves to the decompressed string.
   */
  decompress(buffer: Buffer, encoding = "utf8"): Promise<string> {
    return new Promise((resolve, reject) => {
      zlib.brotliDecompress(
        buffer,
        {
          params: {
            [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
          },
        },
        (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result.toString(encoding as BufferEncoding));
          }
        }
      );
    });
  },

  /**
   * Decompress a buffer to string format in a synchronous manner.
   * @param buffer The buffer to decompress
   * @param encoding The encoding to use
   * @returns The decompressed string
   */
  decompressSync(buffer: Buffer, encoding = "utf8"): string {
    return zlib
      .brotliDecompressSync(buffer, {
        params: {
          [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
        },
      })
      .toString(encoding as BufferEncoding);
  },
};

/**
 * Gzip (de)compression utility
 */
export const Gzip = {
  /**
   * Compress a buffer with gzip compression.
   * @param {Buffer} buffer The buffer to compress
   * @returns {Promise<Buffer>} A promise that resolves to the compressed buffer
   */
  compress(buffer: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      zlib.gzip(buffer, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  },

  /**
   * Compress a string with gzip compression.
   * @param {string} string The string to compress
   * @returns {Promise<Buffer>} The compressed string
   */
  compressString(string: string, encoding = "utf8"): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const buffer = Buffer.from(string, encoding as BufferEncoding);
      zlib.gzip(buffer, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  },

  /**
   * Decompress a buffer to string format.
   * @param {Buffer} buffer The buffer to decompress.
   * @returns {Promise<String>} A promise that resolves to the decompressed string.
   */
  decompress(buffer: Buffer, encoding = "utf8"): Promise<string> {
    return new Promise((resolve, reject) => {
      zlib.gunzip(buffer, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result.toString(encoding as BufferEncoding));
        }
      });
    });
  },

  /**
   * Decompress a buffer to string format in a synchronous manner.
   * @param buffer The buffer to decompress
   * @param encoding The encoding to use
   * @returns The decompressed string
   */
  decompressSync(buffer: Buffer, encoding = "utf8"): string {
    return zlib.gunzipSync(buffer).toString(encoding as BufferEncoding);
  },
};
