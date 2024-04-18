const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
       if(conn){
           console.log("Database connected");
       }else{
           console.log("Database not connected");
       }
    } catch (error) {
        console.log(error.message);
        process.exit();
    }
}

module.exports = connectDB;