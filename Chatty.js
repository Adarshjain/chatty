Chats = new Mongo.Collection('Chats');
HomeChat = new Meteor.Collection('HomeChat');
var userName = "";
var loggedinuser = "";
if (Meteor.isClient) {

	Router.configure({
		layoutTemplate: 'defaultTemplate'
	});
	
	Router.route('/', function () {
		if(Meteor.user()){
			if(loggedinuser === "")
			loggedinuser = Meteor.user().username;
		}
	  this.render('home');
	});
	
	Router.route('/home2', function () {
		if(Meteor.user()){
			if(loggedinuser === ""){
				if(!(loggedinuser = Meteor.user().username)){
					loggedinuser = Meteor.user().profile.name;
				}
			}
		}
	  this.render('home2');
	});
	
	Router.route('/chat/:user', function () {
		if(Meteor.user()){
			if(loggedinuser === "")
			loggedinuser = Meteor.user().username;
		}
		userName = this.params.user;
		if (userName === loggedinuser) {
			this.redirect('/');
		}else{
			this.render('specificChat');
		}
	});

	Meteor.subscribe("Chats");
	Meteor.subscribe("HomeChat");
	Meteor.subscribe("users");

	Template.specificChat.helpers({
		Chats: function() {
			return Chats.find({
				$or:[
					{$and:[{from:loggedinuser},{to:userName}]},
					{$and:[{from:userName},{to:loggedinuser}]}
				]
			});
		},
		isSender:function(name){
			return !(name === userName);
		},
		userName:function() {
			return userName;
		}
	});

	Template.home2.helpers({
		users: function () {
			return Meteor.users.find({},{sort: {username: 1}});
		},
		userName: function(argument) {
			if(argument === loggedinuser) return false;
			else return true;
		}
	});

	Template.home.helpers({
		users: function () {
			return HomeChat.find({to: loggedinuser},{sort: {createdAt:-1}});
		},
		formattedTime:function (time) {
			if(time.getDate() === new Date().getDate()){
				return time.toLocaleTimeString();
			}else{
				return time.toLocaleDateString();
			}
		}
	});

	Template.specificChat.events({
		'submit .sendmes':function(event) {
			var message = event.target.message.value;
			message = message.trim();
			if (message === "") {
				return false;
			}
			event.preventDefault();

			Meteor.call('chatInsert',loggedinuser,userName,message);
			Meteor.call('homeChatInsert',loggedinuser,userName,message);

			event.target.message.value="";

			return false;
		}
	});

	Accounts.ui.config({
		passwordSignupFields: "USERNAME_ONLY"
	});

}

if (Meteor.isServer) {
  Meteor.startup(function () {
    
  });

  Meteor.publish("Chats",function() {
  	return Chats.find();
  });
  Meteor.publish("HomeChat",function() {
  	return HomeChat.find();
  });
  Meteor.publish("users",function() {
  	return Meteor.users.find();
  });
}



Meteor.methods({
  chatInsert: function (loggedinuser,userName,message) {
    Chats.insert({
      from: loggedinuser,
      to: userName,
      content: message,
      createdAt:new Date()
    });
  },
  homeChatInsert: function (loggedinuser,userName,message) {
    HomeChat.update(
      {from:loggedinuser,to:userName},
      {from:loggedinuser,to:userName,content:message,createdAt:new Date()},
      {upsert:true}
    );

    HomeChat.update(
      {from:userName,to:loggedinuser},
      {from:userName,to:loggedinuser,content:message,createdAt:new Date()},
      {upsert:true}
    );
  }
});