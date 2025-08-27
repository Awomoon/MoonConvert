const { exec } = require("child_process");
const fsSync = require("fs");
const fs = require("fs").promises;
const path = require("path");
const { logger } = require("./logger");

async function convertDocumentCLI(inputPath, outputPath, targetExt) {
  return new Promise((resolve, reject) => {
    const outputDir = path.dirname(outputPath);
    const inputFilename = path.basename(inputPath);

    // LibreOffice command line conversion
    const cmd = `libreoffice --headless --convert-to ${targetExt} --outdir "${outputDir}" "${inputPath}"`;

    logger.info(`Executing LibreOffice CLI: ${cmd}`);

    exec(cmd, async (error, stdout, stderr) => {
      if (error) {
        logger.error(`LibreOffice CLI error: ${error.message}`);
        return reject(
          new Error(`Document conversion failed: ${error.message}`)
        );
      }

      // LibreOffice generates files with original name + new extension
      const expectedOutput = path.join(
        outputDir,
        `${path.parse(inputFilename).name}.${targetExt}`
      );

      try {
        // Move to desired output path
        if (
          fsSync.existsSync(expectedOutput) &&
          expectedOutput !== outputPath
        ) {
          await fs.rename(expectedOutput, outputPath);
        }

        if (fsSync.existsSync(outputPath)) {
          const stats = await fs.stat(outputPath);
          logger.info(
            `Document conversion completed via CLI: ${path.basename(
              outputPath
            )}`
          );
          resolve({
            outputPath,
            size: stats.size,
          });
        } else {
          reject(new Error("Conversion completed but output file not found"));
        }
      } catch (moveError) {
        logger.error(`Error moving converted file: ${moveError.message}`);
        reject(
          new Error(
            `Conversion completed but failed to move output file: ${moveError.message}`
          )
        );
      }
    });
  });
}

module.exports = convertDocumentCLI;
