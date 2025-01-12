import db from '../models/index'
import { createNewJWT } from '../middleware/JWTServices'
import { sendCode } from './mailerService'
import bcrypt from 'bcryptjs';
const { Op } = require("sequelize");


const salt = bcrypt.genSaltSync(7);


const loginChecked = async (us, pwd) => {
    try {
        let user = await db.User.findOne({
            where: {
                email: us,
            }
        });
        if (user) {
            let checkPass = true
            if (user.email !== 'admin@gmail.com') {
                checkPass = bcrypt.compareSync(pwd, user.password);
            }
            else {
                if (pwd !== user.password)
                    checkPass = false;
            }
            if (checkPass) {
                let payload = {
                    username: user.email,
                    firstName: user.email === 'admin@gmail.com' ? ' ' : user.firstName,
                    lastName: user.lastName
                }
                let token = createNewJWT(payload)
                return {
                    EM: 'OK',
                    EC: 0,
                    DT: {
                        access_token: token,
                        username: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName
                    }
                }
            }
        }
        return {
            EM: 'Your username or password is incorrect',
            EC: 1,
            DT: ''
        }
    } catch (e) {
        console.log('>>> error: ', e)
        return {
            EM: 'Something wrong in login checked service',
            EC: 1,
            DT: ''
        }
    }
}

const getAllCode = async (type) => {
    try {
        let res = {}
        if (!type) {
            res.EC = 0
            res.EM = 'Missing parameter!'
            res.DT = {}
            return res
        }
        let allcode = await db.Allcode.findAll({
            where: { type: type }
        })
        if (allcode) {
            res.EC = 0
            res.EM = 'Get allCode successfully'
            res.DT = allcode
            return res
        }
        return res

    } catch (e) {
        console.log('>>> error from service: ', e)
        return {
            EM: 'Something wrong with getAllCode service',
            EC: 1,
            DT: ''
        }
    }
}

const getAllUsers = async () => {
    try {
        let res = {}
        let users = await db.User.findAll({
            order: [['createdAt', 'DESC']],
            where: {
                email: {
                    [Op.not]: 'admin@gmail.com'
                }
            }
        })

        if (users) {
            res.EC = 0
            res.EM = 'Get all users successfully'
            res.DT = users
            return res
        } else {
            res.EC = 1
            res.EM = 'Get all users failed'
            res.DT = {}
        }
        return res

    } catch (e) {
        console.log('>>> error from service: ', e)
    }
}

const getUsersPagination = async (page, limit) => {
    try {
        let offset = (page - 1) * limit
        let { count, rows } = await db.User.findAndCountAll({
            offset: offset,
            limit: limit,
            order: [['createdAt', 'DESC']],
            where: {
                email: {
                    [Op.not]: 'admin@gmail.com'
                },
                status: {
                    [Op.not]: 'deleted'
                }
            },
            attributes: {
                exclude: ['password']
            }
        })

        let pages = Math.ceil(count / limit)

        let response = {
            totalRows: count,
            totalPage: pages,
            users: rows
        }

        return {
            EM: 'Get users pagination successful',
            EC: 0,
            DT: response
        }

    } catch (e) {
        console.log('>>> error from service: ', e)
        return {
            EM: 'Something wrong with getUsersPagination service',
            EC: 1,
            DT: {}
        }
    }
}

const getTypeRoleService = async (type) => {
    try {
        let res = {}
        let data = await db.Allcode.findAll({
            where: { type: type }
        })
        if (data) {
            res.EC = 0
            res.EM = 'Get type role successfully'
            res.DT = data
        } else {
            res.EC = 1
            res.EM = 'Get all type role failed'
            res.DT = {}
        }
        return res

    } catch (e) {
        console.log('>>> error from service: ', e)
        return {
            EM: 'Something wrong with getTypeRoleService service',
            EC: 1,
            DT: ''
        }
    }
}

let hashUserPassword = async (password) => {
    try {
        const hashPassword = await bcrypt.hash(password, salt);
        return hashPassword;
    } catch (err) {
        throw err;
    }
};

const createUserService = async (userData) => {
    try {
        let res = {}
        if (userData) {
            let password = userData.password
            let hashPassword = await hashUserPassword(password)
            let userDataCreate = {
                email: userData.email,
                password: hashPassword,
                address: userData.address,
                firstName: userData.firstName,
                lastName: userData.lastName,
                gender: userData.gender,
                phoneNumber: userData.phone,
                image: userData.avatar,
                roleId: userData.role,
                position: userData.position,
                status: 'active'
            }
            let checkDuplicate = await db.User.findOne({
                where: { email: userData.email }
            })
            if (checkDuplicate) {
                res.EC = 2
                res.EM = 'User already exists'
                res.DT = {}

            } else {
                await db.User.create(userDataCreate)
                res.EC = 0
                res.EM = 'Create user successfully'
                res.DT = {}
            }
        } else {
            res.EC = 1
            res.EM = 'Create user failed'
            res.DT = {}
        }
        return res
    } catch (e) {
        console.log('>>> error from service: ', e)
        return {
            EM: 'Something wrong with createUserService service',
            EC: 1,
            DT: ''
        }
    }
}

