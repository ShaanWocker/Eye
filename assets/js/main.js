window.addEventListener("unload", function(event) {
  $.ajax({
    url: "/leaving_user_update/" + username + "",
    type: "PUT",
    success: function(response){
      alert(response);
    },
  });
});
$.ajax({
  url: "/leaving_user_update/" + username + "",
  type: "PUT",
  success: function(response){
    alert(response);
  },
});