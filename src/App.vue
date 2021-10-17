<template>
  <div>
    <div v-if="isSignedIn">
      <button @click="logout()" type="button">Logout</button>
      {{ userName }}
    </div>
    <button
      :disabled="isSignedIn === null"
      @click="login()"
      type="button"
      v-if="!isSignedIn"
    >
      Login
    </button>
    <template v-if="isSignedIn">
      <button @click="pickFile()">Pick File</button>
      <button @click="fetchFiles()">Fetch Files</button>
      <br />
      <p>{{currentFileId}}</p>
      <input v-model="name" />
      <input v-model="rgb" />
      <button @click="saveFile()">Save File</button>
      <div style="width:500px; height:500px" :style="{'background-color': rgb}"></div>
      <img v-if="embedUrl" :src="embedUrl" />
      <div v-if="text != null">{{ text }}</div>
      <ul>
        <li v-for="file in files" :key="file.id">
          <a :href="file.webViewLink" target="_blank">
            <img :src="file.thumbnailLink || file.iconLink" />
            <span>{{ file.name }}</span>
          </a>
          <img
            v-if="file.mimeType == 'image/jpeg'"
            :src="file.webContentLink"
            style="display:block; max-width:100%"
          />
          <button
            v-if="file.mimeType == 'application/vnd.google-apps.folder'"
            @click="fetchChildFiles(file.id)"
          >
            Fetch Files
          </button>
          <ul>
            <li v-for="childFile in childFiles[file.id]" :key="childFile.name">
              {{ childFile.name }}
            </li>
          </ul>
        </li>
      </ul>
    </template>
  </div>
</template>

<script>
export default {
  name: "App",
  components: {},
  data() {
    return {
      isSignedIn: null,
      files: [],
      childFiles: {},
      embedUrl: null,
      text: null,
      currentFileId: null,
      name: "test.json",
      rgb: "#000000",
    };
  },
  created() {
    this.$gapi.listenUserSignIn((isSignedIn) => {
      this.isSignedIn = isSignedIn;
    });
  },
  methods: {
    login() {
      this.$gapi.login();
    },
    logout() {
      this.$gapi.logout();
    },
    async fetchFiles() {
      const gapi = await this.$gapi.getGapiClient();
      const response = await gapi.client.drive.files.list({
        q: "mimeType = 'application/vnd.google-apps.folder'",
        pageSize: 10,
        fields:
          "nextPageToken, files(id, name, iconLink, thumbnailLink, webViewLink, webContentLink, mimeType, parents)",
      });
      this.files = response.result.files;
    },

    async fetchChildFiles(folderId) {
      const gapi = await this.$gapi.getGapiClient();
      const response = await gapi.client.drive.files.list({
        q: `'${folderId}' in parents`,
        pageSize: 10,
        fields:
          "nextPageToken, files(id, name, iconLink, thumbnailLink, webViewLink, webContentLink, mimeType, parents)",
      });
      this.childFiles[folderId] = response.result.files;
    },

    async pickFile() {
      const gpicker = await this.$gpicker();
      const gpickerbuilder = await this.$gpickerbuilder();
      const view = new gpicker.DocsView();
      view.setMimeTypes("text/plain");
      const picker = gpickerbuilder
        .addView(view)
        .setCallback(this.onPick)
        .build();

      picker.setVisible(true);
    },

    async onPick(response) {
      const gpicker = await this.$gpicker();
      if (response[gpicker.Response.ACTION] === gpicker.Action.PICKED) {
        const docs = response[gpicker.Response.DOCUMENTS];
        const id = docs[0].id;
        const file = await this.$gdriveLoad(id);
        this.currentFileId = file.metadata.id;
        this.name = file.metadata.name;
        this.rgb = await file.content.text();
      }
    },

    async saveFile() {
      const response = await this.$gdriveSave(this.currentFileId, {
        name: this.name,
        mimeType: 'text/plain',
      }, this.rgb);
      console.log(response);
    }
  },
  computed: {
    userName() {
      const user = this.$gapi.getUserData();

      if (user) {
        return user.fullName;
      }
      return null;
    },
  },
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin: 60px;
}
</style>
