module.exports = {
    printTokens: function(tokens) {
      var parsed = JSON.parse(tokens)
      var user_id = parsed.user_id;
      access_token = parsed.access_token;
      refresh_token = parsed.refresh_token;
      var expiration = parsed.expires_in;

      console.log("User ID: " + user_id);
      console.log("Access Token: " + access_token);
      console.log("Refresh Token: " + refresh_token);
      console.log("Expiration: " + expiration);
    }
}