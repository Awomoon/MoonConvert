const fs = require("fs").promises;
const { convertDocument } = require("../constants");
const convertDocumentCLI = require("./convertDocumentCli");
const { logger } = require("./logger");

async function convertDocumentEnhanced(
  inputPath,
  outputPath,
  targetExt,
  options = {}
) {
  try {
    logger.info(`Starting document conversion: ${inputPath} -> ${targetExt}`);

    const inputBuffer = await fs.readFile(inputPath);
    const outputFormat = `.${targetExt.replace(".", "")}`;

    // Convert using LibreOffice
    const outputBuffer = await convertDocument(
      inputBuffer,
      outputFormat,
      undefined
    );

    await fs.writeFile(outputPath, outputBuffer);

    logger.info(`Document conversion completed: ${path.basename(outputPath)}`);
    return {
      outputPath,
      size: outputBuffer.length,
      originalSize: inputBuffer.length,
    };
  } catch (error) {
    logger.error(`Document conversion error: ${error.message}`);

    // Try alternative method using LibreOffice command line
    if (error.message.includes("LibreOffice")) {
      return await convertDocumentCLI(inputPath, outputPath, targetExt);
    }

    throw new Error(`Document conversion failed: ${error.message}`);
  }
}

module.exports = convertDocumentEnhanced;
