const User = require("../Model/userModel");

exports.getAlluser = async(req, res) => {
    const user = await User.find();
    res.status(200).json({
        status: "success",
        data: {
            user: user,
        }
    })
}         
