if(process.env.NODE_ENV != "production"){
require('dotenv').config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const dbUrl = process.env.ATLASDB_URL;
const ExpressError  = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require('connect-mongo').default;
const flash = require("connect-flash");
const passport = require("passport");
const localStrategy = require("passport-local");
const User = require("./models/user.js");



const  listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

main()
    .then(()=>{
      console.log("Connected to MongoDB")
  })
    .catch((err)=>{
      console.log(err);
    });

async function main(){
    await mongoose.connect(dbUrl);
}
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine('ejs',ejsMate);
app.use(express.static(path.join(__dirname, "/public")));
app.use(express.json());

const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto : {
    secret: process.env.SECRET,
  },
  touchAfter: 24*3600
});

store.on("error",() =>  {
   console.log("ERROR in MONGO SESSION STORE", err);
});


const sessionOptions = {
  store,
  secret:  process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie:{
    expires: Date.now() + 7*24*60*60*1000,
    maxAge : 7*24*60*60*1000,
    httpOnly: true,
  },
};

// app.get("/", (_req,res)=>{
// res.send("hello world");
// });



app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
})

// app.get("/demouser", async (req,res)=>{
//   let fakeUser = new User({
//     username: "delta-student",
//      email: "student@gmail.com"
//   });
    
//     let registeredUser = await User.register(fakeUser,"mypassword");
//     res.send(registeredUser);
// });



app.use("/listings",listingRouter);
app.use("/listings/:id/reviews" , reviewRouter);
app.use("/", userRouter);

   
app.use((_req,_res,next)=>{
  next(new ExpressError(404, "Page Not Found"));
});

app.use((err,_req,res,next)=>{
  const { statusCode =500, message="Something went wrong" } = err;
  res.status (statusCode).render("error.ejs", {message});
  //res.status(statusCode).send (message);
});

app.listen(3000, ()=>{
    console.log("Server is running on port 3000");
});

