import sendgridMail from '@sendgrid/mail';
import config from 'config';
import logger from '../logging/logger';
import * as _ from 'lodash';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from "path";

sendgridMail.setApiKey(process.env.VENIQA_SENDGRID_API_KEY);



const transport = nodemailer.createTransport({
    host: process.env.VENIQA_NODEMAILER_HOST,
    port: process.env.VENIQA_NODEMAILER_PORT,
    auth: {
        user: process.env.VENIQA_NODEMAILER_USER,
        pass: process.env.VENIQA_NODEMAILER_PASSWORD
    }
});

export default {
    emailEmailConfirmationInstructions(email, name, token) {
        const template = fs.readFileSync( './public/email_templates/email-order-success.html')
        // setup email data
        let mailOptions = {
            from: '"Veniqa Support" <slpjewellery@gmail.com>', // sender address
            to: email, // list of receivers
            subject: 'Welcome to Veniqa - Please Confirm Your Email', // Subject line
            html: template.toString('utf-8'),
            // templateId: config.get('sendgrid.templates.confirm_account_customer'),
            // dynamic_template_data: {
            //     name: name,
            //     confirm_account_customer_url: config.get('frontend_urls.email_confirmation_base_url') + '/' + token
            // }
        };

        this.triggerEmail(mailOptions);
    },

    emailPasswordResetInstructions(email, name, token) {
        // setup email data with unicode symbols
        let mailOptions = {
            from: '"Veniqa Support" <support@veniqa.com>', // sender address
            to: email, // list of receivers
            subject: 'Veniqa - Password Reset', // Subject line
            html: '<b>Hi </b>' +  name + '<br>Please click the link below to reset your password<br><br><button><a href="' + config.get('frontend_urls.password_reset_base_url') + '/' + token + '">Reset Password</a></button>',
            templateId: config.get('sendgrid.templates.reset_password_customer'),
            dynamic_template_data: {
                name: name,
                reset_password_customer_url: config.get('frontend_urls.password_reset_base_url') + '/' + token
            }

        };

        this.triggerEmail(mailOptions);
    },

    emailPasswordResetConfirmation(email, name) {
        // setup email data with unicode symbols
        let mailOptions = {
            from: '"Veniqa Support" <support@veniqa.com>', // sender address
            to: email, // list of receivers
            subject: 'Veniqa - Password Reset Successful', // Subject line
            html: '<b>Hi </b>' +  name + '<br>Your password has been successfully reset.<br><br>',
            templateId: config.get('sendgrid.templates.confirmation_password_reset_customer'),
            dynamic_template_data: {
                name: name
            }
        };

        this.triggerEmail(mailOptions);
    },

    emailOrderReceived(orderObj) {
        let condensedOrderObj = this.parseOrderDetailsForEmail(orderObj);

        // setup email data with unicode symbols
        let mailOptions = {
            from: '"Veniqa Support" <support@veniqa.com>', // sender address
            to: condensedOrderObj.user_email, // list of receivers
            subject: 'Veniqa - Order Received', // Subject line
            html: '<b>Hi </b>' + '<br>We have received your order.<br><br>',
            templateId: config.get('sendgrid.templates.order_received'),
            dynamic_template_data: condensedOrderObj
        };

        this.triggerEmail(mailOptions);
    },

    triggerEmail(mailOptions) {
        transport.sendMail(mailOptions, (error, result) => {
            if (error) {
                return logger.error("Error while sending email using sendgrid", {meta: error});
            }
            logger.verbose('Email sent', {meta: result});
        });
    },

    parseOrderDetailsForEmail(orderObj) {
        // Extract only the applicable root nodes first
        orderObj = (({_id, overall_status, cart, user_email, mailing_address, payment_info}) => ({_id, overall_status, cart, user_email, mailing_address, payment_info}))(orderObj)

        // This goes through the items array and only selects the given object keys no matter how deep in tree. also brings them on the same level in the process
        orderObj.cart.items = _.map(orderObj.cart.items, _.partialRight(_.pick, ['product.name', 'product.brand', 'product.store', 'product.price', 'counts', 'aggregatedPrice', 'customizations']));
        orderObj.payment_info = _.map(orderObj.payment_info, _.partialRight(_.pick, ['source', 'type', 'amount_in_payment_currency']))

        return orderObj;
    }
}