/*-----------------------------------------------------------------------------
This template demonstrates how to use Waterfalls to collect input from a user using a sequence of steps.
For a complete walkthrough of creating this type of bot see the article at
https://docs.botframework.com/en-us/node/builder/chat/dialogs/#waterfall
-----------------------------------------------------------------------------*/
"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");
var path = require('path');

var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'], 
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

var bot = new builder.UniversalBot(connector);
bot.localePath(path.join(__dirname, './locale'));

var reco = new builder.LuisRecognizer('https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/f9a13ee6-5e03-423a-ba25-99d96752b66c?subscription-key=0c7bc56912de4c45b333f45a4a5d085e&timezoneOffset=240&verbose=true&q=');
bot.recognizer(reco);


bot.dialog('/', [
 
    function (session, results) {
        //session.userData.language = results.response.entity;
        session.say("Sorry, I could not understand that, I can help you in making online bookings or information/pricing about our the services.");
        session.endDialog();
    }
]);


bot.dialog('/helloHi', [
    function (session, arg,next) {
       session.send("Hi, I am Claire your digital assistant from Rami Jabali Salon. I can help you get information and make bookings");
       if (!session.userData.name) 
            {
              // Ask user for name if not already found
              session.beginDialog('/profilename');
            }  
            else
            {
               //if we know user then ask basic intent of online booking
               builder.Prompts.confirm(session,"Welcome back "+session.userData.name + ", Would you like to book an appointment?"); 
            }
    },
    function (session, results) {
        
        // Check if we arrvied from the prompt for appointment or not         
        if (results.childId==="BotBuilder:prompt-confirm" && results.response) 
        {
            session.beginDialog('/appointment');
        } else if (results.childId==="BotBuilder:prompt-confirm")
        {
            session.send("What else can i help you with?");
            session.endDialog(); 
        } else
        {
            // if we did not arrive here from the prompt for booking ask intent 
            session.send("How can i help you?");
            session.endDialog(); 
        }
    }
   
]).triggerAction({
     matches: 'helloHi',
     onInterrupted:function(session) { 
         session.send('Please provide booking exiting booking');
         
     }
}); 


bot.dialog('/bookOnline', [
    function (session, arg,next) {
       if (!session.userData.name) 
            {
              // Ask user for name if not already found
              session.beginDialog('/profilename');
            }  
        builder.Prompts.confirm(session, "Hi " + session.userData.name + ", Would you like to book and appointment?"); 
    },
    function (session, results) {
        if (results) 
        {
            session.beginDialog('/appointment');
        } else
        {
            session.userData.appointment = results.response;
            builder.Prompts.text(session, "What else can i help you with?");
            session.endDialog(); 
        }
    }
   
]).triggerAction({
     matches: 'bookOnline',
     onInterrupted:function(session) { 
         session.send('Please provide booking exiting booking');
         
     }
});    

bot.dialog('/locationAddress', [
    function (session, arg,next) {
        session.send('We are located in JBR Al Murjan 3');
        session.endDialog();
    }
]).triggerAction({
     matches: 'locationAddress',
     onInterrupted:function(session) { 
         session.send('Please provide booking exiting address');
     }
});    
    
bot.dialog('/appointment', [
    function (session,results,next) {
        builder.Prompts.time(session, "When would you like your appointment?");
    },
    function (session,results,next) {
        if (results.response)
        {
            session.send("The date is "+builder.EntityRecognizer.resolveTime([results.response]));
            session.userData.bookingDate = builder.EntityRecognizer.resolveTime([results.response]);
            session.send("The Date is "+session.userData.bookingDate.toLocaleDateString());
            session.send("The Time is "+session.userData.bookingDate.toLocaleTimeString());
            
        }
        
        if (session.userData.bookingDate.toLocaleTimeString()==="12:00:00 PM") {
           builder.Prompts.choice(session, "Would you like to book in the morning or evening?",["Morning","Evening"]);
        }  else next();
    },
    function (session, results, next) {
        // session.send("checking 12");
        session.userData.newBookingDate = new Date(session.userData.bookingDate);
        //session.send("checking 32");
        if (session.userData.newBookingDate.toLocaleTimeString()==="12:00:00 PM") 
        {
           // session.send("checking 12 ok");
            if(results.response.entity === "Morning") 
            {
                builder.Prompts.choice(session,  " , Please pick a time",["10:00am","11:00am","12:00pm","1:00pm"]);
                
            } else 
            {
                builder.Prompts.choice(session,  " , Please pick a time",["2:00pm","3:00pm","4:00pm","5:00pm","6:00pm"]);
            }
        } else 
        {
            
         //   session.send("checking 12 not ok");
        
            next();
        }
       // session.send("ending 12");
    },
    function (session, results) {
        session.dialogData.bookingTime = results.response.entity;
        builder.Prompts.confirm(session, "Can we confirm appointment on"+ 
           session.dialogData.newbookingDate.toLocaleDateString()+" at "+session.dialogData.bookingTime);
    },
    function (session, results) {
        if (results)
        {
           session.send("appointment confirmed, you will get an email notification");
        } else
        {
           session.send("ok, your request is cancelled");
        }
        
        session.endDialog();
    }
]);

bot.dialog('/profilename', [
    function (session) {
        builder.Prompts.text(session, 'What is your name?');
    },
    function (session, results) {
        session.userData.name = results.response;
        session.send("Nice to know you "+session.userData.name);
        session.endDialog();
    }
]);

bot.dialog('/profilecontacts', [
    function (session) {
        builder.Prompts.text(session, 'What is your phone number?');
    },
    function (session, results) {
        session.userData.phonenumber = results.response;
        builder.Prompts.text(session, 'and your email address?');
    },
    function (session, results) {
        session.userData.emailaddress = results.response;
        session.endDialog();
    }
]);


bot.dialog('/priceHairServices', [
    
    function (session,arg,next) {
        session.send('Following are the prices');
        var servicesEntity = builder.EntityRecognizer.findEntity(arg.intent.entities, 'HairService'); 
        session.send('Following are the prices of '+servicesEntity.entity);
        session.endDialog();

    }
    
]).triggerAction({
     matches: 'priceHairServices',
     onInterrupted:function(session) { 
         session.send('Please provide booking exiting pricing');
         
     }
});    


bot.dialog('/delete', (session) => {
delete session.userData
session.endDialog('Everything has been wiped out')

})
.triggerAction({
matches: /delete all/i,
confirmPrompt: "This will wipe everything out. Are you sure?"
});

bot.dialog('/goodBye', [
    function (session, arg,next) {
       session.send("Thank you for stopping by, Good bye");
       session.endDialog();
    }
]).triggerAction({
     matches: 'goodBye',
     onInterrupted:function(session) { 
         session.send('Exiting goodbye');
     }
}); 

bot.dialog('/thankYou', [
    function (session, arg,next) {
       session.send("You are welcome");
       session.endDialog();
    }
]).triggerAction({
     matches: 'thankYou',
     onInterrupted:function(session) { 
         session.send('Exiting thank you');
     }
}); 


if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
    module.exports = { default: connector.listen() }
}
