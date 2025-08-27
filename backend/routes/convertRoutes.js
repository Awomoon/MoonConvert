const { singleFileConvert } = require("../controllers/convertControllers");
const upload = require("../constants/upload.js");

const router = require("express").Router();

router.post("/", upload.single("file"), singleFileConvert);
router.post("/batch", upload.array("files", 10));

module.exports = router;
