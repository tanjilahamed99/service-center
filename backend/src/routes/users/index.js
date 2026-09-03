const createContact = require("../../api/v1/users/createContact");
const getLiveKitData = require("../../api/v1/users/getLiveKit");
const getMyData = require("../../api/v1/users/getMyData");
const getUserData = require("../../api/v1/users/getUser");
const getWebsiteData = require("../../api/v1/users/getWebsiteData");
const updateUserData = require("../../api/v1/users/updateUserData");
const saveFcmToken = require("../../api/v1/users/saveFcmToken");
const { protect } = require("../../middlewares/userValidate");
const userFreeTrail = require("../../api/v1/users/userFreeTrail");
const updateUserContactData = require("../../api/v1/users/updateContact");
const getUserContactData = require("../../api/v1/users/getAllContactList");
const getUniqueContact = require("../../api/v1/users/getUniqueContact");
const unblockGest = require("../../api/v1/users/unblockGest");
const blockGest = require("../../api/v1/users/blockGest");

const router = require("express").Router();

router.put("/update/:userId", protect, updateUserData);
router.get("/myData/:userId", protect, getMyData);
router.get("/get/:userId", getUserData);
router.get("/website", getWebsiteData);
router.post("/contact", createContact);
router.get("/liveKit", getLiveKitData);
router.post("/save-fcm-token", saveFcmToken);

router.put("/contact/:userId", updateUserContactData);
router.get("/contact/:userId", getUserContactData);
router.get("/contact/:userId/unique", getUniqueContact);

router.put("/subscription/freeTrail/:id", protect, userFreeTrail);

router.post("/gest/block/:guestId/:userId", blockGest);
router.post("/gest/unblock/:guestId/:userId", unblockGest);

module.exports = router;
