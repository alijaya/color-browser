import { createApp } from "vue";
import App from "./App.vue";
import VueGapi from "vue-gapi";
import axios from "axios";
import VueAxios from "vue-axios";
import MultiPartBuilder from "./scripts/MultiPartBuilder";

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
  const gapi = await app.config.globalProperties.$gapi.getGapiClient();
  const oauthToken = gapi.auth.getToken().access_token;
  const builder = new gpicker.PickerBuilder();
  return builder
    .setAppId(process.env.VUE_APP_G_APP_ID)
    .setDeveloperKey(process.env.VUE_APP_G_API_KEY)
    .setOAuthToken(oauthToken);
};

app.config.globalProperties.$gdriveLoad = async function(fileId) {
  const gdrive = await app.config.globalProperties.$gdrive();
  const resMeta = await gdrive.files.get({
    fileId: fileId,
  });
  const resMedia = await gdrive.files.get({
    fileId: fileId,
    alt: "media",
  });
  const blob = new Blob([app.config.globalProperties.$str2ab(resMedia.body)], {
    type: resMeta.result.mimeType,
  });
  return {
    metadata: resMeta.result,
    content: blob,
  }
};

/**
 * Have several cases:
 * - id:
 *   - exists: update
 *   - null: create
 * - metadata:
 *   - exists: update / create metadata
 *   - null: don't update / create metadata
 * - content:
 *   - exists: update / create content
 *   - null: don't update / create content
 */
app.config.globalProperties.$gdriveSave = async function(id, metadata, content) {
  const gapi = await app.config.globalProperties.$gapi.getGapiClient();
  
  // if metadata & content exists, use long way to create / update stuff
  if (metadata != null && content != null) {
    let path;
    let method;

    if (id) {
      path = '/upload/drive/v3/files/' + encodeURIComponent(id);
      method = 'PATCH';
    } else {
      path = '/upload/drive/v3/files';
      method = 'POST';
    }

    const multipart = new MultiPartBuilder()
      .append('application/json; charset=UTF-8', JSON.stringify(metadata))
      .append(metadata.mimeType, content)
      .finish();

    const response = await gapi.client.request({
      path: path,
      method: method,
      params: {
        uploadType: 'multipart',
      },
      headers: { 'Content-Type' : multipart.type },
      body: multipart.body
    })
    return response.result;
  } else if (metadata != null) {
    if (id) {
      return gapi.drive.files.update({
        fileId: id,
        resource: metadata,
      })
    } else {
      return gapi.drive.files.create({
        resource: metadata,
      })
    }

  } else if (content != null) {
    // not implemented yet
  }
};

app.mount("#app");
