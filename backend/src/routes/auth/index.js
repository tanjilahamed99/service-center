const {
  register,
  login,
  changePassword,
  checkUser,
  sendOtp,
  verifyCode,
} = require("../../controller/v1/auth/auth");

const router = require("express").Router();

router.post("/register", register);
router.post("/login", login);
router.post("/check-user", checkUser);
router.post("/send-code", sendOtp);
router.post("/verify-code", verifyCode);
router.post("/change-password", changePassword);

module.exports = router;
