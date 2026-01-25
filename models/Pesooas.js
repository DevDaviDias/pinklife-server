const mongoose = require('mongoose');


const pessoasSchemas = new mongoose.Schemas({
     name:{
        type:String,
        required:true
     },
     password:{
        type:String,
        required: true,
        unique:true
     },
     email:{
        type:String,
        required:true
     }
})

const pessoas = mongoose.model('pessoas', pessoasSchemas);
module.export = pessoas;
4