const model = require('../models/user');
const Commodity = require('../models/commodity');
const trade = require('../models/trade');

exports.new = (req, res)=>{
    res.render('./user/new');
};

exports.create = (req, res, next)=>{
    let user = new model(req.body);
    user.save()
    .then(user=> {
        req.flash('success', 'You have successfully registered');
        res.redirect('/users/login');
    })
    .catch(err=>{
        if(err.name === 'ValidationError' ) {
            req.flash('error', err.message);  
            return res.redirect('/users/new');
        }

        if(err.code === 11000) {
            req.flash('error', 'Email has been used');  
            return res.redirect('/users/new');
        }
        
        next(err);
    }); 
};

exports.getUserLogin = (req, res, next) => {
    res.render('./user/login');
}

exports.login = (req, res, next)=>{
    let email = req.body.email;
    let password = req.body.password;

    model.findOne({ email: email })
    .then(user => {
        if (!user) {
            req.flash('error', 'Wrong email address');  
            res.redirect('/users/login');
        } else {
            user.comparePassword(password)
            .then(result=>{
                if(result) {
                    req.session.user = user._id;
                    req.session.firstName = user.firstName;
                    req.session.lastName = user.lastName;
                    req.flash('success', 'You have successfully logged in');
                    res.redirect('/users/profile');
                } else {
                    req.flash('error', 'Wrong password');      
                    res.redirect('/users/login');
                }
            })
            .catch(err => next(err));;     
        }     
    })
    .catch(err => next(err));
};

exports.profile = (req, res, next)=>{
    let id = req.session.user;
    
    Promise.all([model.findById(id), Commodity.find({seller: id}),trade.find({attendees: id}).populate('commodities').populate('attendees'),
    trade.find({seller: id}).populate('commodities').populate('attendees')]) 
    .then(results=>{
        // let trades = 0;
        const [user, commodities,myTrades,otherTrades] = results; 
        // let match = [];
        // let deleteTrade = [];
        // myTrades.forEach(function (item) {
        //     otherTrades.forEach(function (item1) {
        //         if(item.attendees.id==item1.seller && item.seller==item1.attendees.id){
        //             item1.commodities.buyer = item1.attendees.firstName+" "+item1.attendees.LastName;
        //             deleteTrade.push(item._id);
        //             deleteTrade.push(item1._id);
        //             match.push(item.commodities);
        //             match.push(item1.commodities);
        //         }
        //       });
        //   });
        // console.log("myTrade "+myTrades);
        // console.log("otherTrades "+otherTrades);
        res.render('./user/profile', {user, commodities,myTrades,otherTrades});
    })
    .catch(err=>{
        console.log(err);
        next(err);

    });
};


exports.logout = (req, res, next)=>{
    req.session.destroy(err=>{
        if(err) 
           return next(err);
       else
            res.redirect('/');  
    });
 };



