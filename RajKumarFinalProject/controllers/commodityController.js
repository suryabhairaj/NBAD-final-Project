const model = require('../models/commodity');
const modelUser = require('../models/user');
const { DateTime } = require("luxon");
const tradeModel = require('../models/trade');

exports.index = (req, res) => {
    let categories = [];
    model.distinct("category", function(error, results){
        categories = results;
    });
    model.find()
    .then(commodities => res.render('./commodities/index', {commodities, categories}))
    .catch(err=>next(err));
};

exports.new = (req, res) => {
    res.render('./commodities/new');
};

exports.create = (req, res,next) => {

    let commodity = new model(req.body);
    commodity.seller = req.session.user;
    commodity.sellerName = req.session.firstName+" "+req.session.lastName;
    commodity.status= "Available";
    commodity.save()
    .then(commodity=> {
        req.flash('success', 'You have successfully created a new commodity');
        res.redirect('/commodities');
    })
    .catch(err=>{
        if(err.name === 'ValidationError' ) {
            err.status = 400;
        }
        next(err);
    });
};

exports.show = (req, res, next) => {
    let id = req.params.id;
    model.findById(id)
    .then(commodity=>{
        if(commodity){
            commodity.date = DateTime.fromSQL(commodity.date).toFormat('LLLL dd, yyyy');
            commodity.startTime = DateTime.fromSQL(commodity.startTime).toFormat('hh:mm a');
            commodity.endTime = DateTime.fromSQL(commodity.endTime).toFormat('hh:mm a');
            // console.log(JSON.stringify(req.session.user));
            let b = false;
            if(req.session.user && req.session.user==commodity.seller) {
                b = true;
            }
            tradeModel.countDocuments({ status: 'Offer Pending', commodities: id })
            .then(tradeCount=>{
                // console.log("tradeCount: "+tradeCount);
                res.render('./commodities/show',{commodity,b,tradeCount});
            })
            .catch(err=>next(err));
            
        }else{
            let err = new Error('Commodity with id '+id+' does not exists');
            err.status = 404;
            next(err);
        }
    }).catch(err=>next(err));
    
};

exports.edit = (req, res, next) => {
    let id = req.params.id;
    model.findById(id).then(commodity=>{
        if(commodity){
            if(commodity.seller==req.session.user){
                commodity.status="Available";
                res.render('./commodities/edit',{commodity});
            }else{
                let err = new Error('You are not Authorised to edit this commodity');
                err.status = 401;
                next(err);
            }
        }else{
            let err = new Error('Commodity with id '+id+' does not exists');
            err.status = 404;
            next(err);
        }
    }).catch(err=>next(err));
};

exports.update = (req, res, next) => {
    let id = req.params.id;
    let commodity = req.body;
    // commodity.status="Available";
    model.findByIdAndUpdate(id, commodity, {useFindAndModify: false, runValidators: true})
    .then(commodity=>{
        if(commodity) {

            res.redirect('/commodities/'+id);
        } else {
            let err = new Error('Commodity with id '+id+' does not exists');
            err.status = 404;
            next(err);
        }
    })
    .catch(err=> {
        if(err.name === 'ValidationError')
            err.status = 400;
        next(err);
    });
    
};

exports.delete = (req, res, next) => {
    let id = req.params.id;
    let commodity;
    model.findById(id)
    .then(com=>{
        commodity = com;
        if(com.seller!=req.session.user){
            let err = new Error('You are not Authorised to edit this commodity');
                err.status = 401;
                next(err);
        }
    }).catch(err=>next(err)).then(com=>{
        if(commodity.seller==req.session.user){
            Promise.all([model.findByIdAndDelete(id, {useFindAndModify: false}),
                tradeModel.remove({"commodities":id}, {useFindAndModify: true})]) 
            .then(results =>{
                if(results) {
                    res.redirect('/commodities');
                }else{
                    let err = new Error('Commodity with id '+id+' does not exists');
                    err.status = 404;
                    next(err);
                } 
            })
            .catch(err=>next(err));
        }
    });
};

