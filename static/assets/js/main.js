jQuery(document).ready(function() {
  $("#search-button").bind("click", function() {
    $("#search").addClass("open");
    $("#query").focus();
  });

  $(".search-close").bind("click", function() {
    $("#query").val("");
    $("#search").removeClass("open");
  });
});
