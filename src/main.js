import { createApp } from "vue";
import App from "./App.vue";
import VueGapi from "vue-gapi";
import axios from "axios";
import VueAxios from "vue-axios";

const app = createApp(App);

app.use(VueAxios, axios);

app.use(VueGapi, {
  apiKey: process.env.VUE_APP_G_API_KEY,
  clientId: process.env.VUE_APP_G_CLIENT_ID,
  discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
  scope: "https://www.googleapis.com/auth/drive.file",
});

app.config.globalProperties.$str2ab = function(str) {
  var buf = new ArrayBuffer(str.length); // 2 bytes for each char
  var bufView = new Uint8Array(buf);
  for (var i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
};

app.config.globalProperties.$gdrive = async function() {
  const gapi = await app.config.globalProperties.$gapi.getGapiClient();
  return gapi.client.drive;
};

app.config.globalProperties.$gpicker = async function() {
  if (window.google?.picker) return window.google.picker;
  const gapi = await app.config.globalProperties.$gapi.getGapiClient();
  return new Promise(function(resolve, reject) {
    gapi.load("picker", function() {
      if (window.google?.picker) resolve(window.google.picker);
      else reject();
    });
  });
};

app.config.globalProperties.$gpickerbuilder = async function() {
  const gpicker = await app.config.globalProperties.$gpicker();
  const userData = app.config.globalProperties.$gapi.getUserData();
  const oauthToken = userData?.accessToken;
  const builder = new gpicker.PickerBuilder();
  return builder
    .setAppId(process.env.VUE_APP_G_APP_ID)
    .setDeveloperKey(process.env.VUE_APP_G_API_KEY)
    .setOAuthToken(oauthToken);
};
app.mount("#app");
