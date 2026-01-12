export const getNotifications = async (req, res) => {
  const user = await User.findById(req.user.id).select("notifications");
  res.json(user.notifications.reverse());
};