exports.trade = (req, res, next) => {
    let attendees = req.session.user;
    let cid = req.params.id;
    let status = req.body.status;
    model.findById(cid)
    .then(commodity=>{
        if(commodity) {
            // console.log(commodity);
            if(commodity.seller==attendees){
                let err = new Error('Unauthorized to access the resource');
                err.status = 401;
                return next(err);
            }else{
                // console.log("status "+status);
                model.findOneAndUpdate({"_id": cid}, {$set: {"status": req.body.status}}).then(c=>{
                    tradeModel.updateOne({ commodities: cid, attendees: attendees }, 
                        { $set: { commodities: cid, attendees: attendees, seller: commodity.seller, status: status }}, 
                        { upsert: true })
                    .then(trade=>{
                        if(trade) {
                            if(trade.upserted){
                                req.flash('success', 'Successfully created a trade for this commodity!');
                            }else{
                                req.flash('success', 'Successfully updated a trade for this commodity!');
                            }
                            res.redirect('/users/profile');
                        } else {
                            req.flash('error', 'There is some problem in creating a trade for this commodity');
                            res.redirect('back');
                        }
                    })
                    .catch(err=> {
                        console.log(err);
                        if(err.name === 'ValidationError'){
                            req.flash('error', err.message);
                            res.redirect('back');
                        }else{
                            next(err);
                        }
                    });
                }).catch(err=>{
                    console.log(err);
                    next(err)});
                
            }
        } else {
            console.log(err);
            let err = new Error('Cannot find a commodity with id ' + id);
            err.status = 404;
            next(err);
        }
    })
    .catch(err=>{
        console.log(err);
        next(err)});
    
};

exports.deleteTrade = (req, res, next) => {
    let id = req.params.id;
        tradeModel.findByIdAndDelete(id, {useFindAndModify: true})
        .then(trade =>{
            model.findOneAndUpdate({"_id": trade.commodities}, {$set: {"status": "Available"}}).then(t=>{
                if(trade) {
                    req.flash('success', 'Trade has been sucessfully deleted!');
                    res.redirect('/users/profile');
                } else {
                    let err = new Error('Cannot find a Trade with id ' + id);
                    err.status = 404;
                    return next(err);
                }
            }).catch(err=>next(err));
        }).catch(err=>next(err));
    
    
};

exports.manage = (req, res, next) => {
    let match = [];
    let myTradeid = req.params.id;
    let id = req.session.user;
    // console.log("in manage: "+id);
    Promise.all([tradeModel.find({attendees: id}).populate('commodities').populate('attendees'),
    tradeModel.find({seller: id}).populate('commodities').populate('attendees'),model.findById(myTradeid)]) 
    .then(results=>{
        // myTrades => the products of my interest
        // otherTrades => the one i am selling
        const [myTrades,otherTrades,com] = results; 
        // console.log("com: "+JSON.stringify(com));
        let deleteTrade = [];
        otherTrades.attendees == myTrades.seller;
        let tempboolean = true;
        myTrades.forEach(function (item) {
            otherTrades.forEach(function (item1) {
                if(tempboolean && item.attendees.id==item1.seller && item.seller==item1.attendees.id){
                    item1.commodities.buyer = item1.attendees.firstName+" "+item1.attendees.LastName;
                    deleteTrade.push(item._id);
                    
                    // deleteTrade.push(item1._id);
                    match.push(item.commodities);
                    console.log("item1: "+JSON.stringify(item1.commodities));
                    console.log("com: "+JSON.stringify(com));
                    // match.push(item1.commodities);
                    tempboolean = false;
                    
                }
                if(item1.commodities.id==com.id){
                    // console.log("item: "+item1.id);
                    // console.log("commodity: "+com.id);
                    deleteTrade.push(item1.id);
                }
              });
              
          });
          if(match.length>0){
                match.push(com);
                req.session.match = match;
                // console.log("match: "+JSON.stringify(req.session.match));
                req.session.deleteTrade = deleteTrade;
                res.render("./commodities/manage",{match});
            }else{
                req.flash('error', 'You First need to add a Counter Trade for the same person who is interested in your commodity, in order to make a trade');
                res.redirect('/users/profile');
            }
        // res.render('./user/profile', {user, commodities,myTrades,otherTrades,b});
    })
    .catch(err=>{
        console.log(err);
        next(err);
    });
};


exports.maketrade = (req, res, next) => {
    let match = req.session.match;
    let deleteTrade = req.session.deleteTrade;
    Promise.all([model.findOneAndUpdate({"_id": match[0]._id}, {$set: {"status": "Traded"}}), 
    model.findOneAndUpdate({"_id": match[1]._id}, {$set: {"status": "Traded"}}),
    tradeModel.findByIdAndDelete(deleteTrade[0], {useFindAndModify: true}),
    tradeModel.findByIdAndDelete(deleteTrade[1], {useFindAndModify: true})]).then(results=>{
        // console.log("result: "+results);
        delete req.session.match;
        delete req.session.deleteTrade;
        res.redirect('/users/profile');
    }).catch(err=>{
        console.log(err);
        next(err);
    });
    
};