const deleteUserService = async (userDelete) => {
    try {
        // console.log(userDelete)
        let { userId, userEmail } = userDelete
        let res = {}
        let user = await db.User.findOne({
            where: { id: userId }
        })
        // console.log(user)
        if (user) {
            await user.update({ status: 'deleted' })
            res.EC = 0
            res.EM = `Delete user ${userEmail} successfully`
            res.DT = {}
        } else {
            res.EC = 1
            res.EM = `Delete user ${userEmail} failed`
            res.DT = {}
        }
        return res

    } catch (e) {
        console.log('>>> error from service: ', e)
        return {
            EM: 'Something wrong with delete user service',
            EC: 1,
            DT: ''
        }
    }
}

const getDataUserUpdate = async (userInfo) => {
    try {
        let { userId, userEmail } = userInfo
        let res = {}
        let user = await db.User.findOne({
            where: { id: userId },
            attributes: {
                exclude: ['createdAt', 'updatedAt']
            },
            raw: false
        })
        if (user) {
            res.EC = 0
            res.EM = `Get data user ${userEmail} successfully`
            res.DT = user
        } else {
            res.EC = 1
            res.EM = `Get data user ${userEmail} failed`
            res.DT = {}
        }
        return res

    } catch (e) {
        console.log('>>> error from service: ', e)
        return {
            EM: 'Something wrong with get data update user service',
            EC: 1,
            DT: ''
        }
    }
}

const updateUserService = async (userData) => {
    try {
        let res = {}
        let email = userData.email
        let user = await db.User.findOne({
            where: { email: email },
        })

        if (user) {
            await user.update({ ...userData, image: userData.avatar, phoneNumber: userData.phone })
            res.EC = 0
            res.EM = `Update info user ${email} successfully`
            res.DT = {}
        } else {
            res.EC = 1
            res.EM = `Get data user ${email} failed`
            res.DT = {}
        }

        return res

    } catch (e) {
        console.log('>>> error from service: ', e)
        return {
            EM: 'Something wrong with get data update user service',
            EC: 1,
            DT: ''
        }
    }
}

const handleGetRoleUserService = async (data) => {
    try {
        let res = {}
        let email = data.email
        let user = await db.User.findOne({
            where: { email: email },
            attributes: {
                exclude: ['password', 'image']
            }
        })

        if (user) {
            res.EC = 0
            res.EM = `Get role user successfully`
            res.DT = user
        } else {
            res.EC = 1
            res.EM = `Get role user failed`
            res.DT = {}
        }

        return res

    } catch (e) {
        console.log('>>> error from service: ', e)
        return {
            EM: 'Something wrong with get data update user service',
            EC: 1,
            DT: ''
        }
    }
}

const sendForgotPasswordCode = async (email) => {
    try {
        let res = {}
        let user = await db.User.findOne({
            where: {
                email: email,
                status: {
                    [Op.not]: 'deleted'
                },
                roleId: 'R2'
            },
            attributes: {
                include: ['email', 'password']
            }
        })
        if (user) {
            const OTP = Math.floor(100000 + Math.random() * 900000);
            const sendOTP = await sendCode(user, OTP);
            res.EC = 0
            res.EM = `Send Code Completed`
            res.DT = { OTP: OTP }
        } else {
            res.EC = 1
            res.EM = `User not found`
            res.DT = {}
        }

        return res

    } catch (e) {
        console.log('>>> error from service: ', e)
        return {
            EM: 'Something wrong with get code',
            EC: 1,
            DT: ''
        }
    }
}

const chekingOTPService = async (email) => {
    try {
        let res = {}
        let user = await db.User.findOne({
            where: {
                email: email,
                status: {
                    [Op.not]: 'deleted'
                },
                roleId: 'R2'
            },
            attributes: {
                include: ['email']
            }
        })
        if (user) {
            res.EC = 0
            res.EM = `User is found`
            res.DT = {}
        } else {
            res.EC = 1
            res.EM = `User not found`
            res.DT = {}
        }

        return res

    } catch (e) {
        console.log('>>> error from service: ', e)
        return {
            EM: 'Something wrong with checking otp service',
            EC: 1,
            DT: ''
        }
    }
}

const changeUserPassword = async (userEmail, newPwd) => {
    try {
        let res = {}
        let email = userEmail
        let user = await db.User.findOne({
            where: { email: email, roleId: 'R2' }
        })
        let hashPassword = await hashUserPassword(newPwd)
        if (user) {
            await user.update({ password: hashPassword })
            res.EC = 0
            res.EM = `Change password user ${userEmail} successfully`
            res.DT = {}
        } else {
            res.EC = 1
            res.EM = `Change pass for user ${userEmail} failed`
            res.DT = {}
        }

        return res

    } catch (e) {
        console.log('>>> error from service: ', e)
        return {
            EM: 'Something wrong with change password user service',
            EC: 1,
            DT: ''
        }
    }
}

module.exports = {
    loginChecked, getAllCode, getAllUsers, getTypeRoleService, createUserService,
    getUsersPagination, deleteUserService, getDataUserUpdate, updateUserService,
    handleGetRoleUserService, sendForgotPasswordCode, changeUserPassword, chekingOTPService
}