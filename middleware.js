const Listing = require("./models/listing");
const ExpressError  = require("./utils/ExpressError.js");
const Review = require("./models/review.js");
const { listingSchema,reviewSchema } = require("./schema.js");

module.exports.isLoggedIn = (req,res,next)=>{
  if(!req.isAuthenticated()) {
      req.session.redirectUrl = req.originalUrl;
      req.flash("error","You must be logged in!");
      return res.redirect("/login");
    }
    next();
  }

  module.exports.saveRedirectUrl = (req,res,next)=>{
    if(req.session.redirectUrl){
      // store on res.locals so it is available to the response handlers and views
      res.locals.redirectUrl = req.session.redirectUrl;
      // clear it from the session after saving
      delete req.session.redirectUrl;
    }
    next();
  }


  module.exports.isOwner = async (req,res,next)=>{
  let { id } = req.params;
  let listing = await Listing.findById(id);
  if(!listing){
    req.flash("error","Listing not found!");
    return res.redirect("/listings");
  }
  if (!req.user || !listing.owner.equals(req.user._id)) {
    req.flash("error","You do not have permission to do that!");
    return res.redirect(`/listings/${id}`);
  }
  next();
};



  module.exports.validateListing = (req,res,next)=>{
  let {error} =  listingSchema.validate(req.body);
        if(error) {
          let errMsg = error.details.map((el) => el.message).join(",");
          return next(new ExpressError(400, errMsg));
        }else{
          next();
        }
  
  };


  module.exports.validateReview = (req,res,next)=>{
  let {error} =  reviewSchema.validate(req.body);
        if(error) {
          let errMsg = error.details.map((el) => el.message).join(",");
          return next(new ExpressError(400, errMsg));
        }else{
          next();
        }
  
  };

   module.exports.isReviewAuthor = async (req,res,next)=>{
  let {id, reviewId } = req.params;
  let review = await Review.findById(reviewId);
  if(!review){
    req.flash("error","Review not found!");
    return res.redirect("/listings");
  }
  if (!review.author.equals(res.locals.currUser._id)) {
    req.flash("error","You are not authorized to do that!");
    return res.redirect(`/listings/${id}`);
  }
  next();
};

  