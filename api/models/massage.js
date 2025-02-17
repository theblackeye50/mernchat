const { text } = require('express');
const mongoose=require('mongoose');

const MessageSchema = new mongoose.Schema({
    sender:{type:mongoose.Schema.Types.ObjectId, ref:'User'},
    recipient:{type:mongoose.Schema.Types.ObjectId,ref:"User"},
    text:String,
    file:String,
    // timestamp: String, 
} , {timestamps:true});

const MessageModel = mongoose.model('Message',MessageSchema);
module.exports = MessageModel;