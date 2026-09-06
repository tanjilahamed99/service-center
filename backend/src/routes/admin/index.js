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

module.exports = router;
