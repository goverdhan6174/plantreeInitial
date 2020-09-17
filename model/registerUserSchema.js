const Joi = require('joi');

let UsersValidation = ( userInfo ) => {
    const registerSchema = Joi.object({
        userId : Joi.string().required(),
        username: Joi.string().alphanum().min(3).max(30).required(),
        password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).min(6).required(),
        email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }),
    })
    
        const {error} = registerSchema.validate( userInfo );
        return error ;
}

module.exports = {
    UsersValidation
}