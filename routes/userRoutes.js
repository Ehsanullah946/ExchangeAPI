const express = require("express");

const router = express.Router();
const userController = require("../Controller/userController");


router.get('/signup', userController.signup);

module.exports = router;