const asyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");
const User = require("../models/userModel");

// to get one on one chat
const accessChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    console.log("UserId param not sent with request");
    return res.sendStatus(400);
  }

  const isChat = await Chat.find({
    isGroupChat: false,
    users: {
      $elemMatch: {
        $eq: req.user._id,
      },
      $elemMatch: {
        $eq: userId,
      },
    },
  })
    .populate("users", "-password")
    .populate("latestMessage")
    .populate({
      path: "latestMessage.sender",
      select: "name pic email",
    });

  if (isChat.length > 0) {
    res.send(isChat[0]);
  } else {
    var chatData = {
      chatName: "sender",
      isGroupChat: false,
      users: [req.user._id, userId],
    };
  }

  try {
    const createdChat = await Chat.create(chatData);

    const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
      "users",
      "-password"
    );

    res.status(201).send(FullChat);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

// to fetch that person chat
const fetchChats = asyncHandler(async (req, res) => {
  try {
    Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({updatedAt: -1,})
      .then(async (results) => {
        results = await User.populate(results, { 
          path: "latestMessage.sender", 
          select: "name pic email",
        });

      res.status(200).send(results);
      });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

// to create group chat
const createGroupChat = asyncHandler(async (req, res) => {
  
  if (!req.body.users || !req.body.name) {
    return res.sendStatus(400).send({ message: "Please Fill all the feilds" });
  }

  var users = JSON.parse(req.body.users);
  console.log(users);

  if(users.length < 2){
    return res.sendStatus(400).send({ message: "Please add more than one user" });
  }

  users.push(req.user);

  try {
    const groupChat = await Chat.create({
      chatName: req.body.name,
      isGroupChat: true,
      users: users,
      groupAdmin: req.user,
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(201).send(fullGroupChat);
  
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }



});

// rename group chat
const renameGroup = asyncHandler(async (req, res) => {
  const { chatId, chatName } = req.body;

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    { chatName },
    { new: true },
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

    if(!updatedChat){
      return res.status(404);
      throw new Error("Chat not found");
    }else{
      res.status(201).json(updatedChat);
    }
});

// add user to group chat
const addToGroup = asyncHandler(async (req, res) => {
  const { chatId, usersId } = req.body;

  const added = await Chat.findByIdAndUpdate(
    chatId,
    { $push: { users: usersId } },
    { new: true },
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

    if(!added){
      return res.status(404);
      throw new Error("Chat not found");
    }else{
      res.status(201).json(added);
    }
});

// remove user from group chat
const removeFromGroup = asyncHandler(async (req, res) => {
  const { chatId, usersId } = req.body;

  const removed = await Chat.findByIdAndUpdate(
    chatId,
    { $pull: { users: usersId } },
    { new: true },
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

    if(!removed){
      return res.status(404);
      throw new Error("Chat not found");
    }else{
      res.status(201).json(removed);
    }
});

module.exports = {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
};
