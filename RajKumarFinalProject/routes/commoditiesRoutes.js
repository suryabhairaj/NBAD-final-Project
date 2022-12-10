const express = require('express');
const router = express.Router();
const controller = require('../controllers/commodityController');
const { validateId } = require('../middlewares/validator'); 
const { isLoggedIn, isHost } = require('../middlewares/auth');
const { validateCommodity, validateResult } = require('../middlewares/validator');

//GET /commodities: send all commodities to the user
router.get('/', controller.index);

//GET /commodities/new: send html form for creating a new commodity
router.get('/new', controller.new);

//POST /commodities: create a new commodity
router.post('/', isLoggedIn, validateCommodity, validateResult, controller.create);

//GET /commodities/:id: send details of commodity identified by id
router.get('/:id', isLoggedIn,validateId, controller.show);

//GET /commodities/:id: send html form for editing an existing commodity
router.get('/:id/edit', validateId, isLoggedIn, isHost, controller.edit);

//PUT /commodities/:id: update the commodity identified by id
router.put('/:id', isLoggedIn, isHost, validateCommodity, validateResult, controller.update);

//DELETE /commodities/:id: delete the commodity identified by id
router.delete('/:id', validateId, isLoggedIn, isHost, controller.delete);

//POST /commodities/:id/trade: user response to trade
router.post('/:id/trade', validateId, isLoggedIn, controller.trade);

//DELETE /commodities/trade/:id: delete the trade identified by id
router.delete('/trade/:id', validateId, isLoggedIn, controller.deleteTrade);

router.post('/trade/manage/:id', isLoggedIn, controller.manage);

router.get('/trade/maketrade', isLoggedIn, controller.maketrade);

module.exports=router;  