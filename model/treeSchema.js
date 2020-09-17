const Joi = require('joi');

let createTreeValidation = (treeInfo) => {
    const createTreeSchema = Joi.object({
        treeId : Joi.string().required(),
        treename: Joi.string().min(3).max(30).required(),
        investment: Joi.number().min(3).required(),
        admins: Joi.array().items(Joi.string()).required(),
        principal: Joi.number().required(),
        returnValue: Joi.number().required(),
        unitCollection: Joi.number().required(),
        unitFine: Joi.number().required(),
        days: Joi.number().min(2).required(),
        createTime: Joi.date().required(),
        createdBy : Joi.required(),
    })

    const { error } = createTreeSchema.validate(treeInfo);
    return error;
}

let addMemberValidation = (memberInfo) => {
    const addMemberSchema = Joi.object({
        memberId : Joi.string().required(),
        name: Joi.string().min(3).max(30).required(),
        noOfPackage: Joi.number().required(),
        joinedAt: Joi.date().required(),
        lastPaymentwrtJoin: Joi.date().required(),
        addBy : Joi.required(),
    })

    const { error } = addMemberSchema.validate(memberInfo);
    return error;
}

let MembersssSchema = Joi.object().keys({
    items: Joi.array().items(
        Joi.object({
            item_id: Joi.number().required(),
            item_qty: Joi.number().required(),
            item_type_id: Joi.number().required(),
            item_qty: Joi.number().required(),
            base_price: Joi.number().required(),
            actual_price: Joi.number().required(),
        })
    ).required(),
})


module.exports = {
    createTreeValidation , addMemberValidation
}