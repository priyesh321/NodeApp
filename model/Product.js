const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
    title: String,
    description: String,
    price: Number,
    company: String
}, {
    timestamps: true

  
});


// export model user with UserSchema
module.exports = mongoose.model("product", UserSchema);