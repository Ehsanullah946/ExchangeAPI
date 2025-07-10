const mongoose = require("mongoose");
const dotenv = require("dotenv");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
dotenv.config({ path: "./config.env" });

mongoose.connect(process.env.DATABASE_LOCAL).then(() => {
    console.log("connection is created successful");
})

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "please provide a user name"]
    },
    email: {
        type: String,
        required: [true, "user should have an email"],
        unique: true,
    },
    password: {
        type: String,
        required: [true, "user should have a password"],
        minlength: 5,
        
    },
    confirmPassword: {
        type: String,
        required: [true, "please confirm your password"],
        validator: {
            validator: function (el) {
                return el === this.password;
            }
        }
    },
    changePasswordAt: Date,
    role: {
        type: String, 
        enum: ["user", "admin", "lead-guide"],
        default: "user"
    },
    passwordResetToken: String,
    passwordResetExpires: Date,

});

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 12);
    this.confirmPassword = undefined;
    next();
});


userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();
  
    this.changePasswordAt = Date.now() - 1000;
    next();
  });



userSchema.methods.changePasswordAfter = function (JWTTimestamp) {
    if (this.changePasswordAt) {
      const changeTimestamp = parseInt(
        this.changePasswordAt.getTime() / 1000,
        10,
      );
      console.log(this.changePasswordAt, JWTTimestamp);
      return JWTTimestamp < changeTimestamp;
    }
    return false;
};


userSchema.methods.correctPassword = async function (
    candidatePassword,
    userPassword,
) {
    return await bcrypt.compare(candidatePassword, userPassword);
}



userSchema.methods.createResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString("hex");

    this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    console.log(this.passwordResetToken, { resetToken });

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;  
}

const User = new mongoose.model("User", userSchema);

module.exports = User;


   