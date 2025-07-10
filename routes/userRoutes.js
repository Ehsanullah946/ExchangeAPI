const express = require("express");

const router = express.Router();
const userController = require("../Controller/userController");
const authController = require("../Controller/authController");


router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/', userController.getAlluser);
router.post('/forgetPassword', authController.forgetPassword);


router.patch("/updateMyPassword", authController.protect, authController.updatePassword);

router.patch('/resetPassword/:token', authController.resetPassword);

module.exports = router;