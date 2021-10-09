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
      <button @click="fetchFiles()">Fetch Files</button>
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
};
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
