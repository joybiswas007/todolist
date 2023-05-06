const express = require('express');
const bodyParser = require('body-parser');
const date = require(__dirname + "/date.js");
const mongoose = require('mongoose');
const _ = require('lodash');
const port = 3000;
const app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/todolist");

const itemsSchema = mongoose.Schema({
	name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
	name: "Welcome to Todolist"
});

const item2 = new Item({
	name: "Click on + to add new Items"
});

const defaultItems = [item1, item2];

const listSchema = {
	name: String,
	items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/:customListItem", function(req, res) {
	const customListItem = _.capitalize(req.params.customListItem);

	List.findOne({ name: customListItem }).then(function(foundList) {
		if (!foundList) {
			const list = new List({
				name: customListItem,
				items: defaultItems
			});
			list.save().then(function() {
				res.redirect("/" + customListItem);
			});
		} else {
			res.render("todo", { listTitle: foundList.name, newItems: foundList.items });
		}
	}).catch(function(err) {
		console.log(err);
	});
});


app.get("/", function(req, res) {
	Item.find({}).then( function(foundItems) {
		if (defaultItems.length == 0){
		Item.insertMany(defaultItems);
		res.redirect("/");
	} else {
		let day = date.getDate();
		res.render("todo", {listTitle: day, newItems: foundItems});
	}
	});
});

app.post("/", function(req, res) {
	const day = date.getDate();
	const itemName = req.body.addNewItem;
	const listName = req.body.list;
	const item = new Item({
		name: itemName
	});

	if(listName == day){
		item.save();
		res.redirect("/");
	} else {
		List.findOne({name: listName}).then( function(foundList) {
			foundList.items.push(item);
			foundList.save();
			res.redirect("/" + listName);
		}).catch(function(err) {
			console.log(err);
		});
	}
});

app.post("/delete", function(req, res) {
	const checkedItemID = req.body.checkbox;
	const listName = req.body.listName;
	const day = date.getDate();

	if(listName == day) {
		Item.findByIdAndRemove(checkedItemID).then((err) => {
			if(!err) {
			console.log("Data has been deleted");
			res.redirect("/");
		}
	});

	} else {
		List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemID}}}).then(function(err, foundList) {
			if(!err) {
				res.redirect("/" + listName);
			}
		});
	}

});

app.listen(port, function() {
	console.log("Server running on " + port);
});
