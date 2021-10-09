import { createApp } from "vue";
import App from "./App.vue";
import VueGapi from "vue-gapi";

const app = createApp(App);
app.use(VueGapi, {
  apiKey: process.env.VUE_APP_G_API_KEY,
  clientId: process.env.VUE_APP_G_CLIENT_ID,
  discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
  scope: "https://www.googleapis.com/auth/drive.metadata.readonly",
});
app.mount("#app");
