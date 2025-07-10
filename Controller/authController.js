const User = require("../Model/userModel");
const jwt = require("jsonwebtoken");
const catchAsynch = require("../utils/catchAsynch");
const AppError = require("../utils/appError");
const { promisify } = require("util");
const sendEmail = require("../utils/email");
const { appendFile } = require("fs");
const crypto = require("crypto");


const singToken = (id) => {
   return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn:process.env.JWT_EXPIRES_IN
    })
}





const createSendToken = (user, statusCode, res) => {
    const token = singToken(user._id);

    res.status(statusCode).json({
        status: "Successful",
        token,
        data: {
            user,user
        }
    })
}


exports.signup = async(req,res) => {
    const newUser = await User.create({
        username: req.body.username,
        email:req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
    })

    createSendToken(newUser, 200, res);

}


exports.login = catchAsynch(async(req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new AppError("please provide the password and email",400))
    }

    //find user by email and password;
    
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError("the email or password is not correct",404))
    }


    user.password = undefined;


    createSendToken(user, 200, res);

})


exports.protect = catchAsynch(async (req, res, next) => {
    let token;
  
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
  
    console.log("Authorization header:", req.headers.authorization);
  
    if (!token) {
      return next(new AppError("you have not access to this page please log in!", 401));
    }
  
    try {
      const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
      console.log("Decoded JWT:", decode);
  
      const currentUser = await User.findById(decode.id);
  
      if (!currentUser) {
        return next(new AppError("the user no longer exists", 401));
        }
        

      if (currentUser.changePasswordAfter(decode.iat)) {
        return next(new AppError("User recently changed the password. Please log in again.", 401));
      }
  
      req.user = currentUser; // ✅ THIS IS ESSENTIAL
      next();
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return next(new AppError("Your token has expired. Please log in again.", 401));
      }
  
      if (err.name === "JsonWebTokenError") {
        return next(new AppError("Invalid token. Please log in again.", 401));
      }
  
      return next(err); // ✅ moved inside catch
    }
  });
  

exports.restricTo = (...role)=>{
    return (req, res, next) => {
        if (!role.includes(req.user.role)) {
            return next(new AppError("you do not have premission to do this operation", 403))
        }
        next();
    }

}

exports.forgetPassword = catchAsynch(async(req, res, next) => {
    
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        return next(new AppError("this user has not found", 404));
    }

    const resetToken = user.createResetToken();
    await user.save({ validateBeforeSave: false });

    console.log("Reset token (raw):", resetToken);
    console.log("Reset token (hashed):", crypto.createHash("sha256").update(resetToken).digest("hex"));



    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

    const message = `forgot your password? submit patch request with your new password and password confirm to 
      ${resetURL}\n if you do not foget your password please ignore this email`;
    
    try {
        await sendEmail({
            email: user.email,
            subject: "you have 10 minutes to reset your password",
            message
        })
        
        res.status(200).json({
            status: 'successs',
            message: "token send to the email"
        })
    } catch (error) {

        console.log("email error", error);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;

        await user.save({ validateBeforeSave: false });

        return next(new appendFile("your email did not send to the user", 500));
    }
   
})


exports.resetPassword = catchAsynch(async (req, res, next) => {
  
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const testUser = await User.findOne({ passwordResetToken: hashedToken });
    console.log("User with matching token only:", testUser);

    console.log(req.params.token);

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });
    
    console.log(user);
    
    if (!user) {
        return next(new AppError("token is invalid has expired", 400))
    }
    
    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    console.log("hashed token:", hashedToken);
    console.log("user from db", await User.findOne({}));

    createSendToken(user, 200, res);

});

exports.updatePassword = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select("+password");

        if (!user) {
            return next(new AppError("user not found", 404));
        }

    const correct = await user.correctPassword(req.body.passwordCurrent, user.password);

    if (!correct) {
        return next(new AppError("password is not correct", 404));
    }

    
    // if so update password

    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    await user.save();
     
        createSendToken(user, 200, res);
        
} catch (error) {
    next(error)
}
       
}


