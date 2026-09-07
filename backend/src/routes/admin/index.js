const express = require("express");
const router = express.Router();
const companyController = require("../../controller/v1/admin/admin");
const { adminCheck } = require("../../middlewares/validatoin");

router.post("/company", adminCheck, companyController.createCompany);
router.get("/company", adminCheck, companyController.getAllCompanies);
router.get("/company/:id", adminCheck, companyController.getCompanyById);
router.patch("/company/:id", adminCheck, companyController.updateCompany);
router.delete("/company/:id", adminCheck, companyController.deleteCompany);
router.post(
  "/company/login/:companyId",
  adminCheck,
  companyController.companyLogin,
);

router.post("/createUser", adminCheck, companyController.createUser);
router.get("/users", adminCheck, companyController.getUsers);
router.put("/user/:id", adminCheck, companyController.updateUser);
router.delete("/user/:id", adminCheck, companyController.deleteUser);

router.get("/getProfile", adminCheck, companyController.getMyProfile);
router.put("/updateProfile", adminCheck, companyController.updateMyProfile);
router.put("/changePassword", adminCheck, companyController.changeMyPassword);

router.get(
  "/getDashboardStats",
  adminCheck,
  companyController.getDashboardStats,
);
router.get(
  "/getServiceCenters",
  adminCheck,
  companyController.getServiceCenters,
);
router.get(
  "/getServiceEngineers",
  adminCheck,
  companyController.getServiceEngineers,
);
router.get(
  "/getCompaniesLookup",
  adminCheck,
  companyController.getCompaniesLookup,
);

module.exports = router;
