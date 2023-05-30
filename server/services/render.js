
exports.homeRoutes = (req, res) => {
  res.render('index');
};

exports.videoChatRoutes = (req, res) => {
  res.render('video_chat');
};

exports.textChatRoutes = (req, res) => {
  res.render('text_chat');
};