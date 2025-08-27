const { SUPPORTED_FORMATS } = require("../constants");
const { checkSystemDependencies } = require("../utils");

const systemInfoController = async (req, res) => {
  try {
    const dependencies = await checkSystemDependencies();

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      supportedFormats: Object.keys(SUPPORTED_FORMATS),
      maxFileSize: "500MB",
      maxBatchFiles: 10,
      dependencies: dependencies.reduce((acc, dep) => {
        acc[dep.name] = dep.available;
        return acc;
      }, {}),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      error: error.message,
      dependencies: {},
    });
  }
};

module.exports = systemInfoController;
