const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tradeSchema = new Schema({
    attendees: {type: Schema.Types.ObjectId, ref: 'User'},
    seller: {type: Schema.Types.ObjectId, ref: 'User'},
    commodities: {type: Schema.Types.ObjectId, ref: 'Commodity'},
    status: {type: String, required: [true, 'Status is required']},
},
{timestamps: true}
);

module.exports = mongoose.model('Trade', tradeSchema);


